import { isMasonView_ } from './symbols';

export interface A11ySetupHost {
  /** Core's own per-view accessibility setup. */
  setup(view: any): void;
  /** Whether any accessibility service is enabled. */
  serviceOn(): boolean;
  /** Every loaded view under the app's root views. */
  eachLoadedView(visit: (view: any) => void): void;
}

/**
 * Core gives every loaded view an accessibility delegate and a content description: three native
 * calls per view that only an accessibility service reads. For Mason views this waits until a
 * service is enabled, then runs for the views already on screen.
 */
export function deferredA11ySetup(host: A11ySetupHost) {
  return {
    update(view: any): void {
      if (!view?.[isMasonView_] || host.serviceOn()) host.setup(view);
    },
    serviceTurnedOn(): void {
      host.eachLoadedView((view) => {
        if (view[isMasonView_]) host.setup(view);
      });
    },
  };
}
