import { afterNextRender, Component, computed, inject, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NativeScriptRouterModule, RouterExtensions } from '@nativescript/angular';
import { File, knownFolders, path } from '@nativescript/core';
import { beginNavigation, benchSnapshot, Flavour, fmt, idle, median, PhaseSample, resetBench, ScenarioKey, setBenchStatus } from '@demo/shared/bench/harness';
import { DemoPageComponent } from '../shared/demo-page.component';

interface Row {
  phase: string;
  mason: string;
  core: string;
  ratio: string;
  ratioClass: string;
}

const medianOf = (samples: PhaseSample[] | undefined, pick: (s: PhaseSample) => number | undefined): number => median((samples ?? []).map(pick).filter((v): v is number => typeof v === 'number'));
const rounded = (samples: PhaseSample[] | undefined, pick: (s: PhaseSample) => number | undefined): number[] => (samples ?? []).map((s) => Math.round((pick(s) ?? NaN) * 10) / 10);

function makeRow(phase: string, mason: number, core: number): Row {
  const ratio = mason / core;
  return { phase, mason: fmt(mason), core: fmt(core), ratio: fmt(ratio, 2), ratioClass: ratio <= 0.9 ? 'good' : ratio >= 1.25 ? 'bad' : '' };
}

@Component({ selector: 'bench-home', templateUrl: 'bench-home.component.html', styleUrl: 'bench-home.component.scss', imports: [DemoPageComponent, NativeScriptRouterModule], schemas: [NO_ERRORS_SCHEMA] })
export class BenchHomeComponent {
  private readonly router = inject(RouterExtensions);
  private readonly snapshot = signal(benchSnapshot());

  readonly scenarios: { key: ScenarioKey; title: string; desc: string }[] = [
    { key: 'feed', title: 'Feed', desc: '100 keyed rows: avatar, two text lines, badge. Append, prepend, shuffle, retitle, clear, refill.' },
    { key: 'dashboard', title: 'Dashboard', desc: '24 stat tiles in a 3-column grid, each with a 5-bar chart. Value ticks, rotation, column count change.' },
    { key: 'nested', title: 'Nested', desc: 'Binary tree 6 levels deep (63 boxes) alternating row / column, wrapped text at every level. Retext, hide row text, resize root.' },
    { key: 'rich', title: 'Rich text', desc: '30 cards, each a paragraph of 12 mixed bold/italic/colored spans plus a 4-span meta line (~500 spans total). Retext, restyle, reflow on resize.' },
  ];
  readonly running = signal(false);
  readonly iterations = signal(5);
  readonly status = computed(() => this.snapshot().status);
  /** The results table of each scenario that has run. */
  readonly tables = computed(() => Object.fromEntries(this.scenarios.map(({ key }) => [key, this.rowsFor(key)]).filter(([, rows]) => rows.length)) as Partial<Record<ScenarioKey, Row[]>>);

  constructor() {
    const runs = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('runs'));
    if (runs > 0) {
      this.iterations.set(runs);
      afterNextRender(() => setTimeout(() => this.runAll(), 800));
    }
  }

  async runAll(): Promise<void> {
    if (this.running()) return;
    this.running.set(true);
    this.reset();
    try {
      for (let i = 0; i < this.iterations(); i++) {
        // Alternating which flavour goes first, so neither always pays for a cold start.
        const order: Flavour[] = i % 2 ? ['core', 'mason'] : ['mason', 'core'];
        for (const { key, title } of this.scenarios) {
          for (const flavour of order) {
            await this.runScreen(key, flavour, `Run ${i + 1}/${this.iterations()} · ${title} · ${flavour}`);
          }
        }
      }
      setBenchStatus(`Done: ${this.iterations()} run(s)`);
      this.snapshot.set(benchSnapshot());
      this.dump();
    } finally {
      this.running.set(false);
    }
  }

  reset(): void {
    resetBench();
    this.snapshot.set(benchSnapshot());
  }

  dump(): void {
    const { results, phaseOrder } = this.snapshot();
    const out: Record<string, Record<string, unknown>> = {};
    for (const { key } of this.scenarios) {
      const { mason, core } = results[key];
      out[key] = Object.fromEntries(
        phaseOrder[key].map((phase) => [
          phase,
          {
            mason: medianOf(mason[phase], (s) => s.ms),
            core: medianOf(core[phase], (s) => s.ms),
            masonCpu: medianOf(mason[phase], (s) => s.cpuMs),
            coreCpu: medianOf(core[phase], (s) => s.cpuMs),
            masonDraws: medianOf(mason[phase], (s) => s.draws),
            coreDraws: medianOf(core[phase], (s) => s.draws),
            masonPasses: medianOf(mason[phase], (s) => s.passes),
            corePasses: medianOf(core[phase], (s) => s.passes),
            masonUndrawn: medianOf(mason[phase], (s) => s.undrawnTicks),
            coreUndrawn: medianOf(core[phase], (s) => s.undrawnTicks),
            masonWorst: medianOf(mason[phase], (s) => s.worstFrameMs),
            coreWorst: medianOf(core[phase], (s) => s.worstFrameMs),
            masonSamples: rounded(mason[phase], (s) => s.ms),
            coreSamples: rounded(core[phase], (s) => s.ms),
            masonCpuSamples: rounded(mason[phase], (s) => s.cpuMs),
            coreCpuSamples: rounded(core[phase], (s) => s.cpuMs),
          },
        ]),
      );
      // One line per scenario: logcat truncates long lines.
      console.log('BENCH_RESULT ' + JSON.stringify({ [key]: out[key] }));
    }
    const file = File.fromPath(path.join(knownFolders.documents().path, 'bench.json'));
    file.writeText(JSON.stringify(out)).then(
      () => console.log(`bench.json written to ${file.path}`),
      (e) => console.log(`bench.json write failed: ${e}`),
    );
  }

  private async runScreen(scenario: ScenarioKey, flavour: Flavour, label: string): Promise<void> {
    const done = beginNavigation(scenario, flavour);
    this.router.navigate(['/bench', scenario, flavour], { animated: false, queryParams: { auto: 1 } });
    await done;
    await idle(250);
    setBenchStatus(label);
    this.snapshot.set(benchSnapshot());
  }

  private rowsFor(key: ScenarioKey): Row[] {
    const { results, phaseOrder } = this.snapshot();
    const { mason, core } = results[key];
    return phaseOrder[key].flatMap((phase) => {
      const rows = [
        makeRow(
          phase,
          medianOf(mason[phase], (s) => s.ms),
          medianOf(core[phase], (s) => s.ms),
        ),
      ];
      const masonWorst = medianOf(mason[phase], (s) => s.worstFrameMs);
      const coreWorst = medianOf(core[phase], (s) => s.worstFrameMs);
      if (Number.isFinite(masonWorst) || Number.isFinite(coreWorst)) rows.push(makeRow('  worst frame', masonWorst, coreWorst));
      return rows;
    });
  }
}
