import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { range } from '../shared/range';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-nested-scroll', templateUrl: 'nested-scroll.component.html', styleUrl: 'nested-scroll.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class NestedScrollComponent {
  readonly range = range;

  readonly rows = [
    { title: 'Small cards', count: 20, size: 'small' },
    { title: 'Wide cards', count: 10, size: 'wide' },
    { title: 'Tall cards', count: 12, size: 'tall' },
  ];

  private readonly palette = ['#6c5ce7', '#0984e3', '#00b894', '#e17055', '#fdcb6e', '#e84393', '#00cec9', '#636e72'];
  readonly lastTap = signal('');
  readonly taps = signal(0);

  color(n: number) {
    return this.palette[n % this.palette.length];
  }

  tap(row: string, n: number): void {
    this.lastTap.set(`${row} #${n}`);
    this.taps.update((v) => v + 1);
  }
}
