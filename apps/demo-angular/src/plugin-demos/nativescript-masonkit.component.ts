import { Component, NgZone, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DemoSharedNativescriptMasonkit } from '@demo/shared';

@Component({ selector: 'demo-nativescript-masonkit', templateUrl: 'nativescript-masonkit.component.html', imports: [NativeScriptCommonModule], schemas: [NO_ERRORS_SCHEMA] })
export class NativescriptMasonkitComponent {
  demoShared: DemoSharedNativescriptMasonkit;

  constructor(private _ngZone: NgZone) {}

  ngOnInit() {
    this.demoShared = new DemoSharedNativescriptMasonkit();
  }
}
