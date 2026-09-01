/**
 * The context CSS relative units resolve against.
 *
 * `rem` needs a root font size, and `vw`/`vh`/`vmin`/`vmax` need the viewport.
 * Neither is knowable from a style buffer, and importing `Screen` here would
 * drag the platform module into every consumer (including the Node tests), so
 * the platform pushes the values in at init instead — see `tree/index.*.ts`.
 *
 * The defaults are the CSS defaults: 16px root font size, and a zero viewport,
 * which makes an unresolvable `vw`/`vh` collapse to 0 rather than silently
 * becoming a bare number in the wrong unit.
 */
export interface CssUnitContext {
  /** Root font size in CSS px. The browser default is 16. */
  rootFontSize: number;
  /** Viewport width in CSS px, or 0 when not yet known. */
  viewportWidth: number;
  /** Viewport height in CSS px, or 0 when not yet known. */
  viewportHeight: number;
}

export const cssUnits: CssUnitContext = {
  rootFontSize: 16,
  viewportWidth: 0,
  viewportHeight: 0,
};

export function setCssUnitContext(context: Partial<CssUnitContext>): void {
  if (typeof context.rootFontSize === 'number' && context.rootFontSize > 0) {
    cssUnits.rootFontSize = context.rootFontSize;
  }
  if (typeof context.viewportWidth === 'number' && context.viewportWidth >= 0) {
    cssUnits.viewportWidth = context.viewportWidth;
  }
  if (typeof context.viewportHeight === 'number' && context.viewportHeight >= 0) {
    cssUnits.viewportHeight = context.viewportHeight;
  }
}
