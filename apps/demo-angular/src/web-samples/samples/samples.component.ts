import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptRouterModule } from '@nativescript/angular';
import { DemoPageComponent } from '../../shared/demo-page.component';
import { samples } from './samples';

@Component({
  selector: 'demo-samples',
  imports: [DemoPageComponent, NativeScriptRouterModule],
  schemas: [NO_ERRORS_SCHEMA],
  styles: `
    .list {
      display: flex;
      flex-direction: column;
      gap: 12;
    }
  `,
  template: `
    <demo-page title="Web samples">
      <main class="list page-body">
        <span class="body">Ten content-rich screens built from web-shaped elements — pricing, checkout, dashboards and more.</span>
        <section class="nav-list">
          @for (sample of samples; track sample.path) {
            <div class="nav-row" [nsRouterLink]="'/web-samples/' + sample.path">
              <div class="nav-icon" [style.backgroundColor]="sample.color">
                <span class="nav-icon-text">{{ sample.title.charAt(0) }}</span>
              </div>
              <div class="nav-body">
                <span class="nav-title">{{ sample.title }}</span>
                <span class="nav-desc">{{ sample.desc }}</span>
              </div>
              <span class="nav-arrow">›</span>
            </div>
          }
        </section>
      </main>
    </demo-page>
  `,
})
export class SamplesComponent {
  readonly samples = samples;
}
