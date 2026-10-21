# Grid

`display: grid` (or `inline-grid`) makes an element a CSS grid container, laid out by the [Taffy](https://github.com/DioxusLabs/taffy) grid algorithm.

```html
<div class="gallery">
  <img src="~/images/1.jpg" />
  <img src="~/images/2.jpg" />
  <img src="~/images/3.jpg" />
</div>
```

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
```

## Container properties

| Property | Values |
| --- | --- |
| `grid-template-columns`, `grid-template-rows` | a track list, see below |
| `grid-template-areas` | quoted rows of area names, or `none` |
| `grid-auto-columns`, `grid-auto-rows` | sizes of implicitly created tracks; a list such as `100px 1fr` repeats |
| `grid-auto-flow` | `row` (default), `column`, `row dense`, `column dense` |
| `gap`, `row-gap`, `column-gap` (also `grid-gap`, `grid-row-gap`, `grid-column-gap`) | lengths or percentages |
| `justify-items`, `align-items`, `place-items` | `normal`, `start`, `end`, `flex-start`, `flex-end`, `center`, `baseline`, `stretch` |
| `justify-content`, `align-content`, `place-content` | `normal`, `start`, `end`, `flex-start`, `flex-end`, `center`, `stretch`, `space-between`, `space-around`, `space-evenly` |

The `grid-template` and `grid` shorthands aren't supported. Set the longhands.

## Track lists

A track list is a space-separated list of track sizes. Each size can be:

| Size | Example |
| --- | --- |
| a length | `120px`, `120` (CSS px), `2dppx` |
| a percentage | `25%` |
| a flexible fraction | `1fr`, `2fr` |
| a keyword | `auto`, `min-content`, `max-content` |
| `minmax(min, max)` | `minmax(120px, 1fr)`, `minmax(0, 1fr)` |
| `fit-content(limit)` | `fit-content(240px)` |

`repeat()` takes a count or `auto-fill` / `auto-fit`:

```css
.columns {
  grid-template-columns: 200px repeat(2, 1fr) 80px;
}

/* as many 160px-or-wider columns as fit */
.responsive {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
```

`auto-fill` keeps empty tracks when there are fewer items than columns; `auto-fit` collapses them so the items stretch, as in CSS.

Track sizes take every length unit (`px`, `rem`, `em`, `pt`, `vw`, `vh`, ...), percentages, `fr` and `calc()`/`min()`/`max()`/`clamp()`. A math function that mixes `%` with a length can't be resolved before layout, so it is dropped with a [diagnostic](/guide/diagnostics).

`subgrid` and `masonry` aren't supported.

## Placing items

| Property | Values |
| --- | --- |
| `grid-column-start`, `grid-column-end`, `grid-row-start`, `grid-row-end` | `auto`, a line number (negative counts from the end), `span <n>`, an area name |
| `grid-column`, `grid-row` | `<start> / <end>` |
| `grid-area` | an area name, or `<row-start> / <column-start> / <row-end> / <column-end>` |

```css
.hero {
  grid-column: 1 / -1;      /* full width */
}

.wide {
  grid-column: span 2;
}

.tall {
  grid-row: 2 / span 3;
}
```

## Template areas

Name regions with `grid-template-areas` and place items into them with `grid-area`. Use `.` for an empty cell. Every row must have the same number of cells.

```css
.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    'header header'
    'nav    main'
    'footer footer';
  height: 100%;
}

.layout > header { grid-area: header; }
.layout > nav    { grid-area: nav; }
.layout > main   { grid-area: main; }
.layout > footer { grid-area: footer; }
```

## Named lines

Line names in brackets are accepted in track lists. When you place an item by a name, Mason looks for the line `<name>-start` (for a start edge) or `<name>-end` (for an end edge), which is how area names work. So name lines in `-start` / `-end` pairs and place by the base name:

```css
.page {
  display: grid;
  grid-template-columns: [full-start] 16px [content-start] 1fr [content-end] 16px [full-end];
}

.page > * {
  grid-column: content / content;   /* content-start to content-end */
}

.page > .bleed {
  grid-column: full / full;
}
```

As in CSS, a lone name fills in the missing end, so `grid-column: content` is the same as `content / content` and spans `content-start` to `content-end`. Full line names (`grid-column-start: content-start`) and single named lines (`[sidebar]`) resolve too.

## Auto placement

Items without an explicit position fill the grid in order, row by row, or column by column with `grid-auto-flow: column`. The `dense` variants backfill earlier holes with later, smaller items:

```css
.mosaic {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 100px;
  grid-auto-flow: row dense;
}
```

`dense` on its own means `row dense`, and the keywords can come in either order (`dense column`).

## Alignment

Grid items align within their cell with `justify-self` / `align-self` (or `place-self`). The container sets defaults for all items with `justify-items` / `align-items`, and distributes extra space between tracks with `justify-content` / `align-content`.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  justify-content: space-between;
  place-items: center;
}
```
