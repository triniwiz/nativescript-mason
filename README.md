# @triniwiz/\* plugins

```
npm run setup
npm start
```

- [@triniwiz/nativescript-masonkit](packages/nativescript-masonkit/README.md)

# How to use?

This workspace manages the suite of plugins listed above.

In general, when in doubt with what to do, just `npm start`.

## Contributing

1. Ensure using latest rust tooling
   
```bash
rustup update
```

2. Build iOS and Android

First setup the targets:

```bash
rustup target add i686-linux-android x86_64-linux-android armv7-linux-androideabi aarch64-linux-android
```

Now compile.

```bash
make ios
make android
```

If you get `error: linking with `cc` failed: exit status: 1`, there's couple things to check.

Make sure you have recent version of the NDK with environment set, for example:

```bash
export ANDROID_NDK=$ANDROID_HOME/ndk/27.2.12479018
```

You can run `cargo build --target aarch64-linux-android` to get more verbase detail.

You may want these environment variables set within the terminal window:

```bash
export PATH=$PATH:$ANDROID_NDK/toolchains/llvm/prebuilt/darwin-x86_64/bin
export CC_armv7_linux_androideabi=armv7a-linux-androideabi21-clang
export CXX_armv7_linux_androideabi=armv7a-linux-androideabi21-clang++
export AR_armv7_linux_androideabi=llvm-ar
export CARGO_TARGET_ARMV7_LINUX_ANDROIDEABI_LINKER=armv7a-linux-androideabi21-clang

export CC_aarch64_linux_android=aarch64-linux-android21-clang
export CXX_aarch64_linux_android=aarch64-linux-android21-clang++
export AR_aarch64_linux_android=llvm-ar
export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER=aarch64-linux-android21-clang

export CC_i686_linux_android=i686-linux-android21-clang
export CXX_i686_linux_android=i686-linux-android21-clang++
export AR_i686_linux_android=llvm-ar
export CARGO_TARGET_I686_LINUX_ANDROID_LINKER=i686-linux-android21-clang

export CC_x86_64_linux_android=x86_64-linux-android21-clang
export CXX_x86_64_linux_android=x86_64-linux-android21-clang++
export AR_x86_64_linux_android=llvm-ar
export CARGO_TARGET_X86_64_LINUX_ANDROID_LINKER=x86_64-linux-android21-clang
```

## How to add a new package to workspace?

```
npm run add
```

At the prompt, enter the name of the new package.

- This adds a plugin harness in `packages` with the necessary boilerplate to just start developing
- Updates all demo app flavors to support demoing the new package
- Adds shared code in `tools/demo` where you can write demo code **once** and share across all demo flavors
- Updates build tooling to support the new package
- Updates the `npm start` interactive display
- Updates the README here to list the new package

## How to add Angular compatibility to a package

```
npm run add-angular
```

At the prompt, enter the name of the package to add an `angular` folder to it with the necessary boilerplate to provide Angular support to the package.

## How to focus on just 1 package to develop in isolation

```
npm start
```

- Choose the focus commands for the package you wish to focus on and hit enter.
- All the demo app's will be updated to isolate that 1 package and for supported IDE's (currently VS Code), the source code will also become isolated in the workspace.

Note: _good to always clean the demo you plan to run after focusing. (You can clean any demo from `npm start` as well)_

## How to publish packages?

```
npm run publish-packages
```

- You will be prompted for the package names to publish. Leaving blank and hitting enter will publish them all.
- You will then be prompted for the version to use. Leaving blank will auto bump the patch version (it also handles prerelease types like alpha, beta, rc, etc. - It even auto tags the corresponding prelease type on npm).
- You will then be given a brief sanity check 🧠😊

<h3 align="center">Made with ❤️</h3>
