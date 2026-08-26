// Maps a fixture's raw kebab-case CSS declarations (as found in the vendored
// taffy_tests HTML fixtures) onto the camelCase style-object shape the rest
// of this demo app uses. Bare px values become numbers (dip); everything
// else (percentages, keywords, grid-template strings, ...) passes through
// unchanged since the native Style setters parse those themselves.
const PX_VALUE = /^-?[\d.]+px$/;
// Multi-value shorthands (e.g. `padding: 10px 20px`) stay strings and hit
// the native parser as-is, where "px" means literal device pixels, not dips.
// Rewrite embedded "px" tokens to "dip" so both paths agree on units.
const PX_TOKEN = /(-?[\d.]+)px\b/g;

// Grid track-list/placement props are always strings natively; don't let a
// single-token value like "40px" get numified by PX_VALUE above.
const GRID_STRING_PROP = /^grid-/;

function toCamelCase(prop: string): string {
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function toStyleValue(prop: string, value: string): string | number {
  if (!GRID_STRING_PROP.test(prop) && PX_VALUE.test(value)) return parseFloat(value);
  return value.replace(PX_TOKEN, '$1dip');
}

// test_base_style.css defaults applied to every div in the fixture suite:
// flex-by-default containers, border-box sizing, and a zeroed box model.
const FIXTURE_DEFAULTS = {
  display: 'flex',
  boxSizing: 'border-box',
  position: 'relative',
} as const;

// base.css has `body > * { position: absolute }`, applying only to the
// fixture root; without it the root stretches to the off-screen stage's
// width instead of shrink-to-fitting its own content.
export function cssToStyle(style: Record<string, string>, isRoot = false): Record<string, string | number> {
  const out: Record<string, string | number> = { ...FIXTURE_DEFAULTS };
  if (isRoot) out.position = 'absolute';
  for (const [prop, value] of Object.entries(style)) {
    out[toCamelCase(prop)] = toStyleValue(prop, value);
  }
  return out;
}
