# Testing

MasonKit has three layers of tests. The rule that keeps bugs cheap: **a unit or parsing bug must fail in the fast Node suite before it is allowed to reach a device.** Most bugs in the CSS value layer (wrong units, a shorthand mislabelling a bare number, a percentage off by 100x) are catchable in milliseconds there.

| Layer | Command | Needs |
| --- | --- | --- |
| TypeScript value layer | `npm test` | Node only |
| Generated code checks | `npm run test:keys`, `npm run test:jsx-types` | Node only |
| Rust engine | `npm run test:rust` | Rust |
| Kotlin / Swift unit tests | Gradle / `xcodebuild test` | JDK + Android SDK, or Xcode |
| Layout against a real browser | WebSpec in `apps/demo-solid` | A device or simulator |

## Node suite (`npm test`)

```bash
npm test          # run once
npm run test:watch
```

Vitest runs every `packages/**/*.spec.ts` and `tools/testing/**/*.spec.ts` in Node, with no device and no native build. The config is `tools/testing/vitest.config.ts`; helpers live in `tools/testing/mason-test-kit/`.

It works without touching production code:

- **The style buffer is a plain `ArrayBuffer`.** `style-under-test.ts` hands a `Style` a buffer sized from the StyleKeys schema, so setters write real bytes you can read back.
- **Offsets are read from the source**, not copied, so a test can't drift from `style.ts`.
- **`@nativescript/core` is stubbed just enough to load.** `ns-core-stub.ts` re-exports core's real classes from their leaf modules, and `platform-suffix-resolver.ts` resolves core's platform-suffixed imports. The `windows` and `windows-sync` projects also prefer MasonKit's own `*.windows.ts` modules, as the Windows build does.

The suite is split into Vitest projects. Most specs run platform-neutral (`__ANDROID__`, `__APPLE__` and `__WINDOWS__` all false). `*.android.spec.ts` and `*.windows.spec.ts` run with their platform flag set against mocked natives, and `style-native-sync.spec.ts` runs once per platform.

Useful guards to know about:

- `style.spec.ts` runs the unit table at screen scales 1, 2 and 3. At scale 1 a px/dip mix-up is invisible.
- `diagnostics.spec.ts` feeds a stylesheet's worth of declarations through the parsers and snapshots what was dropped, so a regression shows up as a new line.
- `properties.spec.ts` fails when a new CSS property collides with one NativeScript core already registers without being routed for plain views.
- `tools/testing/core-view-unaffected.spec.ts` checks that installing MasonKit doesn't change how plain NativeScript views handle CSS.

::: tip What not to test in Node
NativeScript core's selector engine and `CssState` need a live view tree and the application lifecycle. Selector matching stays on-device.
:::

## Generated code checks

```bash
npm run test:keys        # StyleKeys/StateKeys blocks match style-keys.schema
npm run test:jsx-types   # JSX intrinsic typings match the element registry
```

Both fail in CI when a generated file is stale or was edited by hand. Fix them by running the generator (`npm run gen:style-keys`, `npm run gen:jsx-types`) and committing the result.

## Rust (`npm run test:rust`)

```bash
npm run test:rust   # cargo test -p mason-core --all-targets
```

The integration tests in `crates/mason-core/tests/` cover flex, grid, block, inline flow, floats and writing modes, include batches ported from the Web Platform Tests (`wpt_*.rs`), and pin regressions in engine behaviour MasonKit depends on. CI also runs `cargo fmt --all -- --check`.

## Kotlin and Swift

Android JVM unit tests (parsers, geometry, no device):

```bash
cd packages/nativescript-masonkit/src-native/mason-android
./gradlew :masonkit:testReleaseUnitTest
```

Tests that load `libmasonnative` or use Android's text classes live in `androidTest` and run on a device or emulator:

```bash
./gradlew :masonkit:connectedReleaseAndroidTest
```

An instrumented run stops at the first native crash, so when chasing one, run a single class:

```bash
./gradlew :masonkit:connectedReleaseAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=org.nativescript.mason.masonkit.ScrollInstrumentedTest
```

iOS:

```bash
cd packages/nativescript-masonkit/src-native/mason-ios/Mason
xcodebuild test -project Mason.xcodeproj -scheme Mason \
  -destination 'platform=iOS Simulator,name=iPhone 16'
```

## WebSpec: layout against Chromium

WebSpec compares MasonKit's layout with a real browser. `tools/scripts/webspec-tests/generate.mjs` renders each fixture in headless Chromium (through Playwright), records the layout rect of every box, and writes the result to `apps/demo-solid/src/webspec/fixtures.generated.json`. The demo-solid app replays each fixture with MasonKit on a device and compares rects.

The fixtures are the vendored taffy/WPT flex and grid tests in `tools/scripts/gentests/taffy_tests`, plus hand-written ones in `tools/scripts/gentests/custom_element_tests` that check tag defaults such as heading and paragraph margins.

```bash
npx playwright install chromium   # once
npm run gen:webspec               # regenerate the committed ground truth
npm run gen:webspec -- --check    # fail if it is stale (the nightly job)
```

Running it on a device:

1. Rebuild the package (`npx nx run nativescript-masonkit:build.all`).
2. Run `apps/demo-solid` (`ns run ios` or `ns run android`). WebSpec is the initial route.
3. The run starts when the screen opens; **Run All** restarts it.

When a run finishes, the app logs a `WEBSPEC_RESULT {...}` line with pass and fail counts and writes the full failure list to `webspec-failures.json` in the app's documents folder. On Android you can pull it with:

```bash
adb shell run-as <app id> cat files/webspec-failures.json > webspec-failures.json
```

::: warning Flat 0x0 failures
A fixture where every box, root included, comes back 0x0 usually means the device stalled (a slow or overloaded emulator), not a layout bug. Re-run on an idle device before investigating. A real regression shows a wrong but non-zero rect.
:::

The fixtures use the Ahem test font, which ships in `apps/demo-solid/src/fonts/` so text metrics match the browser.
