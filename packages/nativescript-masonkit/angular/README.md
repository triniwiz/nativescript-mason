# @triniwiz/nativescript-masonkit/angular

Angular support for MasonKit. Registers every MasonKit element with
`@nativescript/angular`, and makes your Angular components lay out like they do
on the web.

## Setup

MasonKit ships this entry point, so there is nothing extra to install. Call
`installMasonKit()` in `main.ts`, before the bootstrap:

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

It must run before Angular bootstraps, so an `NgModule` import or an
`APP_INITIALIZER` is too late. Calling it again is safe.

Requires `@nativescript/angular` 19 or later. Works with both NgModule and
standalone apps.

## Using the elements

Everything is registered for you - no `registerElement` calls, no `imports`
entry. Add `NO_ERRORS_SCHEMA` to your component as you would for any
NativeScript element:

```ts
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
export class StoryComponent {}
```

```scss
.card {
  display: flex;
  flex-direction: column;
  gap: 4;
  padding: 10;
}
```

> **Lengths:** use unitless values. In NativeScript `px` means _physical device
> pixels_, so `padding: 12px` lands at ~4 on a 3x screen. Unitless is the dip
> value, which is what matches a CSS pixel in a browser.

### Available elements

| From                                  | Elements                                                                                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@triniwiz/nativescript-masonkit`     | `View`, `Text`, `Scroll`, `Img`, `Button`, `Input`, `TextArea`, `Br`, `Ul`, `Ol`, `Li`                                                                |
| `@triniwiz/nativescript-masonkit/web` | `div`, `section`, `header`, `footer`, `article`, `main`, `nav`, `aside`, `span`, `code`, `h1`-`h6`, `p`, `ul`, `li`, `blockquote`, `b`, `strong`, `a` |

Each name works in its original, lowercase and kebab-case spelling, so `<View>`,
`<view>` and `<text-area>` all resolve.

Note that these **replace** some core elements in Angular templates: `<Button>`,
`<img>` and `<Span>` resolve to MasonKit's versions rather than core's `Button`,
`Image` and `Span`. Turn off either set if you would rather keep the classic
widgets:

```ts
installMasonKit({ web: false }); // MasonKit elements only
installMasonKit({ mason: false }); // HTML-shaped elements only
```

## Component hosts

By default, your component's own element is a real MasonKit box. That means
styling a component from the outside works the way it does on the web:

```html
<app-story class="card"></app-story>
```

```scss
app-story,
.card {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8;
  padding: 10;
}
```

Without this, Angular component elements produce no native view at all, so
`class`, `backgroundColor`, `margin` and host bindings on them are silently
dropped and the component is invisible to layout. Nesting components then gives
you a layout that doesn't match your template.

Turn it off if you want stock `@nativescript/angular` behaviour and only the
element registrations:

```ts
installMasonKit({ componentHosts: false });
```

### Page-level components

Components that a router outlet loads are page roots - their template is an
`<ActionBar>` plus content that fills the `Page`. Those need to stay transparent,
and they are detected automatically, but detection can only correct things from
the second render onwards. List them to get the first render right too:

```ts
installMasonKit({
  componentHosts: {
    passthrough: ['app-feed', 'app-detail', /-page$/],
  },
});
```

Components _below_ a page root are unaffected and stay real MasonKit boxes.

## Options

`installMasonKit(options?)`

| Option           | Type                              | Default | Description                                   |
| ---------------- | --------------------------------- | ------- | --------------------------------------------- |
| `mason`          | `boolean`                         | `true`  | Register MasonKit's own elements              |
| `web`            | `boolean`                         | `true`  | Register the HTML-shaped elements from `/web` |
| `componentHosts` | `boolean \| ComponentHostOptions` | `true`  | Make component elements real MasonKit boxes   |

`componentHosts` options

| Option                  | Type                   | Default | Description                                                               |
| ----------------------- | ---------------------- | ------- | ------------------------------------------------------------------------- |
| `enabled`               | `boolean`              | `true`  | Turn host mode off, keeping element registration                          |
| `passthrough`           | `PassthroughMatcher[]` | `[]`    | Elements to keep transparent. Strings, regexes or predicates              |
| `autoDetectPassthrough` | `boolean`              | `true`  | Recognise page roots automatically                                        |
| `rootAsPassthrough`     | `boolean`              | `true`  | Keep the app's root component transparent so the tree gets a sized parent |

Router outlets (`page-router-outlet`, `ns-empty-outlet`, `router-outlet`) are
always transparent; your `passthrough` entries are added to that list.

## API

| Export                                | Purpose                                                    |
| ------------------------------------- | ---------------------------------------------------------- |
| `installMasonKit(options?)`           | The whole integration. Call before bootstrap               |
| `registerMasonKitElements(options?)`  | Element registration only                                  |
| `enableMasonComponentHosts(options?)` | Component-host mode only                                   |
| `masonMeta`                           | `ViewClassMeta` for registering your own MasonKit subclass |

Registering your own MasonKit subclass:

```ts
import { registerElement } from '@nativescript/angular';
import { masonMeta } from '@triniwiz/nativescript-masonkit/angular';

registerElement('MyBox', () => MyBox, masonMeta);
```

`masonMeta` is what keeps Angular's view updates (`@if`, `@for`, router changes)
in step with MasonKit's own child tracking. Without it, children are appended
rather than inserted in position, and removals leave stale entries behind.

## Troubleshooting

**A routed screen shows only its ActionBar, everything else is blank.**
That component is a page root whose host box collapsed. Add its selector to
`passthrough`. Check the console - auto-detection logs the name.

**Everything looks cramped, but the text size is right.**
Lengths are in `px`. In NativeScript that means physical pixels. Drop the unit.

**A component's `class` or `backgroundColor` does nothing.**
Component host mode is off, or that element is in `passthrough`.

**`No known component for element X`.**
With host mode on this error can't occur - unknown names silently become boxes,
so a typo'd element renders as an empty box instead of throwing.

## See also

- [`apps/demo-angular`](../../../apps/demo-angular) - a small Hacker News client
  plus a layout stress screen covering insertion order, conditional siblings and
  nested hosts
- [`apps/hn-reference.html`](../../../apps/hn-reference.html) - the same screens
  in a browser, for side-by-side comparison
