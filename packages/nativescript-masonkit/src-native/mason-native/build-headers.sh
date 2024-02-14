#!/bin/bash

cbindgen --config mason-ios/cbindgen.toml  mason-ios/src/lib.rs -l c > ../mason-ios/Mason/include/mason_ios.h
cbindgen --config mason-c/cbindgen.toml  mason-c/src/lib.rs -l c > ../mason-ios/Mason/include/mason_native.h
cbindgen --config mason-c/cbindgen.toml  mason-c/src/lib.rs -l c > mason-ios/include/mason_native.h
#cbindgen --config mason-c/cbindgen.toml  mason-c/src/lib.rs -l c > ../../platforms/ios/src/cpp/include/mason_native.h
cbindgen --config mason-android/cbindgen.toml  mason-android/src/lib.rs -l c > ../mason-android/masonkit/src/main/cpp/include/mason_android.h
cbindgen --config mason-c/cbindgen.toml  mason-c/src/lib.rs -l c > ../mason-android/masonkit/src/main/cpp/include/mason_native.h
