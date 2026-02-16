#!/bin/bash
cd ../../packages/nativescript-masonkit/src-native/mason-android
set -e

mkdir -p ../../platforms/android

echo "Build Android AAR"
./gradlew :masonkit:assembleRelease

echo "Copy masonkit-release.aar to platforms/android"
cp masonkit/build/outputs/aar/masonkit-release.aar ../../platforms/android/masonkit-release.aar

echo "Done"
