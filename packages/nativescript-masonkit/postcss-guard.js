/**
 * Keeps app CSS that MasonKit supports through @nativescript/tailwind's PostCSS step.
 *
 * That step removes every declaration NativeScript core can't apply (`display`, `gap`,
 * `grid-*`, values in `vw`/`vh`/`min-content`, ...) and every `:hover` rule, from all of
 * the app's CSS. `before` stores a copy of each declaration in a custom property, which
 * the step leaves alone; `after` puts back the declarations it removed and drops the copies.
 * Declarations it kept, including the ones it rewrote, stay as it left them.
 */
const KEEP = '--mason-keep-';
// The step drops rules using these; they are renamed past it and back.
const PSEUDOS = [
  [':hover', ':-mason-hover'],
  [':focus-within', ':-mason-focus-within'],
];

// Hex has no `r` or `m`, so the step's rem/em rewrite can't touch a stored copy.
const encode = (decl) => Buffer.from(JSON.stringify([decl.prop, decl.value, decl.important])).toString('hex');
const decode = (value) => JSON.parse(Buffer.from(value, 'hex').toString('utf8'));

const before = () => ({
  postcssPlugin: 'masonkit-css-guard-before',
  Once(root) {
    let id = 0;
    root.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) return;
      const key = String(id++);
      decl.raws.masonKeep = key;
      decl.cloneAfter({ prop: KEEP + key, value: encode(decl), important: false });
    });
    root.walkRules((rule) => {
      for (const [pseudo, alias] of PSEUDOS) {
        if (rule.selector.includes(pseudo)) rule.selector = rule.selector.split(pseudo).join(alias);
      }
    });
  },
});
before.postcss = true;

const after = () => ({
  postcssPlugin: 'masonkit-css-guard-after',
  // After every plugin's visitors, which is where the step removes things.
  OnceExit(root) {
    root.walkDecls((decl) => {
      if (!decl.prop.startsWith(KEEP)) return;
      const key = decl.prop.slice(KEEP.length);
      const kept = decl.parent.some((node) => node !== decl && node.type === 'decl' && node.raws.masonKeep === key);
      if (kept) {
        decl.remove();
        return;
      }
      const [prop, value, important] = decode(decl.value);
      decl.replaceWith(decl.clone({ prop, value, important }));
    });
    root.walkRules((rule) => {
      for (const [pseudo, alias] of PSEUDOS) {
        if (rule.selector.includes(alias)) rule.selector = rule.selector.split(alias).join(pseudo);
      }
    });
  },
});
after.postcss = true;

module.exports = { before, after };
