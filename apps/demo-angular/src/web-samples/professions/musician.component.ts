import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

type Track = { num: string; title: string; plays: string; playing: boolean };

@Component({ selector: 'demo-musician', templateUrl: 'musician.component.html', styleUrl: 'musician.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class MusicianComponent {
  readonly tracks = signal<Track[]>([
    { num: '01', title: 'Glass Harbour', plays: '84.1k', playing: true },
    { num: '02', title: 'Static Bloom', plays: '31.7k', playing: false },
    { num: '03', title: 'Midnight Circuit', plays: '12.2k', playing: false },
  ]);

  readonly shows = [
    { day: '18', month: 'JUN', city: 'Lisbon', venue: 'Lux Frágil', status: 'Selling fast', statusClass: 'hot' },
    { day: '02', month: 'JUL', city: 'Porto', venue: 'Hard Club', status: 'Tickets', statusClass: 'open' },
    { day: '19', month: 'JUL', city: 'Madrid', venue: 'Sala Riviera', status: 'Sold out', statusClass: 'sold' },
  ];

  toggle(track: Track): void {
    this.tracks.update((tracks) => tracks.map((t) => ({ ...t, playing: t === track && !t.playing })));
  }
}
