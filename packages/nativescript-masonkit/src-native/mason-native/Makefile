ARCHS_IOS = x86_64-apple-ios aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios-macabi aarch64-apple-ios-macabi
ARCHS_ANDROID = i686-linux-android x86_64-linux-android aarch64-linux-android armv7-linux-androideabi

all:GENERATE_HEADERS ios android

ios: GENERATE_IOS

android: GENERATE_ANDROID

.PHONY: GENERATE_HEADERS
GENERATE_HEADERS:
	./build-headers.sh

# PHONY keyword on make means this is not a file, just an identifier for a target
.PHONY: $(ARCHS_IOS)
$(ARCHS_IOS): %:
	./build-ios.sh $@

.PHONY: GENERATE_IOS
GENERATE_IOS: $(ARCHS_IOS)
	./copy-ios.sh

.PHONY: $(ARCHS_ANDROID)
$(ARCHS_ANDROID): %:
	./build-android.sh $@

.PHONY: GENERATE_ANDROID
GENERATE_ANDROID: $(ARCHS_ANDROID)
	./copy-android.sh

.PHONY: clean
clean:
	cargo clean

