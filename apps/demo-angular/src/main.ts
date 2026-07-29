import { bootstrapApplication, provideNativeScriptRouter, runNativeScriptAngularApp } from '@nativescript/angular';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/angular';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

// Before the bootstrap: registers every MasonKit element with the child
// bookkeeping meta it needs, and makes Angular component host elements real
// MasonKit views instead of invisible ProxyViewContainers. This has to happen
// before Angular creates the root component's host element.
installMasonKit();

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
      providers: [provideNativeScriptRouter(routes)],
    }),
});
