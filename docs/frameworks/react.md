# React

There is no dedicated React entry point. `@nativescript-community/react` renders React into a [dominative](https://github.com/SudoMaker/DOMiNATIVE) DOM, so MasonKit's elements are registered with dominative, from the shared [element registry](/frameworks/#the-element-registry). The glue below lives in your app and follows the repository's `apps/demo-react`.

## Setup

Install the renderer and its peer dependencies alongside MasonKit:

```bash
npm install @nativescript-community/react dominative undom-ng react react-reconciler
ns plugin add @triniwiz/nativescript-masonkit
```

Register the elements in the app entry, before the app starts:

```tsx
// src/index.ts
import { Application } from '@nativescript/core';
import { startReactApp } from '@nativescript-community/react';
import { makeView, registerElement, scope } from 'dominative';
import { getMasonKitElements } from '@triniwiz/nativescript-masonkit/elements';
import { App } from './app';

for (const { tag, ctor, isContainer } of getMasonKitElements()) {
  const key = tag.toLowerCase();
  // dominative pre-registers some tags (span, button, ...) for core widgets.
  if (scope[key]) delete scope[key];
  registerElement(key, isContainer ? makeMasonElement(ctor) : makeView(ctor, {}));
}

startReactApp({ Application, root: App });
```

`makeMasonElement` wraps container elements so dominative's text nodes become MasonKit text runs in the right position. It is not React-specific; copy it from [Solid: makeMasonElement](/frameworks/solid#makemasonelement). (`apps/demo-react` carries an older copy without the last insert-position fallback.)

::: info Routing
`apps/demo-react` boots through a preview build of `@tanstack/react-nativescript-router` (`startNativeScriptApp({ router })`) instead of `startReactApp`. The element registration is the same either way.
:::

## Build setup

`@nativescript/webpack`'s TypeScript rule only matches `.ts`. Point `ts-loader` at `.tsx` too, and set `"jsx": "react-jsx"` in `tsconfig.json`:

```js
// webpack.config.js
const webpack = require('@nativescript/webpack');

module.exports = (env) => {
  webpack.init(env);

  webpack.chainWebpack((config) => {
    config.resolve.extensions.prepend('.tsx').prepend('.jsx');
    config.module
      .rule('tsx')
      .test(/\.tsx$/)
      .use('ts-loader')
      .loader('ts-loader')
      .options({ transpileOnly: true, allowTsInNodeModules: true });
  });

  return webpack.resolveConfig();
};
```

## Using the elements

```tsx
import { useState } from 'react';

const PILLS = ['Flexbox', 'Grid', 'CSS', 'React'];

export function App() {
  const [count, setCount] = useState(0);

  return (
    <scroll style={{ backgroundColor: '#0f172a', padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>Mason + React</span>

        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PILLS.map((label) => (
            <div key={label} className="pill">
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div onClick={() => setCount((c) => c + 1)} style={{ display: 'flex', alignItems: 'center', padding: 14, borderRadius: '8px', backgroundColor: '#22c55e' }}>
          <span style={{ color: 'white' }}>Tapped {count} times</span>
        </div>
      </div>
    </scroll>
  );
}
```

- Tags are the lowercase keys you registered: `<div>`, `<span>`, `<scroll>`, `<view>`, `<input>`.
- `className` takes CSS classes; `style` takes an object with camelCase properties.
- Event props add a listener on the element itself (no delegation): `onClick` and `onTap` both listen for `tap`, and any other `on<Event>` listens for the lowercased name (`onLoaded` for `loaded`). On MasonKit elements `tap` and `click` are the same native event.

## TypeScript

MasonKit does not ship JSX typings. This repository generates them from the element registry with `npm run gen:jsx-types`, into `apps/demo-react/src/jsx.d.ts`. Copy that file into your app's `src/` so every MasonKit tag typechecks. It declares each tag loosely as `any`, both globally and for React's JSX namespace:

```ts
// src/jsx.d.ts (generated, excerpt)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      a: any;
      div: any;
      scroll: any;
      span: any;
      view: any;
      // ...one entry per registered tag
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      a: any;
      div: any;
      // ...same list
    }
  }
}

export {};
```

## Preflight

`apps/demo-react` sets `View.preflight = true` before registering the elements, which suits utility CSS such as Tailwind:

```ts
import { View } from '@triniwiz/nativescript-masonkit';

View.preflight = true;
```

See [Plain NativeScript](/frameworks/core#preflight) for what it resets.
