import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';
import { DashboardScreen } from './screens';

@Component({ selector: 'bench-dashboard-mason', templateUrl: 'dashboard-mason.component.html', styleUrl: 'dashboard-mason.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class DashboardMasonComponent extends DashboardScreen {}
