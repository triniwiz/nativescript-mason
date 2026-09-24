import { ref } from 'nativescript-vue';

/**
 * In-app layout benchmark: every scenario exists as a MasonKit page and a core
 * page running the same workload. Phases are timed from the mutation until
 * layout has settled (see `settled`); medians are reported.
 */

const hiResNow: (() => number) | undefined = (globalThis as any).__time;
export const now = (): number => (hiResNow ? hiResNow() : Date.now());

/** Main-thread CPU ms: steadier than wall time on an emulator. */
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
  cpuMs?: number;
  /** Longest single frame inside a multi-frame phase. */
  worstFrameMs?: number;
}

type Results = Record<ScenarioKey, Record<Flavour, Record<string, PhaseSample[]>>>;

const emptyResults = (): Results => ({
  feed: { mason: {}, core: {} },
  dashboard: { mason: {}, core: {} },
  nested: { mason: {}, core: {} },
});

export const results = ref<Results>(emptyResults());
export const running = ref(false);
export const status = ref('');

export const phaseOrder = ref<Record<ScenarioKey, string[]>>({ feed: [], dashboard: [], nested: [] });

export function resetResults(): void {
  results.value = emptyResults();
  phaseOrder.value = { feed: [], dashboard: [], nested: [] };
  resetBenchRunState();
}

/**
 * The next vsync, after its layout and draw. Not requestAnimationFrame: outside
 * a frame callback core runs it as a macrotask, so ticks never waited for a frame.
 */
export const nextFrame = (): Promise<number> =>
  new Promise((resolve) => {
    if (!(global as any).isAndroid) {
      requestAnimationFrame(resolve);
      return;
    }
    android.view.Choreographer.getInstance().postFrameCallback(
      new android.view.Choreographer.FrameCallback({
        doFrame: (frameTimeNanos: number) => setTimeout(() => resolve(frameTimeNanos / 1e6), 0),
      }),
    );
  });

/**
 * Settled = a layout traversal ran since the mutation, and no further pass or
 * pending requestLayout for two frames. The same bar for both flavours.
 */
let layoutPasses = 0;
let watchedRoot: any = null;
let layoutListener: any = null;

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
  } catch {}
  watchedRoot = null;
  layoutListener = null;
}

function layoutPending(): boolean {
  try {
    return !!watchedRoot?.isLayoutRequested();
  } catch {
    return false;
  }
}

export async function settled(): Promise<void> {
  const watching = !!watchedRoot;
  const entry = layoutPasses;
  const deadline = Date.now() + 5000;
  let frames = 0;
  let stable = 0;
  let last = -1;
  let advanced = !watching;
  // A phase with no layout effect never produces a pass.
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

export async function idle(ms = 150): Promise<void> {
  const gc = (globalThis as any).gc;
  if (typeof gc === 'function') gc();
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Native Perf counters per phase, logged to MasonPerf. Off when comparing. */
export const PERF_COUNTERS = false;

function perfDump(scenario: ScenarioKey, flavour: Flavour, phase: string): void {
  if (!PERF_COUNTERS) return;
  try {
    const Perf = (globalThis as any).org?.nativescript?.mason?.masonkit?.Perf;
    if (!Perf) return;
    if (!Perf.enabled) Perf.enabled = true;
    Perf.dump(`${scenario}/${flavour}/${phase}`);
    Perf.reset();
  } catch {}
}

/**
 * The Bench page is itself MasonKit, so reactive UI updates during a run would
 * land in the open timing window. Results are stashed and published between pages.
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
    await settled();
    record(this.scenario, this.flavour, 'first frame', { ms: now() - this.loadedAt, cpuMs: cpuNow() - this.loadedAtCpu });
  }

  async run(phase: string, mutate: () => void): Promise<void> {
    const start = now();
    const startCpu = cpuNow();
    mutate();
    await settled();
    record(this.scenario, this.flavour, phase, { ms: now() - start, cpuMs: cpuNow() - startCpu });
  }

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
    await settled();
    record(this.scenario, this.flavour, `${phase} x${count}`, { ms: now() - start, cpuMs: cpuNow() - startCpu, worstFrameMs: worst });
  }
}

let pendingNavStart: number | undefined;
let pendingNavStartCpu: number | undefined;
let pendingDone: (() => void) | undefined;

export function beginNavigation(): Promise<void> {
  pendingNavStart = now();
  pendingNavStartCpu = cpuNow();
  return new Promise((resolve) => {
    pendingDone = resolve;
  });
}

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
