#!/bin/sh

echo "Set exit on simple errors"
set -e

rm -rf $(PWD)/dist


echo "Build for iphonesimulator"
xcodebuild \
    -project Mason/Mason.xcodeproj \
    -scheme Mason \
    -sdk iphonesimulator \
    -destination "generic/platform=iOS Simulator" \
    -configuration Release \
    clean build \
    BUILD_DIR=$(PWD)/dist \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    -quiet

echo "Build for iphoneos"
xcodebuild \
    -project Mason/Mason.xcodeproj \
    -scheme Mason \
    -sdk iphoneos \
    -destination "generic/platform=iOS" \
    -configuration Release \
    clean build \
    BUILD_DIR=$(PWD)/dist \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    -quiet

echo "Creating XCFramework"
xcodebuild \
    -create-xcframework \
    -framework $(PWD)/dist/Release-iphoneos/Mason.framework \
    -debug-symbols $(PWD)/dist/Release-iphoneos/Mason.framework.dSYM \
    -framework $(PWD)/dist/Release-iphonesimulator/Mason.framework \
    -debug-symbols $(PWD)/dist/Release-iphonesimulator/Mason.framework.dSYM \
    -output $(PWD)/dist/Mason.xcframework