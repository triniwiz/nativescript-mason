import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-showcase', templateUrl: 'showcase.component.html', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class ShowcaseComponent {}
