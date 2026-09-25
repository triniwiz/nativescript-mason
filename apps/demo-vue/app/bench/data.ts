export interface FeedItem {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
}

const COLORS = ['#6c5ce7', '#0984e3', '#00b894', '#e84393', '#fdcb6e', '#e17055', '#74b9ff', '#a29bfe'];
const WORDS = ['layout', 'flex', 'grid', 'measure', 'taffy', 'native', 'render', 'frame', 'scroll', 'view', 'text', 'span'];

let seed = 1;
function rand(): number {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

export function resetSeed(): void {
  seed = 1;
}

function words(count: number): string {
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(WORDS[Math.floor(rand() * WORDS.length)]);
  return out.join(' ');
}

export function makeFeed(count: number, startId = 0): FeedItem[] {
  const items: FeedItem[] = [];
  for (let i = 0; i < count; i++) {
    const id = startId + i;
    items.push({
      id,
      title: `#${id} ${words(3)}`,
      subtitle: words(6 + Math.floor(rand() * 6)),
      badge: `${Math.floor(rand() * 99)}`,
      color: COLORS[id % COLORS.length],
    });
  }
  return items;
}

export const FEED_INITIAL = 100;
export const FEED_APPEND = 20;

export interface Tile {
  id: number;
  label: string;
  value: number;
  bars: number[];
  color: string;
}

const DASH_COLS = 3;
const DASH_ROWS = 8;

export function makeTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 0; i < DASH_COLS * DASH_ROWS; i++) {
    tiles.push({
      id: i,
      label: words(2),
      value: Math.floor(rand() * 10000),
      bars: [0, 1, 2, 3, 4].map(() => 4 + Math.floor(rand() * 28)),
      color: COLORS[i % COLORS.length],
    });
  }
  return tiles;
}

export function bumpTiles(tiles: Tile[], step: number): Tile[] {
  return tiles.map((t, i) => ({
    ...t,
    value: (t.value + step * 37 + i * 11) % 10000,
    bars: t.bars.map((b, j) => 4 + ((b + step * 3 + j * 5) % 28)),
  }));
}

const NESTED_DEPTH = 5;

export interface NestedNode {
  id: number;
  depth: number;
  text: string;
  children: NestedNode[];
}

export function makeNested(depth = NESTED_DEPTH, breadth = 2, id = { n: 0 }): NestedNode {
  const node: NestedNode = { id: id.n++, depth, text: words(depth ? 4 : 10), children: [] };
  if (depth > 0) {
    for (let i = 0; i < breadth; i++) node.children.push(makeNested(depth - 1, breadth, id));
  }
  return node;
}

export function retextNested(node: NestedNode, suffix: string): NestedNode {
  return {
    ...node,
    text: node.children.length ? node.text : `${words(8)} ${suffix}`,
    children: node.children.map((c) => retextNested(c, suffix)),
  };
}
