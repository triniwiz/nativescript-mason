# CSS diagnostics

When MasonKit meets a CSS value it cannot use, it falls back quietly (usually to `0` or to the property's default) so the rest of the layout still renders. During development you can ask it to report those values instead, which is the fastest way to find out what a pasted stylesheet lost.

```ts
import { setCssDiagnostics, formatCssDiagnostics } from '@triniwiz/nativescript-masonkit';

setCssDiagnostics(true);

// ...render the screen you are checking...

console.log(formatCssDiagnostics());
```

Diagnostics are off by default and cost nothing while off. Turn them on before the views you want to check are styled, for example at app startup behind a dev flag:

```ts
if (__DEV__) {
  setCssDiagnostics(true);
}
```

## API

| Function | Description |
|---|---|
| `setCssDiagnostics(enabled, options?)` | Turn reporting on or off. Turning it off also clears what was collected. |
| `cssDiagnosticsEnabled()` | Whether reporting is on. |
| `getCssDiagnostics()` | Everything reported since it was enabled or last cleared, as `CssDiagnostic` objects. |
| `clearCssDiagnostics()` | Forget what was collected, for example before navigating to the next screen. |
| `formatCssDiagnostics()` | The collected diagnostics as one line each, ready to paste into a bug report. |

### Options

```ts
setCssDiagnostics(true, { log: false, limit: 1000 });
```

| Option | Default | Description |
|---|---|---|
| `log` | `true` | Also write each diagnostic to the console with `console.warn`, prefixed `[mason css]`. |
| `limit` | `500` | How many diagnostics to keep. The oldest are dropped past it. |

Each distinct problem is reported once: the same declaration repeated across a long stylesheet shows up as a single entry.

### `CssDiagnostic`

```ts
interface CssDiagnostic {
  kind: CssDiagnosticKind;
  name: string; // what was being parsed, e.g. 'length' or 'aspect-ratio'
  value?: string; // the value as written
  detail?: string; // why it was dropped, and what to do instead where there is an answer
}
```

## What gets reported

| Kind | Example | What happens to the value |
|---|---|---|
| `unsupported-unit` | `width: 10ch` | An unknown unit is treated as CSS px. |
| `unsupported-unit` | `height: 50vh` before the viewport size is known | Resolves to `0`. |
| `not-implemented` | `width: var(--w)` set from code | `var()` is only expanded in stylesheets. Resolves to `0`. |
| `not-implemented` | `width: calc(100% - 20px)` | Math that mixes `%` with a length can't be resolved before layout. Resolves to `0`. |
| `unparsable-value` | A length that is not a finite number, such as `1e999px` | Treated as `0`. |
| `unparsable-value` | `aspect-ratio: -1` or `aspect-ratio: 2 / 0` | Ignored. Use a positive number, a ratio like `16 / 9`, or `auto`. |

The `CssDiagnosticKind` type also includes `unknown-property` and `unknown-tag`. They are reserved; current versions do not report them yet.

::: tip
`var()` works in stylesheets, where NativeScript expands it before MasonKit sees the value; the diagnostic is about `var()` in values set from code. MasonKit evaluates `calc()`, `min()`, `max()` and `clamp()` itself. See [Units](/styling/units).
:::
