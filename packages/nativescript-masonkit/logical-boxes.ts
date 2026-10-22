import { unsetValue } from '@nativescript/core';
import { logicalBoxGroups } from './properties';
import type { LogicalBoxGroup } from './properties';
import type { Style as MasonStyle } from './style';
import { remapLogicalBoxes_ } from './symbols';

// Logical borders, corners and overflow (see properties.ts). Their painters read physical
// sides, so a Mason view writes each side the later of its physical and logical declarations,
// by the box's writing mode and direction, and writes them again when either changes.

interface LogicalBoxState {
  seq: number;
  // Per group: the write stamps of its physical slots then its logical ones, 0 for none.
  stamps: Map<LogicalBoxGroup, number[]>;
  // Per group: the physical slots last written from a logical value.
  fromLogical: Map<LogicalBoxGroup, boolean[]>;
  applying: boolean;
}

const logicalBoxes_ = Symbol('[[logicalBoxes]]');

// Logical sides are slots 0 block-start, 1 inline-end, 2 block-end, 3 inline-start; corners
// 0 start-start, 1 start-end, 2 end-end, 3 end-start; axes 0 inline, 1 block.
const CORNER_SIDES = [
  [0, 3],
  [0, 1],
  [2, 1],
  [2, 3],
];

/** For each physical side (top, right, bottom, left), the logical side on it, as mason-core maps margins. */
function logicalSidesOn(writingMode: number, rtl: boolean): number[] {
  const [start, end] = rtl ? [1, 3] : [3, 1];
  switch (writingMode) {
    case 1:
      return [start, 0, end, 2];
    case 2:
      return [start, 2, end, 0];
    default:
      return [0, end, 2, start];
  }
}

/** For each physical slot of a group, the logical slot on it. */
export function logicalSlotsOn(kind: LogicalBoxGroup['kind'], writingMode: number, rtl: boolean): number[] {
  if (kind === 'axes') return writingMode === 0 ? [0, 1] : [1, 0];
  const on = logicalSidesOn(writingMode, rtl);
  if (kind === 'sides') return on;
  return CORNER_SIDES.map(([v, h]) => {
    const sides = [on[v], on[h]];
    const inlineStart = sides.includes(3);
    return sides.includes(0) ? (inlineStart ? 0 : 1) : inlineStart ? 3 : 2;
  });
}

/** The writing mode and direction a view's box has: its own, else the nearest Mason ancestor's. */
function boxFlow(view: any): [writingMode: number, rtl: boolean] {
  let writingMode = -1;
  let direction: string | undefined;
  for (let v = view; v && (writingMode < 0 || !direction); v = v.parent) {
    const style = v._styleHelper as MasonStyle | undefined;
    if (!style) continue;
    if (writingMode < 0) writingMode = style.ownWritingMode ?? -1;
    if (!direction && style.direction !== 'inherit') direction = style.direction;
  }
  return [Math.max(writingMode, 0), direction === 'rtl'];
}

function applyLogicalBoxGroup(view: any, group: LogicalBoxGroup, state: LogicalBoxState) {
  const stamps = state.stamps.get(group);
  if (!stamps) return;
  const count = group.physical.length;
  let last = state.fromLogical.get(group);
  if (!last) state.fromLogical.set(group, (last = new Array(count).fill(false)));
  const [writingMode, rtl] = boxFlow(view);
  const on = logicalSlotsOn(group.kind, writingMode, rtl);
  state.applying = true;
  try {
    for (let slot = 0; slot < count; slot++) {
      const logical = on[slot];
      const fromLogical = stamps[count + logical] > stamps[slot];
      // A side neither kind ever moved keeps what its physical declaration wrote.
      if (!fromLogical && !last[slot]) continue;
      last[slot] = fromLogical;
      const property = fromLogical ? group.logical[logical] : group.physical[slot];
      const value = view.style[property.name];
      view[group.physical[slot].setNative](value == null || value === unsetValue ? group.initial : value);
    }
  } finally {
    state.applying = false;
  }
}

/**
 * Installs the logical longhands' setNative on `target` (a Mason view prototype), and wraps its
 * physical ones so a group with logical values is rewritten after each physical write.
 */
export function installLogicalBoxes(target: any) {
  for (const group of logicalBoxGroups) {
    const count = group.physical.length;
    group.physical.forEach((property, slot) => {
      const write = target[property.setNative];
      target[property.setNative] = function (this: any, value: unknown) {
        const state: LogicalBoxState | undefined = this[logicalBoxes_];
        const stamps = state && !state.applying ? state.stamps.get(group) : undefined;
        if (!stamps) return write?.call(this, value);
        stamps[slot] = ++state.seq;
        write?.call(this, value);
        applyLogicalBoxGroup(this, group, state);
      };
    });
    group.logical.forEach((property, slot) => {
      target[property.setNative] = function (this: any, value: unknown) {
        if (!this._styleHelper) return;
        const state: LogicalBoxState = (this[logicalBoxes_] ??= { seq: 0, stamps: new Map(), fromLogical: new Map(), applying: false });
        let stamps = state.stamps.get(group);
        if (!stamps) state.stamps.set(group, (stamps = new Array(count * 2).fill(0)));
        stamps[count + slot] = value == null || value === unsetValue || value === property.defaultValue ? 0 : ++state.seq;
        applyLogicalBoxGroup(this, group, state);
      };
    });
  }

  // `deep` for writing-mode, which descendants inherit natively; NativeScript passes
  // direction, an inherited property, down to each of them itself.
  target[remapLogicalBoxes_] = function (this: any, deep = true) {
    const visit = (view: any) => {
      const state: LogicalBoxState | undefined = view[logicalBoxes_];
      if (state) for (const group of state.stamps.keys()) applyLogicalBoxGroup(view, group, state);
      if (!deep) return;
      view.eachChild?.((child: any) => {
        visit(child);
        return true;
      });
    };
    visit(this);
  };
}
