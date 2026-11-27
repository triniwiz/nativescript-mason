import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-grid', templateUrl: 'grid.component.html', styleUrl: 'grid.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class GridComponent {
  readonly basic = [{ color: '#00b894' }, { color: '#e17055' }, { color: '#74b9ff' }, { color: '#a29bfe' }, { color: '#fdcb6e', dark: true }, { color: '#ff6b6b' }];

  readonly gap = [
    { label: 'A', color: '#ff6b6b' },
    { label: 'B', color: '#4ecdc4' },
    { label: 'C', color: '#ffd93d', dark: true },
    { label: 'D', color: '#6c5ce7' },
    { label: 'E', color: '#e17055' },
    { label: 'F', color: '#00b894' },
  ];
}
