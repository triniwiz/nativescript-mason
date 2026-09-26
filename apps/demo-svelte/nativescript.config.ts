import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.nativescript.plugindemosvelte',
  appResourcesPath: '../../tools/assets/App_Resources',
  appPath: 'app',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
  },
} as NativeScriptConfig;
