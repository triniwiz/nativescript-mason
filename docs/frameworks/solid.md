# Solid

There is no dedicated Solid entry point. `@nativescript-community/solid-js` renders into a [dominative](https://github.com/SudoMaker/DOMiNATIVE) DOM, so you register MasonKit's elements with dominative yourself, from the shared [element registry](/frameworks/#the-element-registry). The glue below lives in your app; it is the code the repository's `apps/demo-solid` runs.

## Setup

Start from a NativeScript Solid app (it already depends on `@nativescript-community/solid-js`, `solid-js` and `dominative`), then add MasonKit:

```bash
ns plugin add @triniwiz/nativescript-masonkit
```

Register the elements in the app entry, before `render()`:

```ts
// src/index.ts
import { render } from '@nativescript-community/solid-js';
import { Application } from '@nativescript/core';
import { document, makeView, registerElement, scope } from 'dominative';
import { getMasonKitElements } from '@triniwiz/nativescript-masonkit/elements';
import { App } from './app';

for (const { tag, ctor, isContainer } of getMasonKitElements()) {
  const key = tag.toLowerCase();
  // dominative pre-registers some tags (span, button, ...) for core widgets.
  if (scope[key]) delete scope[key];
  registerElement(key, isContainer ? makeMasonElement(ctor) : makeView(ctor, {}));
}

Application.run({
  create: () => {
    render(App, document.body);
    return document;
  },
});
```

### `makeMasonElement`

dominative's built-in child policies either drop text nodes (`layout`) or flatten them into one string (`builder`). MasonKit containers hold both elements and separate text runs, so containers need a small wrapper that sends text nodes to MasonKit's own `insertBefore` and recovers the insert position when dominative passes no reference:

```ts
function makeMasonElement(base: any) {
  const view: any = makeView(base, { childrenPolicy: 'layout' });

  return class MasonElement extends view {
    constructor(...args: any[]) {
      super(...args);
      this.__dominative_role = 'Layout';
    }

    __dominative_onInsertChild(child: any, ref: any) {
      // Text node: MasonKit creates a native text run and places it by index.
      if (child.nodeType === 3) {
        const effectiveRef = ref ?? child.nextSibling ?? null;
        try {
          super.insertBefore(child, effectiveRef);
        } catch {
          super.insertBefore(child, ref ?? null);
        }
        return;
      }
      // No ref: dominative may have dropped a text-node anchor.
      if (!ref) {
        const next = child.nextSibling;
        if (next != null) {
          try {
            super.insertBefore(child, next);
            return;
          } catch {}
        }
        this.addChild(child);
        return;
      }
      // The ref is the next element; text runs may sit between it and the child.
      for (let next = child.nextSibling; next != null && next !== ref; next = next.nextSibling) {
        try {
          super.insertBefore(child, next);
          return;
        } catch {}
      }
      try {
        super.insertBefore(child, ref);
      } catch {
        super.__dominative_onInsertChild(child, ref);
      }
    }

    __dominative_onRemoveChild(child: any) {
      if (child.nodeType === 3) {
        super.removeChild(child);
        return;
      }
      super.__dominative_onRemoveChild(child);
    }
  };
}
```

In-place text edits need no glue: once MasonKit adopts a text node, writes to its `data` reach the native run.

## Using the elements

```tsx
import { createSignal, For } from 'solid-js';

export function App() {
  const [count, setCount] = createSignal(0);
  const pills = ['Flexbox', 'Grid', 'CSS'];

  return (
    <>
      <actionbar title="Mason + Solid" />
      <scroll style={{ padding: 16 }}>
        <div class="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2>Tapped {count()} times</h2>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <For each={pills}>{(label) => <span class="pill">{label}</span>}</For>
          </div>
          <div class="btn" on:click={() => setCount((c) => c + 1)}>
            <span>Tap me</span>
          </div>
        </div>
      </scroll>
    </>
  );
}
```

- Tags are the lowercase keys you registered: `<div>`, `<span>`, `<scroll>`, `<view>`, `<input>`.
- `class` takes CSS classes; `style` takes an object with camelCase properties.
- Text can be JSX children or a `text` attribute (`<span text="Hi" />`).

### Events

Use Solid's `on:` namespace, which adds a listener directly on the element: `on:click`, `on:input`, `on:change`, `on:focus`. Solid's delegated `onClick` form does not reach native views. On MasonKit elements `click` and `tap` are the same native event.

```tsx
<input value={name()} placeholder="Name" on:input={(e: any) => setName(e.target.value)} />
<input type="checkbox" checked={agree()} on:change={(e: any) => setAgree(e.target.checked)} />
```

Input events bubble, so one listener on a container can observe all its fields:

```tsx
<div on:input={log} on:change={log}>
  ...
</div>
```

## TypeScript

The demo types JSX with `@nativescript-dom/solidjs-types`, whose intrinsic elements accept any tag name, so MasonKit tags typecheck without extra declarations:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@nativescript-dom/solidjs-types",
    "types": ["node", "@nativescript-dom/core-types", "@nativescript-dom/solidjs-types"]
  }
}
```

## Preflight

To start every element from a normalised baseline, set `View.preflight = true` before rendering:

```ts
import { View } from '@triniwiz/nativescript-masonkit';

View.preflight = true;
```

See [Plain NativeScript](/frameworks/core#preflight) for what it resets.
