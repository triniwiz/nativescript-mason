import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NativeScriptFormsModule } from '@nativescript/angular';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-inputs', templateUrl: 'inputs.component.html', styleUrl: 'inputs.component.scss', imports: [DemoPageComponent, NativeScriptFormsModule], schemas: [NO_ERRORS_SCHEMA] })
export class InputsComponent {
  readonly prefilled = signal('Prefilled value');
  readonly small = signal('Small text');
  readonly large = signal('Large text');
  readonly bold = signal('Bold text');
  readonly centered = signal('Centered');
  readonly right = signal('Right aligned');
  readonly live = signal('');
  readonly agree = signal(true);
  readonly size = signal('m');
  readonly volume = signal(30);
  readonly day = signal('2026-01-15');
  readonly tint = signal('#ff0000');

  show(v: unknown) {
    return `${JSON.stringify(v)} (${typeof v})`;
  }

  setBound(): void {
    this.agree.set(!this.agree());
    this.size.set('s');
    this.volume.set(80);
    this.day.set('2026-12-25');
    this.tint.set('#00aa00');
  }

  noop(): void {}
}
