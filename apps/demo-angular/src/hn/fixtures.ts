import { Comment, Story } from './models';

/**
 * A frozen snapshot instead of the live Firebase API, so the layout under test
 * is identical on every run and works offline / in CI.
 *
 * Story 1 carries a deliberately pathological comment tree — eight levels deep
 * on its first branch. Each level is a `<hn-comment>` component host containing
 * another `<hn-comment>`, which is exactly the nesting that breaks when
 * component elements are invisible `ProxyViewContainer`s or when child
 * insertion order is not tracked.
 */

let nextId = 1000;

function c(by: string, agoHours: number, text: string, kids: Comment[] = []): Comment {
  return { id: nextId++, by, agoHours, text, kids };
}

/** Builds a single chain `depth` levels deep, to stress nesting specifically. */
function chain(depth: number, by: (level: number) => string, text: (level: number) => string): Comment {
  let node = c(by(depth), depth, text(depth));
  for (let level = depth - 1; level >= 1; level--) {
    node = c(by(level), level * 2, text(level), [node]);
  }
  return node;
}

export const STORIES: Story[] = [
  {
    id: 1,
    title: 'Taffy: a flexbox and CSS grid implementation in Rust',
    url: 'https://github.com/DioxusLabs/taffy',
    domain: 'github.com',
    by: 'dioxus',
    score: 482,
    agoHours: 3,
    descendants: 14,
    tags: ['rust', 'layout'],
    comments: [
      chain(
        8,
        (level) => `deep_thread_${level}`,
        (level) => `Reply at depth ${level}. Every level here is a separate component host, so this thread is ${level} nested MasonKit boxes deep. If nesting is broken this collapses or renders out of order.`,
      ),
      c('layout_nerd', 5, 'The grid implementation is the part I care about. Subgrid support is what pushed us over the line.', [c('gridder', 4, 'Same. We were faking subgrid with nested containers and the measure cost was brutal.', [c('layout_nerd', 3, 'How brutal? We measured ~4ms per pass on a mid-range Android device.')]), c('skeptic', 4, 'Does it handle percentage gaps against an indefinite container?')]),
      c('mobile_dev', 6, 'Being able to write the same flex rules on iOS, Android and Windows is the whole pitch for me.', [c('crossplat', 5, 'Agreed, though the interesting question is always what happens at the boundary with the platform layout system.')]),
      c('quiet_one', 9, 'No notes. Good work.'),
    ],
  },
  {
    id: 2,
    title: 'Show HN: I rewrote my layout engine three times and here is what I learned',
    url: 'https://example.com/layout-lessons',
    domain: 'example.com',
    by: 'threetimes',
    score: 217,
    agoHours: 7,
    descendants: 6,
    tags: ['showhn'],
    comments: [c('been_there', 6, 'The third rewrite is always the one that works, because by then you know what the problem actually is.', [c('threetimes', 5, 'That matches my experience exactly. The first two were me solving the wrong problem faster.'), c('cynic', 5, 'Or you just ran out of budget to rewrite it a fourth time.', [c('been_there', 4, 'Also true.')])]), c('measurer', 4, 'Did you keep the intermediate versions around to benchmark against?')],
  },
  {
    id: 3,
    title: 'The measure-layout-paint pipeline, explained without the hand-waving',
    url: 'https://example.org/mlp',
    domain: 'example.org',
    by: 'pipeline',
    score: 96,
    agoHours: 11,
    descendants: 3,
    tags: ['rendering'],
    comments: [c('curious', 9, 'Is there a version of this that covers incremental relayout?', [c('pipeline', 8, 'Part two. It is mostly about dirty-marking and how little of the tree you actually need to touch.')]), c('drive_by', 10, 'Bookmarked.')],
  },
  {
    id: 4,
    title: 'Why your list scrolls badly and it is probably not the list',
    url: 'https://example.net/scroll',
    domain: 'example.net',
    by: 'scrolls',
    score: 63,
    agoHours: 14,
    descendants: 0,
    tags: ['performance'],
    comments: [],
  },
];

export function findStory(id: number): Story | undefined {
  return STORIES.find((story) => story.id === id);
}
