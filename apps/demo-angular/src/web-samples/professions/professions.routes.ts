import { Routes } from '@angular/router';

import { professions } from './professions';
import { ProfessionsComponent } from './professions.component';

export const professionRoutes: Routes = [{ path: '', component: ProfessionsComponent }, ...professions.map(({ path, load }) => ({ path, loadComponent: load }))];
