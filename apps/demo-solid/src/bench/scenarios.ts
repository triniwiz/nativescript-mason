import { createRenderEffect, createSignal, onCleanup } from 'solid-js';
import { createStore, reconcile, unwrap } from 'solid-js/store';
import { useParams, useRoute, useRouter } from 'solid-navigation';
import { bumpTiles, FEED_APPEND, FEED_INITIAL, makeFeed, makeNested, makeRichCards, makeTiles, resetSeed, restyleRich, retextNested, retextRich, RICH_APPEND, RICH_INITIAL, type FeedItem, type RichCard, type Tile } from './data';
import { PageBench, idle, pageDone, unwatchLayout, type Flavour } from './harness';

interface PageParams {
  auto?: boolean;
}

interface BenchPage {
  auto: () => boolean;
  goBack: () => void;
  onLoaded: (handler: (args?: any) => void) => void;
}

function useBenchPage(): BenchPage {
  const router = useRouter();
  const params = useParams() as PageParams | undefined;
  const page: any = useRoute()?.ref;
  return {
    auto: () => !!params?.auto,
    goBack: () => router.goBack(),
    onLoaded: (handler) => {
      if (!page) return;
      page.on('loaded', handler);
      onCleanup(() => page.off('loaded', handler));
    },
  };
}

async function finish(bench: PageBench, page: BenchPage, workload: () => Promise<void>): Promise<void> {
  // Still pop back and release the runner, or an unattended run hangs with nothing logged.
  try {
    await bench.firstFrame();
    if (!page.auto()) return;
    await workload();
  } catch (e) {
    console.log('BENCH_ERROR ' + (e?.stack ?? e));
    if (!page.auto()) return;
  }
  unwatchLayout();
  await idle();
  page.goBack();
  await idle();
  pageDone();
}

/**
 * Vue's keyed patch for a `:style` / `v-bind` object: sets changed keys, resets keys that went
 * away, and never touches keys that were never set. Solid's `style` prop only Object.assigns.
 */
export function bindKeyed(target: any, read: () => Record<string, string>): void {
  let prev: Record<string, string> = {};
  createRenderEffect(() => {
    const next = read();
    for (const k in prev) if (!(k in next)) target[k] = '';
    for (const k in next) if (next[k] !== prev[k]) target[k] = next[k];
    prev = next;
  });
}

// Lists live in stores and every new array is reconciled by `id`, so rows keep their views and
// only changed fields update, like Vue's `:key` patch. Replacing a signal's array would
// remount every row, since <For> keys by object identity.
export function useFeed(flavour: Flavour) {
  const page = useBenchPage();
  resetSeed();
  const bench = new PageBench('feed', flavour);
  const [state, setState] = createStore({ items: makeFeed(FEED_INITIAL) });
  const items = () => state.items;
  const setItems = (next: FeedItem[]) => setState('items', reconcile(next, { key: 'id' }));
  let nextId = FEED_INITIAL;

  const append = () => {
    setItems([...unwrap(state.items), ...makeFeed(FEED_APPEND, nextId)]);
    nextId += FEED_APPEND;
  };
  const prepend = () => {
    setItems([...makeFeed(FEED_APPEND, nextId), ...unwrap(state.items)]);
    nextId += FEED_APPEND;
  };
  const shuffle = () => {
    const next = [...unwrap(state.items)];
    for (let i = next.length - 1; i > 0; i--) {
      const j = (i * 7919) % (i + 1);
      [next[i], next[j]] = [next[j], next[i]];
    }
    setItems(next);
  };
  const retitle = (step: number) => {
    setItems(unwrap(state.items).map((it) => ({ ...it, title: `#${it.id} tick ${step}`, badge: `${(step * 13 + it.id) % 99}` })));
  };
  const clear = () => {
    setItems([]);
  };
  const refill = () => {
    setItems(makeFeed(FEED_INITIAL));
  };

  page.onLoaded((args) => {
    bench.loaded(args?.object);
    void finish(bench, page, async () => {
      await bench.run('append 20', append);
      await bench.run('prepend 20', prepend);
      await bench.run('shuffle', shuffle);
      await bench.run('retitle all', () => retitle(1));
      await bench.ticks('retitle', 30, (i) => retitle(i + 2));
      await bench.run('clear', clear);
      await bench.run('refill 100', refill);
    });
  });

  return { items, append, prepend, shuffle, retitle, clear, refill };
}

export function useDashboard(flavour: Flavour) {
  const page = useBenchPage();
  resetSeed();
  const bench = new PageBench('dashboard', flavour);
  const [state, setState] = createStore({ tiles: makeTiles() });
  const tiles = () => state.tiles;
  const setTiles = (next: Tile[]) => setState('tiles', reconcile(next, { key: 'id' }));
  const [wide, setWide] = createSignal(false);

  const bump = (step: number) => {
    setTiles(bumpTiles(unwrap(state.tiles), step));
  };
  const rotate = () => {
    const next = [...unwrap(state.tiles)];
    next.push(next.shift() as Tile);
    setTiles(next);
  };
  const toggleWide = () => {
    setWide(!wide());
  };

  page.onLoaded((args) => {
    bench.loaded(args?.object);
    void finish(bench, page, async () => {
      await bench.run('bump values', () => bump(1));
      await bench.ticks('bump', 30, (i) => bump(i + 2));
      await bench.run('rotate tiles', rotate);
      await bench.run('widen tiles', toggleWide);
      await bench.run('narrow tiles', toggleWide);
    });
  });

  return { tiles, wide, bump, rotate, toggleWide };
}

export function useNested(flavour: Flavour) {
  const page = useBenchPage();
  resetSeed();
  const bench = new PageBench('nested', flavour);
  const [state, setState] = createStore({ tree: makeNested() });
  const tree = () => state.tree;
  const [showOdd, setShowOdd] = createSignal(true);
  const [narrow, setNarrow] = createSignal(false);

  const retext = (step: number) => {
    setState('tree', reconcile(retextNested(unwrap(state.tree), `v${step}`), { key: 'id' }));
  };
  const toggleOdd = () => {
    setShowOdd(!showOdd());
  };
  const toggleNarrow = () => {
    setNarrow(!narrow());
  };

  page.onLoaded((args) => {
    bench.loaded(args?.object);
    void finish(bench, page, async () => {
      await bench.run('retext leaves', () => retext(1));
      await bench.ticks('retext', 30, (i) => retext(i + 2));
      await bench.run('hide row text', toggleOdd);
      await bench.run('show row text', toggleOdd);
      await bench.run('narrow root', toggleNarrow);
      await bench.run('widen root', toggleNarrow);
    });
  });

  return { tree, showOdd, narrow, retext, toggleOdd, toggleNarrow };
}

export function useRich(flavour: Flavour) {
  const page = useBenchPage();
  resetSeed();
  const bench = new PageBench('rich', flavour);
  const [state, setState] = createStore({ cards: makeRichCards(RICH_INITIAL) });
  const cards = () => state.cards;
  const setCards = (next: RichCard[]) => setState('cards', reconcile(next, { key: 'id' }));
  const [narrow, setNarrow] = createSignal(false);
  let nextId = RICH_INITIAL;

  const retext = (step: number) => {
    setCards(retextRich(unwrap(state.cards), `v${step}`));
  };
  const restyle = () => {
    setCards(restyleRich(unwrap(state.cards)));
  };
  const append = () => {
    setCards([...unwrap(state.cards), ...makeRichCards(RICH_APPEND, nextId)]);
    nextId += RICH_APPEND;
  };
  const toggleNarrow = () => {
    setNarrow(!narrow());
  };
  const clear = () => {
    setCards([]);
  };
  const refill = () => {
    setCards(makeRichCards(RICH_INITIAL));
    nextId = RICH_INITIAL;
  };

  page.onLoaded((args) => {
    bench.loaded(args?.object);
    void finish(bench, page, async () => {
      await bench.run('retext all', () => retext(1));
      await bench.ticks('retext', 20, (i) => retext(i + 2));
      await bench.run('restyle spans', restyle);
      await bench.run('append 10', append);
      await bench.run('narrow root', toggleNarrow);
      await bench.run('widen root', toggleNarrow);
      await bench.run('clear', clear);
      await bench.run('refill 30', refill);
    });
  });

  return { cards, narrow, retext, restyle, append, toggleNarrow, clear, refill };
}
