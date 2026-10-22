import { layout as coreLayout } from '@nativescript/core/utils';

// Core reads the display density once per process. A density change (Settings > Display size)
// relaunches the Activity and restyles Mason's views, so Mason converts with the new value.
let changed = 0;

export function displayDensity(): number {
  return changed || coreLayout.getDisplayDensity();
}

/** Records the density after a configuration change; core's own value is used until then. */
export function setDisplayDensity(value: number): void {
  if (value > 0 && value !== coreLayout.getDisplayDensity()) changed = value;
  else changed = 0;
}

/** core's `layout` conversions, against the current density. */
export const masonLayout = {
  getDisplayDensity: displayDensity,
  toDevicePixels: (value: number) => value * displayDensity(),
  toDeviceIndependentPixels: (value: number) => value / displayDensity(),
};
