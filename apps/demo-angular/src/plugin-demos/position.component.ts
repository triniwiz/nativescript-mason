import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { range } from '../shared/range';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-position', templateUrl: 'position.component.html', styleUrl: 'position.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class PositionComponent {
  readonly range = range;

  readonly groups = [
    { letter: 'A', names: ['Ada', 'Alan', 'Amara', 'Anil'] },
    { letter: 'B', names: ['Bea', 'Ben', 'Bianca'] },
    { letter: 'C', names: ['Cara', 'Chen', 'Clara', 'Cyrus'] },
    { letter: 'D', names: ['Dana', 'Deepak', 'Dmitri'] },
    { letter: 'E', names: ['Elin', 'Emeka', 'Eva', 'Ezra', 'Elio'] },
    { letter: 'F', names: ['Farah', 'Finn', 'Freya'] },
  ];

  readonly bannerVisible = signal(true);
}
