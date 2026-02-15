import { native_ } from '../symbols';
import { Tree } from '../tree';

export class TextNode {
  [native_]: org.nativescript.mason.masonkit.TextNode;
  constructor() {
    this[native_] = new org.nativescript.mason.masonkit.TextNode(Tree.instance.native as never);
  }

  get native() {
    return this[native_];
  }

  get data() {
    return this[native_].getData();
  }

  set data(value: string) {
    this[native_].setData(value);
  }

  get length() {
    return this[native_].getLength();
  }

  appendData(s: string) {
    this[native_].appendData(s);
    return this;
  }

  deleteData(offset: number, count: number) {
    this[native_].deleteData(offset, count);
    return this;
  }

  insertData(s: string, offset: number) {
    this[native_].insertData(offset, s);
    return this;
  }

  substringData(offset: number, count: number) {
    return this[native_].substringData(offset, count);
  }
}
