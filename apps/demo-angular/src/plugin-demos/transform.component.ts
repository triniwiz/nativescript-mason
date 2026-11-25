import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NativeScriptFormsModule } from '@nativescript/angular';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-transform', templateUrl: 'transform.component.html', styleUrl: 'transform.component.scss', imports: [DemoPageComponent, NativeScriptFormsModule], schemas: [NO_ERRORS_SCHEMA] })
export class TransformComponent {
  readonly presets = [
    { label: 'translate(0,0)', value: 'translate(0, 0)' },
    { label: 'rotate(15deg)', value: 'rotate(15deg)' },
    { label: 'scale(1.3)', value: 'scale(1.3, 1.3)' },
    { label: 'skew(12deg)', value: 'skewX(12deg)' },
    { label: 'combo', value: 'translate(24, 12) rotate(8deg) scale(1.02)' },
    { label: 'combo 2', value: 'translate(40, -10) rotate(-12deg) scale(0.9)' },
  ];

  readonly current = signal('translate(24, 12) rotate(8deg) scale(1.02)');
  readonly custom = signal('');

  apply(value: string): void {
    if (!value || !value.trim()) {
      return;
    }
    this.current.set(value.trim());
  }
}
