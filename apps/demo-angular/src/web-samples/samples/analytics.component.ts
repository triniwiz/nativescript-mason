import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-analytics', templateUrl: 'analytics.component.html', styleUrl: 'analytics.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class AnalyticsComponent {
  readonly stats = [
    { label: 'Visitors', value: '48.2k', delta: 12.4, color: '#0984e3' },
    { label: 'Signups', value: '1,204', delta: 8.1, color: '#00b894' },
    { label: 'Revenue', value: '$9.6k', delta: -2.3, color: '#6c5ce7' },
  ];

  readonly chart = [
    { label: 'M', value: 42, color: '#74b9ff' },
    { label: 'T', value: 68, color: '#74b9ff' },
    { label: 'W', value: 55, color: '#0984e3' },
    { label: 'T', value: 90, color: '#0984e3' },
    { label: 'F', value: 74, color: '#6c5ce7' },
    { label: 'S', value: 38, color: '#a29bfe' },
    { label: 'S', value: 61, color: '#a29bfe' },
  ];

  readonly activity = [
    { text: 'New team signup — Nordwind GmbH', time: '2m', color: '#00b894' },
    { text: 'Invoice paid — $249.00', time: '14m', color: '#0984e3' },
    { text: 'Trial ending soon — 3 accounts', time: '1h', color: '#fdcb6e' },
    { text: 'Churn risk flagged — acme.io', time: '3h', color: '#ff6b6b' },
    { text: 'Feature flag enabled — new onboarding', time: '5h', color: '#6c5ce7' },
  ];
}
