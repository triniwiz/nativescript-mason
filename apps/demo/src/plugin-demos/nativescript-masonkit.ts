import { Observable, EventData, Page } from '@nativescript/core';
import { DemoSharedNativescriptMasonkit } from '@demo/shared';
import {} from '@triniwiz/nativescript-masonkit';

export function navigatingTo(args: EventData) {
  const page = <Page>args.object;
  page.bindingContext = new DemoModel();
}

export function loaded(args) {
  const view = args.object;
  // setTimeout(() => {
  //   console.log('display value:', view.display);

  //   console.log('width value:', view.width);

  //   console.log('height value:', view.height);

  //   console.time('set values');

  //   for (let i = 0; i < 1000; i++) {
  //     view.display = 'none';

  //     // console.log(view.height);

  //     view.height = { value: 100, unit: 'dip' };
  //     const h = view.height;
  //     //console.log(view.height);

  //     //console.log(view.width);

  //     view.width = { value: 200, unit: 'dip' };
  //     const w = view.width;
  //     // console.log(view.width);
  //   }

  //   console.timeEnd('set values');

  //   console.time('get height');

  //   for (let i = 0; i < 1000; i++) {
  //     const h = view.height;
  //   }

  //   console.timeEnd('get height');

  //   console.time('get width');

  //   for (let i = 0; i < 1000; i++) {
  //     const w = view.width;
  //   }

  //   console.timeEnd('get width');

  //   console.log('display updated value:', view.display);

  //   console.log('width updated value:', view.width);

  //   console.log('height updated value:', view.height);
  // }, 300);

  setTimeout(() => {
    view.nativeView.requestLayout();
  }, 5000);
}

export class DemoModel extends DemoSharedNativescriptMasonkit {}
