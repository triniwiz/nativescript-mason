// Maps a fixture's raw kebab-case CSS declarations (as found in the vendored
// taffy_tests HTML fixtures) onto the camelCase style-object shape the rest of
// this demo app uses.
//
// Values pass through verbatim, `px` included: mason treats a CSS px as a CSS
// px, so the fixtures exercise the real parsing path. (This used to rewrite
// every `px` token to `dip` before handing it over, which meant the suite could
// be green while the px path was broken.)
function toCamelCase(prop: string): string {
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// test_base_style.css defaults applied to every div in the fixture suite:
// flex-by-default containers, border-box sizing, and a zeroed box model.
const FIXTURE_DEFAULTS = {
  display: 'flex',
  boxSizing: 'border-box',
  position: 'relative',
} as const;

// base.css's `#test-root` rule, which applies only to the fixture root. Ahem is
// the whole point: its "X" is exactly 1em wide and tall, so at 10px a run of
// X's has an exactly predictable size and min-content/max-content become
// comparable against the browser. The font ships at
// apps/demo-solid/src/fonts/Ahem.ttf and is declared in app.css.
const ROOT_DEFAULTS = {
  position: 'absolute',
  fontFamily: 'ahem',
  fontSize: 10,
  lineHeight: 1,
} as const;

// base.css has `body > * { position: absolute }`, applying only to the
// fixture root; without it the root stretches to the off-screen stage's
// width instead of shrink-to-fitting its own content.
export function cssToStyle(style: Record<string, string>, isRoot = false): Record<string, string | number> {
  const out: Record<string, string | number> = { ...FIXTURE_DEFAULTS };
  if (isRoot) Object.assign(out, ROOT_DEFAULTS);
  for (const [prop, value] of Object.entries(style)) {
    out[toCamelCase(prop)] = value;
  }
  return out;
}
