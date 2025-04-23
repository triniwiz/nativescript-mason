import { Application, GridLayout } from '@nativescript/core';
import { View } from '@triniwiz/nativescript-masonkit';

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

/*
console.time('legacy');
const legacy = Array.from({ length: 1000 }).map((_, i) => {
  const grid = new GridLayout();
  grid.width = 100;
  grid.height = 100;
  return grid;
});
console.timeEnd('legacy');

console.time('mason');
const mason = Array.from({ length: 1000 }).map((_, i) => {
  const grid = new View();
  // grid.display = 'grid';
  // grid.width = 100;
  // grid.height = 100;
  return grid;
});
console.timeEnd('mason');

*/

Application.run({ moduleName: 'app-root' });
