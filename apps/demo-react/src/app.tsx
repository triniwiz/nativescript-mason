import { useState } from 'react';
import { Outlet, createRootRoute, createRoute, createNativeScriptRouter, useNavigate, useRouter } from '@tanstack/react-nativescript-router';
import { HomeScreen } from './components/Home';
import { TailwindLandingScreen } from './components/TailwindLanding';
import { ComponentKitScreen } from './components/ComponentKit';
import { BootstrapGridScreen } from './components/BootstrapGrid';
import { VanillaShellScreen } from './components/VanillaShell';
import { ShowcaseScreen } from './components/Showcase';
import { FormControlsScreen } from './components/FormControls';

const PILLS = ['Flexbox', 'Grid', 'CSS', 'React'];

function Layout() {
  return <Outlet />;
}

function RouterDemoScreen() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  return (
    <scroll style={{ backgroundColor: '#0f172a', padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>Mason + React</span>
        <span style={{ fontSize: 14, color: '#94a3b8' }}>Real CSS flexbox/grid syntax, rendered through @nativescript-community/react</span>
        <div
          onClick={() => navigate({ to: '/router-demo/details/$id', params: { id: 'router-pr-7874' }, stackBehavior: 'push' } as never)}
          style={{ display: 'flex', backgroundColor: '#f97316', borderRadius: '8px', paddingTop: 14, paddingBottom: 14, alignItems: 'center' }}
        >
          <span style={{ color: 'white', fontWeight: 600 }}>Open Router Details</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PILLS.map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                paddingTop: 8,
                paddingBottom: 8,
                paddingLeft: 14,
                paddingRight: 14,
                backgroundColor: '#38bdf8',
                borderRadius: '999px',
              }}
            >
              <span style={{ color: 'red', fontWeight: 600, fontSize: 13 }}>{label} </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                width: '31%',
                height: 60,
                borderRadius: '8px',
                backgroundColor: i % 2 === 0 ? '#334155' : '#1e293b',
              }}
            />
          ))}
        </div>

        <div
          onClick={() => setCount((c) => c + 1)}
          style={{ display: 'flex', backgroundColor: '#22c55e', borderRadius: '8px', paddingTop: 14, paddingBottom: 14, alignItems: 'center' }}
        >
          <span style={{ color: 'white', fontWeight: 600 }}>Tapped {count} times</span>
        </div>
      </div>
    </scroll>
  );
}

function DetailsScreen() {
  const router = useRouter();
  const navigate = useNavigate();

  return (
    <scroll style={{ backgroundColor: '#111827', padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>TanStack Router Details</span>
        <span style={{ fontSize: 14, color: '#a7f3d0' }}>This route is rendered through @tanstack/react-nativescript-router.</span>
        <div
          onClick={() => navigate({ to: '/router-demo', stackBehavior: 'replace' } as never)}
          style={{ display: 'flex', backgroundColor: '#38bdf8', borderRadius: '8px', paddingTop: 14, paddingBottom: 14, alignItems: 'center' }}
        >
          <span style={{ color: 'white', fontWeight: 600 }}>Replace With Router Demo</span>
        </div>
        <div
          onClick={() => router.back()}
          style={{ display: 'flex', backgroundColor: '#22c55e', borderRadius: '8px', paddingTop: 14, paddingBottom: 14, alignItems: 'center' }}
        >
          <span style={{ color: 'white', fontWeight: 600 }}>Go Back</span>
        </div>
      </div>
    </scroll>
  );
}

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeScreen,
  native: {
    title: 'Mason + React',
  },
});

const tailwindRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'tailwind',
  component: TailwindLandingScreen,
  native: { title: 'Tailwind CSS' },
});

const componentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'components',
  component: ComponentKitScreen,
  native: { title: 'Component Kit' },
});

const bootstrapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'bootstrap',
  component: BootstrapGridScreen,
  native: { title: 'Bootstrap-style Grid' },
});

const vanillaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'vanilla',
  component: VanillaShellScreen,
  native: { title: 'Vanilla CSS Shell' },
});

const showcaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'showcase',
  component: ShowcaseScreen,
  native: { title: 'Showcase' },
});

const formsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'forms',
  component: FormControlsScreen,
  native: { title: 'Form Controls' },
});

const routerDemoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'router-demo',
  component: RouterDemoScreen,
  native: { title: 'Router Demo' },
});

const detailsRoute = createRoute({
  getParentRoute: () => routerDemoRoute,
  path: 'details/$id',
  component: DetailsScreen,
  native: ({ params }) => ({
    title: `Details ${params.id}`,
    animation: 'slide_from_right',
  }),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  tailwindRoute,
  componentsRoute,
  bootstrapRoute,
  vanillaRoute,
  showcaseRoute,
  formsRoute,
  routerDemoRoute.addChildren([detailsRoute]),
]);

export const router = createNativeScriptRouter({
  routeTree,
  initialPath: '/',
});

declare module '@tanstack/react-nativescript-router' {
  interface Register {
    router: typeof router;
  }
}

declare module '@tanstack/react-router/native' {
  interface Register {
    router: typeof router;
  }
}
