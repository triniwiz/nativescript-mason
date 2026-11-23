/** Expand a shorthand using the Rust CSS parser. The cascade applies the returned longhands. */
export function expandCssShorthand(name: string, value: string): string[] | null {
  if (__ANDROID__) {
    const fields = org.nativescript.mason.masonkit.Mason.expandCssShorthand(name, value);
    return fields == null ? null : Array.from(fields);
  }
  if (__APPLE__) {
    const fields = NSCMason.expandCssShorthandValue(name, value);
    return fields == null ? null : Array.from({ length: fields.count }, (_, i) => fields.objectAtIndex(i));
  }
  if (__LINUX__) return JSON.parse(mason_gtk_css_expand(name, value) ?? "null");
  if (__WINDOWS__) {
    const fields = NativeScript.Mason.Css.ExpandCssShorthand(name, value);
    return fields ? JSON.parse(fields) : null;
  }
  return null;
}

type NumericCssContext = [scale: number, fontSize: number, rootFontSize: number, viewportWidth: number, viewportHeight: number];

export function resolveCssValues(
  value: string,
  kind: number,
  [scale, fontSize, rootFontSize, viewportWidth, viewportHeight]: NumericCssContext,
): number[] | null {
  if (__ANDROID__) {
    const fields = org.nativescript.mason.masonkit.Mason.nativeParseCss(value, kind, scale, fontSize, rootFontSize, viewportWidth, viewportHeight, 0);
    return fields?.length ? Array.from(fields) : null;
  }
  if (__APPLE__) {
    const fields = NSCMason.resolveCssLengthKindScaleFontSizeRootFontSizeViewportWidthViewportHeight(value, kind, scale, fontSize, rootFontSize, viewportWidth, viewportHeight);
    return fields?.count ? Array.from({ length: fields.count }, (_, i) => Number(fields.objectAtIndex(i))) : null;
  }
  if (__LINUX__) return JSON.parse(mason_gtk_css_parse(value, kind, scale, fontSize, rootFontSize, viewportWidth, viewportHeight) ?? "null");
  if (__WINDOWS__) {
    const fields = NativeScript.Mason.Css.ResolveCssLength(value, kind, scale, fontSize, rootFontSize, viewportWidth, viewportHeight);
    return fields ? JSON.parse(fields) : null;
  }
  return null;
}

export function resolveCssLength(value: string, kind: number, ...context: NumericCssContext): [number, number] | null {
  const fields = resolveCssValues(value, kind, context);
  return fields?.length === 2 ? [fields[0], fields[1]] : null;
}

export function resolveCssPosition(value: string, kind: number, ...context: NumericCssContext): [number, number, number, number] | null {
  const fields = resolveCssValues(value, kind, context);
  return fields?.length === 4 ? [fields[0], fields[1], fields[2], fields[3]] : null;
}
