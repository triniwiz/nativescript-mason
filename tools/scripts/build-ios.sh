#!/bin/bash

TARGET="$1"

if [ "$TARGET" = "" ]; then
    echo "missing argument TARGET"
    echo "Usage: $0 TARGET"
    exit 1
fi
RUSTFLAGS="-Zlocation-detail=none -C panic=abort -Zfmt-debug=none" \
cargo +nightly build -Z build-std='std,panic_abort'  -Z build-std-features='panic_immediate_abort,optimize_for_size' --target $TARGET --release $EXTRA_ARGS -p mason-ios