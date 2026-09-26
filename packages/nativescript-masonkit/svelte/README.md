# @triniwiz/nativescript-masonkit/svelte

Svelte Native support for MasonKit.

## Setup

MasonKit ships this entry point, so no extra package is required. Register the
elements in the app entry file before starting Svelte Native:

```ts
import { svelteNative } from 'svelte-native';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/svelte';
import App from './App.svelte';

installMasonKit();
svelteNative(App, {});
```

The call registers MasonKit's native elements and all HTML-shaped elements from
`@triniwiz/nativescript-masonkit/web`. It is safe to call repeatedly during HMR.

```svelte
<page>
  <div class="card">
    <h2>{title}</h2>
    {#each items as item (item.id)}
      <span>{item.label}</span>
    {/each}
  </div>
</page>
```

## Options

```ts
installMasonKit({ web: false }); // native MasonKit elements only
installMasonKit({ mason: false }); // HTML-shaped elements only
```

svelte-native registers core's `Button`, `Label` and `Span` under names MasonKit
also uses. MasonKit's implementations take over `<button>`, `<label>` and
`<span>`, and the core elements stay available as `<nbutton>`, `<nlabel>` and
`<nspan>`. Use `<nspan>` inside `<nlabel><formattedString>`, which needs core's
`Span`.

## How children are placed

svelte-native only inserts by index into a core layout; any other parent gets
an append. MasonKit containers are registered with `MasonElementNode`, which
maps a child's position among svelte's nodes to MasonKit's own child list (one
slot per element and per non-empty text node) so keyed `{#each}` blocks keep
their order.
