// The slice of svelte-native's DOM this package uses. svelte-native is an
// optional peer dependency, so the plugin builds without it installed.
declare module 'svelte-native/dom' {
  export class ViewNode {
    childNodes: ViewNode[];
    nodeType: number | null;
    parentNode: ViewNode | null;
    onInsertedChild(childNode: ViewNode, index: number): void;
    onRemovedChild(childNode: ViewNode): void;
  }
  export class ElementNode extends ViewNode {}
  export class NativeElementNode<T = any> extends ElementNode {
    constructor(tagName: string, elementClass: new () => T, setsParentProp?: string | null, propConfig?: Record<string, unknown>);
    readonly nativeElement: T;
    propAttribute: string | null;
  }
  export class NativeViewElementNode<T = any> extends NativeElementNode<T> {
    readonly nativeView: T;
  }
  export function registerElement(elementName: string, resolver: () => ViewNode, options?: { override?: boolean }): void;
  export function registerNativeViewElement(elementName: string, resolver: () => new () => any, parentProp?: string | null, propConfig?: Record<string, unknown>, options?: { override?: boolean }): void;
}
