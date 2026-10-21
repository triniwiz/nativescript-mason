# Plain NativeScript (XML / TS)

With plain NativeScript there is nothing to install or register. Declare an XML namespace for the module that exports the element, or construct the classes from TypeScript.

## XML

Each MasonKit widget lives in its own module, and the HTML-shaped elements live in `/web`:

```xml
<Page xmlns="http://schemas.nativescript.org/tns.xsd"
  xmlns:ui="@triniwiz/nativescript-masonkit/view"
  xmlns:text="@triniwiz/nativescript-masonkit/text"
  xmlns:img="@triniwiz/nativescript-masonkit/img"
  xmlns:web="@triniwiz/nativescript-masonkit/web">

  <web:div class="card">
    <web:h2 text="Hello Mason" />
    <web:p>
      <web:b text="Tip:" />
      <web:span text=" use real CSS for layout." />
    </web:p>
    <img:Img src="https://picsum.photos/600/600" style="width: 100%; aspect-ratio: 1" />
  </web:div>
</Page>
```

```css
/* app.css */
.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  background-color: #fff;
}
```

| Namespace module | Exports |
| --- | --- |
| `@triniwiz/nativescript-masonkit/view` | `View` |
| `@triniwiz/nativescript-masonkit/text` | `Text`, `Br` |
| `@triniwiz/nativescript-masonkit/scroll` | `Scroll` |
| `@triniwiz/nativescript-masonkit/img` | `Img` |
| `@triniwiz/nativescript-masonkit/button` | `Button` |
| `@triniwiz/nativescript-masonkit/input` | `Input` |
| `@triniwiz/nativescript-masonkit/textarea` | `TextArea` |
| `@triniwiz/nativescript-masonkit/br` | `Br` |
| `@triniwiz/nativescript-masonkit/list` | `UnorderedList`, `OrderedList` |
| `@triniwiz/nativescript-masonkit/li` | `Li` |
| `@triniwiz/nativescript-masonkit/web` | `Div`, `Section`, `P`, `Span`, `H1` to `H6`, `A`, `Details`, ... ([full list](/elements/html)) |

The XML builder upper-cases the first letter of each dash-separated part of a tag, so `<web:div>` and `<web:Div>` both resolve to `Div`, and `<web:h1>` to `H1`.

Text goes in the `text` attribute. Nest text elements to style runs inside a paragraph, as in the `<web:p>` above.

Styles work the usual NativeScript ways: CSS classes from `app.css` or a page stylesheet, a `style="..."` attribute, `style.x="..."` attributes, or plain attributes for properties the view exposes (`width="100"`).

## TypeScript

Every element is a class you can construct:

```ts
import { Page } from '@nativescript/core';
import { Div, H2, P } from '@triniwiz/nativescript-masonkit/web';

export function navigatingTo(args) {
  const page = args.object as Page;

  const card = new Div();
  card.className = 'card';

  const title = new H2();
  title.text = 'Built in code';

  const body = new P();
  body.text = 'Styles can be set from code too.';
  body.style.color = '#475569';

  card.addChild(title);
  card.addChild(body);
  page.content = card;
}
```

Containers expose `addChild(child)`, `insertChild(child, index)` and `removeChild(child)`. The main package also re-exports the widgets and the `/web` classes, so `import { View, Div } from '@triniwiz/nativescript-masonkit'` works too.

## Mixing with core layouts

A MasonKit element placed inside a core layout (`StackLayout`, `GridLayout`, `Page`) acts as a layout root: it is measured by its parent and lays out its own subtree. A core view placed inside a MasonKit container takes part in flex or grid layout as one box. See [Mixing with NativeScript views](/guide/mixing-views).

## Preflight

Set `View.preflight = true` at startup, before any view is created, to start every MasonKit element from a normalised baseline (`box-sizing: border-box`, zero margin, padding and border width, transparent background, `list-style: none`, `display: block` on `<img>`). It applies to the whole tree.

```ts
// app.ts
import { View } from '@triniwiz/nativescript-masonkit';

View.preflight = true;
```

::: tip Units
Inside MasonKit elements `px` is a CSS pixel, as in a browser, and a bare number means the same. Core views keep NativeScript's meaning. See [Units](/styling/units).
:::
