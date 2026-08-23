// Generates numeric layout-assertion fixtures for the demo-solid "WebSpec" test
// runner from the vendored taffy/WPT-derived HTML fixtures in
// tools/scripts/gentests/taffy_tests. Ground truth (expected layout rects) is
// computed by actually rendering each fixture in headless Chromium — the same
// approach taffy's own scripts/gentest uses to port these fixtures into Rust
// tests (see crates/mason-core/tests/wpt_ported_*.rs).
//
// Usage: npm run gen:webspec
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '../gentests/taffy_tests');
const OUT_DIR = path.join(__dirname, '../../../apps/demo-solid/src/webspec');
const OUT_FILE = path.join(OUT_DIR, 'fixtures.generated.json');
const SKIPPED_FILE = path.join(__dirname, 'skipped.json');

const ALLOWED_TAGS = new Set(['html', 'head', 'body', 'title', 'link', 'script', 'div']);

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

// Depth-first pre-order over <div> children only, starting at #test-root.
// seq 0 is always test-root itself. Must exactly mirror the in-browser walk
// in collectExpectedRects() below so seq numbers line up.
function buildStyleTree($, root) {
  let seq = 0;
  function walk(el) {
    const node = { seq: seq++, style: parseInlineStyle($(el).attr('style')), children: [] };
    for (const child of $(el).children('div').toArray()) {
      node.children.push(walk(child));
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
  const text = $(body).clone().children().remove().end().text().trim();
  // Any non-whitespace text directly on #test-root or nested divs (Ahem-font
  // content sizing tests) isn't supported yet — native text metrics won't
  // match browser text metrics without bundling the Ahem font.
  $(body)
    .find('div, body')
    .each((_, el) => {
      const ownText = $(el)
        .contents()
        .filter((_, n) => n.type === 'text')
        .text()
        .trim();
      if (ownText) issues.push('contains text content (Ahem-font sizing not supported yet)');
    });
  return [...new Set(issues)];
}

async function collectExpectedRects(page) {
  return page.evaluate(() => {
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
        if (child.tagName === 'DIV') walk(child, false);
      }
    }
    walk(root, true);
    return out;
  });
}

async function main() {
  const files = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.html'));
  files.sort();

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });

  const fixtures = [];
  const skipped = [];

  for (const file of files) {
    const name = file.replace(/\.html$/, '');
    const fullPath = path.join(FIXTURES_DIR, file);
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

  fs.writeFileSync(OUT_FILE, JSON.stringify(fixtures, null, 0));
  fs.writeFileSync(SKIPPED_FILE, JSON.stringify(skipped, null, 2));

  console.log(`\n\ngenerated ${fixtures.length} fixtures -> ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`skipped ${skipped.length} fixtures -> ${path.relative(process.cwd(), SKIPPED_FILE)}`);
}

main();
