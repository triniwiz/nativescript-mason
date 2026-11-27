import { Component, computed, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-ratings', templateUrl: 'ratings.component.html', styleUrl: 'ratings.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class RatingsComponent {
  readonly breakdown = [
    { stars: 5, pct: 62 },
    { stars: 4, pct: 24 },
    { stars: 3, pct: 9 },
    { stars: 2, pct: 3 },
    { stars: 1, pct: 2 },
  ];

  readonly reviews = signal([
    { author: 'Marta Silva', stars: 5, date: '2d ago', color: '#6c5ce7', text: 'Exactly what I needed. Set it up in ten minutes and it has been rock solid ever since.' },
    { author: 'Jon Peters', stars: 4, date: '5d ago', color: '#0984e3', text: 'Great overall. Would love a dark mode and slightly faster search, but no real complaints.' },
    { author: 'Aisha Khan', stars: 5, date: '1w ago', color: '#00b894', text: 'The onboarding alone deserves five stars. My whole team picked it up in a day.' },
  ]);

  readonly mine = signal(0);
  readonly totalReviews = 1284;
  readonly average = computed(() => (this.mine() ? ((4.6 * this.totalReviews + this.mine()) / (this.totalReviews + 1)).toFixed(2) : '4.6'));
  readonly filled = computed(() => Math.round(Number(this.average())));

  rate(n: number): void {
    this.mine.set(this.mine() === n ? 0 : n);
  }
}
