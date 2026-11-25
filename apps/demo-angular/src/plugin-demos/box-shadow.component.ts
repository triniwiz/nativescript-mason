import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-box-shadow', templateUrl: 'box-shadow.component.html', styleUrl: 'box-shadow.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class BoxShadowComponent {}
