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
 * "Settled" means two consecutive Choreographer frames have run after the
 * mutation, which covers a deferred native layout pass posted from the first.
 *
 * Timings come from the JS thread, so they include Vue reconciliation plus the
 * native measure/layout that runs synchronously inside the frame. Emulator
 * noise is large; the runner therefore keeps every sample and reports medians.
 */

const hiResNow: (() => number) | undefined = (globalThis as any).__time;
export const now = (): number => (hiResNow ? hiResNow() : Date.now());

export type Flavour = 'mason' | 'core';
export type ScenarioKey = 'feed' | 'dashboard' | 'nested';

export interface PhaseSample {
  ms: number;
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
 * Resolve once the native layout pipeline is quiescent: at least two frames
 * have passed AND the masonkit compute counter has not advanced for two of
 * them. MasonKit debounces computes to the next animation frame, so a plain
 * two-frame wait can close the measurement window before the compute that the
 * mutation triggered actually runs — the work then lands in the NEXT phase's
 * window and poisons its numbers. Cores pages have no masonkit Perf, so this
 * degrades to the plain two-frame wait there.
 */
export async function settled(expectCompute = false): Promise<void> {
  const Perf = (globalThis as any).org?.nativescript?.mason?.masonkit?.Perf;
  if (!Perf) {
    await nextFrame();
    await nextFrame();
    return;
  }
  let last = -1;
  let stable = 0;
  let frames = 0;
  const deadline = Date.now() + 5000;
  if (expectCompute) {
    // A mutation's compute may be debounced several frames out; requiring
    // stability alone can close the window before the compute ever runs and
    // dump its cost into the NEXT phase. Wait for the counter to advance past
    // the value at entry, then for stability.
    const entry = Number(Perf.computeCount ?? 0);
    let advanced = false;
    while ((frames < 2 || stable < 2 || !advanced) && Date.now() < deadline) {
      await nextFrame();
      frames++;
      const c = Number(Perf.computeCount ?? -1);
      if (c === last) {
        stable++;
      } else {
        stable = 0;
        last = c;
      }
      if (c > entry) advanced = true;
    }
    return;
  }
  while ((frames < 2 || stable < 2) && Date.now() < deadline) {
    await nextFrame();
    frames++;
    const c = Number(Perf.computeCount ?? -1);
    if (c === last) {
      stable++;
    } else {
      stable = 0;
      last = c;
    }
  }
}

/** Give the GC a chance between pages so one page's garbage is not the next page's stall. */
export async function idle(ms = 150): Promise<void> {
  const gc = (globalThis as any).gc;
  if (typeof gc === 'function') gc();
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Dump + reset the native masonkit perf counters gathered since the last phase. Best-effort: no-op on AARs without Perf. */
function perfDump(scenario: ScenarioKey, flavour: Flavour, phase: string): void {
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
 * `loaded()` from the Page's `@loaded`, then `run(...)` for each phase.
 */
export class PageBench {
  private readonly navStart: number;
  private loadedAt = 0;

  constructor(
    private readonly scenario: ScenarioKey,
    private readonly flavour: Flavour,
  ) {
    this.navStart = pendingNavStart ?? now();
    pendingNavStart = undefined;
  }

  loaded(): void {
    this.loadedAt = now();
    record(this.scenario, this.flavour, 'mount', { ms: this.loadedAt - this.navStart });
  }

  async firstFrame(): Promise<void> {
    // The initial compute is debounced past `loaded`; capture it here so it
    // cannot leak into the first workload phase.
    await settled(this.flavour === 'mason');
    record(this.scenario, this.flavour, 'first frame', { ms: now() - this.loadedAt });
  }

  /** Apply one mutation and time it to the settled frame. */
  async run(phase: string, mutate: () => void): Promise<void> {
    const start = now();
    mutate();
    await settled(this.flavour === 'mason');
    record(this.scenario, this.flavour, phase, { ms: now() - start });
  }

  /** Apply `count` mutations, one per frame, reporting total and worst frame. */
  async ticks(phase: string, count: number, mutate: (i: number) => void): Promise<void> {
    const start = now();
    let worst = 0;
    for (let i = 0; i < count; i++) {
      const frameStart = now();
      mutate(i);
      await nextFrame();
      worst = Math.max(worst, now() - frameStart);
    }
    await nextFrame();
    record(this.scenario, this.flavour, `${phase} x${count}`, { ms: now() - start, worstFrameMs: worst });
  }
}

let pendingNavStart: number | undefined;
let pendingDone: (() => void) | undefined;

/** Called by the runner right before `$navigateTo`. */
export function beginNavigation(): Promise<void> {
  pendingNavStart = now();
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
