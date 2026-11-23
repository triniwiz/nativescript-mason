import type { WindowsMaskContext } from './mask';

function rawNineSlice(css: string | string[], ctx: WindowsMaskContext) {
  return { css, u: ctx.gradientUnits(typeof css === 'string' ? css : css.join(' ')), appRoot: ctx.source('~/') };
}

/** mask-*, clip-path and mask-border longhands as the JSON Css.SetMask takes, or '' for none. */
export function encodeWindowsMask(css: ReadonlyMap<string, string>, ctx: WindowsMaskContext): string {
  const spec: Record<string, unknown> = {};
  const image = css.get(maskLayerProperties[0])?.trim();
  if (image && image.toLowerCase() !== 'none') {
    const values = maskLayerProperties.map((name, index) => index === 0 ? image : (css.get(name) ?? ''));
    spec.ml = { css: values, u: ctx.gradientUnits(values.join(' ')), appRoot: ctx.source('~/') };
  }
  const clip = css.get(clipPathProperty)?.trim();
  if (clip && clip.toLowerCase() !== 'none') {
    spec.cp = { css: clip, u: ctx.gradientUnits(clip) };
  }
  const borderSource = css.get(maskBorderProperties[0])?.trim();
  if (borderSource && borderSource.toLowerCase() !== 'none') {
    const values = maskBorderProperties.map((name, index) => index === 0 ? borderSource : (css.get(name) ?? ''));
    spec.mb = rawNineSlice(values, ctx);
  }
  return Object.keys(spec).length ? JSON.stringify(spec) : '';
}

/** The border-image declaration and resolution context for Rust. */
export function encodeWindowsBorderImage(value: string, ctx: WindowsMaskContext): string {
  const css = value.trim();
  return css && css.toLowerCase() !== 'none' ? JSON.stringify({ mb: rawNineSlice(css, ctx) }) : '';
}

// <style-keys:windows-mask-names> generated from tools/scripts/style-keys/style-keys.schema
const maskLayerProperties = ["mask-image", "mask-size", "mask-position", "mask-repeat", "mask-origin", "mask-clip", "mask-mode", "mask-composite"];
const maskBorderProperties = ["mask-border-source", "mask-border-slice", "mask-border-width", "mask-border-outset", "mask-border-repeat", "mask-border-mode"];
const clipPathProperty = "clip-path";

export const WINDOWS_MASK_PROPERTIES = new Set([...maskLayerProperties, clipPathProperty, ...maskBorderProperties]);
// </style-keys:windows-mask-names>

export type { WindowsMaskContext };
