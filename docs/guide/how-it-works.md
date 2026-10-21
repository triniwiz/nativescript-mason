# How it works

You do not need any of this to use MasonKit, but a rough picture of the moving parts makes layout behaviour easier to predict.

## Three layers

| Layer | What it does |
| --- | --- |
| **TypeScript** (`@triniwiz/nativescript-masonkit`) | Element classes (`Div`, `P`, `View`, `Img`, ...) and the CSS properties MasonKit registers with NativeScript's styling system. |
| **Native views** (Swift on iOS, Kotlin on Android, C++/WinRT on Windows) | One native view per element. Draws backgrounds, borders, shadows and text, handles touch, scrolling and accessibility. |
| **Mason core** (Rust, built on [taffy](https://github.com/DioxusLabs/taffy)) | Holds the layout tree and computes every box's size and position: flexbox, grid, block and inline flow, floats, positioning. |

The same Rust core runs on all three platforms, which is why one stylesheet lays out the same way on each of them.

## From CSS to pixels

1. **NativeScript matches your CSS.** Selectors, classes, specificity, `@media` and `var()` are handled by NativeScript's own CSS engine, exactly as for any other view.
2. **MasonKit receives each declaration.** Its property handlers parse the value with web semantics (CSS `px`, `rem`, `em`, `calc()`, ...) and write it into the node's style. The style lives in memory shared by the JS and native sides, so setting a property does not cost a native call per value. Changes made in the same turn of the event loop are flushed together.
3. **Mason computes layout.** When the tree is dirty, the Rust core lays it out in one pass against the space available.
4. **Native views are placed.** Each view gets its computed frame and repaints if needed.

Reading a layout-dependent value such as `scrollHeight` or `clientWidth` runs any pending layout first, as it does in a browser.

## Mason trees and roots

A MasonKit element whose parent is **not** a MasonKit element (a `Page`, `GridLayout`, `StackLayout`, ...) is the **root** of a Mason tree:

- It is measured by NativeScript like any other view. When NativeScript gives it a definite size, the root lays out against that size. When the space is unconstrained, it sizes to its max-content size.
- Every MasonKit descendant is then placed by the Mason core in the same pass, without going back through NativeScript's measure and layout for each view.

A MasonKit element nested inside another one is just a node in its parent's tree.

A plain NativeScript view inside a MasonKit element (for example a `Label` or a `ListView` inside a `<div>`) becomes a single **leaf** box. Mason asks NativeScript to measure it, places it with flex or grid like any other child, and NativeScript lays out whatever is inside it. See [Mixing with NativeScript views](/guide/mixing-views).

## Elements are native views

Every element you create is a real native view: a `UIView` subclass on iOS, an Android `View` or `ViewGroup`, a XAML element on Windows. There is no web view and no HTML engine involved.

### Text

A text element (`<p>`, `<span>`, `<h1>`, `<li>`, ...) is a single native text view. Inline children inside it, such as a `<strong>` or `<a>` inside a `<p>`, become styled runs of that one text view rather than separate views, so a paragraph with ten styled words is still one view. Taps on a run are still delivered to the element that produced it. Inline elements placed directly in a block such as a `<div>` are grouped the same way: consecutive inline children share one anonymous text container. Non-text inline content, such as an `<img>` or an `inline-block` element on the line, stays a real view positioned within the text.

Each platform shapes and measures text with its native text stack (CoreText on iOS, Android's text layout APIs, DirectWrite on Windows), so fonts, glyphs and line breaking look native. Mason uses those measurements to size text boxes during layout.

### Block containers can scroll

As in a browser, every block box can become a scroll container. `<div>`, `<section>`, `<article>`, `<main>`, `<ul>` and the other block elements all scroll when you give them `overflow: auto` or `overflow: scroll` and their content is larger than their box. With the default `overflow: visible` they neither scroll nor clip.

Scrolling is implemented by MasonKit itself rather than the system scroll view, so nesting scroll containers inside each other works. See [Scrolling](/guide/scrolling).

## Browser defaults

Elements come with browser-like user-agent defaults: heading sizes and margins, paragraph margins, list indentation and markers, `<pre>` whitespace, and so on. They sit at the lowest priority, so any rule in your stylesheet overrides them. Turn them off globally with [preflight](/guide/installation#preflight-optional).

## Where MasonKit semantics apply

MasonKit's CSS semantics apply to MasonKit elements only. A plain NativeScript view keeps NativeScript's semantics even when it sits inside a `<div>`, including NativeScript's meaning of `px` (a device pixel). Installing MasonKit does not change how the rest of your app lays out. See [Units](/styling/units) and [Mixing with NativeScript views](/guide/mixing-views).
