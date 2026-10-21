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
`Input`, `TextArea`, `Br`, `Ul`, `Ol` and `Li`. Every HTML-shaped element from
`/web` is registered too: `div`, `section`, `p`, `span`, `h1`-`h6`, `ul`, `ol`,
`li`, `a`, `details`, `label` and
[more](https://triniwiz.github.io/nativescript-mason/elements/html).

Names are case-insensitive and ignore hyphens, following NativeScript-Vue's
normalization rules.

## Options

```ts
installMasonKit({ web: false }); // native MasonKit elements only
installMasonKit({ mason: false }); // HTML-shaped elements only
```

Tags that NativeScript-Vue already registers (core's `Button`, `Label` and
`Span`) are replaced by MasonKit's taffy-backed implementations. The core
elements stay available under an `n` prefix: `<nbutton>`, `<nlabel>` and
`<nspan>`. Use `<nspan>` inside `<nlabel><FormattedString>`, which needs core's
`Span`.

`v-model` works on `<input>` (its `value`, a checkbox's checked state, or the picked
radio's value, as in web Vue) and `<textarea>`.

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
