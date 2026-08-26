import { Route, RouteDefinition, StackRouter } from 'solid-navigation'
import Home from './components/home'
import Typography from './components/typography'
import Flexbox from './components/flexbox'
import Grid from './components/grid'
import Shadows from './components/shadows'
import Transforms from './components/transforms'
import Backgrounds from './components/backgrounds'
import Position from './components/position'
import QA from './components/qa'
import WebSpec from './webspec/WebSpec'
import MaxWidthChurnRepro from './webspec/MaxWidthChurnRepro'

declare module 'solid-navigation' {
  export interface Routers {
    Default: {
      Home: RouteDefinition
      Typography: RouteDefinition
      Flexbox: RouteDefinition
      Grid: RouteDefinition
      Shadows: RouteDefinition
      Transforms: RouteDefinition
      Backgrounds: RouteDefinition
      Position: RouteDefinition
      QA: RouteDefinition
      WebSpec: RouteDefinition
      MaxWidthChurnRepro: RouteDefinition
    }
  }
}

const App = () => {
  return (
    <StackRouter initialRouteName="WebSpec">
      <Route name="Home" component={Home} />
      <Route name="Typography" component={Typography} />
      <Route name="Flexbox" component={Flexbox} />
      <Route name="Grid" component={Grid} />
      <Route name="Shadows" component={Shadows} />
      <Route name="Transforms" component={Transforms} />
      <Route name="Backgrounds" component={Backgrounds} />
      <Route name="Position" component={Position} />
      <Route name="QA" component={QA} />
      <Route name="WebSpec" component={WebSpec} />
      <Route name="MaxWidthChurnRepro" component={MaxWidthChurnRepro} />
    </StackRouter>
  )
}

export { App }
