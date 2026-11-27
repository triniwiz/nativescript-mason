import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { NestedBoxCoreComponent } from './nested-box-core.component';
import { NestedScreen } from './screens';

@Component({ selector: 'bench-nested-core', templateUrl: 'nested-core.component.html', styleUrl: 'nested-core.component.scss', imports: [NativeScriptCommonModule, NestedBoxCoreComponent], schemas: [NO_ERRORS_SCHEMA] })
export class NestedCoreComponent extends NestedScreen {}
