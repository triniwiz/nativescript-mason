#!/bin/bash

TARGET="$1"

if [ "$TARGET" = "" ]; then
    echo "missing argument TARGET"
    echo "Usage: $0 TARGET"
    exit 1
fi

cargo +nightly build -Z build-std='std,panic_abort'  -Z build-std-features=panic_immediate_abort --target $TARGET --release $EXTRA_ARGS -p mason-ios