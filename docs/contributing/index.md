# Contributing

Thanks for helping out. This page covers how the repo is laid out and how a change gets from your editor to a merged PR. [Building from source](/contributing/building) and [Testing](/contributing/testing) have the details.

## Repository layout

```
crates/
  mason-core/         Rust layout engine, built on taffy
  mason-c/            C ABI over mason-core (used by iOS and Windows)
  mason-ios/          Static library for iOS (libmasonnative.a)
  mason-android/      JNI shared library for Android (libmasonnative.so)
  mason-windows/      Static library for the Windows component
  mason-playground/   Scratch binary for trying the engine from Rust

packages/nativescript-masonkit/
  *.ts                The plugin: elements, style buffer, CSS properties
  angular/ vue/ svelte/   Framework entry points
  platforms/          Prebuilt native libraries that ship in the npm package
    android/            masonkit-release.aar
    ios/                Mason.xcframework
    windows/            NativeScript.Mason.{dll,winmd} + MSBuild glue
  src-native/
    mason-android/    Kotlin library (Gradle) that produces the AAR
    mason-ios/        Swift framework (Xcode) that produces the xcframework
    windows/          C++/WinRT component

apps/
  demo/               Plain NativeScript (XML) demo
  demo-angular/  demo-react/  demo-solid/  demo-svelte/  demo-vue/

tools/
  scripts/            Build scripts and code generators
  testing/            Vitest config and the Node test kit

docs/                 This site (VitePress)
```

A few files are worth knowing before you start:

- `packages/nativescript-masonkit/style.ts`: the shared style buffer and every typed style setter.
- `packages/nativescript-masonkit/properties.ts`: CSS property registration on NativeScript's `Style`.
- `packages/nativescript-masonkit/web.ts`: the HTML-shaped elements (`div`, `p`, `h1`, ...).
- `packages/nativescript-masonkit/elements.ts`: the element registry every framework integration builds from.
- `tools/scripts/style-keys/style-keys.schema`: the single source for style buffer offsets in every language.
- `MASON_CONTEXT.md` at the repo root: long-form contributor notes, invariants and known gotchas.

## Workflow

1. Install dependencies from the repo root with `npm install`. (`npm run setup` does a clean reinstall, deleting `node_modules`, `dist` and `package-lock.json` first.)
2. Make your change. TypeScript edits go in `packages/nativescript-masonkit`; native edits go in `src-native/` or `crates/`.
3. Run the fast checks: `npm test`, plus `npm run test:rust` if you touched Rust. See [Testing](/contributing/testing).
4. If you changed native code, rebuild the AAR or xcframework and copy it into `platforms/`. See [Building from source](/contributing/building).
5. Rebuild the package and run a demo app on a device or simulator.
6. Open a PR against `main`.

`npm start` opens an interactive menu (`nps`) with commands to run, clean and focus each demo.

A pre-commit hook runs Prettier on staged `js`, `ts`, `scss`, `json` and `html` files.

::: tip Demo apps use the built package
Every demo except `apps/demo` depends on `dist/packages/nativescript-masonkit`, not the source folder. After editing the plugin's TypeScript, rebuild it:

```bash
npx nx run nativescript-masonkit:build.all
```

Native library changes need the app to be stopped and run again; livesync does not reload native code.
:::

## CI

Every PR and push to `main` runs `.github/workflows/pr.yml` on a plain Ubuntu runner (no device, no browser):

| Job | What it checks |
| --- | --- |
| Generated StyleKeys are up to date | `node tools/scripts/style-keys/generate.mjs --check` |
| TypeScript CSS value layer | `npm test`, `npm run test:jsx-types`, and a typecheck of the plugin (`tsc --noEmit`) |
| mason-core | `cargo fmt --all -- --check` and `cargo test -p mason-core --all-targets` |

`.github/workflows/nightly.yml` runs the slower checks once a day (and on demand):

| Job | What it checks |
| --- | --- |
| Chromium ground truth is unchanged | `npm run gen:webspec -- --check` against a real headless Chromium |
| Kotlin unit tests | `./gradlew :masonkit:testReleaseUnitTest` |
| Swift unit tests | `xcodebuild test -scheme Mason` on an iOS simulator |

A unit or parsing bug should fail in the PR workflow before it ever reaches a device.

## Working on these docs

The site lives in `docs/` with its own `package.json`, separate from the workspace:

```bash
cd docs
npm install
npm run dev      # local dev server with hot reload
npm run build    # production build into docs/.vitepress/dist
```

Pages are Markdown; the sidebar is in `docs/.vitepress/config.mts`. Pushes to `main` that touch `docs/` deploy the site to GitHub Pages.

## Releases

Maintainers publish with `npm run publish-packages`, which prompts for the packages and version to publish.
