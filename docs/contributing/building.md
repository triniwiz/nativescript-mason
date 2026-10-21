# Building from source

The npm package ships prebuilt native libraries in `packages/nativescript-masonkit/platforms/`. You only need to rebuild them when you change Rust, Kotlin, Swift or C++ code. TypeScript changes only need the package rebuild at the end of this page.

## Prerequisites

- Node 22 or later (CI uses 22).
- Rust via [rustup](https://rustup.rs). Keep it current with `rustup update`.
- [cbindgen](https://github.com/mozilla/cbindgen) (`cargo install cbindgen`). The iOS build regenerates the C headers with it on every build.
- Android: the Android SDK with an NDK installed, and JDK 17.
- iOS: Xcode on macOS.
- Windows: see [Windows](/platforms/windows#building-the-component).

Rust targets:

```bash
# Android
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

# iOS (device, Apple Silicon simulator, Intel simulator)
rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
```

visionOS is a tier-3 Rust target with no prebuilt standard library. It builds with nightly and `-Z build-std`, so it also needs:

```bash
rustup toolchain install nightly
rustup component add rust-src --toolchain nightly
```

## Android AAR

The Kotlin library builds the Rust crate itself through the `rust-android-gradle` plugin, so one Gradle command produces the whole AAR:

```bash
cd packages/nativescript-masonkit/src-native/mason-android
./gradlew :masonkit:assembleRelease -Prust.targets=all
cp masonkit/build/outputs/aar/masonkit-release.aar ../../platforms/android/
```

Or run both steps with the package script:

```bash
cd packages/nativescript-masonkit
npm run build:android
```

`-Prust.targets` picks the ABIs: `all` (arm, arm64, x86, x86_64), a comma-separated list such as `arm64,x86_64`, or leave it out to build only your host architecture, which is much faster while iterating.

::: warning Environment traps
Both of these fail with a one-line `BUILD FAILED` that says nothing about the cause.

- **`rustc` and `cargo` must be on the Gradle daemon's `PATH`**, not just your shell's. The failure reads `A problem occurred starting process 'command 'rustc''`. After changing your environment, run with `--no-daemon` (or `./gradlew --stop` first).
- **A Rust build script runs `python`, not `python3`.** On macOS `/usr/bin/python3` is an Xcode shim that fails when invoked as `python`. Put a real shim ahead of it on `PATH`:

  ```sh
  #!/bin/sh
  exec /usr/bin/python3 "$@"
  ```
:::

::: tip Check the AAR timestamp
A failed `assembleRelease` can leave the previous AAR in `masonkit/build/outputs/aar`. Check its modification time before copying it, or you will ship the old binary.
:::

## iOS xcframework

The Xcode project has a **Build Mason Rust** build phase (`src-native/mason-ios/Mason/pre-build.sh`) that regenerates the C headers with cbindgen and builds the `mason-ios` crate for each architecture Xcode is building. So the framework build is one script:

```bash
cd packages/nativescript-masonkit/src-native/mason-ios
./build.sh                      # iOS device + simulator
INCLUDE_VISIONOS=1 ./build.sh   # plus visionOS device + simulator
rm -rf ../../platforms/ios/Mason.xcframework
cp -R dist/Mason.xcframework ../../platforms/ios/
```

`build.sh` builds Release frameworks for each SDK and combines them into `dist/Mason.xcframework`.

The package script does the visionOS build and the copy in one step:

```bash
cd packages/nativescript-masonkit
npm run build:ios
```

`npm run build:native` runs `build:android` and then `build:ios`.

::: warning pre-build.sh reads your shell profile
The Xcode build phase runs `source $HOME/.cargo/env` and `source $HOME/.profile` under `set -e`. If either file is missing the phase fails, so make sure both exist and put `cargo`, `rustc` and `cbindgen` on `PATH` there.
:::

## Windows component

```powershell
cd packages/nativescript-masonkit/src-native/windows
pwsh ./publish.ps1
```

This builds the `mason-windows` crate and the C++/WinRT component for x64 and ARM64 and copies the binaries into `platforms/windows/`. Prerequisites and the native test harness are on the [Windows page](/platforms/windows#building-the-component).

## Manual Rust builds

You rarely need these, since Gradle and Xcode drive Cargo for you. To check that a crate compiles for a target:

```bash
cargo build --release -p mason-ios --target aarch64-apple-ios
cargo build -p mason-android --target aarch64-linux-android
```

Building `mason-android` by hand needs the NDK's clang as the linker. If you see `error: linking with 'cc' failed`, point Cargo at the NDK toolchain (adjust the NDK version and host to yours):

```bash
export ANDROID_NDK=$ANDROID_HOME/ndk/<version>
export PATH=$PATH:$ANDROID_NDK/toolchains/llvm/prebuilt/darwin-x86_64/bin
export CC_aarch64_linux_android=aarch64-linux-android21-clang
export AR_aarch64_linux_android=llvm-ar
export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER=aarch64-linux-android21-clang
```

The same three variables exist for `armv7_linux_androideabi` (`armv7a-linux-androideabi21-clang`), `i686_linux_android` and `x86_64_linux_android`.

`./tools/scripts/build-headers.sh` regenerates every cbindgen header (iOS, Android and the C ABI) from the repo root.

## Rebuilding the package

The demo apps (all except `apps/demo`) consume the built package from `dist/`. After TypeScript or native changes:

```bash
npx nx run nativescript-masonkit:build.all
```

This compiles the TypeScript and the Angular, Vue and Svelte entry points, and copies `platforms/` into `dist/packages/nativescript-masonkit`. `@nx/js:tsc` infers ESM from the tsconfig and writes `"type": "module"` into the dist `package.json`, which would make Node load `nativescript.webpack.js` as ESM; `tools/scripts/build-finish.ts` restores the source package's `type` and `module` fields.

## Running a demo

```bash
cd apps/demo-solid
ns run ios
ns run android
```

Or pick a demo from the `npm start` menu. Two things to know:

- `ANDROID_HOME` must be exported in the shell that runs `ns run android`.
- `ns run ios` needs `LANG` and `LC_ALL` set (for example `en_US.UTF-8`), or the CocoaPods check fails.

Native library changes need `ns run` to be stopped and started again; livesync only reloads JavaScript.
