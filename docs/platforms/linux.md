# Linux

MasonKit supports Linux through the NativeScript Linux runtime (`@nativescript/linux`), which draws with GTK 4. The same TypeScript API, elements and CSS work there; the native side is a Rust library over GTK instead of a Swift framework or an Android library.

## Setup

Add the Linux platform to your app and install the plugin as usual:

```bash
ns plugin add @triniwiz/nativescript-masonkit
ns run linux
```

The plugin declares `linux: 0.1.0-alpha.2` as its minimum runtime. The Linux runtime is in alpha. Apps need GTK 4.6 or later at run time.

Nothing else is required. The package ships `platforms/linux/lib/x64/libmasonkit.so` and its C header `platforms/linux/include/mason_linux.h`. When your app builds, the CLI copies the library next to the app and runs the metadata generator over the header, so the library's functions are callable from JavaScript.

Fonts in your app's `fonts` folder are registered with fontconfig at startup, so a custom `font-family` resolves by name. Fonts loaded at run time (`@font-face`, `FontFace`) go through `@nativescript/font-manager`: `libmasonkit.so` links its `libfontmanager.so`, resolves families through it, and lays text out again when a face loads.

## What the library contains

`libmasonkit.so` (crate `crates/mason-linux`) wraps the same Rust engine as the other platforms and adds one GTK widget, `MasonElement`, behind every element:

- A container mirrors its Mason node's children to its GTK children. The topmost element computes the tree and every element places its children from that layout.
- Text, nested inline text and inline boxes form one Pango paragraph, which is the text node's measure. Inline boxes stay GTK widgets, placed where their object replacement character lands.
- Backgrounds, gradients, borders, box shadows and filters are drawn with GSK render nodes.
- `<input>` and `<textarea>` host a GTK control (an entry, a check button, a scale, a color button or a text view) in their content box.

In TypeScript, `native.linux.ts` exposes the library with the same API as the Windows component (`NativeScript.Mason.View`, `Text`, `Css`, ...). Each element object is also the `GtkWidget` pointer, so core treats it like any other native view. CSS is parsed in TypeScript, as on Windows.

Plain NativeScript views inside a Mason element are measured and laid out through core, at the size and position Mason gives them.

## Differences from iOS and Android

- **Masks and `clip-path`.** A `clip-path` that is a box, `inset()`, `circle()` or `ellipse()` is a GPU clip. Polygons, paths, `mask-image` layers and `mask-border` use a mask: GTK 4.10 and later draw it on the GPU, GTK 4.6 to 4.8 composite the element in software, which costs more for large masked elements. Taps outside a `clip-path` go to whatever is underneath.
- **`backdrop-filter`** filters the Mason content behind the element, from its layout root down. Plain GTK or NativeScript views behind that root aren't part of the backdrop.
- **Scrolling.** `overflow: scroll` and `auto` scroll with the wheel, touchpad (with momentum) and touch drag, and show overlay indicators while moving. `<scroll>` wraps its content in a `GtkScrolledWindow` instead.
- **Vertical writing modes** draw with Pango's vertical gravity. `text-orientation: upright` keeps CJK upright but turns other scripts sideways, as `mixed` does.
- **Remote images** are fetched with the runtime's `fetch`; files and `data:` URIs load directly.

See the [support matrix](/platforms/) for features that differ across all platforms.

## Building the library

The prebuilt library ships in the npm package. To rebuild it you need Rust and the GTK 4 development files (`libgtk-4-dev` 4.6 or later):

```bash
npm run build:linux     # from packages/nativescript-masonkit
# or
tools/scripts/masonkit-build-linux.sh [--debug]
```

The script builds `crates/mason-linux` and copies `libmasonkit.so` and `mason_linux.h` into `packages/nativescript-masonkit/platforms/linux`. Without the development package, point `NS_SYSROOT` at a sysroot made by the Linux runtime's `metadata-generator/linux/fetch-sysroot.sh`: the script takes the headers and `.pc` files from there and links against the system's GTK libraries.

The demo app in `apps/demo-solid` runs on Linux with `npm run start-linux`. Its WebSpec page compares the layout of 441 fixtures with Chromium.
