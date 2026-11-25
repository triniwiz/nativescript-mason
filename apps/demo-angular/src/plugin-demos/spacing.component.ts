import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-spacing', templateUrl: 'spacing.component.html', styleUrl: 'spacing.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class SpacingComponent {}
