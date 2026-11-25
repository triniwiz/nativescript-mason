import { Routes } from '@angular/router';

import { demos } from './demos';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  // Lazy route groups, so navigating in and out repeatedly tears the MasonKit
  // tree down and rebuilds it rather than just toggling visibility.
  { path: 'hn', loadChildren: () => import('./hn/hn.routes').then((m) => m.hnRoutes) },
  { path: 'stress', loadChildren: () => import('./stress/stress.routes').then((m) => m.stressRoutes) },
  { path: 'web-samples', loadChildren: () => import('./web-samples/samples/samples.routes').then((m) => m.sampleRoutes) },
  { path: 'professions', loadChildren: () => import('./web-samples/professions/professions.routes').then((m) => m.professionRoutes) },
  { path: 'bench', loadChildren: () => import('./bench/bench.routes').then((m) => m.benchRoutes) },
  ...demos.flatMap(({ path, load }) => (load ? [{ path, loadComponent: load }] : [])),
];
