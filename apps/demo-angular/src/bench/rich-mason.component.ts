import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';
import { RichScreen } from './screens';

@Component({ selector: 'bench-rich-mason', templateUrl: 'rich-mason.component.html', styleUrl: 'rich-mason.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class RichMasonComponent extends RichScreen {}
