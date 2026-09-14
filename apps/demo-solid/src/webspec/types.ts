export interface FixtureNode {
  seq: number;
  /** Lowercase tag name (e.g. `'div'`, `'h1'`, `'p'`) — defaults to `'div'` when absent. */
  tag?: string;
  style: Record<string, string>;
  /**
   * The element's own text. These fixtures size boxes with runs of Ahem "X"
   * glyphs, so it is load-bearing — without it a min-content/max-content
   * fixture measures an empty box.
   */
  text?: string;
  children: FixtureNode[];
}

export interface ExpectedRect {
  seq: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Fixture {
  name: string;
  tree: FixtureNode;
  expected: ExpectedRect[];
}

export interface RectDiff {
  seq: number;
  expected: ExpectedRect;
  actual: { x: number; y: number; width: number; height: number } | null;
  error?: string;
}

export type FixtureStatus = 'pending' | 'running' | 'pass' | 'fail';

export interface FixtureResult {
  status: FixtureStatus;
  diffs: RectDiff[];
}
