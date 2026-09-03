// Builds a masonkit `Style` backed by a plain ArrayBuffer, so the real CSS value
// plumbing can be exercised in Node with no device and no native module.
//
// Three properties of `Style` make this work without touching production code:
//   - it has no constructor of its own, so `new Style()` runs only the field
//     initialisers (isDirty = -1n, inBatch = false)
//   - `prepareMut()` returns immediately when REF_COUNT === 1, so no platform
//     branch is ever reached
//   - `commitState()` only ORs bits into `isDirty`; with `inBatch = true` the
//     native syncStyle() is never scheduled
import { Style } from '../../../packages/nativescript-masonkit/style';
import { styleKey } from './style-keys';

/** Must match crates/mason-core/src/style/arena.rs STYLE_BUFFER_SIZE. */
export const STYLE_BUFFER_SIZE = 596;

const REF_COUNT_OFFSET = styleKey('REF_COUNT');

export interface StyleUnderTest {
  style: Style;
  view: DataView;
  bytes: Uint8Array;
  /** Accumulated dirty bits, or -1n when nothing has been committed. */
  dirty(): bigint;
  getInt8(offset: number): number;
  getUint8(offset: number): number;
  getInt32(offset: number): number;
  getFloat32(offset: number): number;
}

export function styleUnderTest(): StyleUnderTest {
  const buffer = new ArrayBuffer(STYLE_BUFFER_SIZE);
  const view = new DataView(buffer);
  // REF_COUNT === 1 means "sole owner", which is what keeps prepareMut() from
  // trying to re-fetch the buffer from a native style object.
  view.setUint32(REF_COUNT_OFFSET, 1, true);

  const style = new Style() as any;
  style.style_view = view;
  style.i8View = new Int8Array(buffer);
  style.u8View = new Uint8Array(buffer);
  style.inBatch = true;

  return {
    style: style as Style,
    view,
    bytes: new Uint8Array(buffer),
    dirty: () => style.isDirty as bigint,
    getInt8: (offset) => view.getInt8(offset),
    getUint8: (offset) => view.getUint8(offset),
    getInt32: (offset) => view.getInt32(offset, true),
    getFloat32: (offset) => view.getFloat32(offset, true),
  };
}
