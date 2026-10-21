# Angular

`@triniwiz/nativescript-masonkit/angular` registers every MasonKit element with `@nativescript/angular` and makes your Angular components real layout boxes, as they are on the web. It requires `@nativescript/angular` 19 or later and works with NgModule and standalone apps.

## Setup

Call `installMasonKit()` in `main.ts`, before the bootstrap:

```ts
// main.ts
import { bootstrapApplication, provideNativeScriptRouter, runNativeScriptAngularApp } from '@nativescript/angular';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/angular';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

installMasonKit();

runNativeScriptAngularApp({
  appModuleBootstrap: () =>
    bootstrapApplication(AppComponent, {
      providers: [provideNativeScriptRouter(routes)],
    }),
});
```

It has to run before Angular creates the root component, so an `NgModule` import or an `APP_INITIALIZER` is too late. A plain call at the top of the entry file is the right place. Calling it again only updates the configuration.

## Using the elements

No `registerElement` calls or `imports` entries are needed. Add `NO_ERRORS_SCHEMA` as you would for any NativeScript element:

```ts
import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-story',
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <div class="card">
      <h3 class="title">{{ story.title }}</h3>
      <span class="domain">{{ story.domain }}</span>
    </div>
  `,
})
export class StoryComponent {
  @Input() story!: { title: string; domain: string };
}
```

```scss
.card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
}
```

Events use the usual NativeScript binding, for example `(tap)="open()"`.

Every MasonKit tag is registered in its original, lowercase and kebab-case spelling, so `<View>`, `<view>` and `<text-area>` all resolve.

### Names shared with core

`@nativescript/angular` registers some core widgets under names MasonKit also uses. Its registry tries the exact spelling first, then lowercase, which decides the winner:

| Template | Resolves to |
| --- | --- |
| `<Button>`, `<button>` | MasonKit `Button` |
| `<img>` | MasonKit `Img` (`<Image>` stays core) |
| `<span>`, `<label>` | MasonKit `/web` elements |
| `<Span>`, `<Label>` | core `Span` and `Label` |

To keep the classic widgets for a whole set, turn it off:

```ts
installMasonKit({ web: false }); // MasonKit widgets only
installMasonKit({ mason: false }); // HTML-shaped elements only
```

## Component hosts

By default each Angular component's own element is a real MasonKit box. Stock `@nativescript/angular` creates an invisible `ProxyViewContainer` for component selectors, so `class`, `backgroundColor`, `margin` and host bindings on a component element do nothing and the component is invisible to layout. With host mode, styling a component from outside works as on the web:

```html
<app-story class="card"></app-story>
```

```scss
app-story {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8px;
  padding: 10px;
}
```

The original tag is kept on the host, so CSS type selectors such as `app-story` match.

Turn it off to keep stock behaviour and only get the element registrations:

```ts
installMasonKit({ componentHosts: false });
```

### Page-level components

Some elements must stay transparent:

- Router outlets (`page-router-outlet`, `ns-empty-outlet`, `router-outlet`) are always transparent.
- The app's root component stays transparent, so the tree below it has a full-screen parent to resolve `height: 100%` against.
- Routed components are page roots (an `<ActionBar>` plus content that fills the `Page`). They are detected while the router outlet creates them.
- A host that turns out to hold a `Frame`, `Page` or `ActionBar` is detected too, but only from the next render, and the console logs the selector.

If a page root still renders blank on first load, list it:

```ts
installMasonKit({
  componentHosts: {
    passthrough: ['app-feed', 'app-detail', /-page$/],
  },
});
```

Components below a page root stay real MasonKit boxes.

::: warning Typos become boxes
With host mode on, an unknown element name (a typo, an undeclared component) becomes an empty box instead of throwing `No known component for element X`.
:::

## Options

`installMasonKit(options?)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `mason` | `boolean` | `true` | Register MasonKit's own widgets |
| `web` | `boolean` | `true` | Register the HTML-shaped elements from `/web` |
| `componentHosts` | `boolean \| ComponentHostOptions` | `true` | Make component elements real MasonKit boxes |

`ComponentHostOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Turn host mode off, keeping element registration |
| `passthrough` | `PassthroughMatcher[]` | `[]` | Extra elements to keep transparent: strings (case-insensitive), regexes or predicates |
| `autoDetectPassthrough` | `boolean` | `true` | Recognise page roots automatically |
| `rootAsPassthrough` | `boolean` | `true` | Keep the app's root component transparent |

## API

| Export | Purpose |
| --- | --- |
| `installMasonKit(options?)` | The whole integration. Call before bootstrap |
| `registerMasonKitElements(options?)` | Element registration only (`mason`, `web`) |
| `enableMasonComponentHosts(options?)` | Component-host mode only |
| `masonMeta` | `ViewClassMeta` for registering your own MasonKit subclass |

## Custom elements

Register your own MasonKit container subclass with `masonMeta`:

```ts
import { registerElement } from '@nativescript/angular';
import { masonMeta } from '@triniwiz/nativescript-masonkit/angular';

registerElement('MyBox', () => MyBox, masonMeta);
```

`masonMeta` keeps Angular's view updates (`@if`, `@for`, router changes) in step with MasonKit's child list. Without it, children are appended instead of inserted in position.

## Troubleshooting

**A routed screen shows only its ActionBar.** That component is a page root whose host box collapsed. Add its selector to `passthrough`. The console names it when auto-detection catches it.

**A component's `class` or `backgroundColor` does nothing.** Host mode is off, or the element is in `passthrough`.

**Sizes look wrong next to core views.** Inside MasonKit elements `px` is a CSS pixel; on core views it is a device pixel. See [Units](/styling/units).
