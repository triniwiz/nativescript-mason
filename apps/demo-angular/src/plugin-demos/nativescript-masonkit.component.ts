import { Component, inject, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule, RouterExtensions } from '@nativescript/angular';
import { DemoSharedNativescriptMasonkit } from '@demo/shared';

@Component({ selector: 'demo-nativescript-masonkit', templateUrl: 'nativescript-masonkit.component.html', imports: [NativeScriptCommonModule], schemas: [NO_ERRORS_SCHEMA] })
export class NativescriptMasonkitComponent {
  protected readonly router = inject(RouterExtensions);
  readonly demoShared = new DemoSharedNativescriptMasonkit();
}
