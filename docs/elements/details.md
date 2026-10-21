# details and summary

`<details>` is a disclosure widget: only its `<summary>` shows until it is opened. Tapping the summary toggles it.

```html
<details>
  <summary>Shipping</summary>
  <p>Orders ship within two business days.</p>
</details>
```

The behaviour is native on iOS, Android and Windows: the summary is exposed to screen readers as an expandable button, and markup parsed through [`innerHTML`](/guide/inner-html) toggles too.

## open

`open` is a boolean attribute. Present means open, absent means closed:

```html
<details open>
  <summary>Already expanded</summary>
  <p>...</p>
</details>
```

In code:

```ts
details.open = true;   // open
details.open = false;  // closed (stored as undefined, an absent attribute)
```

While closed, every child except the first `<summary>` is hidden. This does not touch their own `display`, so a child with `display: none` stays hidden after you open the details.

## Styling the open state

The element matches both `details[open]` and the `:open` pseudo-class, and both restyle whenever `open` changes:

```css
details { border: 1px solid #ddd; border-radius: 8px; padding: 8px 12px; }
details[open] { background-color: #fafafa; }
details:open summary { font-weight: bold; }
```

## The marker

The summary's text starts with a disclosure triangle: `▸` when closed, `▾` when open. Screen readers skip it.

Remove it with `list-style-type: none` on the summary, then draw your own if you want one:

```css
summary { list-style-type: none; }
```

## Accordions with name

Give several `<details>` the same `name` and opening one closes the others:

```html
<details name="faq" open>
  <summary>How do I return an item?</summary>
  <p>...</p>
</details>
<details name="faq">
  <summary>Do you ship abroad?</summary>
  <p>...</p>
</details>
```

Grouping applies to loaded elements: a `<details>` joins its group when it is loaded and leaves it when unloaded.

## The toggle event

Every change of `open`, from a tap or from code, fires `toggle` on the `<details>`. The event carries `oldState` and `newState`, each `'open'` or `'closed'`:

```ts
details.on('toggle', (event: any) => {
  console.log(`${event.oldState} -> ${event.newState}`);
});
```

Because `open` is a NativeScript property, the change also raises `openChange`.

On iOS and Android the toggle is the default action of the summary's `click` event, so `preventDefault()` in a `click` listener stops it. A tap on a link, button or input inside the summary does not toggle it.
