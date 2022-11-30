#!/bin/bash
cd ../../packages/nativescript-masonkit/src-native/mason-ios
set -e


rm -rf ../platforms/ios || true
mkdir -p ../platforms/ios

echo "Build iOS"
./build.sh
#cd ..
echo "Copy /dist/*.xcframework platforms/ios"

cp -R dist/Mason.xcframework ../../platforms/ios
