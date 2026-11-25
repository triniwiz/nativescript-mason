import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RichScreen } from './screens';

@Component({ selector: 'bench-rich-core', templateUrl: 'rich-core.component.html', styleUrl: 'rich-core.component.scss', imports: [NativeScriptCommonModule], schemas: [NO_ERRORS_SCHEMA] })
export class RichCoreComponent extends RichScreen {}
