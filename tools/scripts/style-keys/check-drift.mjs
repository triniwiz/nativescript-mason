#!/usr/bin/env node
// StyleKeys is a byte-offset table into a shared style buffer, hand-maintained
// in four languages. A single disagreeing offset means one side reads a
// different field than the other wrote — silently, and only on one platform.
// This is the cheapest possible guard against that.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const SOURCES = [
  {
    lang: 'ts',
    file: 'packages/nativescript-masonkit/style.ts',
    block: /enum StyleKeys \{([\s\S]*?)\n\}/,
    entry: /^\s*([A-Z][A-Z0-9_]*)\s*=\s*(-?\d+)\s*,?/gm,
  },
  {
    lang: 'rust',
    file: 'crates/mason-core/src/style/mod.rs',
    block: /enum StyleKeys \{([\s\S]*?)\n\}/,
    entry: /^\s*([A-Z][A-Z0-9_]*)\s*=\s*(-?\d+)\s*,?/gm,
  },
  {
    lang: 'kotlin',
    file: 'packages/nativescript-masonkit/src-native/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/Style.kt',
    entry: /^\s*(?:internal\s+)?const val ([A-Z][A-Z0-9_]*)\s*=\s*(-?\d+)/gm,
  },
  {
    lang: 'swift',
    file: 'packages/nativescript-masonkit/src-native/mason-ios/Mason/Mason/MasonStyle.swift',
    entry: /^\s*(?:public\s+)?static let ([A-Z][A-Z0-9_]*)\s*(?::\s*\w+\s*)?=\s*(-?\d+)/gm,
  },
];

const BUFFER_SIZE_SOURCE = 'crates/mason-core/src/style/arena.rs';

function readKeys({ lang, file, block, entry }) {
  const path = resolve(root, file);
  if (!existsSync(path)) throw new Error(`${lang}: missing ${file}`);
  let source = readFileSync(path, 'utf8');
  if (block) {
    const matched = block.exec(source);
    if (!matched) throw new Error(`${lang}: no StyleKeys block in ${file}`);
    source = matched[1];
  }
  const keys = new Map();
  for (const [, name, value] of source.matchAll(entry)) keys.set(name, Number(value));
  if (keys.size === 0) throw new Error(`${lang}: parsed zero StyleKeys out of ${file}`);
  return keys;
}

function bufferSize() {
  const source = readFileSync(resolve(root, BUFFER_SIZE_SOURCE), 'utf8');
  const matched = /STYLE_BUFFER_SIZE: usize = (\d+)/.exec(source);
  if (!matched) throw new Error(`no STYLE_BUFFER_SIZE in ${BUFFER_SIZE_SOURCE}`);
  return Number(matched[1]);
}

const tables = SOURCES.map((source) => ({ lang: source.lang, keys: readKeys(source) }));
const size = bufferSize();

const errors = [];
const warnings = [];

// A name present in more than one language must agree on its offset everywhere.
const everyName = new Set(tables.flatMap((t) => [...t.keys.keys()]));
for (const name of [...everyName].sort()) {
  const present = tables.filter((t) => t.keys.has(name));
  const values = new Set(present.map((t) => t.keys.get(name)));
  if (values.size > 1) {
    errors.push(`${name}: ${present.map((t) => `${t.lang}=${t.keys.get(name)}`).join(' ')}`);
  } else if (present.length !== tables.length) {
    const missing = tables.filter((t) => !t.keys.has(name)).map((t) => t.lang);
    warnings.push(`${name} (=${[...values][0]}) missing from: ${missing.join(', ')}`);
  }
}

// Every offset has to fit, or a write silently lands outside the buffer.
for (const { lang, keys } of tables) {
  for (const [name, offset] of keys) {
    if (offset >= 0 && offset + 4 > size) {
      errors.push(`${lang}: ${name}=${offset} does not fit in STYLE_BUFFER_SIZE=${size}`);
    }
  }
}

for (const { lang, keys } of tables) {
  console.log(`${lang.padEnd(7)} ${keys.size} keys, max offset ${Math.max(...keys.values())}`);
}
console.log(`STYLE_BUFFER_SIZE = ${size}`);

if (warnings.length) {
  console.log(`\n${warnings.length} name(s) not defined in every language (not an error — some fields are platform-specific):`);
  for (const w of warnings) console.log(`  ${w}`);
}

if (errors.length) {
  console.error(`\nStyleKeys drift — ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log('\nStyleKeys agree across all four languages.');
