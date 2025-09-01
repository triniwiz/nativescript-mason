import { Application, GridLayout } from '@nativescript/core';
import { run } from './test';
import { Style } from '@triniwiz/nativescript-masonkit/style';

if (__ANDROID__) {
  Application.android.on(Application.AndroidApplication.activityCreatedEvent, (args) => {
    setTimeout(() => {
      //   run();
    }, 4000);
    // try {
    //   const nativeView = org.nativescript.mason.masonkit.Mason.getShared().createView(args.activity);
    //   const view = {
    //     nativeView,
    //     android: nativeView,
    //     _hasNativeView: true,
    //     _isMasonView: true,
    //   };
    //   const a = Style.fromView(view as never, nativeView, false);
    //   a.display = 'grid';
    //   a.gridAutoRows = '150px';
    //   a.gridGap = '10px';
    //   a.padding = '10px';

    //   // console.log(a.style.gridAutoRows);
    //   console.log(a);
    // } catch (error) {
    //   console.log('Error:', error);
    // }
  });
} else {
  run();
}

Application.run({ moduleName: 'app-root' });
