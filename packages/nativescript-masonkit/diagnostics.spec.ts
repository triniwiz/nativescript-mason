import { beforeEach, describe, expect, it } from 'vitest';
import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { clearCssDiagnostics, formatCssDiagnostics, getCssDiagnostics, setCssDiagnostics } from './diagnostics';
import { setCssUnitContext } from './units';

describe('CSS diagnostics', () => {
  beforeEach(() => {
    setScreenScale(1);
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
    setCssDiagnostics(true, { log: false });
    clearCssDiagnostics();
  });

  it('stays silent when disabled', () => {
    setCssDiagnostics(false);
    const t = styleUnderTest();
    t.style.width = '10ch' as never;
    expect(getCssDiagnostics()).toHaveLength(0);
  });

  it('reports a unit it cannot resolve', () => {
    const t = styleUnderTest();
    t.style.width = '10ch' as never;
    expect(formatCssDiagnostics()).toContain('unsupported-unit');
    expect(formatCssDiagnostics()).toContain('10ch');
  });

  it('reports a viewport unit used before the viewport is known', () => {
    setCssUnitContext({ viewportWidth: 0, viewportHeight: 0 });
    const t = styleUnderTest();
    t.style.width = '50vw' as never;
    expect(formatCssDiagnostics()).toContain('viewport size not known yet');
  });

  it('says nothing for units it does support', () => {
    const t = styleUnderTest();
    for (const value of ['10px', '10dip', '1rem', '2em', '50%', '12pt', '50vw', '10', '10dppx']) {
      t.style.width = value as never;
    }
    expect(formatCssDiagnostics()).toBe('');
  });

  it('deduplicates a repeated problem', () => {
    const t = styleUnderTest();
    for (let i = 0; i < 20; i++) {
      t.style.width = '10ch' as never;
    }
    expect(getCssDiagnostics()).toHaveLength(1);
  });

  // The oracle: feed a stylesheet's worth of declarations through and assert
  // exactly what mason cannot use. A regression that starts dropping something
  // shows up here as a new line, without needing a fixture per property.
  it('produces a stable drop list for a realistic stylesheet', () => {
    const t = styleUnderTest();
    const DECLARATIONS: Array<[string, string]> = [
      ['width', '100px'],
      ['maxWidth', '48rem'],
      ['paddingLeft', '1.5em'],
      ['marginTop', '12pt'],
      ['height', '50vh'],
      ['minWidth', '0'],
      ['flexBasis', '25%'],
      ['rowGap', '0.5rem'],
      ['width', 'calc(100% - 20px)'],
      ['maxWidth', '80ch'],
      ['paddingLeft', '2ex'],
      ['height', 'clamp(1rem, 5vw, 3rem)'],
    ];
    for (const [prop, value] of DECLARATIONS) {
      (t.style as any)[prop] = value;
    }
    expect(formatCssDiagnostics()).toMatchInlineSnapshot(`
      "not-implemented length: calc(100% - 20px) — calc() is not evaluated here; it resolves only in a stylesheet, where core expands it first
      unsupported-unit length: 80ch — unknown unit "ch", treated as CSS px
      unsupported-unit length: 2ex — unknown unit "ex", treated as CSS px
      not-implemented length: clamp(1rem, 5vw, 3rem) — clamp() is not evaluated here; it resolves only in a stylesheet, where core expands it first"
    `);
  });
});
