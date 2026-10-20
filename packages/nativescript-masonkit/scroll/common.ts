import { EventData } from '@nativescript/core';
import { ViewBase } from '../common';
import type { Scroll } from '../index';

/** A native offset change. All distances are in device-independent layout units. */
export interface ScrollEventData extends EventData {
  object: Scroll;
  scrollX: number;
  scrollY: number;
}

/** Shared public scrolling contract; platform classes supply the native bridge. */
export abstract class ScrollBase extends ViewBase {
  static readonly scrollEvent = 'scroll';
  private _pendingScroll?: [number, number, boolean];
  private _scrollRevision = 0;

  /** Current horizontal offset in DIPs (points on Apple platforms). May overshoot during native bounce. */
  get scrollX(): number {
    return this._scrollMetrics()[0];
  }
  /** Current vertical offset in DIPs (points on Apple platforms). May overshoot during native bounce. */
  get scrollY(): number {
    return this._scrollMetrics()[1];
  }
  /** Maximum horizontal seek offset in DIPs; zero when that axis cannot scroll. */
  get scrollableWidth(): number {
    return this._scrollMetrics()[2];
  }
  /** Maximum vertical seek offset in DIPs; zero when that axis cannot scroll. */
  get scrollableHeight(): number {
    return this._scrollMetrics()[3];
  }

  /**
   * Seek both axes, clamping to [0, scrollableWidth/Height]. Disabled axes stay at zero.
   * The latest call before load/layout is applied after the first native layout, using
   * its extents. A new seek replaces an earlier seek/animation and stops momentum.
   * User input can interrupt animation. Android rounds destinations to native pixels.
   * @throws RangeError if either coordinate is not finite.
   */
  scrollTo(x: number, y: number, animated = false): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new RangeError('Scroll offsets must be finite');
    this._scrollRevision++;
    if (!this.isLoaded) this._pendingScroll = [x, y, animated];
    else this._seek(x, y, animated);
  }

  /** Cancel a pending seek and native animation/momentum at the current offset. */
  stopScrolling(): void {
    this._scrollRevision++;
    this._pendingScroll = undefined;
    this._stopScrolling();
  }

  on(eventName: 'scroll', callback: (event: ScrollEventData) => void, thisArg?: any): void;
  on(eventName: string, callback: (event: any) => void, thisArg?: any): void;
  on(eventName: string, callback: (event: any) => void, thisArg?: any): void {
    super.on(eventName, callback, thisArg);
  }

  protected _notifyScroll(): void {
    const [scrollX, scrollY] = this._scrollMetrics();
    this.notify({ eventName: ScrollBase.scrollEvent, object: this as unknown as Scroll, scrollX, scrollY } as ScrollEventData);
  }

  onLoaded(): void {
    this._observeScroll(true);
    const pending = this._pendingScroll;
    const revision = this._scrollRevision;
    this._pendingScroll = undefined;
    super.onLoaded();
    // A loaded handler may issue a newer seek or cancel the queued one.
    if (pending && revision === this._scrollRevision) this._seek(...pending);
  }

  onUnloaded(): void {
    this._observeScroll(false);
    this.stopScrolling();
    super.onUnloaded();
  }

  disposeNativeView(): void {
    this._observeScroll(false);
    this.stopScrolling();
    super.disposeNativeView();
  }

  protected abstract _scrollMetrics(): [number, number, number, number];
  protected abstract _seek(x: number, y: number, animated: boolean): void;
  protected abstract _stopScrolling(): void;
  protected abstract _observeScroll(observe: boolean): void;
}
