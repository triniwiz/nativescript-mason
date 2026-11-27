import { Type } from '@angular/core';

export interface Demo {
  /** Route of the screen, and the name `--es demo` opens it by. */
  path: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  /** The screen, for demos that are one routed component. Route groups are listed in app.routes.ts. */
  load?: () => Promise<Type<unknown>>;
}

export interface DemoGroup {
  title: string;
  items: Demo[];
}

/** Every screen of the app. The home screen lists them and app.routes.ts routes them. */
export const demoGroups: DemoGroup[] = [
  {
    title: 'Layout',
    items: [
      { path: 'flexbox', title: 'Flexbox', desc: 'Direction, wrap, justify and align', icon: 'F', color: '#6c5ce7', load: () => import('./plugin-demos/flexbox.component').then((m) => m.FlexboxComponent) },
      { path: 'grid', title: 'Grid', desc: 'Tracks, spans and auto-placement', icon: 'G', color: '#0984e3', load: () => import('./plugin-demos/grid.component').then((m) => m.GridComponent) },
      { path: 'grid-area', title: 'Grid areas', desc: 'Named grid-template-areas', icon: 'A', color: '#00b894', load: () => import('./plugin-demos/grid-area.component').then((m) => m.GridAreaComponent) },
      { path: 'display', title: 'Display', desc: 'block / flex / none toggling', icon: 'D', color: '#e84393', load: () => import('./plugin-demos/display.component').then((m) => m.DisplayComponent) },
      { path: 'spacing', title: 'Spacing', desc: 'Margin, padding and gap', icon: 'S', color: '#fdcb6e', load: () => import('./plugin-demos/spacing.component').then((m) => m.SpacingComponent) },
      { path: 'position', title: 'Position', desc: 'Sticky headers and fixed overlays', icon: 'P', color: '#00b894', load: () => import('./plugin-demos/position.component').then((m) => m.PositionComponent) },
      { path: 'inline-boxes', title: 'Inline boxes', desc: 'Chips and inline wrappers on the text baseline', icon: 'I', color: '#0984e3', load: () => import('./plugin-demos/inline-boxes.component').then((m) => m.InlineBoxesComponent) },
    ],
  },
  {
    title: 'Styling',
    items: [
      { path: 'typography', title: 'Typography', desc: 'Type scale and text styles', icon: 'T', color: '#b2bec3', load: () => import('./plugin-demos/typography.component').then((m) => m.TypographyComponent) },
      { path: 'box-shadow', title: 'Box shadows', desc: 'Elevation, colored and inset shadows', icon: 'B', color: '#636e72', load: () => import('./plugin-demos/box-shadow.component').then((m) => m.BoxShadowComponent) },
      { path: 'gradient', title: 'Gradients', desc: 'Stop positions, hard edges and stripes', icon: 'Gr', color: '#fd9644', load: () => import('./plugin-demos/gradient.component').then((m) => m.GradientComponent) },
      { path: 'inputs', title: 'Inputs', desc: 'Every input type, padding, border and placeholder', icon: 'In', color: '#00b894', load: () => import('./plugin-demos/inputs.component').then((m) => m.InputsComponent) },
      { path: 'transform', title: 'Transforms', desc: 'Interactive rotate / scale / translate', icon: 'R', color: '#e17055', load: () => import('./plugin-demos/transform.component').then((m) => m.TransformComponent) },
      { path: 'animation', title: 'Animation', desc: 'Keyframe-style animations on Mason views', icon: 'M', color: '#4ecdc4', load: () => import('./plugin-demos/animation.component').then((m) => m.AnimationComponent) },
      { path: 'touch', title: 'Touch animations', desc: 'TouchManager press feedback on Mason views', icon: 'Tm', color: '#fd79a8', load: () => import('./plugin-demos/touch.component').then((m) => m.TouchComponent) },
    ],
  },
  {
    title: 'Interop',
    items: [
      { path: 'core-views', title: 'Core views', desc: 'NativeScript widgets inside Mason containers', icon: 'C', color: '#74b9ff', load: () => import('./plugin-demos/core-views.component').then((m) => m.CoreViewsComponent) },
      { path: 'showcase', title: 'Showcase', desc: 'Component gallery', icon: 'W', color: '#a29bfe', load: () => import('./plugin-demos/showcase.component').then((m) => m.ShowcaseComponent) },
      { path: 'issue-repros', title: 'Issue repros', desc: 'One card per reported MasonKit issue', icon: '!', color: '#d63031', load: () => import('./plugin-demos/issue-repros.component').then((m) => m.IssueReprosComponent) },
      { path: 'nested-scroll', title: 'Nested scroll', desc: 'Horizontal rows inside a vertical page', icon: 'Ns', color: '#0984e3', load: () => import('./plugin-demos/nested-scroll.component').then((m) => m.NestedScrollComponent) },
      { path: 'inline-block-lines', title: 'Inline-block lines', desc: 'Tall inline boxes on later lines', icon: 'Ib', color: '#e17055', load: () => import('./plugin-demos/inline-block-lines.component').then((m) => m.InlineBlockLinesComponent) },
    ],
  },
  {
    title: 'Apps',
    items: [
      { path: 'hn', title: 'Hacker News', desc: 'Sortable feed with threaded comments', icon: 'Y', color: '#ff6600' },
      { path: 'hn/list', title: 'Hacker News ListView', desc: 'MasonKit item templates in a core ListView', icon: 'Yl', color: '#ff6600' },
      { path: 'photos', title: 'Photos', desc: 'Masonry grid with remote images', icon: 'P', color: '#00cec9', load: () => import('./web-samples/photos.component').then((m) => m.PhotosComponent) },
      { path: 'web-samples', title: 'Web samples', desc: 'Ten content-rich web-style screens', icon: '10', color: '#6c5ce7' },
      { path: 'professions', title: 'Professions', desc: 'Ten mini dashboards', icon: 'Pr', color: '#fd79a8' },
    ],
  },
  {
    title: 'Diagnostics',
    items: [
      { path: 'bench', title: 'Layout benchmark', desc: 'MasonKit vs core, four screens, timed', icon: 'B', color: '#00b894' },
      { path: 'stress', title: 'Layout stress', desc: 'Reconciliation and border regressions', icon: 'S', color: '#e17055' },
      { path: 'nativescript-masonkit', title: 'Plugin demo', desc: 'The page the plugin workspace shares between its demos', icon: 'Pd', color: '#636e72', load: () => import('./plugin-demos/nativescript-masonkit.component').then((m) => m.NativescriptMasonkitComponent) },
    ],
  },
];

export const demos: Demo[] = demoGroups.flatMap((group) => group.items);
