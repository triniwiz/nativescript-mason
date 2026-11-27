import { Component, computed, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DashboardScreen } from './screens';

@Component({ selector: 'bench-dashboard-core', templateUrl: 'dashboard-core.component.html', styleUrl: 'dashboard-core.component.scss', imports: [NativeScriptCommonModule], schemas: [NO_ERRORS_SCHEMA] })
export class DashboardCoreComponent extends DashboardScreen {
  readonly cols = computed(() => (this.wide() ? 2 : 3));
  readonly columns = computed(() => Array(this.cols()).fill('*').join(', '));
  readonly rows = computed(() =>
    Array(Math.ceil(this.tiles().length / this.cols()))
      .fill('auto')
      .join(', '),
  );

  rowOf(tile: number): number {
    return Math.floor(tile / this.cols());
  }
}
