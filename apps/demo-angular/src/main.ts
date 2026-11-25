import { IMAGE_CONFIG } from '@angular/common';
import { bootstrapApplication, provideNativeScriptRouter, runNativeScriptAngularApp } from '@nativescript/angular';
import { View } from '@triniwiz/nativescript-masonkit';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/angular';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

// MasonKit's web-normalised defaults (border-box, no default margins or padding), as in the Vue demo.
View.preflight = true;

// Before the bootstrap: registers every MasonKit element with the child
// bookkeeping meta it needs, and makes Angular component host elements real
// MasonKit views instead of invisible ProxyViewContainers. This has to happen
// before Angular creates the root component's host element.
installMasonKit({
  // Its template is an action bar and a fill-parent scroll view, which the Page has to measure.
  componentHosts: { passthrough: ['demo-page'] },
});

if (__ANDROID__) {
  const handler = java.lang.Thread.getDefaultUncaughtExceptionHandler();
  java.lang.Thread.setDefaultUncaughtExceptionHandler(
    new java.lang.Thread.UncaughtExceptionHandler({
      uncaughtException(t, e) {
        if (t.getName() === 'FinalizerWatchdogDaemon' && e instanceof java.util.concurrent.TimeoutException) {
        } else {
          handler.uncaughtException(t, e);
        }
      },
    }),
  );
}

runNativeScriptAngularApp({
  appModuleBootstrap: () =>
    bootstrapApplication(AppComponent, {
      providers: [
        provideNativeScriptRouter(routes),
        // Angular's dev-mode image checks read the DOM document, which NativeScript does not have.
        { provide: IMAGE_CONFIG, useValue: { disableImageSizeWarning: true, disableImageLazyLoadWarning: true } },
      ],
    }),
});
