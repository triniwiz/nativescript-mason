import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-teacher', templateUrl: 'teacher.component.html', styleUrl: 'teacher.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class TeacherComponent {
  readonly lessons = [
    { period: '1', time: '08:45', topic: 'Quadratic equations', desc: 'Factorising & the quadratic formula', status: 'Done', statusClass: 'done' },
    { period: '3', time: '10:35', topic: 'Graphing parabolas', desc: 'Vertex form and intercepts', status: 'Now', statusClass: 'now' },
    { period: '5', time: '13:20', topic: 'Word problems', desc: 'Modelling real scenarios', status: 'Next', statusClass: 'next' },
  ];

  readonly homework = [
    { title: 'Exercise 7.3 — Factorising', meta: 'Due tomorrow · 24 of 28 turned in', turnedIn: 86 },
    { title: 'Worksheet — Parabolas', meta: 'Due Friday · 11 of 28 turned in', turnedIn: 39 },
  ];
}
