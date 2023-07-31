/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    ios: {
      type: 'ios.app',
      binaryPath: 'platforms/ios/build/Debug-iphonesimulator/[APP_NAME].app',
      build: 'ns build ios',
    },
    android: {
      type: 'android.apk',
      // "binaryPath": "platforms/android/app/build/outputs/apk/debug/app-debug.apk",
      // "testBinaryPath": "android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk",
      // testBinaryPath: 'platforms/android/app/build/outputs/apk/debug/app-debug.apk',
      binaryPath: 'platforms/android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'ns build android --detox --env.e2e',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 11 Pro',
      },
    },
    emulator: {
      type: 'android.emulator',
      binaryPath: 'platforms/android/app/build/outputs/apk/debug/app-debug.apk',
      device: {
        avdName: 'Pixel_5_API_31',
      },
    },
  },
  configurations: {
    ios: {
      device: 'simulator',
      app: 'ios',
    },
    android: {
      binaryPath: 'platforms/android/app/build/outputs/apk/debug/app-debug.apk',
      device: 'emulator',
      app: 'android',
    },
  },
};
