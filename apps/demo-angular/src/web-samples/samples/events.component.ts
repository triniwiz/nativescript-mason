import { Component, computed, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

type EventItem = {
  title: string;
  location: string;
  day: string;
  month: string;
  time: string;
  category: string;
  going: boolean;
};

@Component({ selector: 'demo-events', templateUrl: 'events.component.html', styleUrl: 'events.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class EventsComponent {
  readonly categories = ['All', 'Tech', 'Music', 'Food', 'Sport'];
  readonly filter = signal('All');

  readonly events = signal<EventItem[]>([
    { title: 'NativeScript Meetup', location: 'Hub Lisbon · Rua do Alecrim 12', day: '14', month: 'JUN', time: '18:30', category: 'Tech', going: true },
    { title: 'Jazz in the Park', location: 'Parque Eduardo VII', day: '15', month: 'JUN', time: '20:00', category: 'Music', going: false },
    { title: 'Ramen Night Market', location: 'LX Factory, Hall B', day: '18', month: 'JUN', time: '17:00', category: 'Food', going: false },
    { title: 'Morning 10K Run', location: 'Marginal Promenade', day: '21', month: 'JUN', time: '08:00', category: 'Sport', going: true },
    { title: 'Design Systems Talk', location: 'Marvila Startup Hub', day: '24', month: 'JUN', time: '19:00', category: 'Tech', going: false },
    { title: 'Vinyl Swap Fair', location: 'Galeria Zé dos Bois', day: '28', month: 'JUN', time: '14:00', category: 'Music', going: false },
  ]);

  readonly filtered = computed(() => this.events().filter((event) => this.filter() === 'All' || event.category === this.filter()));

  rsvp(event: EventItem): void {
    this.events.update((events) => events.map((e) => (e === event ? { ...e, going: !e.going } : e)));
  }
}
