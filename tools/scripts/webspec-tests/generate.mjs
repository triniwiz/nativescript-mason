// Generates numeric layout-assertion fixtures for the demo-solid "WebSpec" test
// runner from the vendored taffy/WPT-derived HTML fixtures in
// tools/scripts/gentests/taffy_tests. Ground truth (expected layout rects) is
// computed by actually rendering each fixture in headless Chromium — the same
// approach taffy's own scripts/gentest uses to port these fixtures into Rust
// tests (see crates/mason-core/tests/wpt_ported_*.rs).
//
// Usage: npm run gen:webspec           regenerate the committed baseline
//        npm run gen:webspec -- --check  fail if the baseline is out of date
//
// `--check` is what the nightly workflow runs: Chromium's layout behaviour can
// change under us, and we want that to surface as a failing job rather than as a
// silently rewritten set of expected values.
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Vendored taffy/WPT flex+grid fixtures — `<div>`-only, box model driven
// entirely by inline `style`.
const FIXTURES_DIR = path.join(__dirname, '../gentests/taffy_tests');
// Hand-authored fixtures exercising MasonKit's own tag-specific UA defaults
// (heading/paragraph/blockquote/pre margins) — real elements, not `<div>`,
// so the ground truth also covers "does the *tag* apply the right default",
// not just generic flex/grid box geometry.
const CUSTOM_ELEMENT_FIXTURES_DIR = path.join(__dirname, '../gentests/custom_element_tests');
const OUT_DIR = path.join(__dirname, '../../../apps/demo-solid/src/webspec');
const OUT_FILE = path.join(OUT_DIR, 'fixtures.generated.json');
const SKIPPED_FILE = path.join(__dirname, 'skipped.json');

const CHECK_ONLY = process.argv.includes('--check');

const ALLOWED_TAGS = new Set(['html', 'head', 'body', 'title', 'link', 'script', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'pre']);

// Tags whose box model is walked and compared as tree nodes (i.e. can appear
// as #test-root or one of its descendants). A subset of ALLOWED_TAGS, which
// also covers document-shell tags (html/head/body/...) that never nest.
const WALKABLE_TAGS = new Set(['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'pre']);

// The fixtures reference "../scripts/gentest/test_base_style.css" (taffy repo
// layout), which doesn't exist relative to our vendored copy — so the crucial
// `div { display: flex; }` / box-sizing / margin reset rules were silently
// 404ing. Inline a local copy instead of relying on that path.
const BASE_CSS = fs.readFileSync(path.join(__dirname, 'base.css'), 'utf8');

function inlineBaseStyles(html) {
  return html
    .replace(/<script src="[^"]*test_helper\.js"><\/script>/, '')
    .replace(/<link rel="stylesheet"[^>]*test_base_style\.css"[^>]*>/, `<style>${BASE_CSS}</style>`);
}

function parseInlineStyle(styleAttr) {
  const style = {};
  for (const chunk of (styleAttr || '').split(';')) {
    const idx = chunk.indexOf(':');
    if (idx === -1) continue;
    const prop = chunk.slice(0, idx).trim();
    const value = chunk.slice(idx + 1).trim();
    if (prop && value) style[prop] = value;
  }
  return style;
}

// Depth-first pre-order over WALKABLE_TAGS children only, starting at
// #test-root. seq 0 is always test-root itself. Must exactly mirror the
// in-browser walk in collectExpectedRects() below so seq numbers line up.
function buildStyleTree($, root) {
  let seq = 0;
  function walk(el) {
    const node = { seq: seq++, tag: el.tagName.toLowerCase(), style: parseInlineStyle($(el).attr('style')), children: [] };
    // The element's own text, not its descendants'. These fixtures size boxes
    // with runs of Ahem "X" glyphs, so the text is load-bearing: without it the
    // device renders an empty box and min-content/max-content mean nothing.
    //
    // Apply HTML's whitespace rules first. Pretty-printed markup puts a newline
    // and indentation between every pair of child elements; the browser collapses
    // that to nothing, so recording it verbatim would hand the device a text node
    // the ground truth never had — which is exactly what it did, and it squeezed
    // every flex container in the suite.
    const ownText = $(el)
      .contents()
      .filter((_, n) => n.type === 'text')
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    if (ownText.length) node.text = ownText;
    for (const child of $(el).children().toArray()) {
      if (WALKABLE_TAGS.has(child.tagName?.toLowerCase())) {
        node.children.push(walk(child));
      }
    }
    return node;
  }
  return walk(root);
}

function findIssues($, body) {
  const issues = [];
  const tags = new Set();
  $(body)
    .find('*')
    .each((_, el) => tags.add(el.tagName?.toLowerCase()));
  for (const tag of tags) {
    if (tag && !ALLOWED_TAGS.has(tag)) issues.push(`unsupported tag <${tag}>`);
  }
  // Text content used to be an automatic skip: these fixtures size boxes with
  // runs of Ahem "X" glyphs, and without that font bundled the device's text
  // metrics could never match the browser's. Ahem now ships with demo-solid
  // (src/fonts/Ahem.ttf) and `font-family` is finally settable from CSS, so the
  // text is rendered and compared like anything else.
  return [...new Set(issues)];
}

async function collectExpectedRects(page) {
  return page.evaluate((walkableTags) => {
    const walkable = new Set(walkableTags);
    const root = document.getElementById('test-root');
    if (!root) return null;
    const rootRect = root.getBoundingClientRect();
    const out = [];
    let seq = 0;
    function walk(el, isRoot) {
      const mySeq = seq++;
      const rect = el.getBoundingClientRect();
      out.push({
        seq: mySeq,
        x: isRoot ? 0 : rect.left - rootRect.left,
        y: isRoot ? 0 : rect.top - rootRect.top,
        width: rect.width,
        height: rect.height,
      });
      for (const child of el.children) {
        if (walkable.has(child.tagName.toLowerCase())) walk(child, false);
      }
    }
    walk(root, true);
    return out;
  }, [...WALKABLE_TAGS]);
}

async function main() {
  const files = [
    ...fs
      .readdirSync(FIXTURES_DIR)
      .filter((f) => f.endsWith('.html'))
      .map((file) => ({ file, dir: FIXTURES_DIR })),
    ...fs
      .readdirSync(CUSTOM_ELEMENT_FIXTURES_DIR)
      .filter((f) => f.endsWith('.html'))
      .map((file) => ({ file, dir: CUSTOM_ELEMENT_FIXTURES_DIR })),
  ];
  files.sort((a, b) => a.file.localeCompare(b.file));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });

  const fixtures = [];
  const skipped = [];

  for (const { file, dir } of files) {
    const name = file.replace(/\.html$/, '');
    const fullPath = path.join(dir, file);
    const html = fs.readFileSync(fullPath, 'utf8');
    const $ = cheerio.load(html);
    const root = $('#test-root').get(0);

    if (!root) {
      skipped.push({ name, reason: 'no #test-root element' });
      continue;
    }

    const issues = findIssues($, $('body').get(0));
    if (issues.length) {
      skipped.push({ name, reason: issues.join('; ') });
      continue;
    }

    try {
      await page.setContent(inlineBaseStyles(html), { baseURL: `file://${fullPath}` });
      const expected = await collectExpectedRects(page);
      if (!expected) {
        skipped.push({ name, reason: 'no #test-root element (in-browser)' });
        continue;
      }
      const tree = buildStyleTree($, root);
      fixtures.push({ name, tree, expected });
      process.stdout.write(`.`);
    } catch (err) {
      skipped.push({ name, reason: `render_error: ${err.message}` });
      process.stdout.write(`x`);
    }
  }

  await browser.close();

  const nextFixtures = JSON.stringify(fixtures, null, 0);
  const nextSkipped = JSON.stringify(skipped, null, 2);

  if (CHECK_ONLY) {
    const read = (file) => {
      try {
        return fs.readFileSync(file, 'utf8');
      } catch {
        return '';
      }
    };
    const stale = [];
    if (read(OUT_FILE) !== nextFixtures) stale.push(path.relative(process.cwd(), OUT_FILE));
    if (read(SKIPPED_FILE) !== nextSkipped) stale.push(path.relative(process.cwd(), SKIPPED_FILE));

    console.log(`\n\nchecked ${fixtures.length} fixtures, ${skipped.length} skipped`);
    if (stale.length) {
      console.error(`\nground truth is out of date:\n${stale.map((f) => `  ${f}`).join('\n')}\n\nRegenerate with: npm run gen:webspec`);
      process.exitCode = 1;
    } else {
      console.log('ground truth matches the committed baseline');
    }
    return;
  }

  fs.writeFileSync(OUT_FILE, nextFixtures);
  fs.writeFileSync(SKIPPED_FILE, nextSkipped);

  console.log(`\n\ngenerated ${fixtures.length} fixtures -> ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`skipped ${skipped.length} fixtures -> ${path.relative(process.cwd(), SKIPPED_FILE)}`);
}

main();
