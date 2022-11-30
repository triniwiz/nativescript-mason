import { Observable, EventData, Page } from '@nativescript/core';
import { DemoSharedNativescriptMasonkit } from '@demo/shared';
import {} from '@triniwiz/nativescript-masonkit';

export function navigatingTo(args: EventData) {
  const page = <Page>args.object;
  page.bindingContext = new DemoModel();
}

export class DemoModel extends DemoSharedNativescriptMasonkit {}
