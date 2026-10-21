# @triniwiz/nativescript-masonkit

[![npm](https://img.shields.io/npm/v/@triniwiz/nativescript-masonkit/beta?label=npm)](https://www.npmjs.com/package/@triniwiz/nativescript-masonkit)
[![docs](https://img.shields.io/badge/docs-github%20pages-3d5afe)](https://triniwiz.github.io/nativescript-mason/)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/triniwiz/nativescript-mason/blob/main/LICENSE)

Web layout for NativeScript. MasonKit brings flexbox, grid, block and inline flow, positioning and HTML-shaped elements (`div`, `p`, `span`, `h1`, `ul`, `img`, `input`, ...) to iOS, Android and Windows. Every element is a real native view; layout runs in a Rust core built on [taffy](https://github.com/DioxusLabs/taffy).

**Documentation: https://triniwiz.github.io/nativescript-mason/**

## Install

```bash
ns plugin add @triniwiz/nativescript-masonkit
```

## Usage

Register the elements once in your app entry, then write markup and CSS the way you would for the web.

| Flavour | Setup |
| --- | --- |
| Plain NativeScript (XML / TS) | [XML namespaces or imports](https://triniwiz.github.io/nativescript-mason/frameworks/core) |
| Angular | `installMasonKit()` from `@triniwiz/nativescript-masonkit/angular` ([guide](https://triniwiz.github.io/nativescript-mason/frameworks/angular)) |
| Vue 3 | `installMasonKit()` from `@triniwiz/nativescript-masonkit/vue` ([guide](https://triniwiz.github.io/nativescript-mason/frameworks/vue)) |
| Svelte Native | `installMasonKit()` from `@triniwiz/nativescript-masonkit/svelte` ([guide](https://triniwiz.github.io/nativescript-mason/frameworks/svelte)) |
| React, Solid | register `getMasonKitElements()` with your renderer ([React](https://triniwiz.github.io/nativescript-mason/frameworks/react), [Solid](https://triniwiz.github.io/nativescript-mason/frameworks/solid)) |

Vue 3 example:

```ts
// app.ts
import { createApp } from 'nativescript-vue';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/vue';
import App from './App.vue';

installMasonKit();
createApp(App).start();
```

```vue
<template>
  <div class="card">
    <h2>{{ title }}</h2>
    <p>Styled with <strong>real</strong> CSS.</p>
  </div>
</template>

<style>
.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 1rem;
  border-radius: 12px;
  background-color: #3d5afe;
  color: white;
}
</style>
```

Plain NativeScript XML:

```xml
<Page xmlns="http://schemas.nativescript.org/tns.xsd"
      xmlns:web="@triniwiz/nativescript-masonkit/web">
  <web:Div class="card">
    <web:H2 text="Hello Mason" />
    <web:P text="Styled with real CSS." />
  </web:Div>
</Page>
```

## Highlights

- **CSS that means what it means on the web.** `px` is a CSS pixel, and `rem`, `em`, `vw`, `vh`, `calc()`, `min()`, `max()` and `clamp()` resolve. [Units](https://triniwiz.github.io/nativescript-mason/styling/units)
- **Flexbox, grid, block, inline, float, `position: fixed` and `sticky`.** [Styling](https://triniwiz.github.io/nativescript-mason/styling/)
- **Rich visuals:** gradients, box shadows, border images, corner shapes, filters, backdrop filters, masks, clip paths and transforms. [Effects](https://triniwiz.github.io/nativescript-mason/styling/effects)
- **Scrollable block containers** with a web-shaped scroll API (`scrollTop`, `scrollTo`, `scrollIntoView`). [Scrolling](https://triniwiz.github.io/nativescript-mason/guide/scrolling)
- **Mixes with existing NativeScript views** in both directions. [Mixing views](https://triniwiz.github.io/nativescript-mason/guide/mixing-views)
- **CSS diagnostics** that report what was dropped and why. [Diagnostics](https://triniwiz.github.io/nativescript-mason/guide/diagnostics)

## Contributing

Building the native libraries from source, running the tests and the repo layout are covered in the [contributing guide](https://triniwiz.github.io/nativescript-mason/contributing/).

## License

Apache License Version 2.0
