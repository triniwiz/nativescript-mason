/** Standalone NativeScript app entry: build MasonKit JS + native binaries from this checkout first. */
import { Application, GridLayout, knownFolders, Label, Page, Utils } from '@nativescript/core';
import { Scroll, View } from '@triniwiz/nativescript-masonkit';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};
const near = (actual: number, expected: number) => Math.abs(actual - expected) <= 1 / Utils.layout.getDisplayDensity();

// Persist checkpoints so simulator validation does not depend on an inspector connection.
const checkpoints: unknown[] = [];
function report(event: string, details: unknown) {
  checkpoints.push({ event, details });
  knownFolders.documents().getFile('scroll-smoke.json').writeTextSync(JSON.stringify(checkpoints));
  console.log(event, JSON.stringify(details));
}
report('SCROLL_SMOKE_START', {});

const scroll = new Scroll();
scroll.style.width = 320;
scroll.style.height = 240;
scroll.style.overflowX = 'scroll';
scroll.style.overflowY = 'scroll';
const content = new View();
content.style.width = 1280;
content.style.height = 2400;
content.style.minWidth = 1280;
content.style.minHeight = 2400;
scroll.addChild(content);
const page = new Page();
const host = new GridLayout();
host.rows = '240,*';
host.columns = '320,*';
// Mason's existing public Style type differs from core's View.style declaration.
host.addChild(scroll as unknown as import('@nativescript/core').View);
page.content = host;
let events = 0;
scroll.on(Scroll.scrollEvent, (event) => {
  assert(near(event.scrollX, scroll.scrollX) && near(event.scrollY, scroll.scrollY), 'stale event offsets');
  events++;
});
scroll.scrollTo(10, 20);
scroll.scrollTo(100, 900);

function position(x: number, y: number) {
  assert(scroll.isLoaded, 'smoke viewport unloaded before its checks completed');
  assert(near(scroll.scrollX, x) && near(scroll.scrollY, y), `offset ${scroll.scrollX},${scroll.scrollY}, expected ${x},${y}`);
  const native = __IOS__ ? scroll.ios : scroll.android;
  const nativeX = __IOS__ ? native.bounds.origin.x : Utils.layout.toDeviceIndependentPixels(native.getScrollX());
  const nativeY = __IOS__ ? native.bounds.origin.y : Utils.layout.toDeviceIndependentPixels(native.getScrollY());
  assert(near(nativeX, x) && near(nativeY, y), `native offset ${nativeX},${nativeY}, expected ${x},${y}`);
  report('SCROLL_SMOKE_POSITION', { x: scroll.scrollX, y: scroll.scrollY, nativeX, nativeY, events, maxX: scroll.scrollableWidth, maxY: scroll.scrollableHeight });
}

scroll.once('loaded', async () => {
  try {
    report('SCROLL_SMOKE_LOADED', {});
    await wait(500);
    if (__ANDROID__) Utils.android.getCurrentActivity()?.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    position(100, 900);
    assert(scroll.scrollableWidth > 300 && scroll.scrollableHeight > 1800, 'missing scroll ranges');
    scroll.scrollTo(200, 1400, true);
    await wait(450);
    position(200, 1400);
    scroll.scrollTo(300, 1800, true);
    scroll.scrollTo(0, 0);
    await wait(350);
    position(0, 0);
    scroll.scrollTo(300, 1800, true);
    await wait(80);
    scroll.stopScrolling();
    const stopped = [scroll.scrollX, scroll.scrollY];
    await wait(350);
    position(stopped[0], stopped[1]);
    scroll.scrollTo(Number.MAX_VALUE, Number.MAX_VALUE);
    position(scroll.scrollableWidth, scroll.scrollableHeight);
    scroll.scrollTo(-100, -200);
    position(0, 0);
    assert(events > 3, 'missing native movement events');
    const native = __IOS__ ? scroll.ios : scroll.android;
    scroll.scrollTo(300, 1800, true);
    page.content = new Label();
    const detachedEvents = events;
    await wait(350);
    assert(!scroll.isLoaded, 'scroll did not unload');
    if (__IOS__) {
      assert(native.scrollChangeListener == null, 'listener retained after unload');
      native.scrollToOffsetAnimated(CGPointMake(50, 60), false);
    } else {
      assert(native.getScrollListener() == null, 'listener retained after unload');
      native.scrollToOffset(50, 60, false);
    }
    await wait(50);
    assert(events === detachedEvents, 'events delivered after unload');
    report('SCROLL_SMOKE_PASS', { density: Utils.layout.getDisplayDensity(), events, stopped });
  } catch (error) {
    report('SCROLL_SMOKE_FAIL', { error: String(error), stack: error?.stack });
  }
});
Application.run({ create: () => page });
