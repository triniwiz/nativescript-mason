import { Style as CoreStyle } from '@nativescript/core/ui/styling/style';
import { styleUnderTest } from './style-under-test';
import { isMasonView_ } from '../../../packages/nativescript-masonkit/symbols';

// NativeScript's WeakRef shim exposes `.get()`, and both core and masonkit call
// it that way; the platform WeakRef only has `.deref()`.
function nsWeakRef(view: unknown) {
  return { get: () => view, deref: () => view, clear() {} } as any;
}

/**
 * Inherited properties (font-size among them) walk children, a shorthand's
 * per-view setter batches its longhands, and core's padding valueChanged reads
 * the view's padding shorthand, so a host needs all three.
 */
function viewShape(extra: Record<PropertyKey, unknown> = {}) {
  return { eachChild: () => {}, _batchUpdate: (update: () => void) => update(), getEffectivePaddingShorthand: () => '', ...extra } as any;
}

export function masonHost(extra: Record<PropertyKey, unknown> = {}) {
  const under = styleUnderTest();
  const view: any = viewShape({ [isMasonView_]: true, _styleHelper: under.style, ...extra });
  const style = new CoreStyle(nsWeakRef(view));
  view.style = style;
  return { under, view, style };
}

export function coreHost(extra: Record<PropertyKey, unknown> = {}) {
  const view: any = viewShape(extra);
  const style = new CoreStyle(nsWeakRef(view));
  view.style = style;
  return { view, style };
}
