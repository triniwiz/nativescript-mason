import { Application } from '@nativescript/core';

declare const __non_webpack_require__;

// load with java system before requiring which in turn calls dlopen
//java.lang.System.loadLibrary('masonnative');

//__non_webpack_require__('system_lib://libmasonnativev8.so');

//__non_webpack_require__('./libmasonnativev8.so');

// try {
//   console.log(global.__Mason_setWidth, global.__Mason_setHeight);
// } catch (error) {
//   console.log(error);
// }
Application.run({ moduleName: 'app-root' });
