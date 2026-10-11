import { CoreTypes, unsetValue } from '@nativescript/core';
import type { CssAnimationProperty, Style, View } from '@nativescript/core';
import { KeyframeAnimation } from '@nativescript/core/ui/animation/keyframe-animation';
import { tokenizeCss } from './css-shorthands';

/**
 * CSS keyframes for properties MasonKit draws itself.
 *
 * Core plays each keyframe interval with its native Animation, which only knows opacity,
 * background-color, transforms, width and height. MasonKit's animatable properties are taken
 * out of core's keyframes and interpolated every frame on the same timeline instead: delay,
 * duration, iterations, each interval's timing function and `animation-fill-mode`.
 */

type Interpolate = (from: string, to: string, t: number) => string;

interface Track {
  property: CssAnimationProperty<Style, string>;
  interpolate: Interpolate;
  /** [time in ms from the start of an iteration, value]; time-ordered. */
  stops: [number, string][];
}

const animatable = new Map<string, { property: CssAnimationProperty<Style, string>; interpolate: Interpolate; initial: string }>();

/** Lets keyframes animate [property] with [interpolate]; [initial] is its CSS initial value. */
export function registerKeyframeProperty(property: CssAnimationProperty<Style, string>, interpolate: Interpolate, initial: string) {
  animatable.set(property.name, { property, interpolate, initial });
}

// What core's native Animation plays. A keyframe interval with none of these is skipped by core
// at once, so its time would be lost.
const CORE_ANIMATED = ['backgroundColor', 'scale', 'translate', 'rotate', 'opacity', 'width', 'height'];

// ---------------------------------------------------------------------------------------------
// Interpolation

interface Component {
  number?: number;
  unit?: string;
  keyword?: string;
}

const NUMERIC = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z]+|%)?$/i;

function component(token: string): Component {
  const match = NUMERIC.exec(token);
  return match ? { number: parseFloat(match[1]), unit: match[2] ?? '' } : { keyword: token };
}

function format(c: Component): string {
  if (c.keyword !== undefined) {
    return c.keyword;
  }
  return `${Math.round(c.number * 10000) / 10000}${c.unit}`;
}

function mix(a: Component, b: Component, t: number): Component | null {
  if (a.number === undefined || b.number === undefined) {
    return a.keyword === b.keyword ? a : null;
  }
  // A unitless 0 takes the other side's unit, as `0` does in CSS lengths.
  const unit = a.unit || (a.number === 0 ? b.unit : a.unit);
  const otherUnit = b.unit || (b.number === 0 ? unit : b.unit);
  if (unit !== otherUnit) {
    return null;
  }
  return { number: a.number + (b.number - a.number) * t, unit };
}

/** Layers of a list-valued property, each split into whitespace tokens. */
function layers(value: string): string[][] {
  const result: string[][] = [[]];
  for (const token of tokenizeCss(value)) {
    if (token === ',') {
      result.push([]);
    } else {
      result[result.length - 1].push(token);
    }
  }
  return result;
}

const POSITION_KEYWORD: Record<string, number> = { left: 0, top: 0, center: 50, right: 100, bottom: 100 };
const VERTICAL = new Set(['top', 'bottom']);
const HORIZONTAL = new Set(['left', 'right']);

/** One `<position>` as [x, y], or null for the 3- and 4-value edge-offset forms. */
function position(tokens: string[]): [Component, Component] | null {
  const read = (token: string): Component => (token in POSITION_KEYWORD ? { number: POSITION_KEYWORD[token], unit: '%' } : component(token));
  if (tokens.length === 1) {
    return VERTICAL.has(tokens[0]) ? [read('center'), read(tokens[0])] : [read(tokens[0]), read('center')];
  }
  if (tokens.length === 2) {
    const [a, b] = tokens;
    return VERTICAL.has(a) || HORIZONTAL.has(b) ? [read(b), read(a)] : [read(a), read(b)];
  }
  return null;
}

/** One `<bg-size>` as [width, height]; `cover` and `contain` stay single keywords. */
function size(tokens: string[]): Component[] | null {
  if (tokens.length === 1) {
    return tokens[0] === 'cover' || tokens[0] === 'contain' ? [{ keyword: tokens[0] }] : [component(tokens[0]), { keyword: 'auto' }];
  }
  return tokens.length === 2 ? tokens.map(component) : null;
}

function listInterpolator(parse: (tokens: string[]) => Component[] | null): Interpolate {
  return (from, to, t) => {
    const a = layers(from).map(parse);
    const b = layers(to).map(parse);
    // Values that can't be mixed flip halfway, as CSS does for discrete animation.
    const discrete = () => (t < 0.5 ? from : to);
    if (a.length !== b.length) {
      return discrete();
    }
    const out: string[] = [];
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      const y = b[i];
      if (!x || !y || x.length !== y.length) {
        return discrete();
      }
      const mixed = x.map((c, j) => mix(c, y[j], t));
      if (mixed.some((c) => c === null)) {
        return discrete();
      }
      out.push(mixed.map(format).join(' '));
    }
    return out.join(', ');
  };
}

/** Interpolates `<position>` lists (`mask-position`, `background-position`). */
export const interpolatePositionList: Interpolate = listInterpolator(position);

/** Interpolates `<bg-size>` lists (`mask-size`, `background-size`). */
export const interpolateSizeList: Interpolate = listInterpolator(size);

// ---------------------------------------------------------------------------------------------
// Timing

function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const sample = (a1: number, a2: number, s: number) => ((1 - 3 * a2 + 3 * a1) * s + (3 * a2 - 6 * a1)) * s * s + 3 * a1 * s;
  const slope = (a1: number, a2: number, s: number) => 3 * (1 - 3 * a2 + 3 * a1) * s * s + 2 * (3 * a2 - 6 * a1) * s + 3 * a1;
  return (t) => {
    if (t <= 0 || t >= 1) {
      return t;
    }
    // Newton's method for the curve parameter at x = t, then bisection if it stalls.
    let s = t;
    for (let i = 0; i < 8; i++) {
      const error = sample(x1, x2, s) - t;
      if (Math.abs(error) < 1e-6) {
        return sample(y1, y2, s);
      }
      const d = slope(x1, x2, s);
      if (Math.abs(d) < 1e-6) {
        break;
      }
      s -= error / d;
    }
    let lo = 0;
    let hi = 1;
    s = t;
    for (let i = 0; i < 30; i++) {
      const x = sample(x1, x2, s);
      if (Math.abs(x - t) < 1e-6) {
        break;
      }
      if (x < t) {
        lo = s;
      } else {
        hi = s;
      }
      s = (lo + hi) / 2;
    }
    return sample(y1, y2, s);
  };
}

const NAMED_CURVES: Record<string, [number, number, number, number]> = {
  [CoreTypes.AnimationCurve.ease]: [0.25, 0.1, 0.25, 1],
  [CoreTypes.AnimationCurve.easeIn]: [0.42, 0, 1, 1],
  [CoreTypes.AnimationCurve.easeOut]: [0, 0, 0.58, 1],
  [CoreTypes.AnimationCurve.easeInOut]: [0.42, 0, 0.58, 1],
};

/** Core's keyframe curve as an easing function; `linear`, `spring` and unknown curves are linear. */
export function easing(curve: any): (t: number) => number {
  if (curve && typeof curve === 'object' && typeof curve.x1 === 'number') {
    return cubicBezier(curve.x1, curve.y1, curve.x2, curve.y2);
  }
  const named = NAMED_CURVES[curve];
  return named ? cubicBezier(...named) : (t) => t;
}

/**
 * The value of [track] at [time] ms into an iteration of [total] ms. [curveAt] gives the timing
 * function of the interval starting at a time. A missing first or last keyframe uses [base], the
 * element's own value, as CSS does.
 */
export function sampleTrack(track: Pick<Track, 'interpolate' | 'stops'>, base: string, total: number, time: number, curveAt: (start: number) => (t: number) => number): string {
  const stops = track.stops;
  const points: [number, string][] = [];
  if (stops[0][0] > 0) {
    points.push([0, base]);
  }
  points.push(...stops);
  if (stops[stops.length - 1][0] < total) {
    points.push([total, base]);
  }
  if (time <= points[0][0]) {
    return points[0][1];
  }
  for (let i = 1; i < points.length; i++) {
    const [end, to] = points[i];
    if (time <= end) {
      const [start, from] = points[i - 1];
      const span = end - start;
      const t = span > 0 ? curveAt(start)((time - start) / span) : 1;
      return track.interpolate(from, to, t);
    }
  }
  return points[points.length - 1][1];
}

// ---------------------------------------------------------------------------------------------
// Playing alongside core

const driver_ = Symbol('mason:keyframeDriver');
const tracks_ = Symbol('mason:keyframeTracks');

const nextFrame: (callback: () => void) => unknown = typeof requestAnimationFrame === 'function' ? (callback) => requestAnimationFrame(callback) : (callback) => setTimeout(callback, 16);

class KeyframeDriver {
  private stopped = false;
  private startTime = 0;
  private readonly bases: string[];
  private readonly intervalEnds: number[] = [];
  private readonly curves: ((t: number) => number)[] = [];

  constructor(
    private readonly view: View,
    private readonly tracks: Track[],
    private readonly total: number,
    private readonly delay: number,
    private readonly iterations: number,
    private readonly forwards: boolean,
    segments: any[],
  ) {
    const style = view.style as any;
    this.bases = tracks.map((track) => {
      const value = style[track.property.name];
      return typeof value === 'string' && value.trim() ? value : animatable.get(track.property.name).initial;
    });
    // Core has already moved each keyframe's timing function onto the interval that keyframe
    // starts, so an interval's own curve is the one to use.
    let time = 0;
    for (const segment of segments) {
      time += segment.duration;
      this.intervalEnds.push(time);
      this.curves.push(easing(segment.curve));
    }
  }

  /** The curve of the interval starting at [start]: the first one ending after it. */
  private curveAt = (start: number) => {
    // Skips the 0.01 ms interval core gives a 0% keyframe.
    const index = this.intervalEnds.findIndex((end) => end > start + 1);
    return this.curves[index === -1 ? this.curves.length - 1 : index];
  };

  start(onFinish: () => void) {
    this.startTime = Date.now();
    const tick = () => {
      if (this.stopped) {
        return;
      }
      const elapsed = Date.now() - this.startTime - this.delay;
      if (elapsed < 0) {
        nextFrame(tick);
        return;
      }
      const iteration = this.total > 0 ? Math.floor(elapsed / this.total) : this.iterations;
      if (iteration >= this.iterations) {
        this.apply(this.total);
        this.finish(!this.forwards);
        onFinish();
        return;
      }
      this.apply(elapsed - iteration * this.total);
      nextFrame(tick);
    };
    tick();
  }

  private apply(time: number) {
    const style = this.view.style as any;
    this.tracks.forEach((track, i) => {
      const value = sampleTrack(track, this.bases[i], this.total, time, this.curveAt);
      if (style[track.property.keyframe] !== value) {
        style[track.property.keyframe] = value;
      }
    });
  }

  finish(reset: boolean) {
    this.stopped = true;
    if (reset) {
      const style = this.view.style as any;
      for (const track of this.tracks) {
        style[track.property.keyframe] = unsetValue;
      }
    }
  }
}

/** Takes MasonKit's properties out of core's keyframe intervals, as tracks with stop times. */
function extractTracks(segments: any[]): { tracks: Track[]; total: number } {
  const byName = new Map<string, Track>();
  let time = 0;
  for (const segment of segments) {
    time += segment.duration;
    for (const [name, entry] of animatable) {
      if (name in segment) {
        let track = byName.get(name);
        if (!track) {
          track = { property: entry.property, interpolate: entry.interpolate, stops: [] };
          byName.set(name, track);
        }
        // Core gives a 0% keyframe a 0.01 ms interval; it is still the start.
        track.stops.push([segment === segments[0] && segment.duration <= 1 ? 0 : time, String(segment[name])]);
        delete segment[name];
      }
    }
  }
  return { tracks: [...byName.values()], total: time };
}

/**
 * Keeps every interval timed for core: an interval left with nothing core can animate is
 * skipped at once, so it holds the previous interval's values instead.
 */
function holdEmptyIntervals(segments: any[]) {
  let previous: Record<string, unknown> = {};
  for (const segment of segments) {
    const present = CORE_ANIMATED.filter((name) => name in segment);
    if (present.length === 0) {
      Object.assign(segment, previous);
    } else {
      previous = { ...previous, ...Object.fromEntries(present.map((name) => [name, segment[name]])) };
    }
  }
}

let installed = false;

/** Installs the keyframe hooks once. */
export function installKeyframes() {
  if (installed) {
    return;
  }
  installed = true;
  const proto = KeyframeAnimation.prototype as any;
  const play = proto.play;
  const cancel = proto.cancel;

  proto.play = function (this: any, view: View) {
    // The keyframe intervals are shared by every play of this animation, so take the tracks
    // out once.
    if (this[tracks_] === undefined) {
      this[tracks_] = extractTracks(this.animations);
      if (this[tracks_].tracks.length) {
        holdEmptyIntervals(this.animations);
      }
    }
    const { tracks, total } = this[tracks_] as { tracks: Track[]; total: number };
    if (!tracks.length) {
      return play.call(this, view);
    }
    const hasCoreWork = this.animations.some((segment: any) => CORE_ANIMATED.some((name) => name in segment));
    let finishDriver: () => void;
    const driverDone = new Promise<void>((resolve) => (finishDriver = resolve));
    const driver = new KeyframeDriver(view, tracks, total, this.delay ?? 0, this.iterations ?? 1, !!this._isForwards, this.animations);
    this[driver_] = driver;
    driver.start(() => finishDriver());
    if (!hasCoreWork) {
      this._isPlaying = true;
      return driverDone.then(() => {
        this._isPlaying = false;
      });
    }
    return Promise.all([play.call(this, view), driverDone]).then(() => undefined);
  };

  proto.cancel = function (this: any) {
    const driver: KeyframeDriver | undefined = this[driver_];
    if (driver) {
      driver.finish(true);
      this[driver_] = undefined;
    }
    if (this._nativeAnimations?.length || !driver) {
      return cancel.call(this);
    }
    this._isPlaying = false;
  };
}
