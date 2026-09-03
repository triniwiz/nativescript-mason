# @triniwiz/nativescript-masonkit

**Web-Inspired Layout System for NativeScript**

A layout engine that brings familiar web layout paradigms (Flexbox, CSS Grid) and semantic HTML elements to NativeScript, powered by a high-performance Rust core. Write layouts the way you would on the web, but running natively on iOS and Android.

**Version:** 1.0.0-beta.60
**License:** Apache-2.0
**Platforms:** iOS 8.0+, Android 8.0+

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Components](#components)
  - [View](#view)
  - [Text](#text)
  - [Img](#img)
  - [Scroll](#scroll)
  - [Button](#button)
  - [Input](#input)
  - [Br](#br)
  - [TextNode](#textnode)
- [Semantic HTML Components](#semantic-html-components)
- [Layout Properties](#layout-properties)
  - [Display](#display)
  - [Box Model](#box-model)
  - [Sizing](#sizing)
  - [Positioning](#positioning)
  - [Flexbox](#flexbox)
  - [CSS Grid](#css-grid)
  - [Gap & Spacing](#gap--spacing)
  - [Overflow & Scrolling](#overflow--scrolling)
  - [Text & Typography](#text--typography)
  - [Visual Styling](#visual-styling)
- [Events](#events)
- [Types Reference](#types-reference)
- [Framework Support](#framework-support)

---

## Installation

```bash
ns plugin add @triniwiz/nativescript-masonkit
```

---

## Quick Start

### XML (NativeScript Core)

```xml
<Page xmlns:mason="@triniwiz/nativescript-masonkit">
  <mason:View display="flex" flexDirection="column" padding="16" gap="8">
    <mason:Text textContent="Hello MasonKit!" fontSize="24" fontWeight="bold" />
    <mason:View display="grid" gridTemplateColumns="1fr 1fr" gap="12">
      <mason:View background="#e0e0e0" padding="8">
        <mason:Text textContent="Column 1" />
      </mason:View>
      <mason:View background="#f0f0f0" padding="8">
        <mason:Text textContent="Column 2" />
      </mason:View>
    </mason:View>
  </mason:View>
</Page>
```

### Using Semantic HTML Components

```xml
<Page xmlns:mason="@triniwiz/nativescript-masonkit">
  <mason:Div display="flex" flexDirection="column">
    <mason:Header padding="16" background="#333">
      <mason:H1 textContent="My App" color="#fff" />
    </mason:Header>
    <mason:Main display="flex" flex="1" padding="16">
      <mason:Nav width="200" padding="8">
        <mason:Ul>
          <mason:Li textContent="Home" />
          <mason:Li textContent="About" />
        </mason:Ul>
      </mason:Nav>
      <mason:Article flex="1" padding="8">
        <mason:P textContent="Welcome to the app!" />
      </mason:Article>
    </mason:Main>
    <mason:Footer padding="16" background="#333">
      <mason:Span textContent="Footer content" color="#fff" />
    </mason:Footer>
  </mason:Div>
</Page>
```

---

## Components

### View

The base container component. Use it as a general-purpose layout wrapper, similar to a `<div>` without built-in scrolling.

```typescript
import { View } from '@triniwiz/nativescript-masonkit';
```

```xml
<mason:View display="flex" flexDirection="row" gap="8" padding="16">
  <!-- children -->
</mason:View>
```

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `addChild` | `(child: any): void` | Appends a child to the view |
| `insertChild` | `(child: any, atIndex: number): void` | Inserts a child at a specific index |
| `replaceChild` | `(child: any, atIndex: number): void` | Replaces the child at a specific index |
| `removeChild` | `(child: any): void` | Removes a child from the view |
| `removeChildren` | `(): void` | Removes all children |
| `getChildrenCount` | `(): number` | Returns the number of children |
| `getChildAt` | `(index: number): View` | Returns the child at the specified index |
| `getChildIndex` | `(child: View): number` | Returns the index of the specified child |
| `getChildById` | `(id: string): any` | Finds a child by its id |
| `forceStyleUpdate` | `(): void` | Forces a recalculation of the layout |

---

### Text

A text display component. Renders styled text content.

```typescript
import { Text } from '@triniwiz/nativescript-masonkit';
```

```xml
<mason:Text textContent="Hello World" fontSize="18" fontWeight="bold" color="#333" />
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `textContent` | `string` | The text content to display |

Inherits all layout and styling properties from [View](#view).

---

### Img

An image component for displaying images from local or remote sources.

```typescript
import { Img } from '@triniwiz/nativescript-masonkit';
```

```xml
<mason:Img src="~/assets/logo.png" width="100" height="100" />
<mason:Img src="https://example.com/image.jpg" aspectRatio="1.5" />
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `src` | `string` | The image source — a local path (`~/...`) or a URL |

---

### Scroll

A scrollable container. Wraps children in a scrollable region.

```typescript
import { Scroll } from '@triniwiz/nativescript-masonkit';
```

```xml
<mason:Scroll overflow="scroll" height="300">
  <!-- Scrollable content -->
</mason:Scroll>
```

---

### Button

A clickable button with text content.

```typescript
import { Button } from '@triniwiz/nativescript-masonkit';
```

```xml
<mason:Button textContent="Click Me" padding="12 24" background="#007AFF" color="#fff" borderRadius="8" />
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `textContent` | `string` | The button label text |

---

### Input

A form input component supporting various input types.

```typescript
import { Input } from '@triniwiz/nativescript-masonkit';
```

```xml
<mason:Input type="text" placeholder="Enter your name" />
<mason:Input type="email" placeholder="you@example.com" />
<mason:Input type="password" />
<mason:Input type="file" accept="image/*" multiple="true" />
<mason:Input type="checkbox" />
<mason:Input type="range" />
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `type` | `InputType` | The input type (see [InputType](#inputtype)) |
| `value` | `string` | The current input value |
| `valueAsNumber` | `number` | The value as a number (for numeric types) |
| `valueAsDate` | `Date \| null` | The value as a Date (for date types) |
| `placeholder` | `string` | Placeholder text |
| `multiple` | `boolean` | Allow multiple values (e.g., file input) |
| `accept` | `string` | Accepted file types (for file inputs) |

---

### Br

A line break element for use inside text components.

```typescript
import { Br } from '@triniwiz/nativescript-masonkit';
```

```xml
<mason:Text>
  <mason:Span textContent="Line one" />
  <mason:Br />
  <mason:Span textContent="Line two" />
</mason:Text>
```

---

### TextNode

A low-level text node for programmatic text manipulation.

```typescript
import { TextNode } from '@triniwiz/nativescript-masonkit';
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `data` | `string` | The text data |
| `length` | `number` (readonly) | Length of the text data |

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `appendData` | `(s: string): this` | Appends text to the end |
| `deleteData` | `(offset: number, count: number): this` | Deletes text at offset |
| `insertData` | `(s: string, offset: number): this` | Inserts text at offset |
| `substringData` | `(offset: number, count: number): string` | Extracts a substring |

---

## Semantic HTML Components

MasonKit provides web-inspired semantic components that map directly to familiar HTML elements. They are styled via CSS using their lowercase tag names.

```typescript
import { Div, Section, Header, Footer, Article, Main, Nav, Aside,
         Span, Code, H1, H2, H3, H4, H5, H6, P, B, Strong,
         A, Blockquote, Li, Ul } from '@triniwiz/nativescript-masonkit';
```

### Container Components

| Component | CSS Selector | Extends | Description |
|-----------|-------------|---------|-------------|
| `Div` | `div` | `Scroll` | General-purpose scrollable container |
| `Section` | `section` | `View` | Thematic grouping of content |
| `Header` | `header` | `View` | Introductory or navigational content |
| `Footer` | `footer` | `View` | Footer content |
| `Article` | `article` | `View` | Self-contained content |
| `Main` | `main` | `View` | Dominant content of the page |
| `Nav` | `nav` | `View` | Navigation links |
| `Aside` | `aside` | `View` | Tangentially related content |
| `Ul` | `ul` | `View` | Unordered list container |

### Text Components

| Component | CSS Selector | Description |
|-----------|-------------|-------------|
| `Span` | `span` | Inline text |
| `Code` | `code` | Code/monospace text |
| `H1` - `H6` | `h1` - `h6` | Heading levels 1 through 6 |
| `P` | `p` | Paragraph text |
| `B` | `b` | Bold text |
| `Strong` | `strong` | Strong emphasis text |
| `A` | `a` | Anchor/link text |
| `Blockquote` | `blockquote` | Block quotation |
| `Li` | `li` | List item |

### Example: CSS Styling

```css
/* App styles */
h1 {
  font-size: 32;
  font-weight: bold;
  margin-bottom: 16;
}

p {
  font-size: 16;
  line-height: 1.5;
  color: #333;
}

header {
  background: #1a1a2e;
  padding: 16;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 8;
}
```

---

## Layout Properties

All components that extend `View` support the following layout properties, settable as XML attributes, via CSS, or programmatically in TypeScript/JavaScript.

### Display

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `display` | `Display` | `'flex'` | Layout mode |
| `boxSizing` | `BoxSizing` | — | Box model calculation |

**Display values:** `'none'` | `'flex'` | `'grid'` | `'block'` | `'inline'` | `'inline-block'` | `'inline-flex'` | `'inline-grid'`

**BoxSizing values:** `'border-box'` | `'content-box'`

---

### Box Model

| Property | Type | Description |
|----------|------|-------------|
| `margin` | `string` | Shorthand margin (all sides) |
| `marginLeft` | `Length` | Left margin |
| `marginRight` | `Length` | Right margin |
| `marginTop` | `Length` | Top margin |
| `marginBottom` | `Length` | Bottom margin |
| `padding` | `string` | Shorthand padding (all sides) |
| `paddingLeft` | `Length` | Left padding |
| `paddingRight` | `Length` | Right padding |
| `paddingTop` | `Length` | Top padding |
| `paddingBottom` | `Length` | Bottom padding |

Length values support `px`, `%`, `dip`, and `auto` (for margins).

---

### Sizing

| Property | Type | Description |
|----------|------|-------------|
| `width` | `DimensionLength` | Element width |
| `height` | `DimensionLength` | Element height |
| `minWidth` | `LengthAuto` | Minimum width |
| `minHeight` | `LengthAuto` | Minimum height |
| `maxWidth` | `LengthAuto` | Maximum width |
| `maxHeight` | `LengthAuto` | Maximum height |

## Transforms

MasonKit supports a subset of CSS `transform` functions on native views. The following functions are supported on Android via the `transform` style property:

- `translate(x, y)` — translation in pixels (also `translateX`, `translateY`)
- `scale(sx, sy)` — scaling (also `scaleX`, `scaleY`)
- `rotate(angle)` — rotation in degrees (supports `deg` and `rad`)

Notes:
- Lengths in pixels can be specified with `px` (e.g. `translate(10px, 20px)`). Numeric values without units are interpreted as raw numbers (for scale/angle parsing try to use unit suffixes for clarity).
- Percentage translations are not supported in this initial implementation.

XML example (NativeScript Core):

```xml
<Page xmlns:mason="@triniwiz/nativescript-masonkit">
  <mason:View padding="16">
    <mason:View width="120" height="120" background="#2196F3"
                 transform="translate(10px, 20px) rotate(15deg) scale(1.05)">
      <mason:Text textContent="Transformed" color="#fff" textAlign="center" />
    </mason:View>
  </mason:View>
</Page>
```

Programmatic example (TypeScript):

```ts
import { View } from '@triniwiz/nativescript-masonkit';

const v = new View();
v.width = 120;
v.height = 120;
v.background = '#2196F3';
v.style.transform = 'translate(10px, 20px) rotate(15deg) scale(1.05)';

// append to parent as usual
```

Use-cases:

- Simple motion/placement without changing layout (translation)
- Visual emphasis (scale/rotate)

If you want transforms to be driven from the native style buffer (Rust) and cascade with pseudo-state merges, I can add a `TRANSFORM` style key in the Rust layout buffer and wire it through — ask me to proceed and I'll implement the native-side changes and iOS parity.
| `aspectRatio` | `number` | Width-to-height ratio |

```xml
<mason:View width="50%" height="200" maxWidth="400" aspectRatio="1.5" />
```

---

### Positioning

| Property | Type | Description |
|----------|------|-------------|
| `position` | `Position` | `'relative'` or `'absolute'` |
| `left` | `LengthAuto` | Left offset |
| `right` | `LengthAuto` | Right offset |
| `top` | `LengthAuto` | Top offset |
| `bottom` | `LengthAuto` | Bottom offset |
| `inset` | `LengthAuto` | Shorthand for all four offsets |
| `zIndex` | `number` | Stacking order |

```xml
<mason:View position="absolute" top="10" right="10" zIndex="1">
  <mason:Text textContent="Floating badge" />
</mason:View>
```

---

### Flexbox

| Property | Type | Description |
|----------|------|-------------|
| `flexDirection` | `FlexDirection` | Direction of the main axis |
| `flexWrap` | `FlexWrap` | Whether items wrap |
| `flex` | `string \| number` | Shorthand for grow, shrink, and basis |
| `flexFlow` | `string` | Shorthand for direction + wrap |
| `flexGrow` | `number` | Grow factor |
| `flexShrink` | `number` | Shrink factor |
| `flexBasis` | `Length` | Initial main-axis size |
| `alignItems` | `AlignItems` | Cross-axis alignment of children |
| `alignSelf` | `AlignSelf` | Cross-axis alignment of this element |
| `alignContent` | `AlignContent` | Alignment of wrapped lines |
| `justifyContent` | `JustifyContent` | Main-axis alignment |
| `justifyItems` | `JustifyItems` | Default justify for children |
| `justifySelf` | `JustifySelf` | Justify alignment for this element |

**FlexDirection values:** `'row'` | `'column'` | `'row-reverse'` | `'column-reverse'`

**FlexWrap values:** `'no-wrap'` | `'wrap'` | `'wrap-reverse'` | `'balance'` | `'balance-reverse'`

**Alignment values:** `'normal'` | `'flex-start'` | `'flex-end'` | `'start'` | `'end'` | `'center'` | `'baseline'` | `'stretch'`

**JustifyContent/AlignContent also accept:** `'space-between'` | `'space-around'` | `'space-evenly'`

#### Example: Flexbox Layout

```xml
<mason:View display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" padding="16">
  <mason:Text textContent="Left" />
  <mason:Text textContent="Center" />
  <mason:Text textContent="Right" />
</mason:View>
```

#### Example: Flex Shorthand

```xml
<!-- flex: 1 (grow to fill available space) -->
<mason:View flex="1" />

<!-- flex: none (don't grow or shrink) -->
<mason:View flex="none" />

<!-- flex: auto -->
<mason:View flex="auto" />
```

---

### CSS Grid

| Property | Type | Description |
|----------|------|-------------|
| `gridTemplateColumns` | `string` | Column track definitions |
| `gridTemplateRows` | `string` | Row track definitions |
| `gridTemplateAreas` | `string` | Named grid areas |
| `gridAutoColumns` | `string` | Size of implicit columns |
| `gridAutoRows` | `string` | Size of implicit rows |
| `gridAutoFlow` | `GridAutoFlow` | Auto-placement algorithm |
| `gridColumn` | `string` | Shorthand for column start/end |
| `gridColumnStart` | `string` | Column start line |
| `gridColumnEnd` | `string` | Column end line |
| `gridRow` | `string` | Shorthand for row start/end |
| `gridRowStart` | `string` | Row start line |
| `gridRowEnd` | `string` | Row end line |
| `gridArea` | `string` | Shorthand for row/column start/end or named area |

**GridAutoFlow values:** `'row'` | `'column'` | `'row dense'` | `'column dense'` | `'dense'`

#### Example: Grid Layout

```xml
<mason:View display="grid" gridTemplateColumns="1fr 2fr 1fr" gridTemplateRows="auto 1fr auto" gap="8" padding="16">
  <mason:View gridColumn="1 / -1" background="#eee" padding="8">
    <mason:Text textContent="Full-width header" />
  </mason:View>
  <mason:View background="#ddd" padding="8">
    <mason:Text textContent="Sidebar" />
  </mason:View>
  <mason:View background="#ccc" padding="8">
    <mason:Text textContent="Main Content" />
  </mason:View>
  <mason:View background="#ddd" padding="8">
    <mason:Text textContent="Right Panel" />
  </mason:View>
</mason:View>
```

#### Example: Grid Template Areas

```xml
<mason:View
  display="grid"
  gridTemplateColumns="200 1fr"
  gridTemplateRows="auto 1fr auto"
  gridTemplateAreas="'header header' 'sidebar content' 'footer footer'"
  gap="8">
  <mason:View gridArea="header"><mason:Text textContent="Header" /></mason:View>
  <mason:View gridArea="sidebar"><mason:Text textContent="Sidebar" /></mason:View>
  <mason:View gridArea="content"><mason:Text textContent="Content" /></mason:View>
  <mason:View gridArea="footer"><mason:Text textContent="Footer" /></mason:View>
</mason:View>
```

#### Example: Auto-fill / minmax

```xml
<mason:View display="grid" gridTemplateColumns="repeat(auto-fill, minmax(150, 1fr))" gap="12">
  <mason:View background="#eee" padding="12">
    <mason:Text textContent="Card 1" />
  </mason:View>
  <mason:View background="#eee" padding="12">
    <mason:Text textContent="Card 2" />
  </mason:View>
  <mason:View background="#eee" padding="12">
    <mason:Text textContent="Card 3" />
  </mason:View>
</mason:View>
```

---

### Gap & Spacing

| Property | Type | Description |
|----------|------|-------------|
| `gap` | `Gap` | Shorthand for row and column gap |
| `rowGap` | `Length` | Gap between rows |
| `columnGap` | `Length` | Gap between columns |
| `gridGap` | `Gap` | Alias for `gap` |
| `gridRowGap` | `Gap` | Alias for `rowGap` |
| `gridColumnGap` | `Gap` | Alias for `columnGap` |

```xml
<!-- Uniform gap -->
<mason:View display="flex" gap="16">...</mason:View>

<!-- Different row and column gaps -->
<mason:View display="grid" rowGap="8" columnGap="16">...</mason:View>
```

---

### Overflow & Scrolling

| Property | Type | Description |
|----------|------|-------------|
| `overflow` | `Overflow` | Overflow behavior (both axes) |
| `overflowX` | `Overflow` | Horizontal overflow |
| `overflowY` | `Overflow` | Vertical overflow |
| `scrollBarWidth` | `Length` | Width of the scrollbar |

**Overflow values:** `'visible'` | `'hidden'` | `'scroll'` | `'clip'` | `'auto'`

```xml
<mason:View overflow="hidden" height="200">
  <!-- Content that may exceed 200 height will be clipped -->
</mason:View>

<mason:Scroll overflowY="scroll" height="400">
  <!-- Vertically scrollable content -->
</mason:Scroll>
```

---

### Text & Typography

| Property | Type | Description |
|----------|------|-------------|
| `textContent` | `string` | The text to display |
| `color` | `Color` | Text color |
| `fontSize` | `number` | Font size |
| `fontWeight` | `string` | Font weight (e.g., `'bold'`, `'400'`) |
| `fontStyle` | `string` | Font style (`'normal'`, `'italic'`) |
| `lineHeight` | `number` | Line height |
| `letterSpacing` | `number` | Spacing between characters |
| `textAlignment` | `string` | Text alignment |
| `textWrap` | `TextWrap` | Text wrapping behavior |
| `textOverFlow` | `TextOverflow` | Text overflow behavior |
| `verticalAlign` | `VerticalAlign` | Vertical alignment |

**TextWrap values:** `'nowrap'` | `'wrap'` | `'balance'`

**TextOverflow values:** `'clip'` | `'ellipsis'`

```xml
<mason:Text
  textContent="This is a long text that will be truncated with an ellipsis if it overflows"
  textWrap="nowrap"
  textOverFlow="ellipsis"
  maxWidth="200"
  fontSize="16"
  lineHeight="1.4"
  color="#333" />
```

---

### Visual Styling

| Property | Type | Description |
|----------|------|-------------|
| `background` | `string` | Background (color, gradient, etc.) |
| `backgroundColor` | `Color` | Background color |
| `border` | `string` | Shorthand border |
| `borderRadius` | `string` | Corner rounding |
| `borderLeftWidth` | `Length` | Left border width |
| `borderRightWidth` | `Length` | Right border width |
| `borderTopWidth` | `Length` | Top border width |
| `borderBottomWidth` | `Length` | Bottom border width |
| `filter` | `string` | CSS filter effects |

```xml
<mason:View
  background="#f5f5f5"
  border="1 solid #ccc"
  borderRadius="12"
  padding="16">
  <mason:Text textContent="Styled card" />
</mason:View>
```

---

## Events

MasonKit components support DOM-like event handling.

### Supported Events

| Event | Fires On | Description |
|-------|----------|-------------|
| `input` | `Input` | When the input value changes |
| `change` | `Input` | When the input value is committed |

### Event Class

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` (readonly) | Event type name |
| `target` | `any` (readonly) | The element that fired the event |
| `currentTarget` | `any` (readonly) | The element the listener is attached to |
| `bubbles` | `boolean` (readonly) | Whether the event bubbles |
| `cancelable` | `boolean` (readonly) | Whether the event is cancelable |
| `isComposing` | `boolean` (readonly) | Whether the event is part of a composition |
| `timeStamp` | `number` (readonly) | Time at which the event was created |
| `defaultPrevented` | `boolean` (readonly) | Whether `preventDefault()` was called |

| Method | Description |
|--------|-------------|
| `stopPropagation()` | Stops further propagation |
| `stopImmediatePropagation()` | Stops immediate propagation |
| `preventDefault()` | Prevents the default action |

### InputEvent Class (extends Event)

| Property | Type | Description |
|----------|------|-------------|
| `data` | `any` (readonly) | The input data (string for text, array for file inputs) |
| `inputType` | `string` (readonly) | The type of input change |

### Example: Listening to Events

```xml
<mason:Input type="text" input="{{ onInput }}" />
```

```typescript
onInput(event: InputEvent) {
  console.log('Input data:', event.data);
  console.log('Input type:', event.inputType);
  console.log('Target value:', event.target.value);
}
```

```typescript
// Programmatic event listeners
const input = page.getViewById('myInput');
input.addEventListener('input', (event) => {
  console.log('Value changed:', event.data);
});
```

---

## Types Reference

### InputType

```typescript
type InputType =
  | 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'
  | 'search' | 'date' | 'time' | 'datetime-local' | 'month'
  | 'week' | 'color' | 'checkbox' | 'radio' | 'button'
  | 'submit' | 'reset' | 'file' | 'range';
```

### Length

```typescript
// A numeric length value — supports px, %, and dip units
type Length =
  | CoreTypes.dip
  | CoreTypes.LengthDipUnit
  | CoreTypes.LengthPxUnit
  | CoreTypes.LengthPercentUnit
  | `${number}px`
  | `${number}%`
  | `${number}dip`;
```

### LengthAuto

```typescript
// Same as Length, but also accepts 'auto'
type LengthAuto = Length | 'auto';
```

### DimensionLength

```typescript
type DimensionLength = LengthAuto
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | `fit-content(${string})`
  | 'stretch'
  | 'content';
```

### Display

```typescript
type Display = 'none' | 'flex' | 'grid' | 'block' | 'inline'
             | 'inline-block' | 'inline-flex' | 'inline-grid';
```

### Position

```typescript
type Position = 'absolute' | 'relative';
```

### BoxSizing

```typescript
type BoxSizing = 'border-box' | 'content-box';
```

### Overflow

```typescript
type Overflow = 'visible' | 'hidden' | 'scroll' | 'clip' | 'auto';
```

### FlexDirection

```typescript
type FlexDirection = 'column' | 'row' | 'column-reverse' | 'row-reverse';
```

### FlexWrap

```typescript
type FlexWrap = 'no-wrap' | 'wrap' | 'wrap-reverse' | 'balance' | 'balance-reverse';
```

### AlignItems / AlignSelf

```typescript
type AlignItems = 'normal' | 'flex-start' | 'flex-end' | 'start'
                | 'end' | 'center' | 'baseline' | 'stretch';
type AlignSelf = AlignItems;
```

### AlignContent / JustifyContent

```typescript
type AlignContent = 'normal' | 'flex-start' | 'flex-end' | 'start'
                  | 'end' | 'center' | 'stretch' | 'space-between'
                  | 'space-around' | 'space-evenly';
type JustifyContent = AlignContent;
```

### JustifyItems / JustifySelf

```typescript
type JustifyItems = AlignItems;
type JustifySelf = AlignSelf;
```

### GridAutoFlow

```typescript
type GridAutoFlow = 'row' | 'column' | 'row dense' | 'column dense' | 'dense';
```

### Gap

```typescript
type GapTypeUnit = 'px' | 'dip' | '%';
type Gap = `${string}${GapTypeUnit} ${string}${GapTypeUnit}` | SizeLengthType;
```

### VerticalAlign

```typescript
type VerticalAlign = 'baseline' | 'sub' | 'super' | 'text-top'
                   | 'text-bottom' | 'middle' | 'top' | 'bottom'
                   | Length | number;
```

---

## Framework Support

MasonKit supports multiple NativeScript frameworks:

| Framework | Status |
|-----------|--------|
| NativeScript Core (XML) | Supported |
| Angular | Supported |
| Vue 3 (`nativescript-vue`) | Supported |
| React (`react-nativescript`) | Supported |
| Svelte | Supported |

Framework detection is automatic. MasonKit detects which framework is in use and adapts its internal child management accordingly.

### Vue 3 Example

```vue
<template>
  <Div display="flex" flexDirection="column" padding="16">
    <H1 textContent="Hello from Vue!" />
    <P textContent="MasonKit works with NativeScript Vue." />
    <Button textContent="Click Me" @tap="onTap" />
  </Div>
</template>

<script setup>
function onTap() {
  console.log('Button tapped!');
}
</script>
```

### Angular Example

```typescript
import { registerElement } from '@nativescript/angular';
import { View, Text, Div, H1, P } from '@triniwiz/nativescript-masonkit';

registerElement('view', () => View);
registerElement('text', () => Text);
registerElement('div', () => Div);
registerElement('h1', () => H1);
registerElement('p', () => P);
```

```html
<MasonDiv display="flex" flexDirection="column" padding="16">
  <MasonH1 textContent="Hello from Angular!"></MasonH1>
  <MasonP textContent="MasonKit works with NativeScript Angular."></MasonP>
</MasonDiv>
```
