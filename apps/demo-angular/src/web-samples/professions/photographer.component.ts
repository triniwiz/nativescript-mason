import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-photographer', templateUrl: 'photographer.component.html', styleUrl: 'photographer.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class PhotographerComponent {
  readonly frames = [
    { title: 'Tide lines', loc: 'Comporta', year: '2025', color: '#7a9e9f' },
    { title: 'Night market', loc: 'Bangkok', year: '2024', color: '#3d3a50' },
    { title: 'Granite light', loc: 'Serra da Estrela', year: '2024', color: '#8c7a6b' },
    { title: 'Harbour fog', loc: 'Aveiro', year: '2023', color: '#5f7a95' },
    { title: 'Dune study', loc: 'Sahara', year: '2023', color: '#c2a06b' },
    { title: 'Metro ghosts', loc: 'Lisbon', year: '2022', color: '#4a4a55' },
  ];

  readonly gear = ['Mirrorless body · 45 MP', '35 mm f/1.4 prime', '70–200 mm f/2.8 zoom', 'Compact tripod & filters'];
}
