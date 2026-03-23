#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."
ANDROID_DIR="$PROJECT_ROOT/packages/nativescript-masonkit/src-native/mason-android"
PLATFORMS_DIR="$PROJECT_ROOT/packages/nativescript-masonkit/platforms/android"

cd "$ANDROID_DIR"

mkdir -p "$PLATFORMS_DIR"

echo "Build Android AAR"
./gradlew :masonkit:assembleRelease -Prust.targets=all

echo "Copy masonkit-release.aar to platforms/android"
cp masonkit/build/outputs/aar/masonkit-release.aar "$PLATFORMS_DIR/masonkit-release.aar"

echo "Done"
