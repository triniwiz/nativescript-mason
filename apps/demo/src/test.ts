import { View } from '@triniwiz/nativescript-masonkit';
import { Frame, View as NSView, Utils } from '@nativescript/core';
export function run() {
  console.info('Running style property tests...');

  const root = new View();
  console.info('display default value: ', root.style.display, root.style.display === 'block');
  root.style.display = 'flex';
  console.info('display set flex: ', root.style.display, root.style.display === 'flex');
  root.style.display = 'invalid' as never;
  console.info('display set invalid value should return previous value flex', root.style.display, root.style.display === 'flex');

  console.info('boxSizing default value: ', root.style.boxSizing, root.style.boxSizing === 'border-box');
  root.style.boxSizing = 'content-box';
  console.info('boxSizing set content-box: ', root.style.boxSizing, root.style.boxSizing === 'content-box');
  root.style.boxSizing = 'invalid' as never;

  console.info('boxSizing set invalid value should return previous value content-box', root.style.boxSizing, root.style.boxSizing === 'content-box');

  console.info('overflow default value: ', root.style.overflow, root.style.overflow === 'visible');
  root.style.overflow = 'hidden';
  console.info('overflow set hidden: ', root.style.overflow, root.style.overflow === 'hidden');
  root.style.overflow = 'invalid' as never;
  console.info('overflow set invalid value should return previous value should equal hidden', root.style.overflow, root.style.overflow === 'hidden');

  console.info('overflowX default value: ', root.style.overflowX, root.style.overflowX === 'visible');
  root.style.overflowX = 'hidden';
  console.info('overflowX set hidden: ', root.style.overflowX, root.style.overflowX === 'hidden');
  root.style.overflowX = 'invalid' as never;
  console.info('overflowX set invalid value should return previous value should equal hidden', root.style.overflowX, root.style.overflowX === 'hidden');

  console.info('overflowY default value: ', root.style.overflowY, root.style.overflowY === 'visible');
  root.style.overflowY = 'hidden';
  console.info('overflowY set hidden: ', root.style.overflowY, root.style.overflowY === 'hidden');
  root.style.overflowY = 'invalid' as never;
  console.info('overflowY set invalid value should return previous value should equal hidden', root.style.overflowY, root.style.overflowY === 'hidden');

  if (__IOS__) {
    root._setupAsRootView({});
  } else {
    root._setupAsRootView(Utils.android.getCurrentActivity() || Utils.android.getApplicationContext());
  }

  root.callLoaded();

  //@ts-ignore
  console.log(root._styleHelper.toJSON());
}
