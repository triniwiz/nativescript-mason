# Quick start

This page builds one small screen, a header plus a grid of cards, first in XML and then in plain TypeScript. Both use the same stylesheet.

## The stylesheet

Put this in `app.css` (or a page's own CSS file). It is ordinary CSS: element selectors match MasonKit's HTML-shaped elements, and `px` is a CSS pixel, exactly as on the web.

```css
/* app.css */
.screen {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  height: 100%;
  background-color: #f4f5f7;
}

h1 {
  margin: 0;
  font-size: 1.75rem;
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.card {
  padding: 12px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.card p {
  margin: 4px 0 0;
  color: #5f6368;
}
```

## XML

Declare a namespace for the HTML-shaped elements (`/web`). XML tags use the exported class names, so `<div>` is `<web:Div>` and `<p>` is `<web:P>`. Set text with `textContent`.

```xml
<Page xmlns="http://schemas.nativescript.org/tns.xsd"
      xmlns:web="@triniwiz/nativescript-masonkit/web">
  <web:Div class="screen">
    <web:H1 textContent="Dashboard" />

    <web:Div class="cards">
      <web:Div class="card">
        <web:Strong textContent="Orders" />
        <web:P textContent="1,204 this week" />
      </web:Div>
      <web:Div class="card">
        <web:Strong textContent="Refunds" />
        <web:P textContent="18 this week" />
      </web:Div>
      <web:Div class="card">
        <web:Strong textContent="Visitors" />
        <web:P textContent="32,880 this week" />
      </web:Div>
      <web:Div class="card">
        <web:Strong textContent="Revenue" />
        <web:P>
          <web:Span textContent="Up " />
          <web:Strong textContent="12%" />
        </web:P>
      </web:Div>
    </web:Div>
  </web:Div>
</Page>
```

Nested elements inside a `<p>` (the last card) become styled runs of the same paragraph, as inline elements do in a browser.

MasonKit's own widgets (`View`, `Text`, `Img`, `Button`, `Input`, ...) live at the package root, so add a second namespace when you need them:

```xml
<Page xmlns="http://schemas.nativescript.org/tns.xsd"
      xmlns:web="@triniwiz/nativescript-masonkit/web"
      xmlns:mason="@triniwiz/nativescript-masonkit">
  <web:Div class="screen">
    <mason:Img src="https://picsum.photos/600/300" />
    <mason:Button textContent="Continue" />
  </web:Div>
</Page>
```

## TypeScript

The same screen built in code. Elements are NativeScript views: create them with `new`, set `className` or `style`, and add children with `addChild`.

```ts
// app.ts
import { Application } from '@nativescript/core';
import { Div, H1, P, Strong } from '@triniwiz/nativescript-masonkit/web';

function card(title: string, body: string) {
  const el = new Div();
  el.className = 'card';

  const heading = new Strong();
  heading.textContent = title;
  el.addChild(heading);

  const text = new P();
  text.textContent = body;
  el.addChild(text);

  return el;
}

Application.run({
  create() {
    const screen = new Div();
    screen.className = 'screen';

    const title = new H1();
    title.textContent = 'Dashboard';
    screen.addChild(title);

    const cards = new Div();
    cards.className = 'cards';
    cards.addChild(card('Orders', '1,204 this week'));
    cards.addChild(card('Refunds', '18 this week'));
    cards.addChild(card('Visitors', '32,880 this week'));
    screen.addChild(cards);

    return screen;
  },
});
```

Styles can also be set directly, with the same values the stylesheet accepts:

```ts
cards.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
cards.style.gap = '12px 16px'; // row gap, column gap
```

::: tip
A MasonKit element placed directly in a NativeScript layout (a `Page`, `GridLayout`, `StackLayout`, ...) becomes the root of its own Mason tree and sizes itself to the space it is given. Everything below it is laid out by Mason. See [How it works](/guide/how-it-works).
:::

## Using a framework

The markup is the same idea in every flavour, with real HTML tag names:

- [Angular](/frameworks/angular)
- [Vue 3](/frameworks/vue)
- [Svelte Native](/frameworks/svelte)
- [React](/frameworks/react)
- [Solid](/frameworks/solid)
- [Plain NativeScript (XML / TS)](/frameworks/core) for more on the setup used here

## Where to go next

- [Units](/styling/units): how `px`, `rem`, `em` and viewport units resolve.
- [Flexbox](/styling/flexbox) and [Grid](/styling/grid).
- [HTML elements](/elements/html): every tag and its defaults.
- [Mixing with NativeScript views](/guide/mixing-views): put a `Label` or `ListView` inside a `<div>`, or a `<div>` inside a `StackLayout`.
