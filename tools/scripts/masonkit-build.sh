#!/bin/bash
cd ../../packages/nativescript-masonkit/src-native/mason-ios
set -e


rm -rf ../platforms/ios || true
mkdir -p ../platforms/ios

echo "Build iOS"
./build.sh
#cd ..
echo "Copy /build/*.xcframework platforms/ios"

cp -R build/Mason.xcframework ../../platforms/ios