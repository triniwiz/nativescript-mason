# Mason — Contributor Context

A working guide for anyone picking up this codebase. It covers architecture, build flow, known gotchas, and bugs that have already been fixed (so you don't re-investigate them).

---

## What Mason Is

Mason is a CSS-layout engine for NativeScript. It wraps a Rust core (`crates/mason-core`, built on [taffy](https://github.com/DioxusLabs/taffy)) with native bindings for Android (Kotlin, via JNI) and iOS (Swift, via a static lib). The NativeScript plugin layer (`packages/nativescript-masonkit`) exposes a set of view primitives — `View`, `Scroll`, `Text`, `Img`, `Button` — that host Mason nodes and delegate layout to the Rust engine.

The demo app at `apps/demo-solid` uses a SolidJS renderer (`@nativescript-community/solid-js`) and is the primary integration test surface.

---

## Repository Layout

```
crates/
  mason-core/         Rust layout engine (taffy-based)
  mason-android/      Rust JNI bindings for Android
  mason-ios/          Rust FFI bindings for iOS

packages/nativescript-masonkit/
  src/                TypeScript plugin (common + platform)
  style.ts            CSS property → mason-core style buffer
  scroll/             Scroll view (iOS/Android split)
  platforms/
    android/          masonkit-release.aar (pre-built)
    ios/              Mason.xcframework (pre-built)

  src-native/
    mason-android/    Kotlin source → produces the AAR
    mason-ios/        Swift source → produces the xcframework

apps/demo-solid/      SolidJS demo / integration harness
```

---

## Build Flow

### Android AAR

```bash
cd packages/nativescript-masonkit/src-native/mason-android
./gradlew :masonkit:assembleRelease -Prust.targets=all
# Copy output:
cp masonkit/build/outputs/aar/masonkit-release.aar \
   ../../platforms/android/
```

- Gradle's cargo plugin builds the Rust crate (`mason-android`) automatically.
- Omit `-Prust.targets=all` (host arch only) for faster iteration during development.
- **Two environment traps**, both of which surface as a one-line `BUILD FAILED`
  that says nothing about the cause:
  - `rustc`/`cargo` must be on the **Gradle daemon's** `PATH`, not just the
    calling shell's. Failure reads `A problem occurred starting process 'command
    'rustc''`. Use `--no-daemon` after changing the environment.
  - A Rust build script invokes **`python`**, not `python3`. On a machine with
    only `python3`, `~/.cargo/bin/python` may symlink to `/usr/bin/python3`,
    which is an Xcode shim that fails when invoked under the name `python`
    (`python: error: Failed to locate 'python'`). Put a real `python` shim
    (`#!/bin/sh` + `exec /usr/bin/python3 "$@"`) ahead of it on `PATH`.
- **`assembleRelease` can leave a stale AAR in place on failure.** Check the
  artifact's timestamp before copying it to `platforms/android/` — a failed build
  copied blind ships the previous binary and looks like a mystery regression.

### iOS xcframework

```bash
# Build Rust static libs (reuses cached output):
cargo build --release -p mason-ios \
  --target aarch64-apple-ios \
  --target aarch64-apple-ios-sim \
  --target x86_64-apple-ios

# Package the framework:
cd packages/nativescript-masonkit/src-native/mason-ios
./build.sh   # produces dist/Mason.xcframework

# Copy output:
cp -R dist/Mason.xcframework ../../platforms/ios/
```

- `tools/scripts/masonkit-build-ios-native.sh` is **stale** (references a non-existent path). Use `build.sh` directly.
- visionOS builds are supported (`INCLUDE_VISIONOS=1 ./build.sh`) but require adding `SUPPORTED_PLATFORMS = "... xros xrsimulator"` to `Mason.xcodeproj` before they'll link.

### Running the demo

```bash
cd apps/demo-solid
ANDROID_HOME=$HOME/Library/Android/sdk ns run android
# or
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 ns run ios
```

- `ANDROID_HOME` is **not** in the shell profile — you must export it.
- `ns run ios` requires `LANG`/`LC_ALL` set or CocoaPods doctor check fails (exit 127).
- The plugin is **symlinked** into `node_modules`, so TypeScript changes hot-apply via livesync.
- AAR or xcframework changes require **stopping and restarting** `ns run` — livesync does not reload native code.

### Verifying on device/simulator

**Android:**
```bash
# Screenshot
$ANDROID_HOME/platform-tools/adb exec-out screencap -p > screen.png
# Tap
adb shell input tap X Y   # screen is 1080×2400
# Logs
adb logcat -s MASON_TXTDBG
adb logcat -G 16M -c     # enlarge + clear ring buffer before a single action
```

**iOS:**
```bash
xcrun simctl io booted screenshot screen.png
# Tapping the simulator from a script is hard (no idb/cliclick).
# Workaround: set initialRouteName in app.tsx and let livesync open that page.
```

- The `Read` tool rejects device screenshots once many images are in-session — resize with `sips -Z 760` first.
- After force-stop + relaunch, Android may crash with "No view found for id … for fragment Page" — `adb shell am force-stop <pkg>` then `am start` avoids it (not a Mason bug).

### Test suites

See **Testing** below. `cargo test -p mason-core --all-targets` is green (65
binaries) — the old note here about `wpt_css_align_batch1.rs` not compiling and
`display_contents_text_only_smoke` failing is stale, both were fixed.

---

## Architecture Invariants

### 1. Dirty propagation must reach the root

In `crates/mason-core/src/tree.rs`, every structural or style mutation must mark dirty **all the way up the ancestor chain** via `Tree::mark_dirty_inner(tree, parent)`, **not** just the immediate parent via `node.mark_dirty()`.

`compute_layout` from the root returns a node's **cached** layout when it isn't dirty and never recurses into it. If only the immediate parent is dirtied, the root cache stays valid and the subtree is never re-laid-out.

**Symptom when wrong:** add items → remove → re-add leaves re-added flex children at `x=0 y=0 w=0 h=0` (ghost squares at the container's top-left).

**All of these** must call `mark_dirty_inner`: `detach_inner`, `add_child_at_index`, `insert_before`, `insert_after`, `remove_all`, `with_style_mut`.

### 2. Inline segment packed array stride is 4

`TextEngine.kt collectAndCacheSegments` ↔ Rust `NodeNativeSetSegmentsPacked` (`crates/mason-android/src/node.rs`).

The float array stride is **4 per segment** on both sides:
- Text segment: `width / ascent / descent / flags`
- InlineChild: baseline at `i*4`

iOS uses typed `CMasonSegment` structs — no stride issue there.

### 3. `_nativeIndexFor` for child indexing

NativeScript views attach to the mason node tree **lazily** (on `loaded`). But placeholders (`<br>`) and text nodes attach immediately. So `_children` JS indices run ahead of native children.

`common.ts _nativeIndexFor()` maps a JS index to the native index by counting only natively-attached preceding siblings. Any new native-attach call site must go through it.

### 4. Non-text child insert/remove must invalidate the parent text engine

Inserting or removing a non-text child (e.g. `<br>`) under a `TextContainer` must call `engine.invalidateInlineSegments()` on the **parent** — `invalidateDescendantTextViews(child, …)` only touches the child subtree.

This is handled in `Node.kt` and `MasonNode.swift` `addChildAt/appendChild/removeChildAt/replaceChildAt`. New call sites must do the same.

### 5. `removeView` must unlink the mason node — not just the Android/iOS view

**Android:** `View.addView`/`removeView` (and `Scroll`) mutate the **mason node tree**, not the Android view tree directly. `addView` → `node.appendChild/addChildAt` → `NodeUtils.addView` → `super.addView` under `node.suppressChildOps`. Removal must mirror this: `removeView` → `node.removeChild(childNode)` (detaches the Android view + Rust node + invalidates layout).

**iOS:** `MasonUIView` and `Scroll` expose `removeView(_:)`/`removeView(at:)` which call `node.removeChild` (detaches subview + `mason_node_remove_child` + invalidates). `_removeViewFromNativeVisualTree` in `view/index.ios.ts` and `scroll/index.ios.ts` must call `nativeView.removeView(child.nativeViewProtected)` — **not** just `removeFromSuperview`.

Bug pattern: a bare `super.removeView`/`removeFromSuperview` orphans the mason node → stale layout slots, ghost backgrounds, corruption after add-then-remove.

### 6. iOS `MasonNode.parent` setter does NOT detach the Rust node

Explicit `mason_node_remove_child` calls are required on all removal paths. The setter alone is not enough.

### 7. Overflow and border-radius clipping are independent

**Border-radius alone must not clip child content.** Only the element's own background/border are rounded. Children clip only when `overflow != visible`.

- iOS: `MasonElement.swift` — no `else if hasRadii` mask branch on overflow-visible views.
- Android: `ViewUtils.kt render()` — the `if (hasRadii) canvas.clipPath(innerPath)` content clip is guarded by an `overflowClipsContent` per-axis test.

### 8. iOS CSS transform + frame assignment

CSS `transform` is applied as `view.transform` in `MasonUIView.layoutSubviews`. Assigning `view.frame` on a view that already carries a non-identity transform is undefined in UIKit — it collapses/skews the view.

When a view has a non-identity transform: position via `view.bounds` (size only) + `view.center` (= `newFrame.midX/midY`). Only use the `view.frame = newFrame` fast path when `view.transform.isIdentity && CATransform3DIsIdentity(view.layer.transform)`.

### 9. iOS shadow layers are hosted in the child's own layer (non-clipping views)

`MasonStyle.syncShadowLayer` hosts `mShadowLayer` in the **view's own layer** (`view.layer.insertSublayer(_, at: 0)`) for non-clipping views. This means the shadow moves, frees, and animates with the view by construction — no orphan tracking needed.

**Clipping views** (`masksToBounds == true`, overflow hidden/scroll/clip) keep the superview-hosted path so the shadow can escape the clip. That path retains the reconcile sweep (`reconcileShadowLayers`), per-frame reposition from `applyToView`, and disabled implicit animation (`action(forKey:)` → `NSNull()`).

`MasonShadowLayer.draw` clips out the view interior and only paints outside. The inner-clip and caster paths must be in exact agreement — an inflation gap (even 1px) opens a corner wedge where the opaque caster fill leaks through.

---

## Testing

```bash
npm test           # the CSS value layer, in Node, no device, no native build
npm run test:keys  # StyleKeys byte offsets agree across ts/rust/kotlin/swift
npm run test:rust  # cargo test -p mason-core --all-targets  (65 binaries, green)
```

**The rule that keeps bugs cheap: a unit or parsing bug must fail in `npm test`
before it is allowed to reach a device.** Historically almost every bug found in
this repo lived in `style.ts`/`properties.ts` — percent off by 100×, a
percent-blind converter, a shorthand mislabelling a bare number — and each was
found by running an app. They are all catchable in milliseconds.

### How the Node tests reach `style.ts` at all

`tools/testing/` (config in `vitest.config.ts`, helpers in `mason-test-kit/`).
Three things make it work, and all three are worth knowing before you extend it:

1. **The `Style` seam needs no production change.** `Style` has no constructor of
   its own, `prepareMut()` is a no-op while `REF_COUNT === 1`, and `commitState()`
   only ORs bits into `isDirty` while `inBatch` is true. So
   `style-under-test.ts` hands a `new Style()` a plain 596-byte `ArrayBuffer` and
   no platform branch is ever taken.
2. **Offsets are parsed out of the source, not copied.** `style-keys.ts` reads
   `enum StyleKeys` from `style.ts`; `utils-stub.ts` reads the enums from
   `utils/index.d.ts`. A copied table would be one more place to drift — it
   drifted twice while these tests were being written.
3. **`@nativescript/core` is loadable in Node, but only just.** The barrel pulls
   in the application lifecycle and the HTTP stack, so `ns-core-stub.ts` aliases
   it and re-exports the *real* classes from their leaf modules;
   `platform-suffix-resolver.ts` resolves core's platform-suffixed and
   directory-style imports (Node's resolver rejects both) and swaps the two
   modules that define `NSObject`/`java` subclasses at import time; `setup.ts`
   installs a self-similar proxy for the `android`/`java`/`androidx` namespaces
   that core reads module-scope constants from.

   It resolves to core's `.android` variants — an arbitrary but deliberate pick:
   the iOS ones need a real Objective-C runtime (`NSObject` subclassing at module
   scope in `timer`, `fps-meter`, `application`), while Android's only read
   constants off namespaces the proxy can stand in for. Mason itself is
   platform-neutral here — `__ANDROID__`/`__APPLE__` are both `false`.

**Not testable in Node, don't try:** core's selector engine and `CssState`. They
need `application`, `platform/screen`, `fps-meter` and a live `ViewBase` tree;
stubbing far enough to load them means the thing under test is no longer core.
Real selector matching stays on-device.

### Known duplicate CSS registrations

`properties.spec.ts` carries an allow-list of 16 CSS names registered by **both**
core and masonkit (`margin`, `padding`, `background`, `border-radius`,
`vertical-align`, `flex`, ...). Two properties answer the same declaration and
which one runs depends on registration order. Pre-existing, and not obviously
safe to collapse — deduping `margin` would swap mason's whole-shorthand handler
for core's expand-to-four-longhands one. The allow-list exists so a *new* clash
fails in CI rather than on a device.

## Mixing with plain NativeScript views

Mason views and plain `{N}` views nest **both** ways, and all four
(platform × direction) combinations have explicit code:

- **A `{N}` view inside a mason container** — `View.addView` calls
  `node.mason.nodeForView(child)` (`Mason.kt`), which for a non-`Element` view
  creates a mason **leaf** with `setDefaultMeasureFunction()`. A `<Label>` or
  `StackLayout` participates in flex/grid as one atomic box, and NativeScript
  lays out its own children. iOS is at parity (`MasonElement.swift`,
  `MasonUIView.swift`).
- **A mason view inside a `{N}` layout** — `View.kt`'s `onMeasure` takes the
  `if (parent !is Element)` branch and acts as a layout root; iOS mirrors it in
  `view/index.ios.ts` (`if (!parentIsMason)`).

### The CSS boundary: web semantics inside a mason subtree

A mason element is a mason element; **a plain `{N}` view keeps core's semantics,
including core's `px`**. That is deliberate — it is the only way to avoid
redefining `px` for every plain NativeScript app that merely installs masonkit.

Two mechanisms enforce it, and both exist because getting this wrong broke plain
views app-wide:

1. **`registerAlongsideCore(property)`** in `properties.ts`. `CssProperty.register()`
   installs its accessors with `Object.defineProperty`, so for a CSS name core
   already owns the *last* registration wins outright — masonkit's. That silently
   shadowed core's handling of `margin`, `padding`, `background`, `background-*`,
   `border-color`, `border-radius`, `box-shadow`, `transform`, `vertical-align`,
   `text-overflow`, `align-content`, `flex`, `flex-flow`, `font-family` and
   `white-space` for **every view in the app**: a plain `StackLayout` with
   `margin: 10` in a stylesheet got nothing at all. This helper keeps core's
   descriptor and picks by `isMasonView(this)` at assignment time.
2. **`overrideForMasonViews(property, …)`**, for the 13 core properties mason
   narrows with `overrideHandlers`. `overrideHandlers` *replaces* core's handlers
   and core keeps the originals in a closure, so the fallback has to be named
   explicitly (hence `FlexWrapParse`, `TextAlignmentParse`, … in `properties.ts`).
   Before this, the converters handed core's `setNative` a raw CSS string, and
   the `valueChanged` bodies *reverted* the value (`target.x = oldValue`) whenever
   there was no mason style — i.e. on every plain view.

`tools/testing/core-view-unaffected.spec.ts` is the guard. **Any new property that
collides with a core CSS name must go through `registerAlongsideCore`** —
`properties.spec.ts` fails on an unrouted collision.

`isMasonView()` deliberately asks whether the view *is* a mason element, not
whether it sits inside one: a plain view parented into a mason tree has no mason
style buffer, so its value still has to be converted for core. (There was a
`isMasonChild_` Symbol read here that nothing ever assigned — the 17 write sites
set a string `_isMasonChild` instead. Removed; the guard now says what it does.)

**Known gap:** font inheritance does not cross into mason.
`common.ts`'s `[fontInternalProperty.setNative]` is `if (!__WINDOWS__) return;`,
and `fontInternal` is core's *inheritable* aggregate font property — so a
`font-family`/size/weight set on a plain `{N}` ancestor is dropped on a mason
descendant. Mason's own `font-family` works (see below); inheritance across the
boundary does not.

## Units: `px` is a CSS pixel

**`px` means a CSS pixel — the same size as a dip — exactly as on the web.** A bare
number is dip too. `dppx` is the escape hatch for a literal device pixel.

This deliberately differs from `@nativescript/core`, where `px` *is* a device
pixel. Mason's whole surface is web elements styled with web CSS, so pasted CSS
has to mean what it means in a browser. A plain NativeScript view in the same app
keeps core's semantics.

Buffer units, which is where this gets confusing:

| Field | Buffer holds | So a dip input is |
|---|---|---|
| geometry (width, padding, inset, gap, border width, letter-spacing, line-height) | device px | multiplied by the screen scale |
| `FONT_SIZE` | dip | stored as-is (the natives apply the density) |

The getters return CSS px in both cases, so `style.width` round-trips.

Every layer that parses a length has to agree, and there are five:
`style.ts` (the three `*FromString` helpers plus each `case 'px'`),
`utils/index.{ios,android}.ts` (the older JSON compat path),
`Border.kt`, `BorderParser.swift`, and `crates/mason-core/src/utils/grid.rs`.
Guarded by `packages/nativescript-masonkit/style.spec.ts`, which runs the whole
table at screen scales 1, 2 and 3 — **at scale 1 a px/dip confusion is invisible,
which is why several of them shipped.** `crates/mason-core/tests/grid_track_units.rs`
pins the Rust end.

Two traps this replaced, worth knowing about if you find old code or notes:
- Android's `Border.kt` treated `px` as a device pixel while iOS's `BorderParser.swift`
  already scaled it, so `border: 2px` rendered 3× thinner on Android at 3×.
- `apps/demo-solid/src/webspec/cssToStyle.ts` used to rewrite every `Npx` token to
  `Ndip` before handing a fixture to mason. WebSpec was 374/374 green without a
  single `px` value ever reaching the engine.

### Relative units

`rem`, `em`, `pt`, `vw`, `vh`, `vmin`, `vmax` all resolve. Two things they need
that a style buffer cannot supply — a root font size and the viewport — live in
`packages/nativescript-masonkit/units.ts` (`cssUnits`), pushed in by the platform
at init (`tree/index.android.ts`, `tree/index.ios.ts`); Android mirrors them on
`Mason.shared`, iOS on `NSCMason`. Defaults are the CSS defaults: a 16px root
font size, and a zero viewport so an unresolvable `vw` collapses to 0 rather than
silently becoming a bare number in the wrong unit.

Suffix order matters in every one of the five parsers: **`rem` also ends with
`em`, and `dppx` with `px`.**

`em` on a length resolves against the element's own font size (threaded through
as `emBasis`); `em` on **`font-size` itself** becomes a *percentage*, because
that is exactly what the buffer's percent type already means — `1.5em` is stored
as `150%` and native inheritance resolves it against the parent.

`rem` was the sharpest edge after `px`: core falls through to
`parseFloat('1rem')` → `1`, so `padding: 1rem` became **1 dip instead of 16**.
`@nativescript/tailwind` pre-multiplies rem by 16 before mason ever sees it,
which is why Tailwind users never hit it and hand-written CSS always did.

## Diagnostics: what CSS was dropped

Every parser used to drop what it didn't understand in silence — not one
`console.warn` in `style.ts`, not one log line in the native HTML parser.

```ts
import { setCssDiagnostics, formatCssDiagnostics } from '@triniwiz/nativescript-masonkit';
setCssDiagnostics(true);
// ... render ...
console.log(formatCssDiagnostics());
```

Reports unknown units, unresolvable viewport units, unparsable values, and
function values (`calc()`, `clamp()`, `var()`) that only resolve in a stylesheet
where core expands them first.

It is also a **test oracle**: `diagnostics.spec.ts` feeds a stylesheet's worth of
declarations through and snapshots the drop list, so a regression that starts
dropping something shows up as a new line — no fixture per property, no device.

## Style / JS → Native Dispatch

`style.ts` properties write into a shared 64-bit state buffer and signal native via:

```
commitState(StateKeys.X)
  → microtask syncStyle
  → mason_syncStyle(low, high)   // 64-bit dirty flags, passed as decimal STRINGS
  → Element.syncStyle(String,String)  // Android parses them
  → Style.setStateFromHalves
  → updateNativeStyle
  → updateTextStyle
  → notifyTextStyleChanged(state)
  → styleChangeListener?.onChange(low, high)
```

**The JS setters bypass the native Swift/Kotlin property setters entirely.** Do not rely on a Swift `MasonStyle.fontSize` setter firing when JS sets `fontSize`. The `setStateFromHalves` path is the one that runs.

**StateKeys.SIZE ≠ StateKeys.FONT_SIZE.** `SIZE` is the width/height flag (flag 20). `FONT_SIZE` is flag 56. They are distinct; confusing them is a latent footgun — the `number` case in `style.ts set fontSize` historically committed `SIZE` instead of `FONT_SIZE`.

**Android `styleChangeListener` may be an ancestor.** The listener for a child node is often a parent `Scroll` or `View`. `onChange` only calls `invalidateDescendantTextViews` on the listener's own node and has no reference to which node actually changed. Visual-only changes (backgroundColor, border, shadow) must also call `(node.view as? View)?.invalidate()` directly on the changed node's own Style — not rely on the listener to propagate.

---

## Text Engine

### Android

- `includeFontPadding` defaults to **`false`**. Web/iOS don't add Android's extra font metrics padding — defaulting to true inflates line boxes to ~1.33×; false gives ~1.17× (natural Roboto).
- Letter-spacing uses `LetterSpacingSpan` (a `MetricAffectingSpan` that sets `tp.letterSpacing = px / tp.textSize`), **not** `ScaleXSpan`. `ScaleXSpan` scales glyph width — it does not add tracking.
- Letter-spacing must be fixed in **both** `TextEngine.kt` (~line 1694) and `TextNode.kt` (~line 204). Fixing only one leaves the other broken.

### iOS

- Regular-weight text must render via `CTRunDraw`, not `drawRunWithFakeBold`. The fake-bold condition is `!isBold && weight >= 600` (CSS weight cutoff), **not** `>= 0.4` (CoreText trait scale). Every regular run has CSS weight 400; `400 >= 0.4` fires the fake-bold path → fuzzy, too-heavy glyphs.
- Single-line block text height is floored to `CTFontGetSize(font) * 1.2`. CoreText's single-line typographic bounds come out ~1.0× (SF/Helvetica report leading=0 and ascent+descent ≈ 1em). The 1.2× floor makes a single line match the web/Android `line-height: normal` box.
- Font metrics (`syncFontMetricsNow`) must be read from a font sized to `resolvedFontSize`, not a fixed `UIFont.labelFontSize` (17pt) stub. Use `baseFont.withSize(CGFloat(resolvedFontSize))` before reading ascent/descent/xHeight/capHeight/leading.

### UA default styles (both platforms)

Both platforms implement CSS user-agent default margins for block elements. They must stay **in sync**. Current values (CSS px):

| Element | Font size | Top/bottom margin |
|---------|-----------|-------------------|
| `<p>`   | 16px | 1em (16px) |
| `<h1>`  | 32px | 0.67em (21.44px) |
| `<h2>`  | 24px | 0.83em (19.92px) |
| `<h3>`  | 19px | 1em (18.72px) |
| `<h4>`  | 16px | 1.33em (21.28px) |
| `<h5>`  | 13px | 1.67em (22.18px) |
| `<h6>`  | 11px | 2.33em (24.98px) |
| `<blockquote>` | — | 1em top/bottom, 40px left/right |
| `<pre>` | — | 1em |

**iOS** (`MasonText.swift`): uses `.Points(cssPx * scale)`.
**Android** (`TextView.kt`): `margin()` helper multiplies by `resources.displayMetrics.density`.

---

## CSS property coverage

NativeScript's own CSS engine does the stylesheet work — selectors, classes,
`@media`, `@keyframes`, `var()`, `calc()`, specificity — and mason plugs into it
by registering its properties onto core's `Style` (`properties.ts`). So `.css` /
`.scss` files genuinely cascade onto `<div>`/`<p>`/`<h1>`.

**Reserved-but-unwritable keys are the recurring bug shape here.** A `StyleKeys`
offset exists, the natives read it, and nothing in JS ever writes it — so the
property looks supported and silently does nothing. `list-style-type` was one
(item 9); five more were found and fixed:

| Property | Why it was unreachable |
|---|---|
| `font-family` | The natives keep the family on a `FontFace`, not in the buffer — `FONT_FAMILY_STATE` exists with **no value slot**. And core's `fontInternalProperty.setNative` hook is Windows-only. **It was unsettable from CSS *and* TS on both mobile platforms.** Now routed through `NodeHelper.setFontFamily` / `MasonStyle.fontFamily`. |
| `white-space` | Read by TextEngine, TextView and TextNode all along (`<pre>` depends on it), written only by the native inline-style parser. |
| `object-fit` | Read by `Img`. |
| `text-justify` | Read by `TextView`. |
| `text-decoration-thickness` | Read by `TextNode`. |

Left alone on purpose: **`text-indent` and `font-variant-numeric`**. Their offsets
exist but *nothing reads them* in Kotlin, Swift or Rust, so exposing them would
write bytes into the void. They need text-engine work first.

**18 registrations were dead** — declared, `register(Style)`ed, and then dropped,
because they had no `valueChanged` and no `setNative` hook even though `style.ts`
had a working setter for every one: `background-position/size/repeat/clip`,
`backdrop-filter`, `object-position`, `border-image`, `font-stretch`,
`font-feature-settings`, `word-spacing`, `hyphens`, `writing-mode`,
`unicode-bidi`, `caret-color` and the four `corner-shape-*` longhands. All wired.

**Pseudo-classes.** `:hover` had a mask in `style.ts` but no
`@PseudoClassHandler`, so it never fired at all. And `_applyPseudoClassStyles`
assigned the **kebab-case** declaration name onto mason's `Style`, which only has
camelCase accessors — `:active { background-color: red }` stamped a dead expando.
Only the accidentally-identical names (`color`, `display`, `padding`, …) ever
worked. Both fixed.

**`flex` shorthand.** The converter tested `value.length` (the *string's* length)
instead of `values.length`, then pushed an object where core destructures a
`[property, value]` tuple — so **any three-part `flex` threw** "not iterable",
on mason and plain views alike. `flex: 1 1 auto` is about as common as CSS gets.

## Elements: what `web.ts` exposes

`web.ts` exports **61** `@CSSType` classes; `elements.ts` (`getMasonKitElements()`)
is the single registry every framework integration builds its `registerElement`
loop from, and `elements.spec.ts` guards it.

Three things worth knowing:

- **`TextType` is closed at 18 members**, so a new phrasing element cannot get
  its own native flavour without a native rebuild. `small`, `mark`, `sub`, `sup`,
  `u`, `ins`, `s`, `del`, `abbr`, `cite`, `dfn`, `q`, `kbd`, `samp`, `var`,
  `time`, `label`, `output`, `bdi`, `bdo` therefore all reuse `Span` and get their
  distinguishing look from ordinary properties (`text-decoration`,
  `vertical-align`, `font-size`, `font-family`, `background-color`). Before this
  they were all *literally indistinguishable* from surrounding text.
- **UA defaults go through `applyUaCss()`, which writes the `css:` tier**, never
  local style values. A local value outranks every stylesheet rule in
  NativeScript's cascade, so a UA default set as `view.style.x` cannot be
  overridden — `ul { margin: 0 }` and Tailwind's `list-none` both silently lost.
- **JSX intrinsics are generated**, not hand-written:
  `npm run gen:jsx-types` (checked in CI by `npm run test:jsx-types`). The
  hand-maintained list in demo-react had drifted to 4 tags out of ~60.

`<a href>` now works — the native side always made the element clickable
(`TextView.kt`'s `TextType.A` case) but nothing gave the click a destination.
`A` registers its own `click` listener and calls `Utils.openUrl`; an in-page
`#fragment` is left to the app.

## `innerHTML`

The native HTML parser (`HTMLParser.kt` / `HTMLParser.swift`, one per platform,
no shared source) maps ~60 tags. Fixed this round:

- **It was a permanent no-op on iOS.** `common.ts` guards the setter on the
  getter being truthy, and the getter was `//todo return ""`.
- **It appended instead of replacing** — assigning twice concatenated. Both
  platforms now clear the subtree first (`removeChildren` / `removeAllChildren`).
- **`<ul>`/`<ol>`/`<li>` used the wrong mechanism**: `createListView`/
  `createListItem` build the data-bound RecyclerView widget, whose marker system
  is wired for row binding and draws nothing for static markup. They now build a
  plain container with `TextType.Li` children — the only arrangement
  `ListMarkers` can draw a bullet for (see item 9 below).
- **`<!doctype html>` became a stray `<div>`** (the comment check only caught
  `<!--`, so `!doctype` fell through as a tag name).
- **`<style>`/`<script>`/`<textarea>`/`<title>` are raw-text elements** now; a
  `<style>` block's CSS used to be tokenized as markup and rendered as text.
- **Whitespace is collapsed** per HTML rules, so pretty-printed markup no longer
  injects an indentation text node between every pair of block children.
- **Inline `style` splitting is quote- and paren-aware**, so
  `background-image: url(data:image/png;base64,…)` and `font-family: "A;B"` no
  longer come apart on the `;` or the `:`.
- `class`, `id`, `href`, `alt`, `title`, `width`, `height`, `value`,
  `placeholder` and `disabled` are applied; previously **only** `style` and `src`
  were.

**Known limitation:** `class`/`id` are recorded on the node
(`Node.htmlAttributes`) but do **not** drive the CSS cascade. A node the HTML
parser builds is a native view with a mason node, not a NativeScript `ViewBase`,
so NativeScript's selector engine never sees it. Making `innerHTML` content
cascade properly means building `{N}` elements from the parser's token stream in
JS instead — worth doing, and a separate piece of work.

## Scroll

**Every block container in `web.ts` extends `Scroll`, not `View`** — `div`,
`section`, `header`, `footer`, `article`, `main`, `nav`, `aside`, `ul`, `ol` — so
any of them can scroll when `overflow` says so, as in a browser where every block
box is scrollable. Nested scroll is the norm.

This is affordable because neither platform uses the system scroll view: Android's
`Scroll` extends a custom `TwoDScrollView` (a `FrameLayout` with two-dimensional
and nested-scroll support), and on iOS the scroll component hosts a `MasonUIView`
with its own scroll handling — `scroll/index.ios.ts` says why: *"UIKit's
UIScrollView breaks with multiple nested scroll views."*

**Consequence to remember:** `Scroll.dispatchDraw` is a different method from
`View.dispatchDraw`, so anything drawn at the container level has to live in both.
List markers are the case in point — they moved out of `View.kt` into
`ListMarkers.kt` for exactly this reason. A marker mechanism that lives only in
`View` silently drops every bullet once `<ul>` is a Scroll.

### Default overflow behavior

A scroll container treats unset (`visible`) overflow as `auto` on the **Y axis only**. Horizontal stays non-scrolling unless an explicit `overflowX` is set — enabling X-auto on all divs causes surprise horizontal scrolling (any wide flex row would scroll the page sideways).

### The auto-overflow viewport trap

For a `height: auto` scroll container, `computedHeight == contentHeight` (the engine sizes the node to its content). Comparing `contentHeight > computedHeight` is always false → the container never enables scrolling. The `auto` check must compare content vs the **viewport** (the measured/laid-out box size), not the mason computed size.

- **Android**: `updateScrollState(viewportW, viewportH)` — `onMeasure` passes measured dims; `onLayout` passes `r-l, b-t`.
- **iOS**: `contentSize` is computed inside `_hasScrollOverflow`, feeding `MasonUIView._canScrollV` which handles `case .Visible: isScrollContainer && contentSize.height > bounds.height`.

### `isScrollContainer` flag

Set from the JS scroll component:
- iOS: `(view as any).isScrollContainer = true` in `scroll/index.ios.ts`
- Android: `Scroll.isAutoY()` treats `Overflow.Visible` as auto

---

## WebSpec

`tools/scripts/webspec-tests/generate.mjs` renders each vendored taffy/WPT fixture
in headless Chromium and records the real layout rects; the demo-solid WebSpec
page replays them on device and compares.

```bash
npm run gen:webspec            # regenerate the committed ground truth
npm run gen:webspec -- --check  # fail if it is stale (nightly CI)
```

**416 fixtures, 0 skipped.** It used to be 383 with 33 skipped, all for one
reason: the fixtures size boxes with runs of Ahem "X" glyphs, and without that
font the device's text metrics could never match the browser's. Ahem now ships at
`apps/demo-solid/src/fonts/Ahem.ttf`, declared in `app.css`, which was only
possible once `font-family` became settable at all.

Getting the font took a detour worth recording: the only copy in the repo is a
**woff2** inlined as base64 in `tools/scripts/webspec-tests/base.css`, and neither
platform's font loader accepts woff2. `fontTools` can convert it but needs a
`brotli` module Python 3.9 doesn't ship; Node's `zlib.brotliDecompressSync` does
the job behind a four-line shim module named `brotli`. The result is a valid TTF:
family `Ahem`, 1000 upem, ascent 800 / descent −200, and an "X" advance of exactly
1000 — i.e. a 1em square glyph, which is the whole point.

The device runner applies `base.css`'s `#test-root` rule
(`font-family: ahem; font-size: 10px; line-height: 1`) via `ROOT_DEFAULTS` in
`cssToStyle.ts`, and `FixtureTree.tsx` renders each node's own text.

**`cssToStyle.ts` no longer rewrites `px` to `dip`.** That rewrite is why the
suite could sit at 374/374 while the `px` path was completely broken.

### Whitespace in fixture text

`buildStyleTree` records each element's own text, and it **must apply HTML's
whitespace rules first** — collapse runs, drop whitespace-only. Pretty-printed
markup puts a newline and indentation between every pair of child elements; the
browser collapses that to nothing, so recording it verbatim hands the device a
text node the ground truth never had. Getting this wrong took the suite from
381/416 to **48/416** — a whitespace text node inside a flex container squeezes
every child. Cheap to spot in the fixture JSON: look for `"text": "\n  \n  "`.

### Current on-device state (Android emulator, density 3)

**381 / 416.** Of the 35 failures, **32 are the Ahem text fixtures** — the ones
that were skipped outright before. They now render text, but their metrics do not
yet match the browser: bundling the font and making `font-family` settable was
necessary but is not sufficient, and matching Ahem's exact 1em advances through
the native text engine is the remaining work.

The other three:

- `absolute_layout_align_items_and_justify_content_center_and_bottom_position` —
  measures 0x0, the known cold-start race (already recorded as harness-only).
- `flex_grow_less_than_factor_one` and
  `width_smaller_then_content_with_flex_grow_small_size` — deterministic, and
  **not** caused by the `px` work: an on-device dump shows the style buffer holds
  the right values (`flexBasis {px, 40}`, `flexGrow 0.2`, root `width 500`), and
  `crates/mason-core/tests/flex_grow_sum_below_one.rs` proves the engine computes
  132/92/184 from exactly those inputs. Restoring the old `px`->`dip` rewrite does
  not fix them either. So the gap is between the style buffer and what the engine
  actually receives on Android - i.e. the sync path for `FLEX_BASIS`, which none
  of this work touched. Most likely pre-existing; not confirmed against a clean
  baseline (reverting the plugin TS against the current harness crashes on
  launch, so that comparison could not be run).

## Backdrop Filter

### Android

`backdrop-filter` uses `BackdropHelper.kt` (API 31+). A `ViewTreeObserver.OnPreDrawListener` snapshots the root view into a `RenderNode`, applies the filter chain via `effectNode.setRenderEffect`, and draws the result clipped to the element's border-radius path **before** the element's own content.

During snapshot capture, `ViewUtils.render()` short-circuits to nothing for the target view (`isCapturing == true`) — its region is the "hole" the blurred backdrop fills.

**`view.setRenderEffect(null)` is always called on the view itself** — applying the effect to the view's own output blurs children, which is the wrong behavior for backdrop-filter.

### iOS

`CSSFilters.applyAsBackdrop` inserts a `UIVisualEffectView` at index 0 plus a `backgroundFilters` CALayer. Content on top stays sharp.

**Caveat:** `CALayer.backgroundFilters` is a no-op on iOS (it works on macOS only). Only `UIBlurEffect` (blur) actually works on iOS. Brightness, saturate, contrast, etc. are no-ops today — a snapshot + CIFilter pipeline (like Android's BackdropHelper) would be needed to fix this.

`MasonStyle.updateBackdropFrames(for:)` is called from `MasonUIView.layoutSubviews` to keep the effect view/layer sized to the host view's bounds (the filter is usually set before the first layout, when bounds is still `.zero`).

---

## CI

`.github/workflows/pr.yml` — every PR, plain ubuntu, no device, no browser:

| Job | What it guards |
|---|---|
| `style-keys` | The `StyleKeys` byte offsets agree across ts/rust/kotlin/swift |
| `ts-unit` | `npm test`, the JSX-intrinsics check, and the plugin typecheck |
| `rust` | `cargo fmt --check` and `cargo test -p mason-core --all-targets` |

`.github/workflows/nightly.yml` — the slow half: `gen:webspec --check` against a
real Chromium, Kotlin unit tests, Swift unit tests.

There was no `.github/` at all before this; the only CI artefact was a
`.travis.yml` from 2023 that built and never tested.

## Screen Scale

All iOS code uses `NSCMason.scale` — **not** `UIScreen.main.scale`. `NSCMason.scale` reads from `window.traitCollection.displayScale` (correct for multi-screen and visionOS scenarios). Using `UIScreen.main.scale` is incorrect on visionOS and potentially on external displays.

`NSCMason.scale` is a computed property (no longer a `let` constant).

---

## SolidJS Demo — Known Pitfalls

### Events use `on:` namespace

The NS SolidJS renderer only wires event listeners for props starting with `on:`. Using `onClick`/`onTap` silently falls through to `setAttribute` and never attaches a listener.

```tsx
// Wrong — never fires:
<view onClick={handler} />

// Correct:
// @ts-ignore
<view on:click={handler} />
```

Each usage needs a `// @ts-ignore` on the line above (JSX has no types for the `on:` namespace).

Also required: `set target`/`set currentTarget` no-op setters on Mason's `Event` class in `common.ts` — undom-ng stamps these during dispatch.

### Scroll requires `overflowY: 'scroll'` or relies on auto-default

A plain `<scroll>` now auto-scrolls vertically when content overflows (the auto-default). To force always-scroll, set `overflowY: 'scroll'`.

---

## font-manager Integration

Mason consumes font-manager as a **published** dependency, not local source:

- Android: `api 'org.nativescript:fontmanager:1.0.7'` in `masonkit/build.gradle`
- iOS: remote SwiftPM `XCRemoteSwiftPackageReference` pointing to `github.com/NativeScript/font-manager`

A source fix in the font-manager repo does **nothing** until font-manager is rebuilt + published and masonkit bumps the version, then the AAR/xcframework is rebuilt.

**Known latent font-manager issue (not Mason's bug):** `FontFace.kt:566` has a typo `"san-serif"` (should be `"sans-serif"`). The default sans-serif family misses the `Typeface.SANS_SERIF` fast path and falls through to `Typeface.create("Roboto", style)`. Mostly harmless (Roboto is the default anyway) but technically wrong.

---

## Open Items (as of 2026-06-19, triaged 2026-08-26)

1. **iOS backdrop non-blur filters** — brightness/saturate/contrast/etc. are no-ops (`CALayer.backgroundFilters` is macOS-only). **Fixed 2026-08-26**: `CSSFilters.swift`'s `applyAsBackdrop` now snapshots the content behind the view (`captureBackdropToCIImage`, walking to the root view and excluding the element's own subtree), runs the CSS filter chain through the existing Metal/`CIContext` pipeline (reused from `apply(to:)`), and re-renders on a `CADisplayLink` throttled to ~30fps while the view is on-window. Pure blur (no other filters) still uses the compositor-backed `UIVisualEffectView` path unchanged — it's cheaper and already live. Border-radius clip (independent of `overflow`, per invariant #7) is re-queried each frame via a `clipPathProvider` closure. Compiles clean; full xcframework rebuilt successfully.
2. **Gradient backgrounds in deeply-nested scroll children** — they don't paint until an external repaint trigger. Solid color backgrounds work. **Fixed 2026-08-26**: root cause was a missing follow-up draw pass, not a cache-invalidation bug — `drawGradient` in `Background.kt` now calls `view?.postInvalidateOnAnimation()` right after (re)building a `Shader`, since a freshly-built gradient `Shader` can miss painting on the very draw call that constructs it (a deeply nested scroll child's first real-size `onDraw` can race the shader's GPU texture upload), while solid-color `Paint.color` fills need no such upload and always painted correctly first-try. Verified via Kotlin compile + full AAR rebuild.
3. **visionOS xcframework** — Rust compiles cleanly. `SUPPORTED_PLATFORMS = "xrsimulator xros iphonesimulator iphoneos"` and `XROS_DEPLOYMENT_TARGET = 1.0` are now both set on the framework target in `Mason.xcodeproj` (2026-08-26). Still untested: nobody has run `INCLUDE_VISIONOS=1 ./build.sh` end-to-end against a visionOS SDK to confirm it links.
4. **`<p>` inside a tight pill is taller on iOS than Android** — residual ~1.17× vs ~1.20× line-height difference (natural SF-vs-Roboto variation, same as web). **Accepted as a platform limitation, not a Mason bug** (2026-08-26) — the iOS 1.2× single-line floor exists specifically to fix a prior tight-line-height clipping bug (see [[mason-ios-tight-lineheight-clip]]); shrinking it to match Android risks reopening glyph clipping on tight pills for a marginal cross-platform delta that real browsers exhibit too. Set `margin: 0` on the `<p>` as the workaround for tight layouts.
5. **UA default styles are duplicated per platform** — `MasonText.swift` and `TextView.kt` must be kept in sync manually. **Fixed 2026-08-26**: the (font-size, margin) numbers for `p`/`h1`-`h6`/`blockquote`/`pre` now live in one place, `crates/mason-core/src/utils/ua_defaults.rs::ua_default_for_tag` (unit-tested per tag), exposed via `mason_ua_default_for_tag` (mason-c → iOS, cbindgen-generated header) and `Mason.nativeUaDefaultForTag` (mason-android JNI). Both `MasonText.swift` and `TextView.kt` now call through to native for the numeric values; each platform still applies its own scale/density multiplier locally (unchanged). Non-numeric per-tag styling (`display`, `fontWeight`, `fontFamily`, gesture wiring, etc.) was left untouched — only the shared numeric table moved. Verified: cross-platform value diff found the two platforms already agreed (no drift bug); `cargo test -p mason-core` (10/10); Kotlin compile + full AAR rebuild; full xcframework rebuild; on-device smoke test on both platforms (no crashes, JNI call confirmed working, headings/margins render as before).
6. **`Button.kt:215` latent flag bug** — `activeTextKeys != StateKeys.NONE` after an `and` is always true. **Fixed 2026-08-26**: `StateKeys` (`Style.kt`) now has a proper `equals`/`hashCode` override based on `low`/`high`, so `!= StateKeys.NONE` compares by value instead of by reference. This was the only place in the codebase comparing `StateKeys` with `==`/`!=`, so the fix is contained — it also incidentally fixed the same latent bug at the two sibling call sites (`disabledTextKeys`, `focusTextKeys`) that weren't in the original note.
7. **`<em>`/`<i>`/`<pre>` were unreachable from every framework** — the native side (`TextType.kt`/`MasonText.swift`) has always fully implemented `Em`/`I` (italic) and `Pre` (monospace + `white-space:pre` + UA margin), but `web.ts` never exported classes for them, so no app could ever render `<em>`, `<i>`, or `<pre>`. **Fixed 2026-08-30**: added `Em`, `I`, `Pre` to `web.ts` (TS-only, no native rebuild needed — verified the native TextType switch already had cases for all three before adding).
8. **Element registration drifted per framework, with no shared source of truth** — demo-solid, demo-vue and demo-react each hand-maintained their own `registerElement` tag list at the app layer, independent of each other and of Angular's `registerMasonKitElements`. This is exactly how demo-react ended up mid-migration with only 4 of ~30 tags registered (`div`/`scroll`/`span`/`button`), and how demo-vue was missing a dozen tags (`ul`/`ol`/`li`/`scroll`/`blockquote`/`strong`/`em`/`i`/`pre`/`a`/`h5`/`h6`/`article`/`main`/`nav`/`header`/`footer`/`aside`) that demo-solid already had. **Fixed 2026-08-30**: extracted the canonical tag/ctor/container-flag list (previously duplicated inside `angular/src/element-registry.ts`) into `packages/nativescript-masonkit/elements.ts` (`getMasonKitElements()`), a plain data list every framework integration builds its registration loop from. Angular's `element-registry.ts` now consumes it directly; demo-solid, demo-react and demo-vue's `index.ts`/`app.ts` now loop over it instead of hand-listing tags. Preserves the "`/web`'s more specific element wins" priority (e.g. `/web`'s inline `Li` over the base package's container `Li`) and the original PascalCase spelling for MasonKit's own widgets (`View`, `TextArea`, ...) — lowercasing those up front would have silently dropped Angular's derived kebab-case spelling (`<text-area>`). Needed matching `tsconfig` path-mapping entries for the new `/elements` subpath in 5 places (`tsconfig.base.json`, the angular sub-package's `tsconfig.angular.json` which has no wildcard fallback, and demo-vue/demo-angular's own tsconfigs) — demo-solid/demo-react didn't need one, they already resolve `@triniwiz/*` via a wildcard.
9. **`<ul>`/`<ol>`/`<li>` had no UA-default box model, and rendered with no visible markers when statically nested.** **Fixed 2026-08-31**, but the initial diagnosis (and a first, abandoned implementation) were wrong — recorded here so a future session doesn't repeat the detour:
   - The **wrong turn**: `packages/nativescript-masonkit/index.d.ts`'s `Ul`/`Ol` re-export `list/index.android.ts`'s `UnorderedList`/`OrderedList` — a data-bound, RecyclerView-backed widget (`<List items=… itemTemplate=…>`), and its item type, `li/index.android.ts`'s `Li` (backed by the native `Li`/`MasonLi` classes), genuinely has a full working marker-drawing system (`Li.kt`'s `drawMarker`/`calculateMarkerMetrics`, `MasonLi.swift`'s equivalent) — but it's wired for that RecyclerView item-binding flow (`ListView.kt` sets `li.position`/`li.isOrdered` per bound row), not for plain static nesting. Reaching for that class and manually driving it (adding a Kotlin `Li.bind(position, isOrdered)`, reserving a marker gutter via `node.style.padding`) got the marker *glyph* rendering, but never got the *text* to move out of the marker's way — because that whole apparatus is irrelevant to the actual live code path (below), not because the approach needed one more fix. All of that (the `bind()` method, `li/index.*.ts`'s `bindPosition`, `Li.bindPosition` in `index.d.ts`) was reverted.
   - **The real, already-built, already-wired mechanism**: `View.kt`'s `dispatchDraw` (and the iOS `MasonUIView` equivalent) unconditionally calls `drawListItemMarkers()`, which scans a plain container's *own* children for ones whose `TextType == .Li`, and draws a bullet/circle/square/decimal marker positioned relative to each such child's own resolved `left` — reading color via `child.style.resolvedColor` (correctly) and list-style-type via `LIST_STYLE_TYPE`/`LIST_STYLE_TYPE_STATE` (falling back to `disc` if unset). This is a completely separate, simpler, purely draw-time mechanism with zero Taffy-side bookkeeping — it works as long as `<li>` content is a `TextType.Li`-flavored **inline Text** child (`web.ts`'s original `Li extends Text`, which this session had briefly deleted in favor of the wrong `Li` above — restored) of a plain container (`web.ts`'s `Ul`/`Ol extends View`).
   - Three small real gaps this exposed and fixed: (1) `web.ts` had no `Ol` at all (only `Ul`) and its `Li` — now restored — needed the browser's `margin: 1em 0; padding-inline-start: 40px` UA default, which `applyListUaDefaults()` now sets on both `Ul` and `Ol`, giving `drawListItemMarkers` a reserved gutter for free since it draws relative to each `<li>`'s (padding-shifted) own position; (2) **no JS-settable `list-style-type` property existed anywhere** (`StyleKeys.LIST_STYLE_TYPE`/`_STATE` were reserved constants nobody wrote to) — added a `listStyleType` getter/setter to `style.ts` (mirrors `boxSizing`'s exact pattern), so `Ol`'s constructor can set `'decimal'` (`Ul` needs nothing — `disc` is `drawListItemMarkers`'s own fallback); (3) both platforms' `TextType.Li` case was a no-op (`Kotlin: {}` / `Swift: break`) — real `<li>` is block-level (`display: list-item`); with no display override at all every `<li>` defaulted to inline and multiple list items ran together on one line. Added `style.display = Block` to both platforms' `Li` case (mirrors the existing `Blockquote` case) — **the fix that actually made per-item lines and correct marker-per-line possible**; the padding/listStyleType pieces alone weren't sufficient.
   - Verified on-device (Android emulator): both `<ul>` (3 discs) and `<ol>` (decimal 1./2./3.) render with correct per-item bullets/numbers, correct white (CSS `color`-following) marker color, correct left-of-text position with no overlap, one line per `<li>`. iOS got the matching `MasonText.swift` `.Li` display-block case but was **not** device-verified this session (no iOS toolchain available) — low risk since it mirrors the already-proven Android fix exactly and iOS's `drawListItemMarkers`-equivalent/marker-drawing code was already unchanged.
10. **WebSpec (`tools/scripts/webspec-tests/`) only ever tested generic `<div>` flex/grid box geometry** — despite reaching 374/374 on both platforms, it never exercised the actual custom elements (headings, paragraphs, lists, links, inline formatting) — "100% WebSpec" was never the same claim as "custom elements match mobile web." **Extended 2026-08-30**: `generate.mjs` now also walks a `custom_element_tests/` fixture directory (hand-authored, not vendored from taffy) through the same real-Chromium-ground-truth pipeline, covering `h1`-`h6`/`p`/`blockquote`/`pre`'s UA-default margins end-to-end (native tag → real layout numbers), not just the Rust-level hardcoded-constant unit tests `ua_defaults.rs` already had. `FixtureTree.tsx` gained a small per-tag JSX-literal renderer map (no `Dynamic`-by-string-tag helper exists in this custom Solid renderer) selected by a new `tree.tag` field threaded through `buildStyleTree`/`collectExpectedRects`. Deliberately did **not** attempt list markers, `img`/`button`/`a` (native-chrome differences vs. browser rendering, or asset-loading complexity), or inline-element (`span`/`b`/`em`/...) text flow (blocked by the pre-existing "Ahem font not bundled" limitation, same wall the original harness already hit) — each has its own blocker, see item 9 and the pre-existing `skipped.json` reasons.
