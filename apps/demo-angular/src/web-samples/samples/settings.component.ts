import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NativeScriptFormsModule } from '@nativescript/angular';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-settings', templateUrl: 'settings.component.html', styleUrl: 'settings.component.scss', imports: [DemoPageComponent, NativeScriptFormsModule], schemas: [NO_ERRORS_SCHEMA] })
export class SettingsComponent {
  readonly profile = { name: 'Amelia Reyes', email: 'amelia@example.com' };
  private readonly defaults = { darkMode: true, notifications: true, compact: false };
  readonly prefs = { ...this.defaults };
  readonly savedNote = signal('');

  reset(): void {
    Object.assign(this.prefs, this.defaults);
    this.savedNote.set('Preferences restored to defaults.');
    setTimeout(() => this.savedNote.set(''), 2000);
  }
}
