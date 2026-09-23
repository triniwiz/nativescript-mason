<template>
  <Frame>
    <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Layout benchmark">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body bench">
        <p class="lead">
          Three screens, each built twice: once from MasonKit elements, once from @nativescript/core layouts. The
          runner opens every page, times mount, first frame and a scripted workload, pops back, and repeats.
          Medians are shown; the last column is Mason ÷ core, so below 1.0 means Mason was faster.
        </p>

        <section class="card controls">
          <div class="control-row">
            <span class="h2">Run all</span>
            <div class="iters">
              <div v-for="n in [1, 3, 5, 10]" :key="n" class="iter" :class="{ selected: iterations === n }" @tap="iterations = n">
                <span class="iter-text">{{ n }}×</span>
              </div>
            </div>
          </div>
          <div class="control-row">
            <button class="btn-primary" :class="{ disabled: running }" @tap="runAll">{{ running ? 'Running…' : 'Start' }}</button>
            <button class="btn-plain" @tap="resetResults">Clear</button>
            <button class="btn-plain" @tap="dump">Log JSON</button>
          </div>
          <span class="muted">{{ status || 'Idle' }}</span>
        </section>

        <section v-for="s in scenarios" :key="s.key" class="card">
          <div class="scenario-head">
            <div class="scenario-text">
              <span class="h2">{{ s.title }}</span>
              <span class="muted">{{ s.desc }}</span>
            </div>
          </div>
          <div class="open-row">
            <button class="btn-open mason" @tap="open(s.mason)">Open Mason</button>
            <button class="btn-open core" @tap="open(s.core)">Open core</button>
          </div>

          <div v-if="phaseOrder[s.key].length" class="table">
            <div class="tr th">
              <span class="td phase">phase</span>
              <span class="td num">mason</span>
              <span class="td num">core</span>
              <span class="td num">m÷c</span>
            </div>
            <div v-for="row in rowsFor(s.key)" :key="row.phase" class="tr">
              <span class="td phase">{{ row.phase }}</span>
              <span class="td num">{{ row.mason }}</span>
              <span class="td num">{{ row.core }}</span>
              <span class="td num ratio" :class="row.ratioClass">{{ row.ratio }}</span>
            </div>
          </div>
        </section>
      </main>
    </Scroll>
    </Page>
  </Frame>
</template>

<script lang="ts" setup>
import { $navigateBack, $navigateTo, onMounted, ref, type Component } from 'nativescript-vue';
import { beginNavigation, flushBenchUi, fmt, idle, median, phaseOrder, resetResults, results, running, setBenchStatus, status, type Flavour, type PhaseSample, type ScenarioKey } from './harness';
import FeedMason from './FeedMason.vue';
import FeedCore from './FeedCore.vue';
import DashboardMason from './DashboardMason.vue';
import DashboardCore from './DashboardCore.vue';
import NestedMason from './NestedMason.vue';
import NestedCore from './NestedCore.vue';

interface Scenario {
  key: ScenarioKey;
  title: string;
  desc: string;
  mason: Component;
  core: Component;
}

const scenarios: Scenario[] = [
  { key: 'feed', title: 'Feed', desc: '100 keyed rows: avatar, two text lines, badge. Append, prepend, shuffle, retitle, clear, refill.', mason: FeedMason, core: FeedCore },
  { key: 'dashboard', title: 'Dashboard', desc: '24 stat tiles in a 3-column grid, each with a 5-bar chart. Value ticks, rotation, column count change.', mason: DashboardMason, core: DashboardCore },
  { key: 'nested', title: 'Nested', desc: 'Binary tree 6 levels deep (63 boxes) alternating row / column, wrapped text at every level. Retext, hide row text, resize root.', mason: NestedMason, core: NestedCore },
];

const iterations = ref(3);

function open(page: Component): void {
  $navigateTo(page);
}

async function runPage(page: Component, label: string): Promise<void> {
  const done = beginNavigation();
  $navigateTo(page, { animated: false, props: { auto: true } });
  await done;
  await idle(250);
  // Safe zone: no timing window is open now, so publishing the bench page's
  // reactive UI (status + results table) cannot leak native layout work
  // into any sample.
  setBenchStatus(label);
  flushBenchUi();
}

async function runAll(): Promise<void> {
  if (running.value) return;
  running.value = true;
  resetResults();
  try {
    for (let i = 0; i < iterations.value; i++) {
      for (const s of scenarios) {
        // Alternate the order so neither flavour always pays for the other's warm-up.
        const order: Array<[Flavour, Component]> = i % 2 ? [['core', s.core], ['mason', s.mason]] : [['mason', s.mason], ['core', s.core]];
        for (const [flavour, page] of order) {
          await runPage(page, `Run ${i + 1}/${iterations.value} · ${s.title} · ${flavour}`);
        }
      }
    }
    status.value = `Done: ${iterations.value} run(s)`;
    dump();
  } finally {
    running.value = false;
  }
}

// Headless bench runs: app launches straight into this page, give the UI a
// moment to settle, then start the default 3x run on its own.
onMounted(() => {
  setTimeout(() => runAll(), 800);
});

interface Row {
  phase: string;
  mason: string;
  core: string;
  ratio: string;
  ratioClass: string;
}

const med = (samples: PhaseSample[] | undefined, pick: (s: PhaseSample) => number | undefined): number =>
  median((samples ?? []).map(pick).filter((v): v is number => typeof v === 'number'));

function rowsFor(key: ScenarioKey): Row[] {
  const rows: Row[] = [];
  const r = results.value[key];
  for (const phase of phaseOrder.value[key]) {
    const m = med(r.mason[phase], (s) => s.ms);
    const c = med(r.core[phase], (s) => s.ms);
    rows.push(makeRow(phase, m, c));
    const mw = med(r.mason[phase], (s) => s.worstFrameMs);
    const cw = med(r.core[phase], (s) => s.worstFrameMs);
    if (Number.isFinite(mw) || Number.isFinite(cw)) rows.push(makeRow(`  worst frame`, mw, cw));
  }
  return rows;
}

function makeRow(phase: string, m: number, c: number): Row {
  const ratio = m / c;
  return {
    phase,
    mason: fmt(m),
    core: fmt(c),
    ratio: fmt(ratio, 2),
    ratioClass: !Number.isFinite(ratio) ? '' : ratio <= 0.9 ? 'good' : ratio >= 1.25 ? 'bad' : '',
  };
}

/** Print a single-line JSON summary so it can be pulled out of logcat. */
function dump(): void {
  const out: Record<string, Record<string, Record<string, unknown>>> = {};
  for (const s of scenarios) {
    out[s.key] = {};
    for (const phase of phaseOrder.value[s.key]) {
      const r = results.value[s.key];
      out[s.key][phase] = {
        mason: med(r.mason[phase], (x) => x.ms),
        core: med(r.core[phase], (x) => x.ms),
        masonWorst: med(r.mason[phase], (x) => x.worstFrameMs),
        coreWorst: med(r.core[phase], (x) => x.worstFrameMs),
        masonSamples: (r.mason[phase] ?? []).map((x) => Math.round(x.ms * 10) / 10),
        coreSamples: (r.core[phase] ?? []).map((x) => Math.round(x.ms * 10) / 10),
      };
    }
  }
  console.log('BENCH_RESULT ' + JSON.stringify(out));
}
</script>

<style scoped>
.bench {
  display: flex;
  flex-direction: column;
  gap: 12;
}

.lead {
  font-size: 12;
  color: var(--text-2);
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 10;
}

.control-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8;
}

.iters {
  display: flex;
  flex-direction: row;
  gap: 6;
  margin-left: auto;
}

.iter {
  padding: 4 10;
  border-radius: 6;
  background-color: var(--surface-2);
}

.iter.selected {
  background-color: var(--primary);
}

.iter-text {
  font-size: 12;
  color: var(--text);
}

.iter.selected .iter-text {
  color: var(--on-primary);
}

.btn-primary {
  padding: 8 16;
  border-radius: 8;
  background-color: var(--primary);
  color: var(--on-primary);
  font-size: 13;
}

.btn-primary.disabled {
  background-color: var(--muted);
}

.btn-plain {
  padding: 8 12;
  border-radius: 8;
  background-color: var(--surface-2);
  color: var(--text);
  font-size: 13;
}

.scenario-head {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.scenario-text {
  display: flex;
  flex-direction: column;
  gap: 2;
  flex-grow: 1;
}

.open-row {
  display: flex;
  flex-direction: row;
  gap: 8;
  margin-top: 10;
}

.btn-open {
  padding: 6 12;
  border-radius: 8;
  font-size: 12;
  color: #ffffff;
}

.btn-open.mason {
  background-color: #6c5ce7;
}

.btn-open.core {
  background-color: #0984e3;
}

.table {
  display: flex;
  flex-direction: column;
  margin-top: 10;
  border-radius: 8;
  background-color: var(--surface-2);
  padding: 6;
}

.tr {
  display: flex;
  flex-direction: row;
  padding: 3 4;
}

.th .td {
  font-weight: bold;
  color: var(--muted);
}

.td {
  font-size: 11;
  color: var(--text);
}

.phase {
  flex-grow: 1;
  flex-basis: 0;
}

.num {
  width: 56;
  text-align: right;
}

.ratio.good {
  color: var(--success);
}

.ratio.bad {
  color: var(--danger);
}
</style>
