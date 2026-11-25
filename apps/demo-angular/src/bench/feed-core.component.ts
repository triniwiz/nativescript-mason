import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { FeedScreen } from './screens';

@Component({ selector: 'bench-feed-core', templateUrl: 'feed-core.component.html', styleUrl: 'feed-core.component.scss', imports: [NativeScriptCommonModule], schemas: [NO_ERRORS_SCHEMA] })
export class FeedCoreComponent extends FeedScreen {}
