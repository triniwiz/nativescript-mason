# Architecture

This page is a map for contributors. `MASON_CONTEXT.md` at the repo root goes deeper on each area and lists the invariants that have bitten people before.

## Layers

```
 TypeScript plugin (packages/nativescript-masonkit)
   elements, CSS properties, style buffer writes
        |  shared style buffer + dirty mask
        v
 Native view layer
   Android: Kotlin (src-native/mason-android)
   iOS:     Swift  (src-native/mason-ios)
   Windows: C++/WinRT (src-native/windows)
        |  JNI / C ABI
        v
 Rust bindings (crates/mason-android, mason-ios, mason-windows, mason-c)
        |
        v
 mason-core (crates/mason-core), built on taffy
```

### mason-core

The layout engine. It owns the node tree and style storage and runs flexbox, grid, block, inline flow and floats on top of [taffy](https://github.com/DioxusLabs/taffy). The workspace pins a fork of taffy (`Cargo.toml`, `[workspace.dependencies]`) that carries flexbox and out-of-flow sizing fixes not yet upstream.

For text, Rust only sizes boxes. The platform breaks and draws lines, and reports sizes back through measure callbacks. That keeps text rendering native (CoreText on iOS, Android's text stack, DirectWrite on Windows).

### Bindings

| Crate | Output | Used by |
| --- | --- | --- |
| `mason-android` | `libmasonnative.so` (cdylib, JNI) | The Kotlin library, built by Gradle |
| `mason-c` | C ABI (`mason_native.h`) | `mason-ios` and `mason-windows` re-export it |
| `mason-ios` | `libmasonnative.a` (staticlib) | The Swift framework, built by an Xcode build phase |
| `mason-windows` | `masonnative.lib` (staticlib) | The C++/WinRT component |

C headers are generated with cbindgen (`tools/scripts/build-headers.sh`, and on every iOS build by `pre-build.sh`).

### Native view layer

Each platform has the same set of elements: a container view, scroll view, text, image, button, input, text area, list, list item and line break. They own a Mason node, apply computed layout to their frames, draw backgrounds, borders, shadows, masks and filters, and handle touch, focus and accessibility.

Android's text view is a `ViewGroup` that draws its own text, so inline boxes (inline-blocks, buttons, images and inputs inside text) can be real child views. iOS's `MasonText` does the same with subviews, and Windows keeps them as live XAML children.

### TypeScript plugin

- `view/`, `text/`, `scroll/`, `img/`, `button/`, `input/`, `textarea/`, `br/`, `list/`, `li/`, `text-node/`: the element classes, split into `common.ts` plus `index.{ios,android,windows}.ts`.
- `web.ts`: the HTML-shaped elements (`div`, `section`, `p`, `h1`-`h6`, `span`, `a`, `ul`, `details`, ...). Block containers extend `Scroll`, so any of them can scroll when `overflow` says so; phrasing elements extend `Text`.
- `style.ts`: the `Style` class that writes the shared style buffer.
- `properties.ts`: CSS property registration on NativeScript's `Style`, so stylesheets cascade onto Mason elements.
- `elements.ts`: the element registry (`getMasonKitElements()`).
- `css-*.ts`, `box-shadow.ts`, `gradient-stops.ts`, `units.ts`: value parsers (colors, math functions, filters, transforms, keyframes, units).
- Windows-only modules use the platform suffix too: `mask.windows.ts` (mask, clip-path and background specs for Direct2D), `panel-helpers.windows.ts`, `svg-path.windows.ts` and `inner-html.windows.ts`. Import them without the suffix. Shared code (`common.ts`, `style.ts`, `web.ts`) imports `./mask` and `./panel-helpers`, so those two also have a base `mask.ts` / `panel-helpers.ts` that iOS and Android resolve to; it only declares the shared types and stubs that run behind `__WINDOWS__`. `svg-path.d.ts` types the Windows-only `svg-path` module.

## The style buffer

Every Mason node has a byte buffer holding its style. JavaScript and the native layer see the **same memory**: on Android an `ArrayBuffer` over a direct `ByteBuffer`, on iOS `interop.bufferFromData` over `NSMutableData`, on Windows the runtime's view of a WinRT `IBuffer`. A new node starts on a shared default buffer and takes its own copy on first write.

The byte offsets (`StyleKeys`) and the bits of the 128-bit dirty mask (`StateKeys`) are generated for every language from one file, `tools/scripts/style-keys/style-keys.schema`. `npm run gen:style-keys` rewrites the marked blocks in:

- `crates/mason-core/src/style/mod.rs` and `crates/mason-core/src/style/arena.rs`
- `src-native/mason-android/.../masonkit/Style.kt`
- `src-native/mason-ios/Mason/Mason/MasonStyle.swift`
- `packages/nativescript-masonkit/style.ts`
- `src-native/windows/Mason/StyleKeys.h` (the whole file)

`npm run test:keys` fails in CI when any of them is stale or was edited by hand.

## From a style write to a layout

```
style.width = '50%'                       (style.ts setter)
  -> write WIDTH_TYPE / WIDTH_VALUE bytes, commitState(StateKeys.SIZE)
  -> microtask: flushStyleSyncs()
  -> syncStyleParts(d0, d1, d2, d3)       (dirty mask as four int32 words)
       Android: Element.syncStyleParts    iOS: mason_syncStyleParts
  -> Style.setStateFromHalves(low, high)
  -> native reads the changed fields, invalidates layout or repaints
```

Writes made in the same turn are batched into one sync per style. The JS setters bypass the typed native property setters entirely, so behaviour that must run on a style change belongs on the sync path, not in a Kotlin or Swift property setter.

## Adding a style field

1. Append the field to `[style]` in `style-keys.schema` (and a bit to `[state]` if it needs its own dirty flag). Never move or resize an existing field; offsets are shared between the Rust core and the platforms.
2. Run `npm run gen:style-keys`.
3. Write the setter and getter in `style.ts`: write the buffer, then `commitState`.
4. Register the CSS property in `properties.ts`.
5. Read the bytes natively (Rust if it affects layout, the platform layers if it affects drawing).
6. Add a Node test that sets the property and reads the bytes back.

::: warning Reserved but unwritable
The recurring bug shape: an offset exists and the natives read it, but nothing in JS ever writes it, so the property looks supported and silently does nothing. Step 6 is what catches it.
:::

## CSS and plain NativeScript views

NativeScript's own CSS engine does the stylesheet work (selectors, classes, `@media`, `@keyframes`, `var()`, specificity). MasonKit registers its properties on core's `Style`, so `.css` files cascade onto `<div>`, `<p>` and friends.

Some CSS names (`margin`, `padding`, `background`, `border-radius`, `flex`, `transform`, ...) are already registered by core. Registering them again would replace core's handling for every view in the app. Two helpers in `properties.ts` prevent that:

- `registerAlongsideCore(property)` keeps core's descriptor and picks the Mason or core path per view at assignment time, based on `isMasonView`.
- `overrideForMasonViews(property, ...)` is for core properties MasonKit narrows; it falls back to core's original handlers for plain views.

Any new property that collides with a core CSS name must go through one of them; `properties.spec.ts` fails otherwise.

A plain NativeScript view inside a Mason container becomes a Mason leaf node and takes part in flex or grid as one box. `foreign-layout.ts` mirrors its layout properties (size, margins, flex, alignment, position, grid placement) into that leaf. A Mason view inside a plain NativeScript layout acts as its own layout root.

## The element registry

`elements.ts` exports `getMasonKitElements()`, the single list of every tag MasonKit backs: the `/web` HTML elements (tag read from each class's `@CSSType` decorator) and MasonKit's own widgets (`View`, `Text`, `Scroll`, `Img`, `Button`, `Input`, `TextArea`, `Br`, `Ul`, `Ol`, `Li`). Each entry says whether the element is a container that needs child-aware wiring.

The Angular, Vue and Svelte entry points build their `registerElement` loops from it, and `npm run gen:jsx-types` generates the JSX intrinsic typings for the React demo from the same sources. Adding a tag to `web.ts` reaches every framework at once; `elements.spec.ts` guards the list.

UA default styles for tags (heading sizes, paragraph and list margins) are applied through `applyUaCss()` in `web.ts`, which writes them at the stylesheet tier rather than as local values, so app CSS such as `ul { margin: 0 }` can override them.
