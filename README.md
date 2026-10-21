<p align="center">
  <img src="docs/public/logo.svg" width="72" alt="MasonKit" />
</p>

<h1 align="center">Mason</h1>

<p align="center">
  Web layout and HTML-shaped elements for NativeScript, powered by Rust and <a href="https://github.com/DioxusLabs/taffy">taffy</a>.
  <br />
  <a href="https://triniwiz.github.io/nativescript-mason/"><strong>Documentation</strong></a>
  ·
  <a href="https://www.npmjs.com/package/@triniwiz/nativescript-masonkit">npm</a>
  ·
  <a href="https://github.com/triniwiz/nativescript-mason/issues">Issues</a>
</p>

---

Mason brings flexbox, grid, block and inline flow, positioning and browser-like elements (`div`, `p`, `span`, `h1`, `ul`, `img`, `input`, `details`, ...) to NativeScript apps on iOS, Android and Windows. Every element is a native view. Layout runs in `mason-core`, a Rust crate built on [taffy](https://github.com/DioxusLabs/taffy).

```bash
ns plugin add @triniwiz/nativescript-masonkit
```

```html
<div class="card">
  <h2>Hello Mason</h2>
  <p>Styled with <strong>real</strong> CSS.</p>
</div>
```

Setup for plain NativeScript, Angular, Vue 3, Svelte Native, React and Solid is in the [framework guide](https://triniwiz.github.io/nativescript-mason/frameworks/). The package README is [packages/nativescript-masonkit/README.md](packages/nativescript-masonkit/README.md).

## Repository layout

| Path | What it is |
| --- | --- |
| [`packages/nativescript-masonkit`](packages/nativescript-masonkit) | The NativeScript plugin (TypeScript), framework entry points and prebuilt native libraries |
| `packages/nativescript-masonkit/src-native` | Kotlin (Android), Swift (iOS) and C++ (Windows) sources for the native side |
| [`crates/mason-core`](crates/mason-core) | Rust layout engine built on taffy |
| `crates/mason-android`, `mason-ios`, `mason-c`, `mason-windows` | Rust bindings per platform |
| [`apps`](apps) | Demo apps per flavour; `demo-solid` hosts the WebSpec layout suite |
| [`docs`](docs) | This project's documentation site (VitePress, deployed to GitHub Pages) |
| [`tools`](tools) | Build scripts, code generators and the Node test harness |

## Development

```bash
npm run setup          # clean install
npm start              # interactive task menu
npm test               # TypeScript unit tests (no device needed)
npm run test:rust      # mason-core tests
```

Building the native libraries needs Rust with the mobile targets and, for Android, the NDK. The full steps, environment variables and common build failures are in [Building from source](https://triniwiz.github.io/nativescript-mason/contributing/building), and the test suites are described in [Testing](https://triniwiz.github.io/nativescript-mason/contributing/testing).

To work on the docs site:

```bash
cd docs
npm install
npm run dev
```

## License

Apache License Version 2.0
