import { Observable, EventData, Page } from '@nativescript/core';
import { DemoSharedNativescriptMasonkit } from '@demo/shared';
import {} from '@triniwiz/nativescript-masonkit';

export function navigatingTo(args: EventData) {
  const page = <Page>args.object;
  page.bindingContext = new DemoModel();
}

export function loaded(args) {
  const view = args.object;
  setTimeout(() => {
    console.time('set values');

    for (let i = 0; i < 1000; i++) {
      view.display = 'none';

      // console.log(view.height);

      view.height = { value: 100, unit: 'px' };
      //console.log(view.height);

      //console.log(view.width);

      view.width = { value: 200, unit: 'px' };

      // console.log(view.width);
    }

    console.timeEnd('set values');
  }, 300);
}

export class DemoModel extends DemoSharedNativescriptMasonkit {}
