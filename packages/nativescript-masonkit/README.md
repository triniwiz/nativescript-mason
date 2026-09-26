# @triniwiz/nativescript-masonkit

```javascript
ns plugin add @triniwiz/nativescript-masonkit
```

## Usage

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
