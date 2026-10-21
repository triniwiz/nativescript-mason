# Svelte Native

`@triniwiz/nativescript-masonkit/svelte` registers every MasonKit element with `@nativescript-community/svelte-native`.

## Setup

Call `installMasonKit()` in the app entry, before starting Svelte Native:

```ts
// app.ts
import { svelteNative } from '@nativescript-community/svelte-native';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/svelte';
import App from './App.svelte';

installMasonKit();
svelteNative(App, {});
```

It is safe to call repeatedly, including during HMR.

The entry point imports `@nativescript-community/svelte-native`, the package's current name. An app still on the old `svelte-native` package has to alias one name to the other so both load the same module, because MasonKit registers its elements in that module's registry.

## Using the elements

```svelte
<script lang="ts">
  let taps = 0;
  let items = [
    { id: 1, label: 'Flexbox' },
    { id: 2, label: 'Grid' },
  ];
</script>

<page>
  <div class="card">
    <h2>Tapped {taps} times</h2>
    {#each items as item (item.id)}
      <span class="pill">{item.label}</span>
    {/each}
    <button class="btn" on:tap={() => taps++}>Tap me</button>
  </div>
</page>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
  }
</style>
```

Svelte Native lowercases tag names, so write MasonKit's widgets in lowercase: `<view>`, `<text>`, `<scroll>`, `<img>`, `<textarea>`.

### Names shared with core

Svelte Native registers core's `Button`, `Label` and `Span` under names MasonKit also uses. MasonKit takes over `<button>`, `<label>` and `<span>`, and the core elements stay available with an `n` prefix:

| Tag | Element |
| --- | --- |
| `<button>` | MasonKit `Button` |
| `<label>`, `<span>` | MasonKit `/web` elements |
| `<nbutton>`, `<nlabel>`, `<nspan>` | core `Button`, `Label`, `Span` |

Use `<nspan>` inside `<nlabel><formattedString>`, which needs core's `Span`.

## Child order

Svelte Native only inserts by index into a core layout and appends everywhere else. MasonKit containers are registered with `MasonElementNode`, which maps a child's position among Svelte's nodes to MasonKit's own child list (one slot per element and per non-empty text node). Keyed `{#each}` blocks and conditional siblings therefore keep their order.

## Options

```ts
installMasonKit({ web: false }); // MasonKit widgets only
installMasonKit({ mason: false }); // HTML-shaped elements only
```

## API

| Export | Purpose |
| --- | --- |
| `installMasonKit(options?)` | Register the elements. Call before `svelteNative()` |
| `MasonElementNode` | The element node class used for MasonKit containers |

Register your own MasonKit container subclass the same way the entry point does:

```ts
import { registerElement } from '@nativescript-community/svelte-native/dom';
import { MasonElementNode } from '@triniwiz/nativescript-masonkit/svelte';

registerElement('mybox', () => new MasonElementNode('mybox', MyBox));
```
