import { Routes } from '@angular/router';

import { FeedComponent } from './feed.component';
import { ItemComponent } from './item.component';
import { ListComponent } from './list.component';

/** Child routes under `/hn`, so the app exercises nested routing. */
export const hnRoutes: Routes = [
  { path: '', component: FeedComponent },
  { path: 'item/:id', component: ItemComponent },
  { path: 'list', component: ListComponent },
];
