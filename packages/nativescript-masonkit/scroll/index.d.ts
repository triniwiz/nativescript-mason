import { ScrollBase } from './common';
export { ScrollEventData } from './common';

/** Native overflow scrolling with logical offsets, seeks, and scroll events. */
export class Scroll extends ScrollBase {
  get _visibleOverflowScrolls(): boolean;
  protected _scrollMetrics(): [number, number, number, number];
  protected _seek(x: number, y: number, animated: boolean): void;
  protected _stopScrolling(): void;
  protected _observeScroll(observe: boolean): void;
}
