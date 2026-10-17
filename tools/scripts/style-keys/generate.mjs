#!/usr/bin/env node
// Generates StyleKeys (style buffer byte offsets) and StateKeys (dirty-mask bits)
// for every language from style-keys.schema.
//
//   node tools/scripts/style-keys/generate.mjs           rewrite the generated blocks
//   node tools/scripts/style-keys/generate.mjs --check   exit 1 when one is stale
//
// A generated block sits between `<style-keys:NAME>` and `</style-keys:NAME>`
// marker comments; everything outside the markers is hand-written and untouched.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const SCHEMA = resolve(here, 'style-keys.schema');
const SCHEMA_REL = relative(root, SCHEMA);

const SIZES = { u8: 1, i8: 1, i32: 4, u32: 4, f32: 4, i64: 8 };
const LANGS = ['rust', 'kotlin', 'swift', 'ts', 'cpp'];

export function parseSchema(text) {
  const style = [];
  const state = [];
  let section = null;
  let offset = 0;
  let bit = 0;
  const fail = (line, msg) => {
    throw new Error(`${SCHEMA_REL}:${line}: ${msg}`);
  };

  text.split('\n').forEach((raw, i) => {
    const line = i + 1;
    const hash = raw.indexOf('#');
    const body = (hash >= 0 ? raw.slice(0, hash) : raw).trim();
    const comment = hash >= 0 ? raw.slice(hash + 1).trim() : '';
    const header = /^\[(\w+)\]$/.exec(body);
    if (header) {
      section = header[1];
      if (section !== 'style' && section !== 'state') fail(line, `unknown section [${section}]`);
      return;
    }
    const list = section === 'style' ? style : section === 'state' ? state : null;
    if (!list) return;
    // Blank lines and whole-line comments become section breaks in the output.
    if (!body) {
      list.push({ kind: comment ? 'comment' : 'blank', text: comment });
      return;
    }
    const tokens = body.split(/\s+/);
    const name = tokens.shift();
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) fail(line, `bad name "${name}"`);

    if (section === 'style') {
      const type = tokens.shift();
      const bytes = /^bytes\((\d+)\)$/.exec(type ?? '');
      const size = bytes ? Number(bytes[1]) : SIZES[type];
      if (!size) fail(line, `${name}: unknown type "${type}"`);
      for (const t of tokens) {
        const pin = /^@(\d+)$/.exec(t);
        if (!pin) fail(line, `${name}: unexpected "${t}"`);
        const at = Number(pin[1]);
        if (at < offset) fail(line, `${name}: @${at} overlaps the previous field (next free byte is ${offset})`);
        offset = at;
      }
      style.push({ kind: 'field', name, type, size, offset, comment, line });
      offset += size;
    } else {
      const names = {};
      for (const t of tokens) {
        const pin = /^@(\d+)$/.exec(t);
        if (pin) {
          if (Number(pin[1]) < bit) fail(line, `${name}: @${pin[1]} reuses an earlier bit`);
          bit = Number(pin[1]);
          continue;
        }
        const rename = /^(\w+)=(-|\w+)$/.exec(t);
        if (!rename || !LANGS.includes(rename[1])) fail(line, `${name}: unexpected "${t}"`);
        names[rename[1]] = rename[2];
      }
      if (bit > 127) fail(line, `${name}: bit ${bit} does not fit the 128-bit mask`);
      state.push({ kind: 'bit', name, bit, names, comment, line });
      bit += 1;
    }
  });

  const seen = new Map();
  for (const entry of [...style, ...state]) {
    if (!entry.name) continue;
    const key = `${entry.kind}:${entry.name}`;
    if (seen.has(key)) fail(entry.line, `${entry.name} is already defined on line ${seen.get(key)}`);
    seen.set(key, entry.line);
  }

  return { style, state, bufferSize: Math.ceil(offset / 4) * 4 };
}

const camel = (name) => name.toLowerCase().replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
// C++ uses kPascalCase: Win32 headers define SCREAMING macros (`OVERFLOW`, `FLOAT`).
const cppName = (name) => `k${camel(name).replace(/^./, (c) => c.toUpperCase())}`;

function stateName(entry, lang) {
  const override = entry.names[lang];
  if (override === '-') return null;
  if (override) return override;
  if (lang === 'swift') return camel(entry.name);
  if (lang === 'cpp') return cppName(entry.name);
  return entry.name;
}

function fieldNote(field) {
  const parts = [];
  if (field.size > 1) parts.push(`${field.type} (${field.offset}-${field.offset + field.size - 1})`);
  if (field.comment) parts.push(field.comment);
  return parts.join(', ');
}

// Renders a section, one line per entry, under one comment style.
function lines(entries, comment, render) {
  const out = [];
  for (const entry of entries) {
    if (entry.kind === 'blank') {
      if (out.length && out[out.length - 1] !== '') out.push('');
    } else if (entry.kind === 'comment') {
      out.push(`${comment} ${entry.text}`);
    } else {
      const text = render(entry);
      if (text == null) continue;
      const note = entry.kind === 'field' ? fieldNote(entry) : entry.comment;
      out.push(note ? `${text} ${comment} ${note}` : text);
    }
  }
  while (out[out.length - 1] === '') out.pop();
  return out;
}

// Lines up trailing comments across consecutive commented lines, as rustfmt does.
function alignComments(out, comment) {
  const marker = ` ${comment} `;
  const result = [...out];
  let start = 0;
  while (start < result.length) {
    if (!result[start].includes(marker) || result[start].startsWith(comment)) {
      start++;
      continue;
    }
    let end = start;
    while (end < result.length && result[end].includes(marker) && !result[end].startsWith(comment)) end++;
    const parts = result.slice(start, end).map((line) => {
      const i = line.indexOf(marker);
      return [line.slice(0, i), line.slice(i + 1)];
    });
    const width = Math.max(...parts.map(([code]) => code.length));
    parts.forEach(([code, note], k) => (result[start + k] = `${code.padEnd(width)} ${note}`));
    start = end;
  }
  return result;
}

const RENDER = {
  'rust:offsets': (s) => alignComments(lines(s.style, '//', (f) => `${f.name} = ${f.offset},`), '//'),
  'rust:state': (s) => alignComments(lines(s.state, '//', (b) => `const ${stateName(b, 'rust')} = 1u128 << ${b.bit};`), '//'),
  'rust:size': (s) => [`pub const STYLE_BUFFER_SIZE: usize = ${s.bufferSize};`],

  'kotlin:offsets': (s) => [`const val STYLE_BUFFER_SIZE = ${s.bufferSize}`, '', ...lines(s.style, '//', (f) => `const val ${f.name} = ${f.offset}`)],
  'kotlin:state': (s) => lines(s.state, '//', (b) => (stateName(b, 'kotlin') ? `val ${stateName(b, 'kotlin')} = flag(${b.bit})` : null)),

  'swift:offsets': (s) => [`public static let STYLE_BUFFER_SIZE = ${s.bufferSize}`, '', ...lines(s.style, '//', (f) => `public static let ${f.name} = ${f.offset}`)],
  'swift:state': (s) => lines(s.state, '//', (b) => (stateName(b, 'swift') ? `public static let ${stateName(b, 'swift')} = StateKeys(${b.bit})` : null)),

  'ts:offsets': (s) => lines(s.style, '//', (f) => `${f.name} = ${f.offset},`),
  'ts:state': (s) => lines(s.state, '//', (b) => (stateName(b, 'ts') ? `static readonly ${stateName(b, 'ts')} = StateKeys.flag(${b.bit});` : null)),
};

const NATIVE = 'packages/nativescript-masonkit/src-native';
const REGIONS = [
  { file: 'crates/mason-core/src/style/mod.rs', blocks: ['rust:offsets', 'rust:state'] },
  { file: 'crates/mason-core/src/style/arena.rs', blocks: ['rust:size'] },
  { file: `${NATIVE}/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/Style.kt`, blocks: ['kotlin:offsets', 'kotlin:state'] },
  { file: `${NATIVE}/mason-ios/Mason/Mason/MasonStyle.swift`, blocks: ['swift:offsets', 'swift:state'] },
  { file: 'packages/nativescript-masonkit/style.ts', blocks: ['ts:offsets', 'ts:state'] },
];

function cppHeader(s) {
  const field = lines(s.style, '//', (f) => `inline constexpr uint32_t ${cppName(f.name)} = ${f.offset};`);
  const state = lines(s.state, '//', (b) => (stateName(b, 'cpp') ? `inline constexpr uint32_t ${stateName(b, 'cpp')} = ${b.bit};` : null));
  const indent = (l) => (l ? `    ${l}` : l);
  return [
    `// Generated from ${SCHEMA_REL} by tools/scripts/style-keys/generate.mjs. Do not edit.`,
    '#pragma once',
    '#include <cstdint>',
    '',
    '// Byte offsets into the shared style buffer.',
    'namespace mason_style_keys',
    '{',
    indent(`inline constexpr uint32_t kStyleBufferSize = ${s.bufferSize};`),
    '',
    ...field.map(indent),
    '}',
    '',
    '// Bit numbers of the 128-bit style dirty mask.',
    'namespace mason_state_keys',
    '{',
    ...state.map(indent),
    '}',
    '',
  ].join('\n');
}

const FILES = [{ file: `${NATIVE}/windows/Mason/StyleKeys.h`, render: cppHeader }];

function fillRegions(source, file, blocks, schema) {
  let out = source;
  for (const block of blocks) {
    const name = block.split(':')[1];
    const lineList = out.split('\n');
    const begin = lineList.findIndex((l) => l.includes(`<style-keys:${name}>`));
    const end = lineList.findIndex((l) => l.includes(`</style-keys:${name}>`));
    if (begin < 0 || end < begin) throw new Error(`${file}: missing <style-keys:${name}> ... </style-keys:${name}> markers`);
    const indent = /^\s*/.exec(lineList[begin])[0];
    const body = RENDER[block](schema).map((l) => (l ? indent + l : l));
    lineList.splice(begin + 1, end - begin - 1, ...body);
    out = lineList.join('\n');
  }
  return out;
}

function main() {
  const check = process.argv.includes('--check');
  const schema = parseSchema(readFileSync(SCHEMA, 'utf8'));
  const outputs = [];
  for (const { file, blocks } of REGIONS) {
    const path = resolve(root, file);
    const before = readFileSync(path, 'utf8');
    outputs.push({ file, path, before, after: fillRegions(before, file, blocks, schema) });
  }
  for (const { file, render } of FILES) {
    const path = resolve(root, file);
    const before = existsSync(path) ? readFileSync(path, 'utf8') : '';
    outputs.push({ file, path, before, after: render(schema) });
  }

  const stale = outputs.filter((o) => o.before !== o.after);
  const fields = schema.style.filter((e) => e.kind === 'field').length;
  const bits = schema.state.filter((e) => e.kind === 'bit').length;
  if (check) {
    if (stale.length) {
      console.error(`StyleKeys are stale in:\n${stale.map((o) => `  ${o.file}`).join('\n')}\nRun \`npm run gen:style-keys\` and commit the result.`);
      process.exit(1);
    }
    console.log(`StyleKeys up to date: ${fields} fields, ${bits} state bits, buffer ${schema.bufferSize} bytes.`);
    return;
  }
  for (const o of stale) writeFileSync(o.path, o.after);
  console.log(`${fields} fields, ${bits} state bits, buffer ${schema.bufferSize} bytes. Updated ${stale.length} file(s)${stale.length ? `:\n${stale.map((o) => `  ${o.file}`).join('\n')}` : '.'}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
