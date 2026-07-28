import { bootstrapApplication, provideNativeScriptRouter, runNativeScriptAngularApp } from '@nativescript/angular';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/angular';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

// Before the bootstrap: registers every MasonKit element with the child
// bookkeeping meta it needs, and makes Angular component host elements real
// MasonKit views instead of invisible ProxyViewContainers. This has to happen
// before Angular creates the root component's host element.
installMasonKit({
  componentHosts: {
    // Routed components are page roots: their template is <ActionBar> plus
    // page-level content that fills the Page by classic measurement. A host
    // between the Page and that content has to stay transparent, or Taffy
    // content-sizes the content away and only the (hoisted) ActionBar shows.
    //
    // Auto-detection catches this and self-corrects from the second render on,
    // but listing them fixes the first render too. Every component *below*
    // these — hn-story-card, hn-comment, stress-chip — is still a real
    // MasonKit host, which is where the nesting is actually under test.
    passthrough: ['hn-feed', 'hn-item', 'hn-list', 'stress-root', 'demo-nativescript-masonkit'],
  },
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
      providers: [provideNativeScriptRouter(routes)],
    }),
});
