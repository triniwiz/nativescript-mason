// Stand-in for `@nativescript/core/utils` in Node tests.
//
// The real module reads the density off a live UIScreen/Resources, so it can't
// load off-device. style.ts only ever uses three members, and the whole point of
// the suite is to run them at more than one screen scale: a px/dip confusion is
// invisible at scale 1, which is exactly why several shipped.
export let screenScale = 3;

export function setScreenScale(scale: number): void {
  screenScale = scale;
}

export const layout = {
  getDisplayDensity: () => screenScale,
  toDevicePixels: (value: number) => value * screenScale,
  toDeviceIndependentPixels: (value: number) => value / screenScale,
  round: (value: number) => Math.round(value),
};
