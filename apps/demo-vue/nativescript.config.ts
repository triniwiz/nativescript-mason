import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.nativescript.plugindemovue',
  appResourcesPath: '../../tools/assets/App_Resources',
  appPath: 'app',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
    maxLogcatObjectSize: 4092,
  },
  tailwind: {
    autoload: true,
  },
} as NativeScriptConfig;
