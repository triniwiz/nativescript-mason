// Windows only (panel-helpers.windows.ts); shared callers stay behind __WINDOWS__.

export function masonEngine(): NativeScript.Mason.Mason {
  throw new Error('masonEngine is only available on Windows');
}

export function appendNativeChild(_panel: any, _child: any, _atIndex: number): boolean {
  return false;
}

export function removeNativeChild(_panel: any, _child: any): void {}
