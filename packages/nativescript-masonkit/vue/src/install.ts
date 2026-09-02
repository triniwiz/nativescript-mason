import { RegisterElementsOptions, registerMasonKitElements } from './element-registry';

export type InstallMasonKitOptions = RegisterElementsOptions;

/**
 * Install MasonKit's Vue 3 integration.
 *
 * Call before `createApp(...).start()` so element registration is complete
 * before the first template renders. Safe to call multiple times, including
 * during HMR.
 */
export function installMasonKit(options: InstallMasonKitOptions = {}): void {
  registerMasonKitElements(options);
}
