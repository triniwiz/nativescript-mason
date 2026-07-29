import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/hn', pathMatch: 'full' },
  // Lazy route groups, so navigating in and out repeatedly tears the MasonKit
  // tree down and rebuilds it rather than just toggling visibility.
  { path: 'hn', loadChildren: () => import('./hn/hn.routes').then((m) => m.hnRoutes) },
  { path: 'stress', loadChildren: () => import('./stress/stress.routes').then((m) => m.stressRoutes) },
  { path: 'nativescript-masonkit', loadComponent: () => import('./plugin-demos/nativescript-masonkit.component').then((m) => m.NativescriptMasonkitComponent) },
];
