import { ComponentHostOptions, enableMasonComponentHosts } from './component-host';
import { RegisterElementsOptions, registerMasonKitElements } from './element-registry';

export interface InstallMasonKitOptions extends RegisterElementsOptions {
  /**
   * Component-host mode: make every Angular component host element a real
   * MasonKit view instead of an invisible `ProxyViewContainer`.
   *
   * On by default — installing this is taken as the statement that MasonKit is
   * how the app lays out. Pass `false`, or an options object with
   * `enabled: false`, to opt out and keep stock `@nativescript/angular`
   * behaviour while still getting the element registrations.
   *
   * @default true
   */
  componentHosts?: boolean | ComponentHostOptions;
}

/**
 * Install MasonKit's Angular integration.
 *
 * Call this in `main.ts` **before** `runNativeScriptAngularApp()`:
 *
 * ```ts
 * import { installMasonKit } from '@triniwiz/nativescript-masonkit/angular';
 *
 * installMasonKit();
 *
 * runNativeScriptAngularApp({
 *   appModuleBootstrap: () => platformNativeScript().bootstrapModule(AppModule),
 * });
 * ```
 *
 * It has to run before the bootstrap, not as part of it: the element map and
 * the renderer patch must be in place before Angular creates the root
 * component's host element, and an `NgModule` import or an `APP_INITIALIZER`
 * would both be too late for some of that. A plain function call at the top of
 * the entry file is unambiguous about when it happens.
 *
 * Idempotent — element registration is deduplicated and the component-host
 * patches are installed once, then only reconfigured.
 */
export function installMasonKit(options: InstallMasonKitOptions = {}): void {
  registerMasonKitElements(options);

  const { componentHosts = true } = options;
  if (componentHosts === false) {
    enableMasonComponentHosts({ enabled: false });
  } else {
    enableMasonComponentHosts(componentHosts === true ? {} : componentHosts);
  }
}
