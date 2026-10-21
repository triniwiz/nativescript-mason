# Forms and inputs

`<input>`, `<textarea>` and `<button>` are native controls that lay out and style like their HTML counterparts.

```html
<form class="signup">
  <fieldset>
    <legend>Account</legend>
    <label>Email</label>
    <input type="email" name="email" placeholder="you@example.com" />
    <label>Password</label>
    <input type="password" name="password" />
  </fieldset>
  <label><input type="checkbox" name="terms" /> I accept the terms</label>
  <button class="primary">Create account</button>
</form>
```

## Input types

`type` defaults to `text` and can change at runtime. Every HTML type is accepted on iOS, Android and Windows:

| Type | Renders as |
| --- | --- |
| `text`, `search` | Single-line text field. `search` shows the search key on the keyboard. |
| `email`, `url`, `tel`, `number` | Text field with the matching keyboard. On Windows, `number` is a number box. |
| `password` | Masked text field. |
| `time`, `datetime-local`, `month`, `week` | Text field with a date/time keyboard on Android, a plain text field on iOS. On Windows, `time` is a time picker. |
| `date` | Native date picker. |
| `checkbox`, `radio` | Native check box and radio button. |
| `range` | Native slider. |
| `color` | Colour well that opens the system colour picker. |
| `file` | Button that opens the system file picker. `accept` (default `*/*`) filters types, `multiple` allows several files. |
| `button`, `submit`, `reset` | Push button; `value` is its label. |

Text-like inputs and buttons are `inline-block` and draw default field or button chrome (padding, border, radius) that your CSS overrides.

## Properties

| Property | Meaning |
| --- | --- |
| `value` | Always a string, as on the web; setting `null` clears it. Setting the value the field already holds does nothing, so a framework that writes `value` back on every keystroke does not move the caret. |
| `defaultValue` | The initial value. It sets `value` until the user or code changes the field. |
| `placeholder` | Hint text. Colour it with `placeholder-color` (or a `::placeholder { color }` rule). |
| `checked` | Checkbox and radio state. |
| `name` | For radios, the group: checking one radio unchecks the other loaded radios with the same `name`. |
| `valueAsNumber`, `valueAsDate` | Numeric and date views of the value, for `range`, `number`, `date` and similar types. |
| `accept`, `multiple` | File inputs. |

::: warning
There is no `disabled` property yet, and no `readonly`, `min`, `max` or `step`. The `disabled` attribute in `innerHTML` disables `<input>`, `<textarea>` and `<button>` on every platform. On iOS and Android, setting core's `isEnabled` to `false` does the same.
:::

## Styling checkboxes and radios

`:checked` matches a checked checkbox or radio, whether code or a tap changed it:

```css
.check:checked { background-color: #3d5afe; }
```

`appearance: none` removes the native control, so the element draws only its CSS box (background, border, radius) at its CSS size. Combined with `:checked`, that builds a fully custom control:

```css
.toggle {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #888;
  border-radius: 4px;
}
.toggle:checked { background-color: #3d5afe; border-color: #3d5afe; }
```

Any other `appearance` value keeps the native control.

## textarea

A multi-line field with `value`, `defaultValue`, `placeholder`, `name`, `rows` (default 2), `cols` (default 20) and `maxLength` (default -1, no limit). `rows` and `cols` give its intrinsic size; CSS `width` and `height` override them.

```html
<textarea rows="4" placeholder="What happened?"></textarea>
```

## Events

| Event | When |
| --- | --- |
| `input` | The value changed: every keystroke, slider move, toggle, ... |
| `beforeinput` | Before an edit is applied (typing, paste, cut, a slider move). Call `preventDefault()` to reject it. |
| `change` | The user committed a change: toggled a checkbox, picked a date, colour or file, released a slider. |
| `focus`, `blur` | A text field gained or lost focus. |
| `textChange` | Fired with every `input`, with `value` on the event, for code written against core's `TextField`. |

```ts
input.addEventListener('input', () => console.log(input.value));
checkbox.addEventListener('change', () => console.log(checkbox.checked));
```

## form, fieldset, legend and label

These are [block](/elements/html#block-containers) and [phrasing](/elements/html#phrasing-elements) elements for structure and styling only:

- `<form>` does not submit, and `type="submit"` / `type="reset"` inputs do not act on it. Handle the button's `click` (or `tap`) and read your inputs.
- `<fieldset>` and `<legend>` have no default border or legend placement.
- `<label>` is inline text; it does not support `for` and tapping it does not focus or toggle an input.
