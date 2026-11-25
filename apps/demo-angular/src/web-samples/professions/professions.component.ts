import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptRouterModule } from '@nativescript/angular';
import { DemoPageComponent } from '../../shared/demo-page.component';
import { professions } from './professions';

@Component({
  selector: 'demo-professions',
  imports: [DemoPageComponent, NativeScriptRouterModule],
  schemas: [NO_ERRORS_SCHEMA],
  styles: `
    .list {
      display: flex;
      flex-direction: column;
      gap: 12;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10;
    }

    .tile {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6;
      background-color: var(--surface);
      border-radius: 14;
      padding: 14;
      border-style: none;
      text-align: left;
      box-shadow: 0 2px 10px var(--shadow);
    }

    .tile:active {
      background-color: var(--surface-2);
    }

    .tile-icon {
      width: 36;
      height: 36;
      border-radius: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4;
    }

    .tile-title {
      font-size: 14;
      font-weight: bold;
      color: var(--text);
    }
  `,
  template: `
    <demo-page title="Professions">
      <main class="list page-body">
        <span class="body">Ten mini dashboards, one per profession — each a different mix of grid, flex and typography.</span>
        <section class="grid">
          @for (p of professions; track p.path) {
            <div class="tile" [nsRouterLink]="'/professions/' + p.path">
              <div class="tile-icon" [style.backgroundColor]="p.color">
                <span class="nav-icon-text">{{ p.glyph }}</span>
              </div>
              <span class="tile-title">{{ p.name }}</span>
              <span class="nav-desc">{{ p.desc }}</span>
            </div>
          }
        </section>
      </main>
    </demo-page>
  `,
})
export class ProfessionsComponent {
  readonly professions = professions;
}
