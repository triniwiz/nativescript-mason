import { createSignal, For, Show } from 'solid-js'
import { BG, MUTED, TEXT } from '../components/controls'
import { FixtureTree } from './FixtureTree'
import type { FixtureNode } from './types'

// TEMP diagnostic page: isolates the WebSpec mount/unmount churn pattern down to just 2 rounds
// instead of running the full 374-fixture suite, to iterate much faster on
// the "identical style, different clamp result 65ms apart" latch bug.
// Every round uses the byte-identical width:600/max-width:300 tree; if the
// bug is a stale-cache/timing latch (not a Taffy math error), some rounds
// should read back 600 (wrong) instead of 300 (correct) even though nothing
// about the style differs between rounds.

const ROUNDS = 8

function makeTree(seq: number): FixtureNode {
  return {
    seq,
    style: { position: 'absolute', width: '600px', 'max-width': '300px' },
    children: [],
  }
}

export default function MaxWidthChurnRepro() {
  const [log, setLog] = createSignal<string[]>([])
  const [round, setRound] = createSignal(0)
  const [running, setRunning] = createSignal(false)

  function append(line: string) {
    console.log('[MaxWidthChurnRepro] ' + line)
    setLog((l) => [...l, line])
  }

  // `round` is 1-based (0 = idle/not running); onMounted for round N calls
  // runNext(N) to advance to round N+1 or finish.
  function runNext(completed: number) {
    if (completed >= ROUNDS) {
      setRunning(false)
      append('DONE')
      return
    }
    setRound(completed + 1)
  }

  function start() {
    setLog([])
    setRunning(true)
    runNext(0) // -> round 1
  }

  function onMounted(roundNum: number, refs: Map<number, any>) {
    const view = refs.get(0)
    if (!view) {
      append(`round ${roundNum}: NO VIEW`)
      runNext(roundNum)
      return
    }
    const { width, height } = view.getActualSize()
    const verdict = Math.abs(width - 300) < 0.5 ? 'OK' : 'BUG'
    append(`round ${roundNum}: width=${width} height=${height} -> ${verdict}`)
    // Unmount before the next round mounts, matching FixtureTree teardown
    // timing in the real WebSpec harness (Show/keyed swaps the subtree).
    runNext(roundNum)
  }

  return (
    <>
      <actionbar title="MaxWidth Churn Repro" />
      <scroll style={{ backgroundColor: BG, padding: 16, overflowY: 'scroll' }}>
        <p style={{ fontSize: 13, color: TEXT, marginBottom: 10 }}>
          Mounts the SAME width:600/max-width:300 tree {ROUNDS} times in a row, off-screen, exactly like WebSpec's
          FixtureTree churn. Expect every round to read back width=300. Any round reading 600 reproduces the latch
          bug without needing the full 374-fixture run.
        </p>
        <div
          style={{ backgroundColor: '#6c5ce7', borderRadius: '12px', padding: 14, marginBottom: 14, alignItems: 'center' }}
          //@ts-ignore
          on:click={() => { if (!running()) start() }}
        >
          <p style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>{running() ? `Running ${round()}/${ROUNDS}…` : 'Run'}</p>
        </div>
        <For each={log()}>
          {(line) => (
            <p style={{ fontSize: 12, color: line.includes('BUG') ? '#e84393' : MUTED, marginBottom: 4 }}>{line}</p>
          )}
        </For>

        <div style={{ position: 'absolute', top: -20000, left: 0, width: 1024, opacity: 0 }}>
          <Show when={running() ? round() : 0} keyed>
            {(r: number) => <FixtureTree tree={makeTree(0)} onMounted={(refs) => onMounted(r, refs)} />}
          </Show>
        </div>
      </scroll>
    </>
  )
}
