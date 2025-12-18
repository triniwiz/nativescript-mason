import { runNativeScriptAngularApp, platformNativeScript, registerElement } from '@nativescript/angular';
import { AppModule } from './app.module';
import { View, Text, Scroll, Img } from '@triniwiz/nativescript-masonkit';

registerElement('View', () => View);
registerElement('Text', () => Text);
registerElement('Scroll', () => Scroll);
registerElement('Img', () => Img);

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
