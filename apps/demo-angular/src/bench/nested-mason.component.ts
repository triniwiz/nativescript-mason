import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';
import { NestedBoxMasonComponent } from './nested-box-mason.component';
import { NestedScreen } from './screens';

@Component({ selector: 'bench-nested-mason', templateUrl: 'nested-mason.component.html', styleUrl: 'nested-mason.component.scss', imports: [DemoPageComponent, NestedBoxMasonComponent], schemas: [NO_ERRORS_SCHEMA] })
export class NestedMasonComponent extends NestedScreen {}
