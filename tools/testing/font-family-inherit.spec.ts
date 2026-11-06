import { describe, expect, it } from 'vitest';
import { Style as CoreStyle } from '@nativescript/core/ui/styling/style';
import { propagateInheritableCssProperties } from '@nativescript/core/ui/core/properties';
import { fontFamilyProperty as coreFontFamilyProperty } from '@nativescript/core/ui/styling/style-properties';
import { styleUnderTest } from './mason-test-kit/style-under-test';
import { isMasonView_ } from '../../packages/nativescript-masonkit/symbols';

// Reproduction for https://github.com/octane-xplat/octane-xplat/issues/157:
// registerAlongsideCore(fontFamilyProperty) dispatches the `fontFamily`
// accessor on mason styles to mason's non-inherited CssProperty. Core's
// InheritedCssProperty still stores the inherited family in its own symbol
// slot, but propagateInheritableCssProperties reads `style[prop.name]`, which
// now returns mason's separate undefined slot — so a child attached after the
// family's propagation receives undefined instead of the inherited family.
import '../../packages/nativescript-masonkit/properties';

function nsWeakRef(view: unknown) {
  return { get: () => view, deref: () => view, clear() {} } as any;
}

function host(mason: boolean) {
  const children: any[] = [];
  const view: any = {
    eachChild: (cb: (child: any) => boolean) => {
      for (const child of children) {
        if (!cb(child)) return;
      }
    },
    _batchUpdate: (cb: () => void) => cb(),
    requestLayout() {},
    getEffectivePaddingShorthand: () => 0,
    getEffectiveMarginShorthand: () => 0,
    addChild(child: any) {
      children.push(child);
      child.parent = view;
      propagateInheritableCssProperties(view.style, child.style);
    },
  };
  if (mason) {
    view[isMasonView_] = true;
    view._styleHelper = styleUnderTest().style;
  }
  view.style = new CoreStyle(nsWeakRef(view));
  return view;
}

describe('fontFamily inheritance through a Mason container (octane-xplat#157)', () => {
  it("a Mason view reads the inherited family held in core's slot", () => {
    const root = host(false);
    const app = host(true);
    const label = host(false);
    root.addChild(app);
    app.addChild(label);

    root.style.fontFamily = 'SN Pro';

    // The family did arrive: core's inherited slot holds it, marked Inherited.
    expect(app.style[coreFontFamilyProperty.key as any]).toBe('SN Pro');
    expect(app.style[coreFontFamilyProperty.sourceKey as any]).toBe(1 /* ValueSource.Inherited */);

    const result = {
      root: root.style.fontFamily,
      app: app.style.fontFamily,
      before: label.style.fontFamily,
    };
    expect(result).toEqual({ root: 'SN Pro', app: 'SN Pro', before: 'SN Pro' });
  });

  it('a late-mounted label receives the inherited family through propagateInheritableCssProperties', () => {
    const root = host(false);
    const app = host(true);
    const label = host(false);
    root.addChild(app);
    app.addChild(label);

    root.style.fontFamily = 'SN Pro';

    const late = host(false);
    app.addChild(late);

    const result = {
      root: root.style.fontFamily,
      app: app.style.fontFamily,
      before: label.style.fontFamily,
      after: late.style.fontFamily,
    };
    expect(result).toEqual({ root: 'SN Pro', app: 'SN Pro', before: 'SN Pro', after: 'SN Pro' });
  });

  it('reapplying the family after a reset still propagates to new mounts', () => {
    const root = host(false);
    const app = host(true);
    const label = host(false);
    root.addChild(app);
    app.addChild(label);

    root.style.fontFamily = 'SN Pro';
    root.style.fontFamily = 'unset';
    root.style.fontFamily = 'SN Pro';

    const late = host(false);
    app.addChild(late);

    expect(label.style.fontFamily).toBe('SN Pro');
    expect(late.style.fontFamily).toBe('SN Pro');
  });
});
