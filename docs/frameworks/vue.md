# Vue 3

`@triniwiz/nativescript-masonkit/vue` registers every MasonKit element with `nativescript-vue` 3.

## Setup

Call `installMasonKit()` in the app entry, before starting Vue:

```ts
// app.ts
import { createApp } from 'nativescript-vue';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/vue';
import App from './App.vue';

installMasonKit();
createApp(App).start();
```

It is safe to call repeatedly, including during HMR.

## Using the elements

```vue
<script setup lang="ts">
import { ref } from 'nativescript-vue';

const count = ref(0);
</script>

<template>
  <Page>
    <div class="card">
      <h2>Tapped {{ count }} times</h2>
      <span class="subtitle">Real CSS, native views</span>
      <button @tap="count++">Tap me</button>
    </div>
  </Page>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}
</style>
```

Tag names are case-insensitive and hyphens are ignored (NativeScript-Vue's own rule), so `<View>`, `<view>`, `<TextArea>` and `<text-area>` are the same element.

Text can be written as template text, including interpolation, or set with a `text` attribute.

### Names shared with core

NativeScript-Vue registers core's `Button`, `Label` and `Span`, which MasonKit also uses. MasonKit's elements take over those names, and the core ones stay available with an `n` prefix:

| Tag | Element |
| --- | --- |
| `<button>` | MasonKit `Button` |
| `<label>`, `<span>` | MasonKit `/web` elements |
| `<nbutton>`, `<nlabel>`, `<nspan>` | core `Button`, `Label`, `Span` |

Use the core versions where core needs them, for example `<nlabel><FormattedString><nspan text="..." /></FormattedString></nlabel>`.

## `v-model`

`v-model` works on `<input>` and `<textarea>`, updating on the `input` event:

```vue
<template>
  <div class="form">
    <input v-model="name" placeholder="Name" />
    <input v-model="agree" type="checkbox" />
    <input v-model="size" type="radio" value="s" />
    <input v-model="size" type="radio" value="m" />
    <textarea v-model="notes" />
  </div>
</template>
```

The binding follows the input type, as on the web: a checkbox binds `checked`, a radio group binds the `value` of the selected radio, and every other type binds `value`. Attribute order does not matter: the model is applied once `type` is set.

## Components and layout

Vue components do not create a native element of their own: their root view (or fragment) is rendered directly. Attributes and classes on a component fall through to its single root as usual. Give a component an explicit `<div>` or `<View>` root when it needs its own box, especially for multi-root components.

## Options

```ts
installMasonKit({ web: false }); // MasonKit widgets only
installMasonKit({ mason: false }); // HTML-shaped elements only
```

## Custom elements

Register your own MasonKit container subclass with `masonMeta`, so Vue's inserts and removals go through MasonKit's child list (which also counts text runs):

```ts
import { registerElement } from 'nativescript-vue';
import { masonMeta } from '@triniwiz/nativescript-masonkit/vue';

registerElement('MyBox', () => MyBox, masonMeta);
```
