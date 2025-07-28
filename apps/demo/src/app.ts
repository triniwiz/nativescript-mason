import { Application, GridLayout } from '@nativescript/core';
import { View } from '@triniwiz/nativescript-masonkit';
import { Style } from '@triniwiz/nativescript-masonkit/style';

Application.android.on(Application.AndroidApplication.activityCreatedEvent, (args) => {
  try {
    const nativeView = org.nativescript.mason.masonkit.Mason.getShared().createView(args.activity);
    const view = {
      nativeView,
      android: nativeView,
      _hasNativeView: true,
      _isMasonView: true,
    };
    const a = Style.fromView(view as never, nativeView, false);
    a.display = 'grid';
    a.gridAutoRows = '150px';
    a.gridGap = '10px';
    a.padding = '10px';

    // console.log(a.style.gridAutoRows);
    console.log(a);
  } catch (error) {
    console.log('Error:', error);
  }
});

Application.run({ moduleName: 'app-root' });
