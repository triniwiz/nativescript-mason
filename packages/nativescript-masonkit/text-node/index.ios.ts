import { native_ } from '../symbols';
import { Tree } from '../tree';

export class TextNode {
  [native_]: MasonTextNode;
  constructor() {
    this[native_] = Tree.instance.createTextNode() as never;
  }

  get native() {
    return this[native_];
  }

  get data() {
    return this[native_].data;
  }

  set data(value: string) {
    this[native_].data = value;
  }

  get length() {
    return this[native_].length;
  }

  appendData(s: string) {
    this[native_].appendData(s);
    return this;
  }

  deleteData(offset: number, count: number) {
    this[native_].deleteDataWithOffsetCount(offset, count);
    return this;
  }

  insertData(s: string, offset: number) {
    this[native_].insertDataAt(s, offset);
    return this;
  }

  substringData(offset: number, count: number) {
    return this[native_].substringDataWithOffsetCount(offset, count);
  }
}
