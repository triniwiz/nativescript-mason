# Lists

`<ul>`, `<ol>` and `<li>` render lists with markers, as in a browser:

```html
<ul>
  <li>Milk</li>
  <li>Eggs</li>
</ul>

<ol>
  <li>Preheat the oven</li>
  <li>Mix the batter</li>
</ol>
```

- `<ul>` and `<ol>` are block containers with `margin: 16px 0` and `padding-left: 40px`. The padding is the gutter the markers draw in.
- `<li>` is a block-level [text element](/elements/text): it holds text and inline content directly.
- `<ul>` draws discs, `<ol>` draws `1.`, `2.`, `3.`, ... counting its `<li>` children in order.

Markers are drawn on iOS, Android and Windows, in the item's text colour and scaled to its font size.

## list-style-type

| Value | Marker |
| --- | --- |
| `disc` | filled circle (default for `<ul>`) |
| `circle` | hollow circle |
| `square` | filled square |
| `decimal` | `1.` `2.` `3.` (default for `<ol>`) |
| `none` | no marker |

Other CSS values (`upper-roman`, `lower-alpha`, a custom string, ...) are ignored and the previous type stays.

`list-style-type` is inherited, as in CSS. Set it on the list to style every item, or on one item to override it:

```css
.checklist { list-style-type: square; }
.checklist .done { list-style-type: none; }
```

A nested list sets its own type, so a `<ul>` inside an `<ol>` keeps its discs.

## list-style-position

`outside` (default) draws the marker in the list's left padding. `inside` draws it as the start of the item's first line of text, so it wraps with the content:

```css
.compact { padding-left: 0; list-style-position: inside; }
```

## The list-style shorthand

`list-style` sets type and position together, in any order. An image (`url(...)`) is accepted by the parser but not drawn.

```css
ul.plain { list-style: none; }
ol.steps { list-style: decimal inside; }
```

`list-style: none` (or a utility class like `list-none`) removes the markers. Remove the padding too if you no longer want the gutter:

```css
ul.menu { list-style: none; padding-left: 0; margin: 0; }
```

With [preflight](/elements/#preflight), `<ul>` and `<ol>` start with `list-style-type: none` and no margin or padding.

::: tip
`start`, `reversed` and `<li value>` are not supported: an `<ol>` always counts from 1.
:::

## Data-bound list

Besides the HTML list elements, the base package exports a native, templated list widget for long, data-driven lists. It is a separate element from `<ul>`/`<ol>`: in framework templates those tags are always the HTML elements, so this widget is only reached by importing it or through an XML namespace.

```xml
<Page xmlns="http://schemas.nativescript.org/tns.xsd"
      xmlns:list="@triniwiz/nativescript-masonkit/list"
      xmlns:li="@triniwiz/nativescript-masonkit/li"
      xmlns:text="@triniwiz/nativescript-masonkit/text">
  <list:OrderedList items="{{ items }}" height="100%">
    <list:OrderedList.itemTemplate>
      <li:Li>
        <text:Text textContent="{{ name }}" />
      </li:Li>
    </list:OrderedList.itemTemplate>
  </list:OrderedList>
</Page>
```

`OrderedList` and `UnorderedList` (exported from the package root as `Ol` and `Ul`) take:

| Member | Meaning |
| --- | --- |
| `items` | An array, an `ObservableArray` (changes refresh the list) or an `ItemsSource`. |
| `itemTemplate` | Template for each item. |
| `itemTemplates`, `itemTemplateSelector` | Several keyed templates, and a function or binding expression that picks one per item. |
| `itemIdGenerator` | `(item, index, items) => number`; defaults to the index. |
| `refresh()` | Re-renders the items. |
| `itemLoading` event | Fired as each item view is prepared. |
