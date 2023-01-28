# @triniwiz/nativescript-masonkit

```javascript
ns plugin add @triniwiz/nativescript-masonkit
```

## Usage

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
