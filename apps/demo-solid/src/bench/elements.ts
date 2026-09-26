import { scope } from 'dominative';

// index.ts hands the lowercase `label`, `button` and `span` tags to MasonKit, but dominative keeps
// core's classes under their PascalCase keys. Alias them the way demo-vue's installMasonKit does,
// so the core pages can use `<nlabel>`, `<nbutton>` and `<nspan>`.
const CORE_ALIASES: Array<[string, string]> = [
  ['nlabel', 'Label'],
  ['nbutton', 'Button'],
  ['nspan', 'Span'],
];

for (const [alias, name] of CORE_ALIASES) {
  if (!scope[alias] && scope[name]) scope[alias] = scope[name];
}
