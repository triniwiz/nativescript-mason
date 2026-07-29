import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptRouterModule } from '@nativescript/angular';

/**
 * Root component. Its host element (`demo-app`) is the one element
 * `installMasonKit()` deliberately leaves as a `ProxyViewContainer`, so
 * `AppHostView` wraps it in the full-screen root `GridLayout` that everything
 * below resolves `height: 100%` against.
 */
@Component({
  selector: 'demo-app',
  imports: [NativeScriptRouterModule],
  schemas: [NO_ERRORS_SCHEMA],
  template: `<GridLayout>
    <page-router-outlet></page-router-outlet>
  </GridLayout>`,
})
export class AppComponent {}
