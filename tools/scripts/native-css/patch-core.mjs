import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const core = 'node_modules/@nativescript/core';
const { version } = JSON.parse(readFileSync(new URL(`../../../${core}/package.json`, import.meta.url)));
const patch = 'patches/@nativescript__core@9.1.4.patch';

if (version !== '9.1.4') throw new Error(`Expected @nativescript/core 9.1.4, found ${version}`);

const apply = (...args) => spawnSync('git', ['apply', `--directory=${core}`, ...args, patch], { cwd: root, encoding: 'utf8' });
if (apply('--reverse', '--check').status !== 0) {
  const result = apply();
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
}
