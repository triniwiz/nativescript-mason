import { createSignal } from 'solid-js';

const g = globalThis as any;
const hiResNow: (() => number) | undefined = g.__time ?? (typeof g.performance?.now === 'function' ? () => g.performance.now() : undefined);
const now = (): number => (hiResNow ? hiResNow() : Date.now());

const cpuNow = (): number => {
  if (__ANDROID__) return android.os.Debug.threadCpuTimeNanos() / 1e6;
  if (__APPLE__) return iosThreadCpuMs();
  return NaN;
};

// Main-thread CPU time on iOS via clock_gettime(CLOCK_THREAD_CPUTIME_ID).
let iosClockBroken = false;
function iosThreadCpuMs(): number {
  if (iosClockBroken) return NaN;
  try {
    const ts = new interop.Reference(g.timespec, { tv_sec: 0, tv_nsec: 0 });
    g.clock_gettime(g.CLOCK_THREAD_CPUTIME_ID, ts);
    const v = ts.value as any;
    return Number(v.tv_sec) * 1e3 + Number(v.tv_nsec) / 1e6;
  } catch {
    iosClockBroken = true;
    return NaN;
  }
}

export type Flavour = 'mason' | 'core';
export type ScenarioKey = 'feed' | 'dashboard' | 'nested' | 'rich';

export interface PhaseSample {
  ms: number;
  cpuMs?: number;
  worstFrameMs?: number;
  draws?: number;
  passes?: number;
  undrawnTicks?: number;
}

export type Results = Record<ScenarioKey, Record<Flavour, Record<string, PhaseSample[]>>>;
type PhaseOrder = Record<ScenarioKey, string[]>;

const emptyResults = (): Results => ({
  feed: { mason: {}, core: {} },
  dashboard: { mason: {}, core: {} },
  nested: { mason: {}, core: {} },
  rich: { mason: {}, core: {} },
});

const emptyPhaseOrder = (): PhaseOrder => ({ feed: [], dashboard: [], nested: [], rich: [] });

const [results, setResults] = createSignal<Results>(emptyResults());
const [running, setRunning] = createSignal(false);
const [status, setStatus] = createSignal('');
const [phaseOrder, setPhaseOrder] = createSignal<PhaseOrder>(emptyPhaseOrder());

export { results, running, setRunning, status, setStatus, phaseOrder };

export function resetResults(): void {
  setResults(emptyResults());
  setPhaseOrder(emptyPhaseOrder());
  resetBenchRunState();
}

/**
 * The next vsync, after its layout and draw. Not requestAnimationFrame: outside
 * a frame callback core runs it as a macrotask, so ticks never waited for a frame.
 */
const nextFrame = (): Promise<number> => {
  if (__WINDOWS__) return nextCompositorFrame();
  return new Promise((resolve) => {
    if (!__ANDROID__) {
      requestAnimationFrame(resolve);
      return;
    }
    android.view.Choreographer.getInstance().postFrameCallback(
      new android.view.Choreographer.FrameCallback({
        doFrame: (frameTimeNanos: number) => setTimeout(() => resolve(frameTimeNanos / 1e6), 0),
      }),
    );
  });
};

let layoutPasses = 0;
let draws = 0;
let watchedRoot: any = null;
let layoutListener: any = null;
let drawListener: any = null;

// Handlers assigned from JS to EventHandler<Object> events (CompositionTarget.Rendering,
// LayoutUpdated) never fire in the Windows runtime, so the native component counts frames and
// layout passes and these poll it.
const diagnostics = (): any => g.NativeScript.Mason.Diagnostics;
const passCount = (): number => (__WINDOWS__ ? Number(diagnostics().LayoutPassCount) : layoutPasses);
const drawCount = (): number => (__WINDOWS__ ? Number(diagnostics().FrameCount) : draws);

// A zero-delay poll keeps the UI thread's queue full and XAML never gets to render a frame.
const POLL_MS = 4;

function nextCompositorFrame(): Promise<number> {
  const start = diagnostics().FrameCount;
  // A minimized window stops producing frames; don't hang the run.
  const deadline = Date.now() + 1000;
  return new Promise((resolve) => {
    const poll = () => {
      if (diagnostics().FrameCount !== start || Date.now() > deadline) resolve(now());
      else setTimeout(poll, POLL_MS);
    };
    setTimeout(poll, POLL_MS);
  });
}

/** Subscribes the Windows frame counter before the first measured frame. */
export function startFrameClock(): void {
  if (__WINDOWS__) diagnostics().FrameCount;
}

export function stopFrameClock(): void {}

function watchLayout(view: any): void {
  unwatchLayout();
  if (__WINDOWS__) {
    const nativeView = view?.nativeViewProtected ?? view?.windows ?? view?._view;
    if (!nativeView) return;
    diagnostics().WatchLayout(nativeView);
    watchedRoot = nativeView;
    return;
  }
  if (!__ANDROID__) return;
  const nativeView = view?.android ?? view?.nativeViewProtected;
  if (!nativeView?.getViewTreeObserver) return;
  layoutListener = new android.view.ViewTreeObserver.OnGlobalLayoutListener({
    onGlobalLayout: () => {
      layoutPasses++;
    },
  });
  nativeView.getViewTreeObserver().addOnGlobalLayoutListener(layoutListener);
  drawListener = new android.view.ViewTreeObserver.OnDrawListener({
    onDraw: () => {
      draws++;
    },
  });
  nativeView.getViewTreeObserver().addOnDrawListener(drawListener);
  watchedRoot = nativeView;
}

export function unwatchLayout(): void {
  if (watchedRoot) {
    if (__WINDOWS__) {
      diagnostics().WatchLayout(null);
    } else {
      watchedRoot.getViewTreeObserver().removeOnGlobalLayoutListener(layoutListener);
      watchedRoot.getViewTreeObserver().removeOnDrawListener(drawListener);
    }
  }
  watchedRoot = null;
  layoutListener = null;
  drawListener = null;
}

// WinUI only raises Rendering when it has a frame to draw, so an unchanged window gives no frames
// to settle on. Let the style syncs queued as microtasks run, then run the pending layout pass
// synchronously: this times layout work, not frame pacing.
async function settledWindows(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  try {
    watchedRoot?.UpdateLayout();
  } catch (e) {
    console.log('BENCH_WARN UpdateLayout failed: ' + e);
  }
}

async function settled(): Promise<void> {
  if (__WINDOWS__) return settledWindows();
  const watching = !!watchedRoot;
  const entry = passCount();
  const deadline = Date.now() + 5000;
  let frames = 0;
  let stable = 0;
  let last = -1;
  let advanced = !watching;
  const NO_PASS_GIVE_UP = 8;
  while (Date.now() < deadline) {
    await nextFrame();
    frames++;
    const passes = passCount();
    if (passes > entry) advanced = true;
    // XAML has no pending-layout query, so Windows settles on LayoutUpdated going quiet alone.
    if (passes === last && (__WINDOWS__ || !watchedRoot?.isLayoutRequested())) {
      stable++;
    } else {
      stable = 0;
      last = passes;
    }
    if (frames >= 2 && stable >= 2 && (advanced || frames >= NO_PASS_GIVE_UP)) return;
  }
}

export async function idle(ms = 150): Promise<void> {
  const gc = g.gc;
  if (typeof gc === 'function') gc();
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const stash: Results = emptyResults();
const stashPhaseOrder: PhaseOrder = emptyPhaseOrder();
let stashStatus = '';

function record(scenario: ScenarioKey, flavour: Flavour, phase: string, sample: PhaseSample): void {
  const bucket = stash[scenario][flavour];
  (bucket[phase] ??= []).push(sample);
  const order = stashPhaseOrder[scenario];
  if (!order.includes(phase)) order.push(phase);
}

export function flushBenchUi(): void {
  setResults(JSON.parse(JSON.stringify(stash)));
  setPhaseOrder(JSON.parse(JSON.stringify(stashPhaseOrder)));
  if (stashStatus) setStatus(stashStatus);
}

export function setBenchStatus(text: string): void {
  stashStatus = text;
}

function resetBenchRunState(): void {
  const fresh = emptyResults();
  (Object.keys(stash) as ScenarioKey[]).forEach((k) => {
    stash[k] = fresh[k];
  });
  stashPhaseOrder.feed = [];
  stashPhaseOrder.dashboard = [];
  stashPhaseOrder.nested = [];
  stashPhaseOrder.rich = [];
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
    const drawsAtStart = drawCount();
    const passesAtStart = passCount();
    let undrawnTicks = 0;
    for (let i = 0; i < count; i++) {
      const frameStart = now();
      const drawsBefore = drawCount();
      mutate(i);
      if (__WINDOWS__) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        try {
          watchedRoot?.UpdateLayout();
        } catch {}
      } else await nextFrame();
      if (drawCount() === drawsBefore) undrawnTicks++;
      worst = Math.max(worst, now() - frameStart);
    }
    await settled();
    record(this.scenario, this.flavour, `${phase} x${count}`, {
      ms: now() - start,
      cpuMs: cpuNow() - startCpu,
      worstFrameMs: worst,
      draws: drawCount() - drawsAtStart,
      passes: passCount() - passesAtStart,
      undrawnTicks,
    });
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
