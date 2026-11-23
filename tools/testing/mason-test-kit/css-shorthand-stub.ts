import { readFileSync } from 'node:fs';
import { evaluateCssMath, isCssMathFunction } from '../../../packages/nativescript-masonkit/css-math';
import { parseSchema } from '../../scripts/style-keys/generate.mjs';

const keywordSchema = parseSchema(readFileSync(new URL('../../scripts/style-keys/style-keys.schema', import.meta.url), 'utf8')).keywords;

// Native results for the declarations used by Node's style and cascade tests.
// The grammar is exercised by Rust tests and by the mobile native bridge tests.
function four(value: string): string[] {
  return [value, value, value, value];
}

function uniformBorder(width: string, style: string, color: string): string[] {
  return [...four(width), ...four(style), ...four(color)];
}

function animation(...layers: (string | [number, string])[][]): string[] {
  return layers.flatMap((layer) => [String(layer.length), ...layer.flatMap((term) =>
    typeof term === 'string' ? ['keyword', term, ''] : ['number', String(term[0]), term[1]])]);
}

const results: Record<string, Record<string, string[] | undefined> | undefined> = {
  tokenize: {
    '10px\t20px/5px , red': ['10px', '20px', '/', '5px', ',', 'red'],
    'rgb(0, 0, 0) url("a b/c.png") linear-gradient(to right, rgba(0,0,0,.5), red)': [
      'rgb(0, 0, 0)', 'url("a b/c.png")', 'linear-gradient(to right, rgba(0,0,0,.5), red)',
    ],
    "url('a)b') x": ["url('a)b')", 'x'],
  },
  'webkit-mask-composite-list': {
    'source-over, xor, source-in, source-out, destination-in, copy': ['add, exclude, intersect, subtract, intersect, add'],
  },
  'webkit-mask-box-list': { 'padding, content-box': ['padding-box, content-box'] },
  'animation-position-list': {
    '0% 0%': animation([[0, '%'], [0, '%']]),
    '100% 0%': animation([[100, '%'], [0, '%']]),
    '50% 0%': animation([[50, '%'], [0, '%']]),
    '10px 20px': animation([[10, 'px'], [20, 'px']]),
    '30px 40px': animation([[30, 'px'], [40, 'px']]),
    'left top': animation([[0, '%'], [0, '%']]),
    'right bottom': animation([[100, '%'], [100, '%']]),
    center: animation([[50, '%'], [50, '%']]),
    left: animation([[0, '%'], [50, '%']]),
    top: animation([[50, '%'], [0, '%']]),
    bottom: animation([[50, '%'], [100, '%']]),
    '0 0': animation([[0, ''], [0, '']]),
    '100% 10px': animation([[100, '%'], [10, 'px']]),
    '0% 0%, 10px 10px': animation([[0, '%'], [0, '%']], [[10, 'px'], [10, 'px']]),
    '100% 100%, 20px 20px': animation([[100, '%'], [100, '%']], [[20, 'px'], [20, 'px']]),
    '10px 0%': animation([[10, 'px'], [0, '%']]),
    '0% 0%, 10% 10%': animation([[0, '%'], [0, '%']], [[10, '%'], [10, '%']]),
  },
  'animation-size-list': {
    '100% 100%': animation([[100, '%'], [100, '%']]),
    '250% 100%': animation([[250, '%'], [100, '%']]),
    '10px': animation([[10, 'px'], 'auto']),
    '30px': animation([[30, 'px'], 'auto']),
    cover: animation(['cover']),
    contain: animation(['contain']),
  },
  'line-clamp': {
    none: ['0'],
    NONE: ['0'],
    '2': ['2'],
    '4': ['4'],
    '3.8': ['3'],
    '2147483647': ['2147483647'],
  },
  'font-family': {
    [`'Roboto Mono', "Courier New", monospace`]: ['Roboto Mono', 'Courier New', 'monospace'],
    [`"A, B",  Mukta   Mahee ,serif`]: ['A, B', 'Mukta Mahee', 'serif'],
    ', Caveat,': ['Caveat'],
    '': [],
    "'Caveat'": ['Caveat'],
    "'Roboto Mono', Courier, monospace": ['Roboto Mono', 'Courier', 'monospace'],
    'Missing, BebasNeue-Regular, sans-serif': ['Missing', 'BebasNeue-Regular', 'sans-serif'],
    'Missing, cursive': ['Missing', 'cursive'],
    [`'Missing One', "Missing Two"`]: ['Missing One', 'Missing Two'],
    inherit: ['inherit'],
  },
  'color-value': {
    '#E03131': ['4292882737'],
    '#00ff00': ['4278255360'],
    '#ff0000': ['4294901760'],
    '#3B5BDB': ['4282080219'],
    'rgb(0 0 0 / 15%)': ['637534208'],
    'color-mix(in oklch, oklch(from #000 l c h / 0.04) 100%, transparent)': ['167772160'],
    white: ['4294967295'],
  },
  border: {
    '1px solid red': uniformBorder('1px', 'solid', 'red'),
    '1rem solid': uniformBorder('1rem', 'solid', 'black'),
    none: uniformBorder('0', 'none', 'black'),
    '2px dashed green': uniformBorder('2px', 'dashed', 'green'),
    '2px solid red': uniformBorder('2px', 'solid', 'red'),
  },
  'border-components': { '0.5em solid red': [...four('0.5em'), '4', '4294901760'] },
  'border-style-values': { 'SOLID /* sides */ dashed dotted': ['4', '3', '2', '3'] },
  'border-left': { '2px dashed': ['2px', 'dashed', 'black'] },
  'border-top': { '3px dashed blue': ['3px', 'dashed', 'blue'] },
  'border-bottom': { '2px dotted #00ff00': ['2px', 'dotted', '#00ff00'] },
  'border-style': {
    dashed: four('dashed'),
    'solid dashed': ['solid', 'dashed', 'solid', 'dashed'],
  },
  'border-width': {
    '0 0 1px': ['0', '0', '1px', '0'],
    '4px': four('4px'),
    'thin 2rem medium thick': ['thin', '2rem', 'medium', 'thick'],
    'thick 1': ['thick', '1', 'thick', '1'],
  },
  'border-color': {
    'red rgb(0, 0, 255)': ['red', 'rgb(0, 0, 255)', 'red', 'rgb(0, 0, 255)'],
  },
  'border-inline-width': { 'thin 2px': ['thin', '2px'] },
  'border-inline-style': { dashed: ['dashed', 'dashed'] },
  'border-block-color': { 'red blue': ['red', 'blue'] },
  'border-block-end': { '1px solid red': ['1px', 'solid', 'red'] },
  'border-inline-start': { '3px solid red': ['3px', 'solid', 'red'] },
  'border-inline': { '2px dotted green': ['2px', 'dotted', 'green', '2px', 'dotted', 'green'] },
  'border-radius': {
    '50% 1rem / 2px': ['50% 2px', '1rem 2px', '50% 2px', '1rem 2px'],
    '50%': four('50%'),
    '10 4px': ['10', '4px', '10', '4px'],
  },
  'border-radius-components': {
    '0': [...four('0'), ...four('0')],
    '4px': [...four('4px'), ...four('4px')],
    '50%': [...four('50%'), ...four('50%')],
    '1px 2px': ['1px', '2px', '1px', '2px', '1px', '2px', '1px', '2px'],
    '1px 2px 3px': ['1px', '2px', '3px', '2px', '1px', '2px', '3px', '2px'],
    '1rem 10px 12pt 4': ['1rem', '10px', '12pt', '4', '1rem', '10px', '12pt', '4'],
    '1px 2px / 3px': ['1px', '2px', '1px', '2px', ...four('3px')],
    '8px / 2px': [...four('8px'), ...four('2px')],
  },
  'border-corner-radius': { '4px': ['4px', '4px'] },
  'corner-shape': {
    'squircle scoop': ['2', '-1', '2', '-1'],
    '': four('1'),
  },
  'corner-shape-bottom-left': { notch: ['-Infinity'] },
  'text-decoration': {
    'underline line-through red': ['5', '0', '4294901760', ''],
    'overline dotted': ['2', '2', '3735928559', ''],
    underline: ['1', '0', '3735928559', ''],
    '2px dashed #00ff00 overline': ['2', '3', '4278255360', '2px'],
    'none currentcolor auto': ['0', '0', '3735928559', ''],
  },
  'text-decoration-line': {
    none: ['0'],
    'spelling-error': ['8'],
    'underline grammar-error': ['16'],
    'line-through underline': ['5'],
  },
  'text-decoration-style': { wavy: ['4'] },
  'text-decoration-thickness': { '3px': ['3px'], 'from-font': [''] },
  'list-style': {
    none: ['none', 'outside'],
    'square inside': ['square', 'inside'],
  },
  margin: {
    '10px': ['10px', '10px', '10px', '10px'],
    '8px': ['8px', '8px', '8px', '8px'],
    '10dip': ['10dip', '10dip', '10dip', '10dip'],
    '10% 2rem': ['10%', '2rem', '10%', '2rem'],
    '10% 20': ['10%', '20', '10%', '20'],
    '1rem 5%': ['1rem', '5%', '1rem', '5%'],
    '0 auto': ['0', 'auto', '0', 'auto'],
    '1rem 5% -2px .5em': ['1rem', '5%', '-2px', '.5em'],
    'calc(1px + 2px) 4px': ['calc(1px + 2px)', '4px', 'calc(1px + 2px)', '4px'],
    '2px 4px 6px 8px': ['2px', '4px', '6px', '8px'],
    '62px 4px 34px': ['62px', '4px', '34px', '4px'],
    '20px 4px 10px': ['20px', '4px', '10px', '4px'],
    '62px 5px 34px': ['62px', '5px', '34px', '5px'],
    '20px 5px 10px': ['20px', '5px', '10px', '5px'],
  },
  padding: {
    'calc(3px + 2px) 4px': ['calc(3px + 2px)', '4px', 'calc(3px + 2px)', '4px'],
    '10px 20px': ['10px', '20px', '10px', '20px'],
    '10dip': ['10dip', '10dip', '10dip', '10dip'],
    '5% 2rem': ['5%', '2rem', '5%', '2rem'],
    '10 4px': ['10', '4px', '10', '4px'],
    '2px 4px 6px 8px': ['2px', '4px', '6px', '8px'],
    '62px 5px 34px': ['62px', '5px', '34px', '5px'],
    '20px 5px 10px': ['20px', '5px', '10px', '5px'],
  },
  inset: {
    '1px 2px': ['1px', '2px', '1px', '2px'],
    '1px 2px 3px 4px': ['1px', '2px', '3px', '4px'],
    '1rem': ['1rem', '1rem', '1rem', '1rem'],
    '1rem 2rem': ['1rem', '2rem', '1rem', '2rem'],
  },
  'margin-inline': {
    '1rem 2rem': ['1rem', '2rem'],
    auto: ['auto', 'auto'],
  },
  'margin-block': {
    '4px': ['4px', '4px'],
    '1px 2px': ['1px', '2px'],
  },
  'padding-inline': { '1rem 0': ['1rem', '0'] },
  'inset-inline': { '0': ['0', '0'] },
  gap: {
    '10px': ['10px', '10px'],
    '10px 20px': ['10px', '20px'],
    '4px': ['4px', '4px'],
    '4px 8px': ['4px', '8px'],
    '0.5rem': ['0.5rem', '0.5rem'],
    '1rem 2rem': ['1rem', '2rem'],
    '1rem 10%': ['1rem', '10%'],
    'clamp(0.5rem, 1vw, 1rem)': ['clamp(0.5rem, 1vw, 1rem)', 'clamp(0.5rem, 1vw, 1rem)'],
  },
  'grid-gap': {
    '0.25rem': ['0.25rem', '0.25rem'],
    '4px 8px': ['4px', '8px'],
  },
  overflow: {
    auto: ['auto', 'auto'],
    'hidden scroll': ['hidden', 'scroll'],
  },
  flex: {
    '1 1 auto': ['1', '1', 'auto'],
    '10px': ['1', '1', '10px'],
  },
  'place-items': { 'center start': ['center', 'start'] },
  'grid-row': {
    '2 / 4': ['2', '4'],
    '3 / 5': ['3', '5'],
  },
  'grid-column': { '2 / 4': ['2', '4'] },
  'aspect-ratio': {
    '2 / 3': [String(2 / 3)],
    '2/3': [String(2 / 3)],
    '16 / 9': [String(16 / 9)],
    '1.5': ['1.5'],
    'auto 2 / 3': [String(2 / 3)],
    auto: [''],
  },
  'font-style': {
    normal: ['0', '0'],
    italic: ['1', '0'],
    oblique: ['2', '0'],
    'oblique -0.125turn': ['2', '-45'],
  },
  'touch-action': {
    '': ['7'],
    auto: ['7'],
    none: ['0'],
    'pan-x /* y */ pan-up pinch-zoom': ['7'],
    'auto pan-left unknown': ['1'],
  },
};

export function expandCssShorthand(name: string, value: string): string[] | null {
  if (name.startsWith('keyword:') || name === 'font-weight' || name === 'font-stretch') {
    const property = name.startsWith('keyword:') ? name.slice('keyword:'.length) : name;
    const word = value.trim().toLowerCase().split(/\s+/).join(' ');
    const keyword = keywordSchema.find((entry) => entry.properties.includes(property))?.values.get(word);
    const code = keyword?.display?.kotlinOnly ? undefined : keyword?.code;
    if (name === 'font-weight') return code === undefined ? null : [String(code), word];
    if (name === 'font-stretch' && word === '113.25%') return ['11325'];
    return code == null ? null : [String(code)];
  }
  if (name === 'font-stretch-name') {
    const stretch = keywordSchema.find((entry) => entry.properties.includes('font-stretch'));
    const keyword = [...stretch!.values].find(([, { code }]) => code === Number(value))?.[0];
    return [keyword ?? `${Number(value) / 100}%`];
  }
  if (name === 'length-value') return scalarLength(value);
  if (name === 'length-prefix') {
    if (value === '80ch') return ['80', 'ch'];
    if (value === '2ex') return ['2', 'ex'];
    return scalarLength(value);
  }
  const declarations = results[name];
  const key = value.trim();
  return declarations && Object.hasOwn(declarations, key) ? declarations[key] ?? null : null;
}


// Node tests have no native ABI. The portable API supplies result values so
// style tests can assert the platform projection. Rust tests cover the grammar.
function scalarLength(value: string): [string, string] | null {
  const match = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z]*|%)$/i.exec(value.trim());
  return match && Number.isFinite(Number(match[1])) ? [match[1], match[2].toLowerCase()] : null;
}

export function resolveCssLength(
  value: string, kind: number, scale: number, fontSize: number, rootFontSize: number, width: number, height: number,
): [number, number] | null {
  const trimmed = value.trim();
  if (kind === 12 || kind === 13) {
    const keywords: Record<string, number> = { auto: 0, 'min-content': 3, 'max-content': 4, 'fit-content': 5, stretch: 8, content: 9 };
    const keyword = keywords[trimmed.toLowerCase()];
    if (keyword === 0 || keyword !== undefined && kind === 12) return [keyword, 0];
    const limit = kind === 12 ? /^fit-content\((.+)\)$/i.exec(trimmed)?.[1] : undefined;
    const fields = resolveCssLength(limit ?? trimmed, 2, scale, fontSize, rootFontSize, width, height);
    if (!fields) return null;
    const [type, amount] = fields;
    return [limit ? type === 2 ? 7 : 6 : type === 2 ? 2 : 1, type === 0 ? amount * scale : amount];
  }
  if (kind === 11) {
    if (trimmed === 'sub') return [3, 6];
    if (trimmed === '-2px') return [1, -2 * scale];
    if (trimmed === '25%') return [2, 0.25];
    return null;
  }
  if (kind === 7 && trimmed === 'normal') return [3, 0];
  if (kind === 8 && trimmed === 'normal') return [1, 0];
  if (kind === 10 && trimmed === 'normal') return [2, 0];
  if (kind >= 7) {
    const input = kind === 9 && trimmed === '5% hanging' ? '5%' : trimmed;
    const fields = resolveCssLength(input, 2, scale, fontSize, rootFontSize, width, height);
    if (!fields) return null;
    const [type, amount] = fields;
    if (kind === 10) return type === 2 ? [1, amount * 100] : [0, type === 0 ? amount * scale : amount];
    if (kind === 7) {
      if (type === 2) return [1, amount * (fontSize || rootFontSize)];
      return type === 1 ? [1, amount / scale] : fields;
    }
    if (kind === 8 && type === 2) return null;
    return type === 0 ? [1, amount * scale] : fields;
  }
  const units: Record<string, number> = {
    px: scale, dip: scale, dp: scale, dppx: 1,
    em: (fontSize || rootFontSize) * scale, rem: rootFontSize * scale, pt: scale * 96 / 72,
    vw: width * scale / 100, vh: height * scale / 100,
    vmin: Math.min(width, height) * scale / 100, vmax: Math.max(width, height) * scale / 100,
  };
  if (!isCssMathFunction(value)) {
    const scalar = scalarLength(value);
    if (!scalar) return null;
    const [raw, unit] = scalar;
    const n = Number(raw);
    if (unit === '%') return [2, n / 100];
    if (kind === 3 && unit === 'em') return [2, n];
    if (unit === '') return [0, n];
    if (!(unit in units)) return null;
    return [1, n * units[unit]];
  }
  const result = evaluateCssMath(value, (n, unit) => {
    if (kind === 3 && unit === 'em') return { percent: n * 100 };
    return unit in units ? n * units[unit] : undefined;
  }) ?? (kind === 3 ? evaluateCssMath(value, (n, unit) => {
    if (unit === '%') return n * (fontSize || rootFontSize) * scale / 100;
    return unit in units ? n * units[unit] : undefined;
  }) : undefined);
  if (result?.kind === 'number') return [0, result.value];
  if (result?.kind === 'length') return [1, result.px];
  if (result?.kind === 'percent') return [2, result.percent / 100];
  return null;
}

export function resolveCssPosition(value: string, kind: 5 | 6, scale: number): [number, number, number, number] | null {
  const result: Record<string, [number, number, number, number]> = {
    center: [1, 50, 1, 50],
    'top left': [1, 0, 1, 0],
    'left top': [1, 0, 1, 0],
    top: [1, 50, 1, 0],
    right: [1, 100, 1, 50],
    'bottom center': [1, 50, 1, 100],
    '10px 20%': [0, 10 * scale, 1, 20],
  };
  if (kind === 5 && value === '25% 75% 10px') return [1, 25, 1, 75];
  return Object.hasOwn(result, value) ? result[value] : null;
}

const radiusFixtures: Record<string, string[] | undefined> = {
  '4': [...four('4'), ...four('4')],
  '4px 8px': ['4px', '8px', '4px', '8px', '4px', '8px', '4px', '8px'],
  '4 8dip 12': ['4', '8dip', '12', '8dip', '4', '8dip', '12', '8dip'],
  '1 2 3 4': ['1', '2', '3', '4', '1', '2', '3', '4'],
  '50% 10dppx / 2 4;': ['50%', '10dppx', '50%', '10dppx', '2', '4', '2', '4'],
  '1e30px': [...four('1e30px'), ...four('1e30px')],
  '5vw': [...four('5vw'), ...four('5vw')],
  'calc(4px + 1px) 10dppx / 2 1rem': ['5px', '10dppx', '5px', '10dppx', '2', '1rem', '2', '1rem'],
};
const cornerRadiusFixtures: Record<string, string[] | undefined> = {
  '8px': ['8px', '8px'],
  '50%': ['50%', '50%'],
  '3dppx': ['3dppx', '3dppx'],
  '8px 4px': ['8px', '4px'],
  '8px 2px': ['8px', '2px'],
  '6px 2px': ['6px', '2px'],
  '5px': ['5px', '5px'],
  '50% 4': ['50%', '4'],
  '10vh 50%': ['10vh', '50%'],
  'calc(4px + 1px) 2rem': ['5px', '2rem'],
};

export function resolveCssValues(value: string, kind: number, context: [number, number, number, number, number]): number[] | null {
  const key = value.trim();
  const words = kind === 14 ? radiusFixtures[key] ?? results['border-radius-components']?.[key] : cornerRadiusFixtures[key];
  if (!words) return null;
  const fields: number[] = [];
  for (const word of words) {
    const pair = resolveCssLength(word, 4, ...context);
    if (!pair) return null;
    const [type, amount] = pair;
    const scale = context[0];
    fields.push(type === 2 ? 2 : 1, type === 0 ? Math.max(-9999, Math.min(9999, amount)) * scale
      : type === 2 ? amount : Math.max(-9999 * scale, Math.min(9999 * scale, amount)));
  }
  return fields;
}
