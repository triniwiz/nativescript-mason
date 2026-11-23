import { instantiate } from './portable-css-evaluator';

interface CssEngine {
  readonly memory: { readonly buffer: ArrayBuffer };
  css_alloc(words: number): number;
  css_free(address: number, words: number): void;
  css_math_evaluate(input: number, length: number, output: number): number;
  css_visit_color_functions(input: number, length: number): void;
  css_visit_shadows(input: number, length: number): void;
  css_visit_filters(input: number, length: number): void;
  css_evaluate_affine(input: number, length: number, width: number, height: number, output: number): number;
  css_angle(input: number, length: number): number;
  css_double_stop(input: number, length: number, output: number): number;
  css_resolve_stop_positions(records: number, count: number): void;
}

interface CssCallbacks {
  resolveUnit?: (value: number, unit: string) => [kind: number, value: number] | undefined;
  colorRange?: (start: number, end: number) => void;
  resolveLength?: (source: string) => number | undefined;
  shadow?: (x: number, y: number, blur: number, spread: number, inset: boolean, color: string | null) => void;
  filter?: (kind: number, amountOrX: number, y: number, blur: number, color: string | null) => void;
}

interface Evaluation {
  callbacks: CssCallbacks;
  failure?: { error: unknown };
}

let evaluator: CssEngine | undefined;
let evaluating: Evaluation | undefined;

function callHost<T>(callback: (callbacks: CssCallbacks) => T): T | undefined {
  const current = evaluating!;
  if (current.failure) return undefined;
  try {
    return callback(current.callbacks);
  } catch (error) {
    // Let Rust release its allocations before the exception crosses back to callers.
    current.failure = { error };
    return undefined;
  }
}

function readCssText(address: number, length: number): string {
  let text = '';
  for (const codeUnit of new Uint16Array(evaluator!.memory.buffer, address, length)) {
    text += String.fromCharCode(codeUnit);
  }
  return text;
}

function resolveUnit(value: number, address: number, length: number, output: number): number {
  const result = callHost(({ resolveUnit }) => resolveUnit?.(value, readCssText(address, length)));
  if (!result) return 0;
  // A resolver may itself evaluate another expression and grow linear memory.
  new Float64Array(evaluator!.memory.buffer, output, 1)[0] = result[1];
  return result[0];
}

function colorRange(start: number, end: number): void {
  callHost(({ colorRange }) => colorRange?.(start, end));
}

function resolveLength(address: number, length: number): number {
  return callHost(({ resolveLength }) => resolveLength?.(readCssText(address, length))) ?? NaN;
}

function shadowRecord(x: number, y: number, blur: number, spread: number, inset: number, address: number, length: number): void {
  callHost(({ shadow }) => shadow?.(x, y, blur, spread, inset !== 0, length === 0 ? null : readCssText(address, length)));
}

function filterRecord(kind: number, amountOrX: number, y: number, blur: number, address: number, length: number): void {
  callHost(({ filter }) => filter?.(kind, amountOrX, y, blur, length === 0 ? null : readCssText(address, length)));
}

export function withPortableCss<T>(
  value: string,
  outputWords: number,
  callbacks: CssCallbacks,
  run: (engine: CssEngine, input: number, output: number) => T,
): T {
  const engine = evaluator ??= instantiate({
    mason_css_host: {
      resolve_unit: resolveUnit,
      color_range: colorRange,
      resolve_length: resolveLength,
      shadow_record: shadowRecord,
      filter_record: filterRecord,
    },
  }) as CssEngine;
  const inputWords = Math.ceil(value.length / 4);
  const words = Math.max(1, inputWords + outputWords);
  const address = engine.css_alloc(words);
  const previous = evaluating;
  const current: Evaluation = { callbacks };
  evaluating = current;
  try {
    const input = new Uint16Array(engine.memory.buffer, address, value.length);
    for (let i = 0; i < value.length; i++) input[i] = value.charCodeAt(i);
    const result = run(engine, address, address + inputWords * 8);
    if (current.failure) throw current.failure.error;
    return result;
  } finally {
    evaluating = previous;
    engine.css_free(address, words);
  }
}
