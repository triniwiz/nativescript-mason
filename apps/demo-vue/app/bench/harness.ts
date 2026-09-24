import { ref } from 'nativescript-vue';

/**
 * In-app layout benchmark harness.
 *
 * Every scenario exists twice - once built from MasonKit elements and once from
 * @nativescript/core layouts - and both flavours run the same scripted workload
 * so the numbers are directly comparable. A page records:
 *
 *  - `mount`        navigate() call -> Page `loaded`
 *  - `first frame`  Page `loaded`   -> the first frame after layout settled
 *  - one entry per workload phase, measured mutation -> settled frame
 *  - `tick xN`      sustained updates, one per frame; also reports the worst
 *                   single frame so a stall inside an otherwise fast run shows
 *
 * "Settled" means an Android layout pass has run since the mutation and none
 * has been seen for two frames since - the same bar for both flavours, so
 * neither side can be credited for work it has not finished (see `settled`).
 *
 * Timings come from the JS thread, so they include Vue reconciliation plus the
 * native measure/layout that runs synchronously inside the frame. Emulator
 * noise is large; the runner therefore keeps every sample and reports medians.
 */

const hiResNow: (() => number) | undefined = (globalThis as any).__time;
export const now = (): number => (hiResNow ? hiResNow() : Date.now());

/**
 * Main-thread CPU time in ms. Wall time on an emulator swings by tens of
 * percent with host load; CPU time spent on the UI thread does not, so it is
 * the steadier number for comparing a change. It excludes RenderThread and
 * idle waits, so read it next to wall time, not instead of it.
 */
export const cpuNow = (): number => {
  try {
    return (global as any).isAndroid ? android.os.Debug.threadCpuTimeNanos() / 1e6 : NaN;
  } catch {
    return NaN;
  }
};

export type Flavour = 'mason' | 'core';
export type ScenarioKey = 'feed' | 'dashboard' | 'nested';

export interface PhaseSample {
  ms: number;
  /** Main-thread CPU time over the same window (see cpuNow). */
  cpuMs?: number;
  /** Longest single frame inside a multi-frame phase. */
  worstFrameMs?: number;
}

/** scenario -> flavour -> phase -> samples */
type Results = Record<ScenarioKey, Record<Flavour, Record<string, PhaseSample[]>>>;

const emptyResults = (): Results => ({
  feed: { mason: {}, core: {} },
  dashboard: { mason: {}, core: {} },
  nested: { mason: {}, core: {} },
});

export const results = ref<Results>(emptyResults());
export const running = ref(false);
export const status = ref('');

/** Phase names in first-seen order so the table stays stable. */
export const phaseOrder = ref<Record<ScenarioKey, string[]>>({ feed: [], dashboard: [], nested: [] });

export function resetResults(): void {
  results.value = emptyResults();
  phaseOrder.value = { feed: [], dashboard: [], nested: [] };
  resetBenchRunState();
}

export const nextFrame = (): Promise<number> => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Flavour-neutral quiescence.
 *
 * Both flavours defer their real work past the mutation, but differently:
 * MasonKit debounces its compute to the next animation frame, while core calls
 * requestLayout() and lets Android service it in a later traversal. A fixed
 * two-frame wait can close the window before either has finished, and an
 * earlier version of this harness closed it early for core only -- it waited on
 * MasonKit's compute counter, which core does not have -- so core was billed
 * for less work than it actually did.
 *
 * So instead of asking either engine about itself, watch the one thing both
 * must go through: an Android layout traversal. `onGlobalLayout` fires once per
 * traversal that performs layout, so "settled" means a layout pass has run
 * since the mutation AND neither a further pass nor a pending requestLayout()
 * has been seen for two consecutive frames. Identical bar for both flavours.
 *
 * The listener costs one bridge crossing per pass; both flavours pay it, so
 * ratios stay honest even though absolutes are a touch inflated.
 */
let layoutPasses = 0;
let watchedRoot: any = null;
let layoutListener: any = null;

/** Attach the pass counter to a Page's native view tree. Best-effort. */
export function watchLayout(view: any): void {
  unwatchLayout();
  if (!(global as any).isAndroid) return;
  const nativeView = view?.android ?? view?.nativeViewProtected;
  if (!nativeView?.getViewTreeObserver) return;
  try {
    layoutListener = new android.view.ViewTreeObserver.OnGlobalLayoutListener({
      onGlobalLayout: () => {
        layoutPasses++;
      },
    });
    nativeView.getViewTreeObserver().addOnGlobalLayoutListener(layoutListener);
    watchedRoot = nativeView;
  } catch {
    watchedRoot = null;
    layoutListener = null;
  }
}

export function unwatchLayout(): void {
  try {
    if (watchedRoot && layoutListener) {
      watchedRoot.getViewTreeObserver().removeOnGlobalLayoutListener(layoutListener);
    }
  } catch {
    // teardown only
  }
  watchedRoot = null;
  layoutListener = null;
}

/** True while a requestLayout() is queued but has not been serviced. */
function layoutPending(): boolean {
  try {
    return !!watchedRoot?.isLayoutRequested();
  } catch {
    return false;
  }
}

/**
 * Resolve once the page has stopped laying out. Without a watcher (iOS, or an
 * attach that failed) this degrades to the plain two-frame wait -- for both
 * flavours alike.
 */
export async function settled(): Promise<void> {
  const watching = !!watchedRoot;
  const entry = layoutPasses;
  const deadline = Date.now() + 5000;
  let frames = 0;
  let stable = 0;
  let last = -1;
  let advanced = !watching;
  // A phase that changes nothing layout-affecting never produces a pass; stop
  // waiting for one after a few frames rather than burning the whole deadline.
  const NO_PASS_GIVE_UP = 8;
  while (Date.now() < deadline) {
    await nextFrame();
    frames++;
    const passes = layoutPasses;
    if (passes > entry) advanced = true;
    if (passes === last && !layoutPending()) {
      stable++;
    } else {
      stable = 0;
      last = passes;
    }
    if (frames >= 2 && stable >= 2 && (advanced || frames >= NO_PASS_GIVE_UP)) return;
  }
}

/** Give the GC a chance between pages so one page's garbage is not the next page's stall. */
export async function idle(ms = 150): Promise<void> {
  const gc = (globalThis as any).gc;
  if (typeof gc === 'function') gc();
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Native masonkit counters, for diagnosing a phase — off by default.
 *
 * Turning Perf on is not free: it makes every `Perf.hit` in the layout walk a
 * ConcurrentHashMap lookup, once per node per pass, and only the Mason pages
 * have any. Leaving it on during a comparison run charges Mason for
 * instrumentation core does not carry. Flip this to true when reading the
 * per-phase breakdown out of logcat, and back to false before quoting ratios.
 */
export const PERF_COUNTERS = false;

/** Dump + reset the native masonkit perf counters gathered since the last phase. Best-effort: no-op on AARs without Perf. */
function perfDump(scenario: ScenarioKey, flavour: Flavour, phase: string): void {
  if (!PERF_COUNTERS) return;
  try {
    const Perf = (globalThis as any).org?.nativescript?.mason?.masonkit?.Perf;
    if (!Perf) return;
    if (!Perf.enabled) Perf.enabled = true;
    Perf.dump(`${scenario}/${flavour}/${phase}`);
    Perf.reset();
  } catch {
    // instrumentation only
  }
}

/**
 * Timing windows stay open while a scenario page runs, but the Bench page
 * itself is built from MasonKit elements (installMasonKit is global), so any
 * reactive update to the results table / status label re-renders native mason
 * layout on the still-attached Bench page. That work lands inside whatever
 * phase window is open and poisons the samples (later phases most, since the
 * table grows). During a run we therefore stash samples and status in plain
 * non-reactive data and only publish to the reactive refs from the safe zone
 * between pages (see flushBenchUi).
 */
const stash: Results = emptyResults();
const stashPhaseOrder: Record<ScenarioKey, string[]> = { feed: [], dashboard: [], nested: [] };
let stashStatus = '';

function record(scenario: ScenarioKey, flavour: Flavour, phase: string, sample: PhaseSample): void {
  const bucket = stash[scenario][flavour];
  (bucket[phase] ??= []).push(sample);
  const order = stashPhaseOrder[scenario];
  if (!order.includes(phase)) order.push(phase);
  perfDump(scenario, flavour, phase);
}

/** Safe-zone publish: call only when no timing window is open. */
export function flushBenchUi(): void {
  results.value = JSON.parse(JSON.stringify(stash));
  phaseOrder.value = JSON.parse(JSON.stringify(stashPhaseOrder));
  if (stashStatus) status.value = stashStatus;
}

export function setBenchStatus(text: string): void {
  stashStatus = text;
}

export function resetBenchRunState(): void {
  const fresh = emptyResults();
  (Object.keys(stash) as ScenarioKey[]).forEach((k) => {
    stash[k] = fresh[k];
  });
  stashPhaseOrder.feed = [];
  stashPhaseOrder.dashboard = [];
  stashPhaseOrder.nested = [];
  stashStatus = '';
}

/**
 * Per-page recorder. The page creates one in `setup()` and calls
 * `loaded(page)` from the Page's `@loaded`, then `run(...)` for each phase.
 * The page object is needed so the layout watcher can attach to its view tree.
 */
export class PageBench {
  private readonly navStart: number;
  private readonly navStartCpu: number;
  private loadedAt = 0;
  private loadedAtCpu = 0;

  constructor(
    private readonly scenario: ScenarioKey,
    private readonly flavour: Flavour,
  ) {
    this.navStart = pendingNavStart ?? now();
    this.navStartCpu = pendingNavStartCpu ?? cpuNow();
    pendingNavStart = undefined;
    pendingNavStartCpu = undefined;
  }

  loaded(page?: any): void {
    watchLayout(page);
    this.loadedAt = now();
    this.loadedAtCpu = cpuNow();
    record(this.scenario, this.flavour, 'mount', { ms: this.loadedAt - this.navStart, cpuMs: this.loadedAtCpu - this.navStartCpu });
  }

  async firstFrame(): Promise<void> {
    // The initial layout is debounced past `loaded`; capture it here so it
    // cannot leak into the first workload phase.
    await settled();
    record(this.scenario, this.flavour, 'first frame', { ms: now() - this.loadedAt, cpuMs: cpuNow() - this.loadedAtCpu });
  }

  /** Apply one mutation and time it to the settled frame. */
  async run(phase: string, mutate: () => void): Promise<void> {
    const start = now();
    const startCpu = cpuNow();
    mutate();
    await settled();
    record(this.scenario, this.flavour, phase, { ms: now() - start, cpuMs: cpuNow() - startCpu });
  }

  /** Apply `count` mutations, one per frame, reporting total and worst frame. */
  async ticks(phase: string, count: number, mutate: (i: number) => void): Promise<void> {
    const start = now();
    const startCpu = cpuNow();
    let worst = 0;
    for (let i = 0; i < count; i++) {
      const frameStart = now();
      mutate(i);
      await nextFrame();
      worst = Math.max(worst, now() - frameStart);
    }
    // Trailing deferred work belongs to this phase, not the next one.
    await settled();
    record(this.scenario, this.flavour, `${phase} x${count}`, { ms: now() - start, cpuMs: cpuNow() - startCpu, worstFrameMs: worst });
  }
}

let pendingNavStart: number | undefined;
let pendingNavStartCpu: number | undefined;
let pendingDone: (() => void) | undefined;

/** Called by the runner right before `$navigateTo`. */
export function beginNavigation(): Promise<void> {
  pendingNavStart = now();
  pendingNavStartCpu = cpuNow();
  return new Promise((resolve) => {
    pendingDone = resolve;
  });
}

/** Called by the page once its workload has finished and it has popped itself. */
export function pageDone(): void {
  const done = pendingDone;
  pendingDone = undefined;
  done?.();
}

export function median(values: number[]): number {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export const fmt = (n: number, digits = 1): string => (Number.isFinite(n) ? n.toFixed(digits) : '-');
