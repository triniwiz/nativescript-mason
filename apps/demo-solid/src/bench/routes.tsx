// `initialRouteName="BenchHome"` launches straight into a full run (see AUTO_START in BenchHome).
import { Route, type RouteDefinition } from 'solid-navigation'
import BenchHome from './BenchHome'
import FeedMason from './FeedMason'
import FeedCore from './FeedCore'
import DashboardMason from './DashboardMason'
import DashboardCore from './DashboardCore'
import NestedMason from './NestedMason'
import NestedCore from './NestedCore'
import RichMason from './RichMason'
import RichCore from './RichCore'

export interface BenchRouteDefs {
  BenchHome: RouteDefinition
  BenchFeedMason: RouteDefinition
  BenchFeedCore: RouteDefinition
  BenchDashboardMason: RouteDefinition
  BenchDashboardCore: RouteDefinition
  BenchNestedMason: RouteDefinition
  BenchNestedCore: RouteDefinition
  BenchRichMason: RouteDefinition
  BenchRichCore: RouteDefinition
}

export type BenchRouteName = keyof BenchRouteDefs

const pageProps = { iosOverflowSafeAreaEnabled: false }

export function BenchRoutes() {
  return (
    <>
      <Route name="BenchHome" component={BenchHome} pageProps={pageProps} />
      <Route name="BenchFeedMason" component={FeedMason} pageProps={pageProps} />
      <Route name="BenchFeedCore" component={FeedCore} pageProps={pageProps} />
      <Route name="BenchDashboardMason" component={DashboardMason} pageProps={pageProps} />
      <Route name="BenchDashboardCore" component={DashboardCore} pageProps={pageProps} />
      <Route name="BenchNestedMason" component={NestedMason} pageProps={pageProps} />
      <Route name="BenchNestedCore" component={NestedCore} pageProps={pageProps} />
      <Route name="BenchRichMason" component={RichMason} pageProps={pageProps} />
      <Route name="BenchRichCore" component={RichCore} pageProps={pageProps} />
    </>
  )
}
