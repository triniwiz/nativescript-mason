import { $navigateBack, ref } from 'nativescript-vue';
import { bumpTiles, FEED_APPEND, FEED_INITIAL, makeFeed, makeNested, makeRichCards, makeTiles, resetSeed, restyleRich, retextNested, retextRich, RICH_APPEND, RICH_INITIAL, type FeedItem, type NestedNode, type RichCard, type Tile } from './data';
import { PageBench, idle, pageDone, unwatchLayout, type Flavour } from './harness';

interface PageProps {
  auto?: boolean;
}

async function finish(bench: PageBench, auto: boolean | undefined, workload: () => Promise<void>): Promise<void> {
  await bench.firstFrame();
  if (!auto) return;
  await workload();
  unwatchLayout();
  await idle();
  $navigateBack();
  await idle();
  pageDone();
}

export function useFeed(flavour: Flavour, props: PageProps) {
  resetSeed();
  const bench = new PageBench('feed', flavour);
  const items = ref<FeedItem[]>(makeFeed(FEED_INITIAL));
  let nextId = FEED_INITIAL;

  const append = () => {
    items.value = [...items.value, ...makeFeed(FEED_APPEND, nextId)];
    nextId += FEED_APPEND;
  };
  const prepend = () => {
    items.value = [...makeFeed(FEED_APPEND, nextId), ...items.value];
    nextId += FEED_APPEND;
  };
  const shuffle = () => {
    const next = [...items.value];
    for (let i = next.length - 1; i > 0; i--) {
      const j = (i * 7919) % (i + 1);
      [next[i], next[j]] = [next[j], next[i]];
    }
    items.value = next;
  };
  const retitle = (step: number) => {
    items.value = items.value.map((it) => ({ ...it, title: `#${it.id} tick ${step}`, badge: `${(step * 13 + it.id) % 99}` }));
  };
  const clear = () => {
    items.value = [];
  };
  const refill = () => {
    items.value = makeFeed(FEED_INITIAL);
  };

  const onLoaded = (args?: any) => {
    bench.loaded(args?.object);
    void finish(bench, props.auto, async () => {
      await bench.run('append 20', append);
      await bench.run('prepend 20', prepend);
      await bench.run('shuffle', shuffle);
      await bench.run('retitle all', () => retitle(1));
      await bench.ticks('retitle', 30, (i) => retitle(i + 2));
      await bench.run('clear', clear);
      await bench.run('refill 100', refill);
    });
  };

  return { items, onLoaded, append, prepend, shuffle, retitle, clear, refill };
}

export function useDashboard(flavour: Flavour, props: PageProps) {
  resetSeed();
  const bench = new PageBench('dashboard', flavour);
  const tiles = ref<Tile[]>(makeTiles());
  const wide = ref(false);

  const bump = (step: number) => {
    tiles.value = bumpTiles(tiles.value, step);
  };
  const rotate = () => {
    const next = [...tiles.value];
    next.push(next.shift() as Tile);
    tiles.value = next;
  };
  const toggleWide = () => {
    wide.value = !wide.value;
  };

  const onLoaded = (args?: any) => {
    bench.loaded(args?.object);
    void finish(bench, props.auto, async () => {
      await bench.run('bump values', () => bump(1));
      await bench.ticks('bump', 30, (i) => bump(i + 2));
      await bench.run('rotate tiles', rotate);
      await bench.run('widen tiles', toggleWide);
      await bench.run('narrow tiles', toggleWide);
    });
  };

  return { tiles, wide, onLoaded, bump, rotate, toggleWide };
}

export function useNested(flavour: Flavour, props: PageProps) {
  resetSeed();
  const bench = new PageBench('nested', flavour);
  const tree = ref<NestedNode>(makeNested());
  const showOdd = ref(true);
  const narrow = ref(false);

  const retext = (step: number) => {
    tree.value = retextNested(tree.value, `v${step}`);
  };
  const toggleOdd = () => {
    showOdd.value = !showOdd.value;
  };
  const toggleNarrow = () => {
    narrow.value = !narrow.value;
  };

  const onLoaded = (args?: any) => {
    bench.loaded(args?.object);
    void finish(bench, props.auto, async () => {
      await bench.run('retext leaves', () => retext(1));
      await bench.ticks('retext', 30, (i) => retext(i + 2));
      await bench.run('hide row text', toggleOdd);
      await bench.run('show row text', toggleOdd);
      await bench.run('narrow root', toggleNarrow);
      await bench.run('widen root', toggleNarrow);
    });
  };

  return { tree, showOdd, narrow, onLoaded, retext, toggleOdd, toggleNarrow };
}

export function useRich(flavour: Flavour, props: PageProps) {
  resetSeed();
  const bench = new PageBench('rich', flavour);
  const cards = ref<RichCard[]>(makeRichCards(RICH_INITIAL));
  const narrow = ref(false);
  let nextId = RICH_INITIAL;

  const retext = (step: number) => {
    cards.value = retextRich(cards.value, `v${step}`);
  };
  const restyle = () => {
    cards.value = restyleRich(cards.value);
  };
  const append = () => {
    cards.value = [...cards.value, ...makeRichCards(RICH_APPEND, nextId)];
    nextId += RICH_APPEND;
  };
  const toggleNarrow = () => {
    narrow.value = !narrow.value;
  };
  const clear = () => {
    cards.value = [];
  };
  const refill = () => {
    cards.value = makeRichCards(RICH_INITIAL);
    nextId = RICH_INITIAL;
  };

  const onLoaded = (args?: any) => {
    bench.loaded(args?.object);
    void finish(bench, props.auto, async () => {
      await bench.run('retext all', () => retext(1));
      await bench.ticks('retext', 20, (i) => retext(i + 2));
      await bench.run('restyle spans', restyle);
      await bench.run('append 10', append);
      await bench.run('narrow root', toggleNarrow);
      await bench.run('widen root', toggleNarrow);
      await bench.run('clear', clear);
      await bench.run('refill 30', refill);
    });
  };

  return { cards, narrow, onLoaded, retext, restyle, append, toggleNarrow, clear, refill };
}
