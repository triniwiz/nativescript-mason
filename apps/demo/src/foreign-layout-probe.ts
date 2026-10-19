/**
 * Renderer-independent native regression probe. To run, use this file as the
 * demo's NativeScript entry instead of src/app.ts (restore the entry afterwards).
 * It prints JSON frames and throws on failure; no screenshots are required.
 *
 * Keep the 100 DIP top padding: this probe does not qualify safe-area clipping,
 * OS input, hit testing, or SVG intrinsic-size arithmetic.
 */
import { Application, ContentView, Label, Page, Utils, View as NativeView, unsetValue } from '@nativescript/core';
import { View as MasonView } from '@triniwiz/nativescript-masonkit';
import { Style as MasonStyle } from '@triniwiz/nativescript-masonkit/style';

const near = (actual: number, expected: number) => Math.abs(actual - expected) < 0.6;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function assert(name: string, passed: boolean, detail?: unknown) {
  console.info('FOREIGN_LAYOUT', JSON.stringify({ assertion: name, passed, detail }));
  if (!passed) throw new Error(`Foreign layout: ${name}`);
}

function frame(view: NativeView) {
  const native = view.nativeViewProtected;
  if (__APPLE__) {
    const value = native.frame;
    return { x: value.origin.x, y: value.origin.y, width: value.size.width, height: value.size.height };
  }
  const dip = Utils.layout.toDeviceIndependentPixels;
  return { x: dip(native.getLeft()), y: dip(native.getTop()), width: dip(native.getWidth()), height: dip(native.getHeight()) };
}

async function waitFor(name: string, predicate: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return;
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${name}`);
}

async function expectSize(name: string, view: NativeView, width: number, height: number) {
  await waitFor(name, () => !!view.nativeViewProtected && near(frame(view).width, width) && near(frame(view).height, height));
  assert(name, near(frame(view).width, width) && near(frame(view).height, height), frame(view));
}

function createProbe() {
  const page = new Page();
  page.actionBarHidden = true;
  page.addCss(`
    .foreign-cell { display: flex; align-items: center; justify-content: center; }
    .foreign-tall { width: 31; height: 36; }
    .foreign-medium { width: 43; height: 43; }
    .foreign-square { width: 54; height: 54; }
  `);
  const root = new MasonView();
  Object.assign(root.style, { display: 'flex', flexDirection: 'column', paddingTop: 100 });
  const grid = new MasonView();
  Object.assign(grid.style, { display: 'grid', width: 330, height: 82, gridTemplateColumns: '1fr 1fr 1fr' });
  root.addChild(grid);
  const cell = new MasonView();
  cell.className = 'foreign-cell';
  grid.addChild(cell);

  // An ordinary, non-Mason native host with a non-square CSS size exercises
  // the same foreign-leaf layout boundary as an SVG without an SVG dependency.
  const leaf = new ContentView();
  leaf.className = 'foreign-tall';
  const initialWidthListeners = leaf.style.hasListeners('widthChange');
  cell.addChild(leaf);
  const labelCell = new MasonView();
  labelCell.className = 'foreign-cell';
  const label = new Label();
  label.text = 'Native label';
  label.className = 'foreign-medium';
  labelCell.addChild(label);
  grid.addChild(labelCell);
  const squareCell = new MasonView();
  squareCell.className = 'foreign-cell';
  const square = new ContentView();
  square.className = 'foreign-square';
  squareCell.addChild(square);
  grid.addChild(squareCell);
  // Mason's public declaration narrows Style, although the runtime view extends
  // NativeScript's CustomLayoutView and can be Page content.
  page.content = root as unknown as NativeView;

  page.once('loaded', () => {
    run().catch((error) => {
      console.error('FOREIGN_LAYOUT_FAIL', error.stack || String(error));
      throw error;
    });
  });

  async function run() {
    console.info('FOREIGN_LAYOUT_PLATFORM', __APPLE__ ? 'iOS' : 'Android');
    await expectSize('class-sized non-square foreign host', leaf, 31, 36);
    await expectSize('class-sized ordinary native label', label, 43, 43);
    await expectSize('class-sized square foreign host', square, 54, 54);
    const relative = leaf.getLocationRelativeTo(cell as unknown as NativeView);
    assert('class horizontal centering', near(relative.x, (110 - 31) / 2), relative);
    assert('class vertical centering', near(relative.y, (82 - 36) / 2), relative);

    leaf.className = 'foreign-medium';
    await expectSize('class replacement', leaf, 43, 43);
    leaf.style.width = 30;
    leaf.className = 'foreign-square';
    await expectSize('inline precedence over changed class', leaf, 30, 54);
    leaf.style.width = unsetValue;
    await expectSize('inline removal reveals changed class', leaf, 54, 54);

    const oldNative = leaf.nativeViewProtected;
    cell.removeChild(leaf);
    assert('detached child releases width listener', leaf.style.hasListeners('widthChange') === initialWidthListeners);
    leaf.style.width = 72;
    await delay(100);
    leaf.style.width = unsetValue;
    leaf.className = 'foreign-medium';
    cell.addChild(leaf);
    await expectSize('reattachment replays resolved class', leaf, 43, 43);
    assert('reattachment creates a fresh native view', oldNative !== leaf.nativeViewProtected);
    leaf.style.width = 28;
    await expectSize('reattached child forwards changes', leaf, 28, 43);
    leaf.style.width = unsetValue;
    await expectSize('reattached inline removal', leaf, 43, 43);

    // Removing all class dimensions must release explicit native leaf sizing.
    leaf.className = '';
    await waitFor('class removal', () => MasonStyle.fromView(leaf as never, leaf.nativeViewProtected).width === 'auto');
    assert('class removal restores auto', MasonStyle.fromView(leaf as never, leaf.nativeViewProtected).width === 'auto');
    console.info('FOREIGN_LAYOUT_PASS');
  }
  return page;
}

Application.run({ create: createProbe });
