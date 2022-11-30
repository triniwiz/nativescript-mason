import { Component, NgZone } from '@angular/core';
import { DemoSharedNativescriptMasonkit } from '@demo/shared';
import {} from '@triniwiz/nativescript-masonkit';

@Component({
  selector: 'demo-nativescript-masonkit',
  templateUrl: 'nativescript-masonkit.component.html',
})
export class NativescriptMasonkitComponent {
  demoShared: DemoSharedNativescriptMasonkit;

  constructor(private _ngZone: NgZone) {}

  ngOnInit() {
    this.demoShared = new DemoSharedNativescriptMasonkit();
  }
}
