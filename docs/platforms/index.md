# Platform support

MasonKit runs on iOS, Android and Windows. The Rust layout engine (`mason-core`, built on [taffy](https://github.com/DioxusLabs/taffy)) is shared by all three; each platform has its own native view layer that draws, measures text and handles input.

## Requirements

| Platform | NativeScript runtime | OS minimum | Native library shipped in the package |
| --- | --- | --- | --- |
| iOS | `@nativescript/ios` 8.0+ | iOS 15.6 | `platforms/ios/Mason.xcframework` (iOS device, iOS simulator, visionOS device and simulator slices) |
| Android | `@nativescript/android` 8.0+ | API 21 | `platforms/android/masonkit-release.aar` (arm, arm64, x86, x86_64) |
| Windows | `@nativescript/windows` 9.1+ | Windows 10/11 with the Windows App SDK (WinUI 3) | `platforms/windows/{x64,arm64}/NativeScript.Mason.{dll,winmd}` |

The runtime minimums come from the `nativescript.platforms` field of the package's `package.json`. The OS minimums come from the native projects: `MinimumOSVersion` in the xcframework and `minSdk` in the AAR's Gradle build.

The Android library also depends on Glide (images), Gson and `org.nativescript:fontmanager`; these are declared in `platforms/android/include.gradle` and resolved by Gradle when you build your app.

## Feature differences

Almost everything in these docs behaves the same on every platform. The differences below are the ones confirmed in the native code.

| Feature | iOS | Android | Windows |
| --- | --- | --- | --- |
| Flexbox, grid, block, inline flow, float | Yes | Yes | Yes |
| `position: fixed` / `sticky` | Yes | Yes | Yes |
| `writing-mode: vertical-rl` / `vertical-lr` | Yes | Yes | Yes |
| `mask-*`, `clip-path`, `mask-border-*`, `border-image` | Yes | Yes | Yes (see notes) |
| SVG `url()` backgrounds | Built-in static SVG reader | Built-in static SVG reader | Direct2D SVG renderer |
| `backdrop-filter` | Yes (snapshot of the content behind) | Yes (`RenderEffect` on API 31+, software snapshot below) | Yes |
| `box-shadow` backend switch (`setBoxShadowRenderMode`) | No-op | Yes | No-op (always Composition) |
| `<details>` / `<summary>` | Native | Native | Native |
| `<input>` types | All types in `InputType` are mapped | All types mapped | All types mapped |

Notes:

- **`backdrop-filter` on iOS** renders a snapshot of what is behind the element through Core Image, refreshed while the screen changes and idle otherwise. The snapshot also includes content painted above the element, skips Metal-backed layers, and does not refresh for animations that run only on the render server.
- **`backdrop-filter` on Android** below API 31 (Android 12) draws from a downscaled software snapshot, with the same filter functions.
- **Mask hit testing.** As in browsers, `clip-path` limits where an element can be tapped and masks do not.
- **`url(#id)` masks and clip paths.** There is no in-document SVG to reference, so they are `none` on every platform.
- **SVG backgrounds.** Shapes, paths, groups, transforms, fills, strokes, opacity, linear and radial gradients, `<use>`, `<symbol>`, `<clipPath>`, `<style>` sheets with simple selectors and raster data-URL `<image>` work on every platform. `<text>`, patterns, masks, filters and markers inside the SVG are not supported anywhere.
- **`background-clip: text`** is not applied on any platform yet; the background is painted as with `border-box`.
- **Text around floats on Android.** Lines wrap around floats when the text is drawn, but the paragraph is measured without them, so its height can come out shorter than on iOS or the web.
- **Vertical writing modes.** Upright CJK (`text-orientation: upright`) and vertical containers whose children flow vertically are not supported yet on any platform.

## Platform-specific APIs

The box-shadow backend can be switched on Android (iOS and Windows export both functions as no-ops):

```ts
import { setBoxShadowRenderMode, setBoxShadowSoftwareRasterScale } from '@triniwiz/nativescript-masonkit';

if (__ANDROID__) {
  // 'auto' | 'render-node' | 'software'
  setBoxShadowRenderMode('auto');
  setBoxShadowSoftwareRasterScale(null);
}
```

## More

- [Windows](/platforms/windows): how the Windows component is packaged and what differs there.
- [Using Mason natively](/platforms/native): driving the Kotlin and Swift libraries without NativeScript.
