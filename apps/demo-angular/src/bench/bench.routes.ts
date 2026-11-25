import { Routes } from '@angular/router';

import { BenchHomeComponent } from './bench-home.component';
import { DashboardCoreComponent } from './dashboard-core.component';
import { DashboardMasonComponent } from './dashboard-mason.component';
import { FeedCoreComponent } from './feed-core.component';
import { FeedMasonComponent } from './feed-mason.component';
import { NestedCoreComponent } from './nested-core.component';
import { NestedMasonComponent } from './nested-mason.component';
import { RichCoreComponent } from './rich-core.component';
import { RichMasonComponent } from './rich-mason.component';
import { ScreenData } from './screens';

const screens = {
  feed: { mason: FeedMasonComponent, core: FeedCoreComponent },
  dashboard: { mason: DashboardMasonComponent, core: DashboardCoreComponent },
  nested: { mason: NestedMasonComponent, core: NestedCoreComponent },
  rich: { mason: RichMasonComponent, core: RichCoreComponent },
};

export const benchRoutes: Routes = [
  { path: '', component: BenchHomeComponent },
  ...(Object.keys(screens) as ScreenData['scenario'][]).flatMap((scenario) =>
    (['mason', 'core'] as const).map((flavour) => ({
      path: `${scenario}/${flavour}`,
      component: screens[scenario][flavour],
      data: { scenario, flavour } satisfies ScreenData,
    })),
  ),
];
