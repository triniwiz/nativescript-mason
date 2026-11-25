import { NgTemplateOutlet } from '@angular/common';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-inline-boxes', templateUrl: 'inline-boxes.component.html', styleUrl: 'inline-boxes.component.scss', imports: [DemoPageComponent, NgTemplateOutlet], schemas: [NO_ERRORS_SCHEMA] })
export class InlineBoxesComponent {}
