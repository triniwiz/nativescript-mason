import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-marketer', templateUrl: 'marketer.component.html', styleUrl: 'marketer.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class MarketerComponent {
  readonly campaigns = [
    { name: 'Summer Launch', channel: 'Paid social', ends: 'Jun 30', status: 'Live', statusClass: 'live', ctr: '3.8%', spend: '$4.2k', roas: '4.1x', budgetUsed: 62 },
    { name: 'Brand Search', channel: 'SEM', ends: 'Ongoing', status: 'Live', statusClass: 'live', ctr: '6.2%', spend: '$2.8k', roas: '5.6x', budgetUsed: 44 },
    { name: 'Webinar Series', channel: 'Email', ends: 'Jul 12', status: 'Draft', statusClass: 'draft', ctr: '—', spend: '$0', roas: '—', budgetUsed: 0 },
  ];
}
