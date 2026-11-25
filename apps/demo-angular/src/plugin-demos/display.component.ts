import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-display', templateUrl: 'display.component.html', styleUrl: 'display.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class DisplayComponent {
  readonly visible = signal(true);

  toggle(): void {
    this.visible.set(!this.visible());
  }
}
