#!/usr/bin/env bash
set -e

source $HOME/.cargo/env
source $HOME/.profile

whereis cc

function to_bool() {
  local arg="$1"
  case "$(echo "$arg" | tr '[:upper:]' '[:lower:]')" in
  [0-9]+)
    if [ $arg -eq 0 ]; then
      echo false
    else
      echo true
    fi
    ;;
  n | no | f | false) echo false ;;
  y | yes | t | true) echo true ;;
  *)
    if [ -n "$arg" ]; then
      echo "warning: invalid boolean argument ('$arg'). Expected true or false" >&2
    fi
    echo false
    ;;
  esac
}

CWD="$SRCROOT/../../../../../crates"
pushd "$SRCROOT/../../../../.."

IS_SIMULATOR=false

IS_RELEASE=false
RUST_BUILD_TYPE=""
RUST_BUILD_TARGET=""

if [[ $CONFIGURATION == Release ]]; then
  IS_RELEASE=true
fi



if $IS_RELEASE; then
  RUST_BUILD_TYPE="--release"
fi



PLATFORM_NAME="${PLATFORM_NAME:-iphoneos}"
CURRENT_ARCH="${CURRENT_ARCH}"

# visionOS (xrOS) is a tier-3 Rust target (no prebuilt std) — built with nightly
# `-Z build-std`. PLATFORM_NAME is "xros" (device) / "xrsimulator" (simulator).
IS_VISIONOS=false
if [[ "$PLATFORM_NAME" == "xros" || "$PLATFORM_NAME" == "xrsimulator" ]]; then
  IS_VISIONOS=true
fi

if [[ "$PLATFORM_NAME" == *"simulator"* ]]; then
    IS_SIMULATOR=true
fi

if [ -z "$CURRENT_ARCH" ] || [ "$CURRENT_ARCH" == "undefined_arch" ]; then
    # Undefined (e.g. a generic destination): fall back to the requested $ARCHS, not a hardcoded arm64.
    CURRENT_ARCH="${ARCHS%% *}"
    if [ -z "$CURRENT_ARCH" ]; then
        CURRENT_ARCH="arm64"
    fi
fi


if $IS_VISIONOS; then
  if $IS_SIMULATOR; then
    RUST_BUILD_TARGET="aarch64-apple-visionos-sim"
  else
    RUST_BUILD_TARGET="aarch64-apple-visionos"
  fi
elif [[ $CURRENT_ARCH == x86_64 ]]; then
  RUST_BUILD_TARGET="x86_64-apple-ios"
elif [[ $CURRENT_ARCH == arm64 ]]; then
  if [[ $IS_SIMULATOR == false ]]; then
    RUST_BUILD_TARGET="aarch64-apple-ios"
  else
    RUST_BUILD_TARGET="aarch64-apple-ios-sim"
  fi
fi


export RUST_SRC_PATH="$(rustc --print sysroot)/lib/rustlib/src/rust/src"
export DYLD_LIBRARY_PATH="$(rustc --print sysroot)/lib:$DYLD_LIBRARY_PATH:$DYLD_FALLBACK_LIBRARY_PATH"
export RUST_BUILD_TARGET="$RUST_BUILD_TARGET"

cbindgen --config "$CWD/mason-c/cbindgen.toml"  "$CWD/mason-c/src/lib.rs" -l c >"$SRCROOT/Mason/include/mason_native.h"
cbindgen --config "$CWD/mason-ios/cbindgen.toml"  "$CWD/mason-ios/src/lib.rs" -l c >"$SRCROOT/Mason/include/mason_ios.h"


if $IS_VISIONOS; then
  # Tier-3 target: build std from source. Requires the `rust-src` component and a
  # nightly toolchain (rustup component add rust-src; rustup toolchain install nightly).
  cargo +nightly build -Z build-std=std,panic_abort --manifest-path Cargo.toml --target $RUST_BUILD_TARGET $RUST_BUILD_TYPE -p mason-ios
elif $IS_RELEASE; then
  # export RUSTFLAGS="-Zlocation-detail=none -C panic=abort -Zfmt-debug=none -Zunstable-options -Cpanic=immediate-abort"
  cargo build  --manifest-path Cargo.toml --target $RUST_BUILD_TARGET $RUST_BUILD_TYPE -p mason-ios

else
  cargo build --manifest-path Cargo.toml --target $RUST_BUILD_TARGET $RUST_BUILD_TYPE -p mason-ios
fi


#cargo build --target aarch64-apple-ios -p camasonnvas-ios

# cargo +nightly build -Z build-std='std'  --manifest-path Cargo.toml --target $RUST_BUILD_TARGET $RUST_BUILD_TYPE -p mason-ios
popd
