import { Routes } from '@angular/router';

import { samples } from './samples';
import { SamplesComponent } from './samples.component';

export const sampleRoutes: Routes = [{ path: '', component: SamplesComponent }, ...samples.map(({ path, load }) => ({ path, loadComponent: load }))];
