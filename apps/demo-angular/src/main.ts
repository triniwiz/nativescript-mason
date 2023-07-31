import { runNativeScriptAngularApp, platformNativeScript } from '@nativescript/angular';
import { AppModule } from './app.module';

const handler = java.lang.Thread.getDefaultUncaughtExceptionHandler();
java.lang.Thread.setDefaultUncaughtExceptionHandler(
  new java.lang.Thread.UncaughtExceptionHandler({
    uncaughtException(t, e) {
      if (t.getName() === 'FinalizerWatchdogDaemon' && e instanceof java.util.concurrent.TimeoutException) {
      } else {
        handler.uncaughtException(t, e);
      }
    },
  })
);

runNativeScriptAngularApp({
  appModuleBootstrap: () => platformNativeScript().bootstrapModule(AppModule),
});
