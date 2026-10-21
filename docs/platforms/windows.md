# Windows

MasonKit supports Windows through the NativeScript Windows runtime (`@nativescript/windows`). The same TypeScript API, elements and CSS work there; the native side is a C++/WinRT component instead of a Swift framework or an Android library.

## Setup

Add the Windows platform to your app and install the plugin as usual:

```bash
ns plugin add @triniwiz/nativescript-masonkit
ns run windows
```

The plugin declares `windows: 9.1.0` as its minimum runtime. The Windows runtime is still in beta.

Nothing else is required. When your app builds, the plugin's `platforms/windows/plugin.targets` copies `NativeScript.Mason.dll` and `NativeScript.Mason.winmd` for the target architecture (x64 or ARM64) into the build output and registers the component's activatable classes in the app manifest. The runtime finds the `.winmd` at startup and activates the classes from there.

`plugin.props` also adds the `NativeScript.FontManager` NuGet package, which MasonKit uses for fonts.

## What the component contains

`NativeScript.Mason` is a WinUI 3 (Windows App SDK) Windows Runtime Component. It wraps the same Rust engine as iOS and Android, through the `mason-c` C ABI, and projects these classes under the `NativeScript.Mason` namespace:

| Class | Role |
| --- | --- |
| `Mason` | The layout engine: node factories, compute, device scale |
| `Node`, `Style`, `Layout`, `MeasureOutput` | Layout tree, per-node style writer, computed layout, measure results |
| `View` | A XAML `Panel` that owns a `Node` and runs Mason layout in its Measure/Arrange overrides |
| `Text`, `Image`, `Button`, `Br`, `Li`, `List`, `TextNode`, `TextArea`, `Input` | The element views |
| `Css` | Visual styling: masks, filters, backgrounds, borders, shadows, transforms |

Plain XAML children of a Mason `View` are measured through a Mason measure callback, so they take part in flex and grid layout as single boxes.

## Differences from iOS and Android

- **Styling is parsed in TypeScript.** Masks, `clip-path`, `mask-border`, `border-image` and `url()` backgrounds are resolved in TS (`mask.windows.ts`) and handed to the native `Css` class as a spec. Rendering uses Direct2D and Composition.
- **`innerHTML`** is parsed in TypeScript on Windows and builds the same element classes the templates use (`inner-html.windows.ts`). On iOS and Android a native HTML parser builds the tree.
- **Text** is laid out and drawn with DirectWrite. Inline boxes (inline-blocks, buttons, images and inputs inside text) stay live XAML children, so they get real input and accessibility.
- **Box shadows** are always drawn through Composition. `setBoxShadowRenderMode` and `setBoxShadowSoftwareRasterScale` exist but do nothing.
- **Gradients.** `conic-gradient` and `repeating-*` gradients work in backgrounds, masks and border images; the stops are tiled in TS before they reach Direct2D.
- **`clip-path`.** A tap outside the clip shape, including a `path()`, goes to whatever is underneath.
- **SVG backgrounds** are drawn by Direct2D's SVG renderer, which ignores `<style>` sheets and `<symbol>` and only follows `xlink:href`.
- **Not applied yet:** `corner-shape`, `background-attachment`, `background-blend-mode` and `background-clip: text`.
- **Checkboxes and radios** with `appearance: none` keep the WinUI control underneath (invisible, still focusable and tappable) so the CSS box is what you see.
- **Accessibility.** Links and clickable inline elements are exposed to UI Automation as children of the text, and `<summary>` exposes the Expand/Collapse pattern.

See the [support matrix](/platforms/) for features that differ across all platforms.

## Building the component

The prebuilt binaries ship in the npm package. To rebuild them from source you need Visual Studio 2022 or later with the **Desktop development with C++** workload (MSVC v143+, Windows SDK 10.0.26100, C++/WinRT) and the Rust MSVC toolchain:

```powershell
rustup target add x86_64-pc-windows-msvc aarch64-pc-windows-msvc

cd packages/nativescript-masonkit/src-native/windows
pwsh ./publish.ps1                 # x64 and ARM64
pwsh ./publish.ps1 -Platforms x64  # one architecture
```

`publish.ps1` builds the `mason-windows` Rust static library, then the C++/WinRT component, and copies the `.dll` and `.winmd` into `packages/nativescript-masonkit/platforms/windows/{x64,arm64}`. From the package directory, `npm run build:windows` does the same.

There is also a headless native test harness that exercises the engine classes without WinUI:

```powershell
pwsh ./publish.ps1
msbuild Demo\Demo.vcxproj -p:Configuration=Release -p:Platform=x64
.\Demo\bin\x64\Release\Demo.exe   # prints PASS/FAIL per layout assertion
```

::: warning Stale builds after a clock change
MSBuild skips sources that look up to date. If the system clock moved backwards, delete `Mason/NativeSc.*/<arch>/Release` and `Mason/bin/<arch>/Release` before running `publish.ps1` again.
:::

See [Building from source](/contributing/building) for the iOS and Android builds.
