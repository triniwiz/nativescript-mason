ARCHS_IOS = x86_64-apple-ios aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios-macabi aarch64-apple-ios-macabi
ARCHS_ANDROID = i686-linux-android x86_64-linux-android aarch64-linux-android armv7-linux-androideabi
XCFRAMEWORK = Mason.xcframework
all:GENERATE_HEADERS ios android

ios: $(XCFRAMEWORK)

android: GENERATE_ANDROID

.PHONY: GENERATE_HEADERS
GENERATE_HEADERS:
	./tools/scripts/build-headers.sh

.PHONY: $(ARCHS_IOS)
$(ARCHS_IOS): %:
#   cargo +nightly build -Z build-std='std,panic_abort' --target $@ -p mason-ios
# 	RUSTFLAGS="-Zlocation-detail=none -C panic=abort -Zfmt-debug=none -Zunstable-options -Cpanic=immediate-abort" cargo +nightly build -Z build-std='std'  -Z build-std-features='optimize_for_size' --target $@ --release -p mason-ios
	cargo build --target $@ --release -p mason-ios

$(XCFRAMEWORK): $(ARCHS_IOS)

.PHONY: $(ARCHS_ANDROID)
$(ARCHS_ANDROID): %:
	./tools/scripts/build-android.sh $@

.PHONY: GENERATE_ANDROID
GENERATE_ANDROID: $(ARCHS_ANDROID)

.PHONY: clean
clean:
	cargo clean

