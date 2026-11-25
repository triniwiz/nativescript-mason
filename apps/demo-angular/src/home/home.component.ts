import { afterNextRender, Component, DestroyRef, inject, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NativeScriptCommonModule, NativeScriptRouterModule, RouterExtensions } from '@nativescript/angular';
import { AndroidActivityNewIntentEventData, Application, Page } from '@nativescript/core';

import { demoGroups } from '../demos';
import { appearance } from '../shared/appearance';

const fibonacci = (n: number): number => (n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2));

@Component({ selector: 'demo-home', templateUrl: 'home.component.html', styleUrl: 'home.component.scss', imports: [NativeScriptCommonModule, NativeScriptRouterModule], schemas: [NO_ERRORS_SCHEMA] })
export class HomeComponent {
  private readonly router = inject(RouterExtensions);

  readonly groups = demoGroups;
  readonly appearance = appearance;
  readonly fibStatus = signal('Recursive fib(30) smoke test');

  constructor() {
    inject(Page).actionBarHidden = true;
    if (__ANDROID__) {
      // Late, because the start activity is not always set yet when the home screen first renders.
      afterNextRender(() => setTimeout(() => this.openFromIntent((Application.android.foregroundActivity ?? Application.android.startActivity)?.getIntent()), 800));
      const onNewIntent = ({ intent }: AndroidActivityNewIntentEventData) => this.openFromIntent(intent);
      Application.android.on(Application.android.activityNewIntentEvent, onNewIntent);
      inject(DestroyRef).onDestroy(() => Application.android.off(Application.android.activityNewIntentEvent, onNewIntent));
    }
  }

  runFibTest(): void {
    const startedAt = Date.now();
    const result = fibonacci(30);
    this.fibStatus.set(`fib(30) = ${result} in ${Date.now() - startedAt} ms`);
  }

  /**
   * `adb shell am start -n org.nativescript.plugindemoangular/com.tns.NativeScriptActivity --es demo flexbox` opens
   * that route, also while the app is running; `--ei bench 3` opens the layout benchmark and runs it 3 times.
   */
  private openFromIntent(intent: android.content.Intent | undefined): void {
    const demo = intent?.getStringExtra('demo');
    const runs = intent?.getIntExtra('bench', 0) ?? 0;
    if (demo) {
      this.router.navigateByUrl(`/${demo}`, { animated: false });
    } else if (runs > 0) {
      console.log(`BENCH_AUTOSTART ${runs}`);
      this.router.navigate(['/bench'], { animated: false, queryParams: { runs } });
    }
  }
}
