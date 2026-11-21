# Events

MasonKit elements dispatch DOM-style events: they bubble from the element that was touched up through its Mason ancestors, and listeners receive an `Event` with `target`, `currentTarget`, `stopPropagation()` and `preventDefault()`.

## Listening

`addEventListener` and NativeScript's `on()` are the same thing on a MasonKit element, so use whichever your code already uses.

```ts
import { Event } from '@triniwiz/nativescript-masonkit';

button.addEventListener('click', (event: Event) => {
  console.log('clicked', event.target, event.currentTarget);
});

// Equivalent
button.on('click', onClick);
button.off('click', onClick);
```

`tap` and `click` are the same event. A `tap` listener is registered as a `click` listener, so `(tap)` in Angular, `@tap` in Vue and `on:tap` in Svelte all work on MasonKit elements.

### In each framework

::: code-group

```html [Angular]
<div (tap)="open()">Open</div>
```

```vue [Vue]
<div @tap="open">Open</div>
```

```svelte [Svelte]
<div on:tap={open}>Open</div>
```

```tsx [React]
<div onClick={open}>Open</div>
```

```tsx [Solid]
<div on:click={open}>Open</div>
```

:::

::: warning Solid
In the Solid renderer, use the `on:` namespace (`on:click`, `on:input`, `on:scroll`). `onClick` is not delivered to MasonKit elements.
:::

## Supported events

| Event | Raised by | Bubbles |
|---|---|---|
| `click` (alias `tap`) | Any element with a listener, plus buttons and inputs | Yes |
| `beforeinput`, `input` | `input`, `textarea` | Yes |
| `change` | `input` (text, checkbox, radio, range, date and others) | Yes |
| `focus`, `blur` | Text inputs | Yes |
| `cancel` | Pickers dismissed without a choice (Android color input, Windows) | Yes |
| `scroll`, `scrollend` | Scroll containers | No |
| `keydown`, `compositionstart`, `compositionupdate`, `compositionend` | Text inputs on Windows | Yes |
| `toggle` | `details`, see [details and summary](/elements/details) | No |
| `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, `pointerout`, `gotpointercapture`, `lostpointercapture` | Any element, see [Pointer events](#pointer-events) | Yes |
| `pointerenter`, `pointerleave` | Any element | No |

Adding a `click` listener is what makes an element tappable, so you do not need a button to make a card clickable:

```html
<div class="card" on:click={select}>...</div>
```

Any other event name (for example `loaded`, `unloaded`, `layoutChanged`) goes through NativeScript's normal event system.

## The `Event` object

| Member | Description |
|---|---|
| `type` | Event name, for example `'click'`. Also available as `eventName`. |
| `target` | The element the event started at. |
| `currentTarget` | The element whose listener is running. Also available as `object`. |
| `bubbles`, `cancelable` | Event flags. `click` and `beforeinput` are always cancelable. `bubbles` is `false` on events MasonKit bubbles itself, so a framework's DOM layer doesn't bubble them a second time. |
| `defaultPrevented` | `true` after `preventDefault()` on a cancelable event. |
| `timeStamp` | When the event was created. |
| `isComposing` | `true` during IME composition. |
| `button` | Always `0` (primary), for code that checks `event.button === 0`. |
| `stopPropagation()` | Stop the event reaching ancestors. |
| `stopImmediatePropagation()` | Also skip the remaining listeners on this element. |
| `preventDefault()` | Cancel the default action of a cancelable event. |

### `InputEvent`

`beforeinput` and `input` listeners receive an `InputEvent`, which adds:

| Member | Description |
|---|---|
| `data` | The inserted text, or `null`. For a file input, an array of file URIs. |
| `inputType` | What kind of edit happened, for example `'insertText'`, `'deleteContentBackward'`, `'insertFromPaste'`. |

Calling `preventDefault()` in a `beforeinput` listener rejects the edit:

```ts
import { InputEvent } from '@triniwiz/nativescript-masonkit';

zip.addEventListener('beforeinput', (e: InputEvent) => {
  if (e.data && /\D/.test(e.data)) e.preventDefault();
});
```

On Windows, `keydown` receives a `KeyboardEvent` (`key`, `repeat`, `ctrlKey`, `shiftKey`, `altKey`, `metaKey`) and the composition events receive a `CompositionEvent` (`data`).

## Pointer events

Every element raises the DOM pointer events for touch, mouse and pen input once something listens for them. Listeners receive a `PointerEvent`:

```ts
import { PointerEvent } from '@triniwiz/nativescript-masonkit';

knob.addEventListener('pointerdown', (e: PointerEvent) => {
  knob.setPointerCapture(e.pointerId);
});
knob.addEventListener('pointermove', (e: PointerEvent) => {
  if (knob.hasPointerCapture(e.pointerId)) moveTo(e.clientX);
});
```

| Member | Description |
|---|---|
| `pointerId` | Stable while the pointer is down. The mouse is `1`; touches and pens count up from `2`. |
| `pointerType` | `'touch'`, `'mouse'` or `'pen'`. |
| `isPrimary` | `true` for the mouse and for the first touch (or pen) of a gesture. |
| `clientX`, `clientY` (`pageX`, `pageY`, `x`, `y`) | CSS pixels from the top-left of the window. |
| `offsetX`, `offsetY` | CSS pixels from the top-left of the target element. |
| `movementX`, `movementY` | Distance since the pointer's last event. |
| `button`, `buttons` | The button that changed (`-1` for moves) and the buttons held, as in the DOM. A touch is button `0` while down. |
| `pressure`, `width`, `height`, `tiltX`, `tiltY`, `twist` | Contact details where the platform reports them; otherwise the DOM defaults (`0.5` pressure while pressed, `1` by `1` contact). |
| `ctrlKey`, `shiftKey`, `altKey`, `metaKey` | Modifier keys. |
| `relatedTarget` | For `pointerover`/`out`/`enter`/`leave`, the element the pointer came from or went to. |

They follow the DOM's rules:

- A pointer is over its target before `pointerdown` (`pointerover`, `pointerenter`) and leaves it after `pointerup` or `pointercancel` (`pointerout`, `pointerleave`). A mouse stays over elements and raises them as it moves.
- Touches and pens are captured to their `pointerdown` target, so its `pointermove` and `pointerup` go there even off the element. `setPointerCapture(pointerId)` sends a pointer's events to another element until `releasePointerCapture` or the pointer goes up; it throws `NotFoundError` for a pointer that isn't down.
- When a scroll container takes over a drag, the pointers inside it get `pointercancel`. Use [`touch-action`](/guide/scrolling#controlling-gestures-with-touch-action) to keep a drag for yourself.
- `click` still fires after `pointerup` as before.

Mouse hover (with no button down) is reported on Android, macOS, iPad and Mac Catalyst pointers, Windows and Linux.

### `pointer-events` (CSS)

`pointer-events: none` makes an element ignore taps and pointers: they go to whatever is beneath it, and `elementFromPoint` skips it. It is inherited, and a descendant set back to `pointer-events: auto` still takes touches, whose events bubble through the `none` element as usual.

```css
.overlay {
  pointer-events: none;
}
.overlay .close {
  pointer-events: auto;
}
```

On Windows, a `none` element that paints a background and has an `auto` descendant still covers native controls beneath its background; MasonKit's own events (`click`, pointer events) go to the element beneath. Without a background (the usual overlay or toolbar wrapper), input reaches native controls too.

## Bubbling

Events travel from the target up through its Mason ancestors, so one listener on a list can handle taps on every row:

```ts
list.addEventListener('click', (e) => {
  const row = e.target;
  if (row !== list) select(row);
});
```

A plain NativeScript view in the middle of the tree is not part of this path. See [Mixing with NativeScript views](/guide/mixing-views).

## Links

An `<a>` with an `href` opens it on click with the platform URL handler. An in-page fragment (`href="#section"`) is not followed; handle it yourself:

```html
<a href="https://nativescript.org">NativeScript</a>
<a href="#faq" on:click={() => faq.scrollIntoView()}>FAQ</a>
```

## Hit testing

`elementFromPoint(x, y)` returns the top-most MasonKit or NativeScript element at a point in the element's own visible coordinate space, or `null`. Coordinates are CSS pixels on every platform, the same unit touch events report.

```ts
const hit = root.elementFromPoint(120, 48);
```
