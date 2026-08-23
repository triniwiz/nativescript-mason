// Maps a fixture's raw kebab-case CSS declarations (as found in the vendored
// taffy_tests HTML fixtures) onto the camelCase style-object shape the rest
// of this demo app uses. Bare px values become numbers (dip); everything
// else (percentages, keywords, grid-template strings, ...) passes through
// unchanged since the native Style setters parse those themselves.
const PX_VALUE = /^-?[\d.]+px$/;

function toCamelCase(prop: string): string {
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function toStyleValue(value: string): string | number {
  return PX_VALUE.test(value) ? parseFloat(value) : value;
}

// test_base_style.css defaults applied to every div in the fixture suite:
// flex-by-default containers, border-box sizing, and a zeroed box model.
const FIXTURE_DEFAULTS = {
  display: 'flex',
  boxSizing: 'border-box',
  position: 'relative',
} as const;

export function cssToStyle(style: Record<string, string>): Record<string, string | number> {
  const out: Record<string, string | number> = { ...FIXTURE_DEFAULTS };
  for (const [prop, value] of Object.entries(style)) {
    out[toCamelCase(prop)] = toStyleValue(value);
  }
  return out;
}
