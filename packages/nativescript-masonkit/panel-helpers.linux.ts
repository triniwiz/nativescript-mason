import { Mason } from './native.linux';

export function masonEngine(): NativeScript.Mason.Mason {
  return Mason.Instance() as never;
}

/** A Windows delegate's Linux counterpart: the function itself. */
export function masonDelegate<T extends Function>(_type: string, fn: T): T {
  return fn;
}

/** Engine style memory as an ArrayBuffer (the facade already hands one out). */
export function arrayBufferOf(buffer: any): ArrayBuffer {
  return buffer as ArrayBuffer;
}

export function appendNativeChild(panel: any, child: any, atIndex: number): boolean {
  const nativeChild = child?.nativeViewProtected ?? child?._view;
  if (!nativeChild || !panel?.Children) return false;
  child._isMasonChild = true;
  Mason.Instance().ReparentChild(panel, nativeChild, atIndex);
  return true;
}

export function removeNativeChild(panel: any, child: any): void {
  const nativeChild = child?.nativeViewProtected ?? child?._view;
  if (nativeChild && panel?.Children) Mason.Instance().RemoveChild(panel, nativeChild);
}
