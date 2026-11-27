// Windows and Linux only (panel-helpers.windows.ts, panel-helpers.linux.ts); shared callers stay behind __WINDOWS__ / __LINUX__.

export function masonEngine(): NativeScript.Mason.Mason {
  throw new Error('masonEngine is only available on Windows');
}

export function appendNativeChild(_panel: any, _child: any, _atIndex: number): boolean {
  return false;
}

export function removeNativeChild(_panel: any, _child: any): void {}

export function masonDelegate<T extends Function>(_type: string, fn: T): T {
  return fn;
}

export function arrayBufferOf(buffer: any): ArrayBuffer {
  return buffer as ArrayBuffer;
}
