import { Component, computed, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-music-player', templateUrl: 'music-player.component.html', styleUrl: 'music-player.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class MusicPlayerComponent {
  private readonly totalSeconds = 214;
  private readonly position = signal(83);
  readonly playing = signal(true);
  readonly shuffle = signal(false);
  readonly repeat = signal(false);
  readonly progress = computed(() => Math.round((this.position() / this.totalSeconds) * 100));
  readonly elapsed = computed(() => this.fmt(this.position()));
  readonly duration = computed(() => this.fmt(this.totalSeconds));

  readonly upNext = [
    { title: 'Glass Harbour', artist: 'Neon Coastline', time: '3:42' },
    { title: 'Static Bloom', artist: 'Neon Coastline', time: '4:05' },
    { title: 'Slow Voltage', artist: 'After Hours', time: '2:58' },
  ];

  private fmt(s: number) {
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  skip(delta: number): void {
    this.position.set(Math.min(this.totalSeconds, Math.max(0, this.position() + delta)));
  }
}
