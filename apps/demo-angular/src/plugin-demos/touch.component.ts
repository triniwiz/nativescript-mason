import { Component, NO_ERRORS_SCHEMA, OnDestroy, signal } from '@angular/core';
import { CoreTypes, EventData, Switch, TouchManager, View } from '@nativescript/core';
import { DemoPageComponent } from '../shared/demo-page.component';

const { easeOut, spring } = CoreTypes.AnimationCurve;

@Component({ selector: 'demo-touch', templateUrl: 'touch.component.html', styleUrl: 'touch.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class TouchComponent implements OnDestroy {
  private readonly previousGlobal = TouchManager.enableGlobalTapAnimations;
  private readonly previousAnimations = TouchManager.animations;

  readonly count = signal({ scale: 0, fade: 0, lift: 0, ignored: 0 });

  // AnimationDefinition form: plain objects, the same shape `view.animate()` takes.
  readonly pressScale = {
    down: { scale: { x: 0.96, y: 0.96 }, duration: 120, curve: easeOut },
    up: { scale: { x: 1, y: 1 }, duration: 220, curve: spring },
  };
  readonly pressFade = {
    down: { opacity: 0.6, duration: 100 },
    up: { opacity: 1, duration: 200 },
  };
  // Function form: full control, e.g. chaining or reading view state.
  readonly pressLift = {
    down: (view: View) => view.animate({ translate: { x: 0, y: -4 }, scale: { x: 1.02, y: 1.02 }, duration: 120, curve: easeOut }),
    up: (view: View) => view.animate({ translate: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, duration: 260, curve: spring }),
  };

  // Global mode: any view with a tap listener gets TouchManager.animations attached when it loads.
  readonly globalOn = signal(false);
  readonly chips = ['Flex', 'Grid', 'Text', 'Img'];
  readonly lastChip = signal('');

  constructor() {
    TouchManager.animations = {
      down: { scale: { x: 0.9, y: 0.9 }, duration: 100 },
      up: { scale: { x: 1, y: 1 }, duration: 180, curve: spring },
    };
  }

  ngOnDestroy(): void {
    // Leave the rest of the app the way we found it.
    TouchManager.enableGlobalTapAnimations = this.previousGlobal;
    TouchManager.animations = this.previousAnimations;
  }

  tapped(card: 'scale' | 'fade' | 'lift' | 'ignored'): void {
    this.count.update((count) => ({ ...count, [card]: count[card] + 1 }));
  }

  toggleGlobal({ object }: EventData): void {
    const on = (object as Switch).checked;
    TouchManager.enableGlobalTapAnimations = on;
    this.globalOn.set(on);
  }
}
