# @triniwiz/nativescript-masonkit/vue

Vue 3 support for MasonKit and `nativescript-vue`.

## Setup

MasonKit ships this entry point, so no extra package is required. Install it in
the app entry file before starting Vue:

```ts
import { createApp } from 'nativescript-vue';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/vue';
import App from './App.vue';

installMasonKit();
createApp(App).start();
```

The call registers MasonKit's native elements and all HTML-shaped elements from
`@triniwiz/nativescript-masonkit/web`. It is safe to call repeatedly during HMR.

```vue
<template>
  <div class="card">
    <h2>{{ title }}</h2>
    <span>{{ subtitle }}</span>
  </div>
</template>
```

Available native elements are `View`, `Text`, `Scroll`, `Img`, `Button`,
`Input`, `TextArea`, `Br`, `Ul`, `Ol` and `Li`. Web-shaped elements include
`div`, `section`, `header`, `footer`, `article`, `main`, `nav`, `aside`, `span`,
`code`, `h1`-`h6`, `p`, `ul`, `li`, `blockquote`, `b`, `strong` and `a`.

Names are case-insensitive and ignore hyphens, following NativeScript-Vue's
normalization rules.

## Options

```ts
installMasonKit({ web: false }); // native MasonKit elements only
installMasonKit({ mason: false }); // HTML-shaped elements only
```

The integration intentionally replaces conflicting built-in Vue registrations
such as `Button` and `Span` with MasonKit's Taffy-backed implementations.

Vue components do not create native host elements: their root view (or fragment)
is rendered directly. Attributes and classes on a component are therefore
forwarded by Vue to a single root as usual; use an explicit `<View>` or `<div>`
when a component needs its own box, especially for multi-root components.

## Custom elements

Use `masonMeta` when registering a custom MasonKit `View` subclass. It ensures
Vue insertions and removals use MasonKit's child bookkeeping:

```ts
import { registerElement } from 'nativescript-vue';
import { masonMeta } from '@triniwiz/nativescript-masonkit/vue';

registerElement('MyBox', () => MyBox, masonMeta);
```
