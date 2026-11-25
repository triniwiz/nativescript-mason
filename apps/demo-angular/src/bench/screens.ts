import { ChangeDetectorRef, computed, Directive, inject, signal, type WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterExtensions } from '@nativescript/angular';
import { Page } from '@nativescript/core';
import { bumpTiles, FEED_APPEND, FEED_INITIAL, FeedItem, makeFeed, makeNested, makeRichCards, makeTiles, NestedNode, resetSeed, restyleRich, retextNested, retextRich, RICH_APPEND, RICH_INITIAL, RichCard, Tile } from '@demo/shared/bench/data';
import { Flavour, idle, PageBench, pageDone, ScenarioKey, unwatchLayout } from '@demo/shared/bench/harness';

/** `data` of a benchmark route. */
export interface ScreenData {
  scenario: ScenarioKey;
  flavour: Flavour;
}

/**
 * One benchmark screen. It times its own mount and first frame; opened with `?auto=1` by the runner, it also runs the
 * scripted workload and goes back.
 */
@Directive()
export abstract class BenchScreen {
  private readonly route = inject(ActivatedRoute).snapshot;
  private readonly router = inject(RouterExtensions);
  private readonly changes = inject(ChangeDetectorRef);
  private readonly bench: PageBench;
  private steps = 100;

  constructor() {
    resetSeed();
    const { scenario, flavour } = this.route.data as ScreenData;
    this.bench = new PageBench(scenario, flavour);
    const page = inject(Page);
    page.once(Page.loadedEvent, () => void this.measure(page));
  }

  protected abstract workload(): Promise<void>;

  /** A different number on every tap, for the toolbar's buttons. */
  nextStep(): number {
    return ++this.steps;
  }

  back(): void {
    this.router.back();
  }

  protected run(phase: string, mutate: () => void): Promise<void> {
    return this.bench.run(phase, () => this.flush(mutate));
  }

  protected ticks(phase: string, count: number, mutate: (i: number) => void): Promise<void> {
    return this.bench.ticks(phase, count, (i) => this.flush(() => mutate(i)));
  }

  /** Change detection runs inside the measured window, rather than whenever the zone settles. */
  private flush(mutate: () => void): void {
    mutate();
    this.changes.detectChanges();
  }

  private async measure(page: Page): Promise<void> {
    this.bench.loaded(page);
    await this.bench.firstFrame();
    if (!this.route.queryParamMap.has('auto')) return;
    await this.workload();
    unwatchLayout();
    await idle();
    this.back();
    await idle();
    pageDone();
  }
}

const toggle = (flag: WritableSignal<boolean>): void => flag.update((on) => !on);

@Directive()
export abstract class FeedScreen extends BenchScreen {
  readonly items = signal<FeedItem[]>(makeFeed(FEED_INITIAL));
  private nextId = FEED_INITIAL;

  append(): void {
    this.items.update((items) => [...items, ...this.more()]);
  }

  prepend(): void {
    this.items.update((items) => [...this.more(), ...items]);
  }

  shuffle(): void {
    this.items.update((items) => {
      const next = [...items];
      for (let i = next.length - 1; i > 0; i--) {
        const j = (i * 7919) % (i + 1);
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  }

  retitle(step: number): void {
    this.items.update((items) => items.map((it) => ({ ...it, title: `#${it.id} tick ${step}`, badge: `${(step * 13 + it.id) % 99}` })));
  }

  clear(): void {
    this.items.set([]);
  }

  refill(): void {
    this.items.set(makeFeed(FEED_INITIAL));
  }

  protected async workload(): Promise<void> {
    await this.run('append 20', () => this.append());
    await this.run('prepend 20', () => this.prepend());
    await this.run('shuffle', () => this.shuffle());
    await this.run('retitle all', () => this.retitle(1));
    await this.ticks('retitle', 30, (i) => this.retitle(i + 2));
    await this.run('clear', () => this.clear());
    await this.run('refill 100', () => this.refill());
  }

  private more(): FeedItem[] {
    const items = makeFeed(FEED_APPEND, this.nextId);
    this.nextId += FEED_APPEND;
    return items;
  }
}

@Directive()
export abstract class DashboardScreen extends BenchScreen {
  readonly tiles = signal<Tile[]>(makeTiles());
  readonly wide = signal(false);

  bump(step: number): void {
    this.tiles.update((tiles) => bumpTiles(tiles, step));
  }

  rotate(): void {
    this.tiles.update(([first, ...rest]) => [...rest, first]);
  }

  toggleWide(): void {
    toggle(this.wide);
  }

  protected async workload(): Promise<void> {
    await this.run('bump values', () => this.bump(1));
    await this.ticks('bump', 30, (i) => this.bump(i + 2));
    await this.run('rotate tiles', () => this.rotate());
    await this.run('widen tiles', () => this.toggleWide());
    await this.run('narrow tiles', () => this.toggleWide());
  }
}

@Directive()
export abstract class NestedScreen extends BenchScreen {
  readonly tree = signal<NestedNode>(makeNested());
  readonly showOdd = signal(true);
  readonly narrow = signal(false);
  readonly boxCount = computed(() => 2 ** (this.tree().depth + 1) - 1);

  retext(step: number): void {
    this.tree.update((tree) => retextNested(tree, `v${step}`));
  }

  toggleOdd(): void {
    toggle(this.showOdd);
  }

  toggleNarrow(): void {
    toggle(this.narrow);
  }

  protected async workload(): Promise<void> {
    await this.run('retext leaves', () => this.retext(1));
    await this.ticks('retext', 30, (i) => this.retext(i + 2));
    await this.run('hide row text', () => this.toggleOdd());
    await this.run('show row text', () => this.toggleOdd());
    await this.run('narrow root', () => this.toggleNarrow());
    await this.run('widen root', () => this.toggleNarrow());
  }
}

@Directive()
export abstract class RichScreen extends BenchScreen {
  readonly cards = signal<RichCard[]>(makeRichCards(RICH_INITIAL));
  readonly narrow = signal(false);
  readonly spanCount = computed(() => this.cards().reduce((n, card) => n + card.runs.length + card.meta.length + 2, 0));
  private nextId = RICH_INITIAL;

  retext(step: number): void {
    this.cards.update((cards) => retextRich(cards, `v${step}`));
  }

  restyle(): void {
    this.cards.update(restyleRich);
  }

  append(): void {
    this.cards.update((cards) => [...cards, ...makeRichCards(RICH_APPEND, this.nextId)]);
    this.nextId += RICH_APPEND;
  }

  toggleNarrow(): void {
    toggle(this.narrow);
  }

  clear(): void {
    this.cards.set([]);
  }

  refill(): void {
    this.cards.set(makeRichCards(RICH_INITIAL));
    this.nextId = RICH_INITIAL;
  }

  protected async workload(): Promise<void> {
    await this.run('retext all', () => this.retext(1));
    await this.ticks('retext', 20, (i) => this.retext(i + 2));
    await this.run('restyle spans', () => this.restyle());
    await this.run('append 10', () => this.append());
    await this.run('narrow root', () => this.toggleNarrow());
    await this.run('widen root', () => this.toggleNarrow());
    await this.run('clear', () => this.clear());
    await this.run('refill 30', () => this.refill());
  }
}
