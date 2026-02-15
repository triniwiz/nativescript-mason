import { Observable, EventData, Page } from '@nativescript/core';
import { DemoSharedNativescriptMasonkit } from '@demo/shared';
import { Text, TextNode } from '@triniwiz/nativescript-masonkit';

let demoShared: DemoSharedNativescriptMasonkit;
export function navigatingTo(args: EventData) {
  const page = <Page>args.object;
  demoShared = new DemoModel();
  page.bindingContext = demoShared;
}

export function textLoaded(args) {
  const view = args.object as Text;

  // const nativeView = view.nativeView as org.nativescript.mason.masonkit.TextView;
  // console.log('text loaded', nativeView.getOwner());
  // console.log('text loaded', view.nativeView.getCurrentText());
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
}

export class DemoModel extends DemoSharedNativescriptMasonkit {
  text: Text;
  textNode: TextNode;

  onChange(args) {
    const textField = args.object;
    if (this.text) {
      //  const data = new TextNode();
      // this.text.textContent = textField.text;
      this.textNode.data = textField.text;
    }
  }

  textLoaded(args) {
    const view = args.object as Text;
    this.text = view;
    this.textNode = new TextNode();
    view.addChild(this.textNode);
  }
}
