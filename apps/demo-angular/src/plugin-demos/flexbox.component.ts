import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-flexbox', templateUrl: 'flexbox.component.html', styleUrl: 'flexbox.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class FlexboxComponent {
  readonly three = [{ color: '#ff6b6b' }, { color: '#4ecdc4' }, { color: '#ffd93d', dark: true }];
  readonly directions = ['row', 'row-reverse', 'column', 'column-reverse'];
  readonly justify = ['space-between', 'space-around', 'center'];
  readonly align = ['flex-start', 'center', 'flex-end'];
  readonly wrapColors = [{ color: '#ff6b6b' }, { color: '#4ecdc4' }, { color: '#ffd93d', dark: true }, { color: '#6c5ce7' }, { color: '#e84393' }, { color: '#00b894' }, { color: '#0984e3' }];
}
