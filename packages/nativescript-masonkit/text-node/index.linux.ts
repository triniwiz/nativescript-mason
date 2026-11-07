import { native_ } from '../symbols';
import { Tree } from '../tree';
import type * as Native from '../native.linux';

export class TextNode {
  [native_]: Native.TextNode;
  constructor() {
    this[native_] = Tree.instance.createTextNode() as never;
  }

  get native() {
    return this[native_];
  }

  // @ts-ignore
  get linux() {
    return this[native_];
  }

  get data() {
    return this[native_].Data;
  }

  set data(value: string) {
    this[native_].Data = value ?? '';
  }

  get length() {
    return (this[native_].Data ?? '').length;
  }

  appendData(s: string) {
    this[native_].Data = (this[native_].Data ?? '') + s;
    return this;
  }

  deleteData(offset: number, count: number) {
    const d = this[native_].Data ?? '';
    this[native_].Data = d.slice(0, offset) + d.slice(offset + count);
    return this;
  }

  insertData(s: string, offset: number) {
    const d = this[native_].Data ?? '';
    this[native_].Data = d.slice(0, offset) + s + d.slice(offset);
    return this;
  }

  substringData(offset: number, count: number) {
    const data = this[native_].Data;
    return data ? data.slice(offset, offset + count) : '';
  }
}
