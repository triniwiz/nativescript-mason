import { createSignal, createMemo, For, Show, ErrorBoundary, onMount } from 'solid-js'
import { BG, MUTED, TEXT, CARD } from '../components/controls'
import { FixtureTree } from './FixtureTree'
import fixturesData from './fixtures.generated.json'
import type { Fixture, FixtureResult, RectDiff } from './types'

// Numeric conformance suite: each fixture is a style tree lifted from a real
// CSS layout test (tools/scripts/gentests/taffy_tests), with expected layout
// rects computed by actually rendering it in headless Chromium
// (tools/scripts/webspec-tests/generate.mjs). We mount the same tree through
// masonkit's own <div> components off-screen, let native layout settle, then
// compare the measured frame of every node against the browser's rects.
const fixtures = fixturesData as unknown as Fixture[]
// Built once so <For> can key rows by stable object identity — recomputing
// {fx, idx} wrappers inside a reactive scope forces a full row teardown and
// remount on every single result update instead of just the changed row.
const indexedFixtures = fixtures.map((fx, idx) => ({ fx, idx }))

const EPS = 0.5

function emptyResults(): FixtureResult[] {
  return fixtures.map(() => ({ status: 'pending', diffs: [] }))
}

export default function WebSpec() {
  const [results, setResults] = createSignal<FixtureResult[]>(emptyResults())
  const [runToken, setRunToken] = createSignal(0) // 0 = idle, else (index + 1)
  const [batchRunning, setBatchRunning] = createSignal(false)
  const [expanded, setExpanded] = createSignal<string | null>(null)
  // Rendering all 374 rows at once blocks the native layout pass long enough
  // to trip Android's ANR watchdog — keep the visible list small and let
  // people page through it or filter down to just the failures.
  const [visibleCount, setVisibleCount] = createSignal(60)
  const [onlyFailures, setOnlyFailures] = createSignal(false)

  // TEMP: auto-start the run on mount for unattended device runs (tapping a
  // simulator from a script isn't possible). Revert before merging.
  onMount(() => {
    setTimeout(() => {
      setResults(emptyResults())
      setExpanded(null)
      runFrom(0)
    }, 800)
  })

  const rows = createMemo(() => {
    if (onlyFailures()) {
      const rs = results()
      return indexedFixtures.filter(({ idx }) => rs[idx]?.status === 'fail')
    }
    return indexedFixtures.slice(0, visibleCount())
  })

  const summary = createMemo(() => {
    const rs = results()
    return {
      pass: rs.filter((r) => r.status === 'pass').length,
      fail: rs.filter((r) => r.status === 'fail').length,
      pending: rs.filter((r) => r.status === 'pending').length,
    }
  })

  // Some fixtures never call back at all (observed: a mount that silently
  // stalls with no error and no measurement, freezing the whole batch with
  // no crash to diagnose). A watchdog guarantees the run always finishes.
  function scheduleWatchdog(idx: number) {
    const token = idx + 1
    setTimeout(() => {
      if (runToken() === token && results()[idx]?.status === 'running') {
        handleFixtureError(idx, new Error('timed out waiting for native layout (4s)'))
      }
    }, 4000)
  }

  function runFrom(idx: number) {
    if (idx >= fixtures.length) {
      setBatchRunning(false)
      setRunToken(0)
      dumpFailures()
      return
    }
    setBatchRunning(true)
    setResults((rs) => rs.map((r, i) => (i === idx ? { status: 'running', diffs: [] } : r)))
    setRunToken(idx + 1)
    scheduleWatchdog(idx)
  }

  function runOne(idx: number) {
    setBatchRunning(false)
    setResults((rs) => rs.map((r, i) => (i === idx ? { status: 'running', diffs: [] } : r)))
    setRunToken(idx + 1)
    scheduleWatchdog(idx)
  }

  function handleMounted(idx: number, refs: Map<number, any>) {
    try {
      const fx = fixtures[idx]
      const root = refs.get(0)
      const diffs: RectDiff[] = []

      for (const exp of fx.expected) {
        const view = refs.get(exp.seq)
        if (!view) {
          diffs.push({ seq: exp.seq, expected: exp, actual: null, error: 'view not rendered' })
          continue
        }
        let x = 0
        let y = 0
        if (exp.seq !== 0 && root) {
          const point = view.getLocationRelativeTo(root)
          x = point?.x ?? 0
          y = point?.y ?? 0
        }
        // getMeasuredWidth/Height reflect a one-shot JS-side measure pass on
        // iOS that never resyncs with masonkit's actual native Swift layout
        // pass (which sets the view's frame directly) — always 0 there.
        // getActualSize() reads the live native frame on both platforms.
        const { width, height } = view.getActualSize()
        const actual = { x, y, width, height }
        if (Math.abs(x - exp.x) > EPS || Math.abs(y - exp.y) > EPS || Math.abs(width - exp.width) > EPS || Math.abs(height - exp.height) > EPS) {
          diffs.push({ seq: exp.seq, expected: exp, actual })
        }
      }

      setResults((rs) => rs.map((r, i) => (i === idx ? { status: diffs.length ? 'fail' : 'pass', diffs } : r)))
      advance(idx)
    } catch (err) {
      // A throw here (e.g. from getLocationRelativeTo on a view left in a bad
      // state) used to leave this fixture's status stuck at 'running' forever
      // since advance() above was never reached — only the 4s JS watchdog
      // caught it, and the same throw then repeated for every fixture after.
      console.error(`[WebSpec] handleMounted threw for ${fixtures[idx]?.name}:`, err)
      handleFixtureError(idx, err)
    }
  }

  function advance(idx: number) {
    if (batchRunning()) runFrom(idx + 1)
    else setRunToken(0)
  }

  // dumps the full failure list to a file for `adb pull`, since logcat
  // truncates a console.log of this size
  function dumpFailures() {
    const rs = results()
    const failures = fixtures
      .map((fx, idx) => ({ name: fx.name, diffs: rs[idx]?.diffs ?? [] }))
      .filter((_, idx) => rs[idx]?.status === 'fail')
    const payload = JSON.stringify({ pass: summary().pass, fail: summary().fail, total: fixtures.length, failures }, null, 2)
    try {
      const { knownFolders } = require('@nativescript/core')
      const file = knownFolders.documents().getFile('webspec-failures.json')
      file.writeTextSync(payload)
      console.log('WEBSPEC_DUMP_WRITTEN ' + file.path)
    } catch (err) {
      console.error('[WebSpec] dumpFailures failed:', err)
    }
  }

  // A rejected/invalid style value (e.g. a masonkit CssProperty validator
  // that doesn't recognize a value its own Style class supports) throws
  // synchronously while mounting the fixture tree and would otherwise crash
  // the whole app — a real browser just ignores an invalid declaration.
  // Isolate that to a single failed fixture instead of taking down the run.
  function handleFixtureError(idx: number, err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    setResults((rs) =>
      rs.map((r, i) =>
        i === idx
          ? { status: 'fail', diffs: [{ seq: -1, expected: { seq: -1, x: 0, y: 0, width: 0, height: 0 }, actual: null, error: `threw: ${message}` }] }
          : r
      )
    )
    setTimeout(() => advance(idx), 0)
  }

  function statusColor(status: string) {
    switch (status) {
      case 'pass':
        return '#00b894'
      case 'fail':
        return '#e84393'
      case 'running':
        return '#fdcb6e'
      default:
        return '#b2bec3'
    }
  }

  return (
    <>
      {/* Warms the shared Ahem FontFace before the run starts: the first node
          anywhere to resolve a given (family, weight, style) still pays its
          own async load() round-trip (see Style.kt's sharedFontFace), so
          without this the very first Ahem fixture in the run would measure
          against fallback metrics for one frame. */}
      <div style={{ width: 0, height: 0, overflow: 'hidden' }}>
        <span style={{ fontFamily: 'ahem', fontSize: 1 }}>X</span>
      </div>
      <actionbar title="WebSpec Conformance" />
      <scroll style={{ backgroundColor: BG, padding: 16, overflowY: 'scroll' }}>
        <div
          style={{
            backgroundColor: CARD,
            borderRadius: '16px',
            padding: 16,
            marginBottom: 14,
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          }}
        >
          {/* margin:0 on every <p> below — <p> has a default block margin
              (web-faithful) that otherwise inflates these compact UI labels. */}
          <p style={{ fontSize: 13, color: MUTED, margin: 0, marginBottom: 10, lineHeight: 1.5 }}>
            {fixtures.length} layout fixtures ported from real CSS test cases. Expected rects come from rendering
            each one in headless Chromium; actual rects come from measuring masonkit's own native layout.
          </p>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8px 16px', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#00b894', fontWeight: 'bold', margin: 0 }}>{summary().pass} pass</p>
            <p style={{ fontSize: 12, color: '#e84393', fontWeight: 'bold', margin: 0 }}>{summary().fail} fail</p>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{summary().pending} pending</p>
          </div>
          <div
            style={{ marginBottom: 12 }}
            //@ts-ignore
            on:click={() => setOnlyFailures(!onlyFailures())}
          >
            <p style={{ fontSize: 11, color: onlyFailures() ? '#e84393' : MUTED, fontWeight: 'bold', margin: 0 }}>
              {onlyFailures() ? '☑ only showing failures' : '☐ only show failures'}
            </p>
          </div>
          <div
            style={{
              backgroundColor: runToken() ? '#dfe6e9' : '#6c5ce7',
              borderRadius: '12px',
              paddingTop: 10,
              paddingBottom: 10,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            //@ts-ignore
            on:click={() => {
              if (runToken()) return
              setResults(emptyResults())
              setExpanded(null)
              runFrom(0)
            }}
          >
            <p style={{ color: runToken() ? MUTED : 'white', fontSize: 13, fontWeight: 'bold', margin: 0 }}>
              {runToken() ? `Running ${runToken()}/${fixtures.length}…` : 'Run All'}
            </p>
          </div>
        </div>

        <For each={rows()}>
          {(row) => {
            const idx = row.idx
            const fx = row.fx
            const result = createMemo(() => results()[idx])
            const isExpanded = createMemo(() => expanded() === fx.name)
            return (
              <div
                style={{
                  backgroundColor: CARD,
                  borderRadius: '12px',
                  padding: 12,
                  marginBottom: 8,
                }}
                //@ts-ignore
                on:click={() => {
                  if (result().status === 'fail') setExpanded(isExpanded() ? null : fx.name)
                  else if (!runToken()) runOne(idx)
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '4px',
                      backgroundColor: statusColor(result().status),
                      marginRight: 10,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 12,
                      color: TEXT,
                      flexGrow: 1,
                      flexShrink: 1,
                      minWidth: 0,
                      margin: 0,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {fx.name}
                  </p>
                  <p style={{ fontSize: 10, color: MUTED, flexShrink: 0, margin: 0, marginLeft: 6 }}>{result().status}</p>
                </div>
                <Show when={isExpanded() && result().diffs.length}>
                  <div style={{ marginTop: 10, paddingTop: 10, backgroundColor: '#f8f9fb', borderRadius: '8px' }}>
                    <For each={result().diffs}>
                      {(d) => (
                        <p style={{ fontSize: 10, color: '#e84393', margin: 0, marginBottom: 4, lineHeight: 1.5 }}>
                          seq {d.seq}: {d.error ?? `expected (${d.expected.x.toFixed(1)}, ${d.expected.y.toFixed(1)}, ${d.expected.width.toFixed(1)}x${d.expected.height.toFixed(1)}) got (${d.actual!.x.toFixed(1)}, ${d.actual!.y.toFixed(1)}, ${d.actual!.width.toFixed(1)}x${d.actual!.height.toFixed(1)})`}
                        </p>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            )
          }}
        </For>

        <Show when={!onlyFailures() && visibleCount() < fixtures.length}>
          <div
            style={{ backgroundColor: CARD, borderRadius: '12px', padding: 12, marginBottom: 14 }}
            //@ts-ignore
            on:click={() => setVisibleCount(Math.min(fixtures.length, visibleCount() + 60))}
          >
            <p style={{ fontSize: 12, color: '#6c5ce7', fontWeight: 'bold', margin: 0 }}>
              Show 60 more ({fixtures.length - visibleCount()} remaining)
            </p>
          </div>
        </Show>

        {/* Off-screen stage: mounts exactly one fixture's tree at a time for measurement. */}
        <div style={{ position: 'absolute', top: -20000, left: 0, width: 1024, opacity: 0 }}>
          <ErrorBoundary
            fallback={(err) => {
              console.error(`[WebSpec] fixture ${fixtures[runToken() - 1]?.name} threw during mount:`, err)
              handleFixtureError(runToken() - 1, err)
              return null
            }}
          >
            <Show when={runToken()} keyed>
              {(token) => {
                const idx = token - 1
                return <FixtureTree tree={fixtures[idx].tree} onMounted={(refs) => handleMounted(idx, refs)} />
              }}
            </Show>
          </ErrorBoundary>
        </div>
      </scroll>
    </>
  )
}
