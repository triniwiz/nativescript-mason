import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';
import { FeedScreen } from './screens';

@Component({ selector: 'bench-feed-mason', templateUrl: 'feed-mason.component.html', styleUrl: 'feed-mason.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class FeedMasonComponent extends FeedScreen {}
