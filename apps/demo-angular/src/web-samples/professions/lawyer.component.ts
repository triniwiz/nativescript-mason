import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-lawyer', templateUrl: 'lawyer.component.html', styleUrl: 'lawyer.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class LawyerComponent {
  readonly cases = [
    { ref: '24-0118', title: 'Breach of contract — logistics JV', client: 'Nordwind GmbH', stage: 'Discovery', stageClass: 'discovery', next: 'Jul 03', progress: 40 },
    { ref: '24-0092', title: 'IP assignment dispute — SaaS platform', client: 'Helio Systems', stage: 'Deposition', stageClass: 'deposition', next: 'Jun 21', progress: 62 },
    { ref: '24-0141', title: 'Lease termination — retail portfolio', client: 'Bluebird Retail', stage: 'Negotiation', stageClass: 'negotiation', next: 'Jun 27', progress: 25 },
    { ref: '23-0877', title: 'Employment claim — executive exit', client: 'Meridian Capital', stage: 'Pre-trial', stageClass: 'pretrial', next: 'Aug 12', progress: 81 },
  ];
}
