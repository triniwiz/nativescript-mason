#!/bin/bash

cbindgen --config crates/mason-ios/cbindgen.toml  crates/mason-ios/src/lib.rs -l c > packages/nativescript-mason/src-native/mason-ios/Mason/include/mason_ios.h
cbindgen --config crates/mason-c/cbindgen.toml  crates/mason-c/src/lib.rs -l c >  packages/nativescript-mason/src-native/mason-ios/Mason/include/mason_native.h
cbindgen --config crates/mason-c/cbindgen.toml  crates/mason-c/src/lib.rs -l c > packages/nativescript-mason/platforms/ios/src/cpp/include/mason_native.h
cbindgen --config crates/mason-android/cbindgen.toml  crates/mason-android/src/lib.rs -l c >  packages/nativescript-mason/src-native/mason-android/masonkit/src/main/cpp/include/mason_android.h
cbindgen --config crates/mason-c/cbindgen.toml  crates/mason-c/src/lib.rs -l c >  packages/nativescript-mason/src-native/mason-android/masonkit/src/main/cpp/include/mason_native.h