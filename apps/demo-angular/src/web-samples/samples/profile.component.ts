import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-profile', templateUrl: 'profile.component.html', styleUrl: 'profile.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class ProfileComponent {
  readonly tab = signal<'grid' | 'about'>('grid');
  readonly following = signal(false);

  readonly posts = [
    { title: 'Onboarding flows', glyph: 'O', color: '#6c5ce7' },
    { title: 'Type scales', glyph: 'T', color: '#0984e3' },
    { title: 'Dark mode kit', glyph: 'D', color: '#1a1a2e' },
    { title: 'Empty states', glyph: 'E', color: '#00b894' },
    { title: 'Motion notes', glyph: 'M', color: '#e84393' },
    { title: 'Form patterns', glyph: 'F', color: '#fdcb6e' },
  ];
}
