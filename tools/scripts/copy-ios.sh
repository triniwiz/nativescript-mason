#! /bin/bash
LIB_NAME="masonnative"
FRAMEWORK="Mason"


cp -r ./mason-ios/include ../../platforms/ios/src/cpp
cp ./target/aarch64-apple-ios/release/libmasonnative.a  ../mason-ios/Mason/libs/arm64-iphoneos
cp ./target/aarch64-apple-ios-sim/release/libmasonnative.a  ../mason-ios/Mason/libs/arm64-iphonesimulator
cp ./target/x86_64-apple-ios/release/libmasonnative.a  ../mason-ios/Mason/libs/x86_64-iphonesimulator
cp ./target/aarch64-apple-ios-macabi/release/libmasonnative.a  ../mason-ios/Mason/libs/arm64-maccatalyst
cp ./target/x86_64-apple-ios-macabi/release/libmasonnative.a  ../mason-ios/Mason/libs/x86_64-maccatalyst
#mkdir target/simulator_fat
#rm -rf target/$FRAMEWORK.xcframework
#rm target/simulator_fat/lib$LIB_NAME.dylib
