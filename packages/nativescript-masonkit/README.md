# @triniwiz/nativescript-masonkit

```javascript
ns plugin add @triniwiz/nativescript-masonkit
```

## Usage

## Scrolling

Use `Scroll` for native overflow scrolling. Subscribe before seeking so a virtualizer
can update its window on every native offset change:

```ts
import { Scroll, View } from '@triniwiz/nativescript-masonkit';

const viewport = new Scroll();
viewport.style.width = 320;
viewport.style.height = 240;
viewport.style.overflowX = 'auto';
const content = new View();
content.style.width = 1280;
content.style.height = 4096;
content.style.minWidth = 1280;
content.style.minHeight = 4096;
viewport.addChild(content);
viewport.on(Scroll.scrollEvent, ({ scrollX, scrollY }) => {
  console.log('viewport offset', scrollX, scrollY);
});
viewport.scrollTo(100, 2048); // queued until loaded and laid out
```

`scrollX` and `scrollY` are the current offsets. `scrollableWidth` and
`scrollableHeight` are the maximum seek offsets, not total content sizes. All four
properties, seek arguments, and event offsets use DIPs (UIKit points on iOS),
independent of display density. Android converts to native pixels and rounds seek
destinations; comparisons should allow one native pixel of tolerance. Before native
layout, offsets and extents are zero. iOS native bounce can temporarily report an
offset outside the seek range.

`scrollTo(x, y, animated = false)` clamps each finite coordinate to its current
range. A disabled/non-overflowing axis stays at zero. Nonfinite coordinates throw
`RangeError`. Before load or the first usable layout, only the latest seek is
retained and clamped using that layout's extents. To seek content added later, call
again after its layout; an earlier out-of-range destination is not retained.

Each seek replaces pending seeks and animations and stops native momentum.
`stopScrolling()` cancels pending work and animation/momentum at the current
offset. Native touch can interrupt an animation. Unloading or disposing stops
scrolling and removes the public native listener; loading again reattaches it.
A cancelled seek is not replayed. A native detach also stops native animation.

The `scroll` event carries `{ object, scrollX, scrollY }` (`ScrollEventData`). It
comes from native offset changes, including pan, momentum, immediate seeks and
animation steps. Handlers read the current native offsets; no consumer polling is
needed. No event is promised for a no-op seek, and there is no completion event.
Normal `on`/`off` subscription rules apply. Nested scrolling, overflow, sticky
positioning and native background updates keep their existing handlers.

Windows exposes the same JS/type API through WinUI `ScrollViewer`. Its existing
horizontal-scrolling restriction remains: `scrollX` and `scrollableWidth` are zero,
and X seeks clamp to zero. Plain HTML blocks that omit the Windows `ScrollViewer`
report zero and do not scroll. The Windows implementation requires the matching
native library; source/type checks do not establish Windows runtime validation.

For an unreleased checkout, build both the JS package and the native AAR/XCFramework
from the same commit, then install the resulting local package/tarball in a separate
consumer validation checkout. A JS-only overlay on a published native binary cannot
provide these new native bridges. Rebuild the host so NativeScript regenerates native
metadata. This does not update any published package version.

The [standalone smoke entry](../../tools/testing/scroll-smoke.ts) checks both axes
against native offsets and writes `scroll-smoke.json` in the app's documents
folder. Run it in a foreground NativeScript app with matching rebuilt native
libraries (and the standard scene manifest on iOS 27). Native regression suites
are `MasonTests/ScrollContractTests` and `ScrollContractInstrumentedTest`;
`npm test` covers the JS contract. See the [recorded correctness evidence](../../tools/testing/scroll-contract.evidence.json)
for targets and limits; these checks do not measure release performance.

## Framework integrations

The main package works with any NativeScript flavour. For Angular, Vue 3 and
Svelte Native, dedicated entry points register every MasonKit element for you — including the
HTML-shaped elements from `/web` — and wire up child-order bookkeeping:

- **Angular** — `@triniwiz/nativescript-masonkit/angular`:
  call `installMasonKit()` in `main.ts` before bootstrap. See
  [angular/README.md](angular/README.md).
- **Vue 3** — `@triniwiz/nativescript-masonkit/vue`:
  call `installMasonKit()` in the app entry before `createApp(App).start()`.
  See [vue/README.md](vue/README.md).
- **Svelte Native** — `@triniwiz/nativescript-masonkit/svelte`:
  call `installMasonKit()` in the app entry before `svelteNative(App)`.
  See [svelte/README.md](svelte/README.md).

All three entry points ship in this package, so no extra dependency is required.

## Rust

For building the iOS and Android packages the following targets are required

### Android

`rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android`

To run the project in Android Studio you will need to install the NDK.

To build the aar to be used by NativeScript you can run `./gradlew masonkit:assembleRelease` then copy the aar build located in `packages/nativescript-masonkit/src-native/mason-android/masonkit/build/outputs/aar` to the `packages/nativescript-masonkit/platforms/android` directory

### iOS

`rustup target add aarch64-apple-ios x86_64-apple-ios`

To build the rust source to be used by xcode you can run `yarn nx run nativescript-masonkit:build.native.ios.release`.

To build the xcframework to be used by NativeScript you can run `yarn nx run nativescript-masonkit:build.native.ios.framework.release`

## License

Apache License Version 2.0
