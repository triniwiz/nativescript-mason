import { Component, computed, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-designer', templateUrl: 'designer.component.html', styleUrl: 'designer.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class DesignerComponent {
  readonly filters = ['All', 'Product', 'Brand', 'Motion'];
  readonly filter = signal('All');
  readonly contacted = signal(false);

  private readonly works = [
    { title: 'Atlas banking app', year: '2024', kind: 'Product', color: '#0984e3', glyph: 'A' },
    { title: 'Copperleaf identity', year: '2024', kind: 'Brand', color: '#e17055', glyph: 'C' },
    { title: 'Pulse onboarding', year: '2023', kind: 'Motion', color: '#6c5ce7', glyph: 'P' },
    { title: 'Fieldnotes journal', year: '2023', kind: 'Product', color: '#00b894', glyph: 'F' },
    { title: 'Meridian rebrand', year: '2022', kind: 'Brand', color: '#e84393', glyph: 'M' },
    { title: 'Loop micro-motion', year: '2022', kind: 'Motion', color: '#fdcb6e', glyph: 'L' },
  ];

  readonly filtered = computed(() => (this.filter() === 'All' ? this.works : this.works.filter((w) => w.kind === this.filter())));
}
