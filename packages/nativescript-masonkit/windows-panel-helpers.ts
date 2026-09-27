declare const Microsoft: any;

let engine: NativeScript.Mason.Mason | undefined;
// The runtime calls instance methods at well under half the cost of static ones.
export function masonEngine(): NativeScript.Mason.Mason {
  return (engine ??= NativeScript.Mason.Mason.Instance());
}

export function appendNativeChild(panel: any, child: any, atIndex: number): boolean {
  const nativeChild = child?.nativeViewProtected ?? child?.windows; // as Microsoft.UI.Xaml.UIElement;
  if (!nativeChild) return false;
  child._isMasonChild = true;
  if (!panel?.Children) return false;
  try {
    masonEngine().ReparentChild(panel, nativeChild, atIndex);
    return true;
  } catch {
    return false;
  }
}

export function removeNativeChild(panel: any, child: any): void {
  const nativeChild = child?.nativeViewProtected ?? child?.windows; // as Microsoft.UI.Xaml.UIElement;
  if (!nativeChild || !panel?.Children) return;
  try {
    masonEngine().RemoveChild(panel, nativeChild);
  } catch {
    // empty
  }
}
