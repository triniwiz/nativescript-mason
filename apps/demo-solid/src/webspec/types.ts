export interface FixtureNode {
  seq: number;
  style: Record<string, string>;
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
