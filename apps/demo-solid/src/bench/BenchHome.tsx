import { createSignal, For, onMount, Show } from 'solid-js'
import { useRouter } from 'solid-navigation'
import { File, knownFolders, path } from '@nativescript/core'
import { beginNavigation, flushBenchUi, fmt, idle, median, phaseOrder, resetResults, results, running, setBenchStatus, setRunning, setStatus, startFrameClock, status, stopFrameClock, type Flavour, type PhaseSample, type ScenarioKey } from './harness'
import type { BenchRouteName } from './routes'
import './styles'

/**
 * Starts a full run once BenchHome mounts, so the app can be launched straight into the bench
 * (`initialRouteName="BenchHome"`) and log results without input: synthetic taps don't reach
 * navigated pages on Windows. `globalThis.__benchAutoStart = true` forces it when this is off.
 */
export const AUTO_START = true

interface Scenario {
  key: ScenarioKey
  title: string
  desc: string
  mason: BenchRouteName
  core: BenchRouteName
}

const scenarios: Scenario[] = [
  { key: 'feed', title: 'Feed', desc: '100 keyed rows: avatar, two text lines, badge. Append, prepend, shuffle, retitle, clear, refill.', mason: 'BenchFeedMason', core: 'BenchFeedCore' },
  { key: 'dashboard', title: 'Dashboard', desc: '24 stat tiles in a 3-column grid, each with a 5-bar chart. Value ticks, rotation, column count change.', mason: 'BenchDashboardMason', core: 'BenchDashboardCore' },
  { key: 'nested', title: 'Nested', desc: 'Binary tree 6 levels deep (63 boxes) alternating row / column, wrapped text at every level. Retext, hide row text, resize root.', mason: 'BenchNestedMason', core: 'BenchNestedCore' },
  { key: 'rich', title: 'Rich text', desc: '30 cards, each a paragraph of 12 mixed bold/italic/colored spans plus a 4-span meta line (~500 spans total). Retext, restyle, reflow on resize.', mason: 'BenchRichMason', core: 'BenchRichCore' },
]

const ITERATION_CHOICES = [1, 3, 5, 10]

interface Row {
  phase: string
  mason: string
  core: string
  ratio: string
  ratioClass: string
}

const med = (samples: PhaseSample[] | undefined, pick: (s: PhaseSample) => number | undefined): number => median((samples ?? []).map(pick).filter((v): v is number => typeof v === 'number'))

function makeRow(phase: string, m: number, c: number): Row {
  const ratio = m / c
  return {
    phase,
    mason: fmt(m),
    core: fmt(c),
    ratio: fmt(ratio, 2),
    ratioClass: !Number.isFinite(ratio) ? '' : ratio <= 0.9 ? 'bh-good' : ratio >= 1.25 ? 'bh-bad' : '',
  }
}

function rowsFor(key: ScenarioKey): Row[] {
  const rows: Row[] = []
  const r = results()[key]
  for (const phase of phaseOrder()[key]) {
    const m = med(r.mason[phase], (s) => s.ms)
    const c = med(r.core[phase], (s) => s.ms)
    rows.push(makeRow(phase, m, c))
    const mw = med(r.mason[phase], (s) => s.worstFrameMs)
    const cw = med(r.core[phase], (s) => s.worstFrameMs)
    if (Number.isFinite(mw) || Number.isFinite(cw)) rows.push(makeRow(`  worst frame`, mw, cw))
  }
  return rows
}

function dump(): void {
  const out: Record<string, Record<string, Record<string, unknown>>> = {}
  const written = (text: string) => {
    try {
      const file = File.fromPath(path.join(knownFolders.documents().path, 'bench.json'))
      file.writeTextSync(text)
      console.log(`bench.json written to ${file.path}`)
    } catch (e) {
      console.log(`bench.json write failed: ${e}`)
    }
  }
  for (const s of scenarios) {
    out[s.key] = {}
    for (const phase of phaseOrder()[s.key]) {
      const r = results()[s.key]
      out[s.key][phase] = {
        mason: med(r.mason[phase], (x) => x.ms),
        core: med(r.core[phase], (x) => x.ms),
        masonCpu: med(r.mason[phase], (x) => x.cpuMs),
        coreCpu: med(r.core[phase], (x) => x.cpuMs),
        masonDraws: med(r.mason[phase], (x) => x.draws),
        coreDraws: med(r.core[phase], (x) => x.draws),
        masonPasses: med(r.mason[phase], (x) => x.passes),
        corePasses: med(r.core[phase], (x) => x.passes),
        masonUndrawn: med(r.mason[phase], (x) => x.undrawnTicks),
        coreUndrawn: med(r.core[phase], (x) => x.undrawnTicks),
        masonWorst: med(r.mason[phase], (x) => x.worstFrameMs),
        coreWorst: med(r.core[phase], (x) => x.worstFrameMs),
        masonSamples: (r.mason[phase] ?? []).map((x) => Math.round(x.ms * 10) / 10),
        coreSamples: (r.core[phase] ?? []).map((x) => Math.round(x.ms * 10) / 10),
        masonCpuSamples: (r.mason[phase] ?? []).map((x) => Math.round((x.cpuMs ?? NaN) * 10) / 10),
        coreCpuSamples: (r.core[phase] ?? []).map((x) => Math.round((x.cpuMs ?? NaN) * 10) / 10),
      }
    }
  }
  // One line per scenario: logcat truncates long lines.
  for (const [key, phases] of Object.entries(out)) {
    console.log('BENCH_RESULT ' + JSON.stringify({ [key]: phases }))
  }
  written(JSON.stringify(out))
}

/**
 * Vue navigates with `animated: false`. solid-navigation doesn't forward it, so it goes on the
 * frame; core's Windows frame ignores it and always slides, and a zero duration is its unanimated path.
 */
function withoutNavAnimation(frame: any): () => void {
  if (!frame) return () => {}
  const animated = frame.animated
  const slideIn = __WINDOWS__ ? frame._slideIn : undefined
  const fadeIn = __WINDOWS__ ? frame._fadeIn : undefined
  frame.animated = false
  if (slideIn) frame._slideIn = (native: any, fromRight: boolean) => slideIn.call(frame, native, fromRight, 0)
  if (fadeIn) frame._fadeIn = (native: any) => fadeIn.call(frame, native, 0)
  return () => {
    frame.animated = animated
    if (slideIn) frame._slideIn = slideIn
    if (fadeIn) frame._fadeIn = fadeIn
  }
}

export default function BenchHome() {
  const router = useRouter()
  const [iterations, setIterations] = createSignal(5)

  function open(route: BenchRouteName): void {
    router.navigate(route, { params: { auto: false } })
  }

  async function runPage(route: BenchRouteName, label: string): Promise<void> {
    const done = beginNavigation()
    router.navigate(route, { params: { auto: true } })
    await done
    await idle(250)
    setBenchStatus(label)
    flushBenchUi()
  }

  function warmupBalancedOrder(s: Scenario, iteration: number): Array<[Flavour, BenchRouteName]> {
    return iteration % 2
      ? [
          ['core', s.core],
          ['mason', s.mason],
        ]
      : [
          ['mason', s.mason],
          ['core', s.core],
        ]
  }

  async function runAll(): Promise<void> {
    if (running()) return
    setRunning(true)
    resetResults()
    const restoreNavAnimation = withoutNavAnimation(router.ref())
    startFrameClock()
    const startedAt = Date.now()
    try {
      for (let i = 0; i < iterations(); i++) {
        for (const s of scenarios) {
          for (const [flavour, route] of warmupBalancedOrder(s, i)) {
            await runPage(route, `Run ${i + 1}/${iterations()} · ${s.title} · ${flavour}`)
          }
        }
      }
      setStatus(`Done: ${iterations()} run(s)`)
      dump()
      console.log('BENCH_DONE ' + JSON.stringify({ iterations: iterations(), seconds: Math.round((Date.now() - startedAt) / 1000) }))
    } catch (e) {
      console.log('BENCH_ERROR ' + (e?.stack ?? e))
    } finally {
      stopFrameClock()
      restoreNavAnimation()
      setRunning(false)
    }
  }

  onMount(() => {
    const forced = (globalThis as { __benchAutoStart?: boolean }).__benchAutoStart === true
    if (AUTO_START || forced) setTimeout(() => void runAll(), 800)
  })

  return (
    <>
      <actionbar title="Layout benchmark" />
      <scroll class="bench-page">
        <main class="bench-page-body bh-bench">
          <p class="bh-lead" text="Three screens, each built twice: once from MasonKit elements, once from @nativescript/core layouts. The runner opens every page, times mount, first frame and a scripted workload, pops back, and repeats. Medians are shown; the last column is Mason ÷ core, so below 1.0 means Mason was faster." />

          <section class="bench-card bh-controls">
            <div class="bh-control-row">
              <span class="bench-h2" text="Run all" />
              <div class="bh-iters">
                <For each={ITERATION_CHOICES}>
                  {(n) => (
                    <div class={iterations() === n ? 'bh-iter bh-selected' : 'bh-iter'} on:click={() => setIterations(n)}>
                      <span class="bh-iter-text" text={`${n}×`} />
                    </div>
                  )}
                </For>
              </div>
            </div>
            <div class="bh-control-row">
              <div class={running() ? 'bh-btn-primary bh-disabled' : 'bh-btn-primary'} on:click={() => void runAll()}>
                <span class="bh-btn-primary-text" text={running() ? 'Running…' : 'Start'} />
              </div>
              <div class="bh-btn-plain" on:click={() => resetResults()}>
                <span class="bh-btn-plain-text" text="Clear" />
              </div>
              <div class="bh-btn-plain" on:click={() => dump()}>
                <span class="bh-btn-plain-text" text="Log JSON" />
              </div>
            </div>
            <span class="bench-muted" text={status() || 'Idle'} />
          </section>

          <For each={scenarios}>
            {(s) => (
              <section class="bench-card">
                <div class="bh-scenario-head">
                  <div class="bh-scenario-text">
                    <span class="bench-h2" text={s.title} />
                    <span class="bench-muted" text={s.desc} />
                  </div>
                </div>
                <div class="bh-open-row">
                  <div class="bh-btn-open bh-mason" on:click={() => open(s.mason)}>
                    <span class="bh-btn-open-text" text="Open Mason" />
                  </div>
                  <div class="bh-btn-open bh-core" on:click={() => open(s.core)}>
                    <span class="bh-btn-open-text" text="Open core" />
                  </div>
                </div>

                <div>
                  <Show when={phaseOrder()[s.key].length}>
                    <div class="bh-table">
                      <div class="bh-tr bh-th">
                        <span class="bh-td bh-phase" text="phase" />
                        <span class="bh-td bh-num" text="mason" />
                        <span class="bh-td bh-num" text="core" />
                        <span class="bh-td bh-num" text="m÷c" />
                      </div>
                      <For each={rowsFor(s.key)}>
                        {(row) => (
                          <div class="bh-tr">
                            <span class="bh-td bh-phase" text={row.phase} />
                            <span class="bh-td bh-num" text={row.mason} />
                            <span class="bh-td bh-num" text={row.core} />
                            <span class={`bh-td bh-num bh-ratio ${row.ratioClass}`} text={row.ratio} />
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </section>
            )}
          </For>
        </main>
      </scroll>
    </>
  )
}
