#!/bin/bash
# Builds libmasonkit.so (crates/mason-linux) into packages/nativescript-masonkit/platforms/linux.
#
# Needs the GTK 4 (>= 4.6) development files, or NS_SYSROOT pointing at a sysroot made by
# NativeScript/linux's metadata-generator/linux/fetch-sysroot.sh (headers and .pc files only).
#
# Links libfontmanager.so from @nativescript/font-manager (resolved from the package, or
# FONT_MANAGER_DIR pointing at a font-manager package folder).
#
# Usage: tools/scripts/masonkit-build-linux.sh [--debug]
set -euo pipefail
cd "$(dirname "$0")/../.."

PROFILE=release
[ "${1:-}" = "--debug" ] && PROFILE=debug

case "$(uname -m)" in
    x86_64) ARCH=x64; TRIPLE=x86_64-linux-gnu ;;
    aarch64) ARCH=arm64; TRIPLE=aarch64-linux-gnu ;;
    *) echo "unsupported architecture $(uname -m)" >&2; exit 1 ;;
esac

if ! pkg-config --exists 'gtk4 >= 4.6' 2>/dev/null; then
    SYSROOT="${NS_SYSROOT:-/tmp/ns-sysroot}"
    [ -f "$SYSROOT/usr/lib/$TRIPLE/pkgconfig/gtk4.pc" ] || {
        echo "GTK 4 development files not found: install libgtk-4-dev or set NS_SYSROOT" >&2
        exit 1
    }
    host_pc=$(pkg-config --variable pc_path pkg-config)
    export PKG_CONFIG_SYSROOT_DIR="$SYSROOT"
    export PKG_CONFIG_LIBDIR="$(echo "$host_pc" | tr ':' '\n' | sed "s|^|$SYSROOT|" | paste -sd:):$host_pc"
    # A sysroot's lib*.so links point at runtime libraries it doesn't have: link the host's.
    LINK="$PWD/target/linux-link"
    mkdir -p "$LINK"
    for dev in "$SYSROOT/usr/lib/$TRIPLE"/lib*.so; do
        soname=$(readlink "$dev" || true)
        [ -n "$soname" ] && [ -e "/usr/lib/$TRIPLE/$soname" ] && ln -sf "/usr/lib/$TRIPLE/$soname" "$LINK/$(basename "$dev")"
    done
    export RUSTFLAGS="${RUSTFLAGS:-} -L $LINK"
fi

FM_DIR="${FONT_MANAGER_DIR:-$(cd packages/nativescript-masonkit && node -p "require('path').dirname(require.resolve('@nativescript/font-manager/package.json'))" 2>/dev/null || true)}"
export FONT_MANAGER_LIB_DIR="$FM_DIR/platforms/linux/lib/$ARCH"
[ -f "$FONT_MANAGER_LIB_DIR/libfontmanager.so" ] || {
    echo "libfontmanager.so not found in '$FONT_MANAGER_LIB_DIR': install @nativescript/font-manager or set FONT_MANAGER_DIR" >&2
    exit 1
}

FLAGS=()
[ "$PROFILE" = release ] && FLAGS+=(--release)
cargo build -p mason-linux "${FLAGS[@]}"

OUT=packages/nativescript-masonkit/platforms/linux
mkdir -p "$OUT/lib/$ARCH" "$OUT/include"
install -m 755 "target/$PROFILE/libmasonkit.so" "$OUT/lib/$ARCH/libmasonkit.so"
cp crates/mason-linux/include/mason_linux.h "$OUT/include/"
echo "built $OUT/lib/$ARCH/libmasonkit.so ($PROFILE)"
