import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-architect', templateUrl: 'architect.component.html', styleUrl: 'architect.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class ArchitectComponent {
  readonly projects = [
    { name: 'Casa do Rio', type: 'Private residence', year: '2025', area: '340 m²', color: '#a08059', stage: 'On site', stageClass: 'site' },
    { name: 'Mercado de Gaia', type: 'Civic refurbishment', year: '2024', area: '2,100 m²', color: '#6b7f8c', stage: 'Built', stageClass: 'built' },
    { name: 'Torre Sal', type: 'Mixed use', year: '2024', area: '8,400 m²', color: '#4d5d73', stage: 'Permitting', stageClass: 'permit' },
    { name: 'Pavilhão Luz', type: 'Competition', year: '2023', area: '1,200 m²', color: '#c9b458', stage: 'Built', stageClass: 'built' },
  ];
}
