import { Component, ElementRef, NO_ERRORS_SCHEMA, viewChild, viewChildren } from '@angular/core';
import { CoreTypes, View } from '@nativescript/core';
import { DemoPageComponent } from '../shared/demo-page.component';

const { easeIn, easeInOut, easeOut } = CoreTypes.AnimationCurve;

@Component({ selector: 'demo-animation', templateUrl: 'animation.component.html', styleUrl: 'animation.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class AnimationComponent {
  private readonly slideBox = viewChild.required<ElementRef<View>>('slideBox');
  private readonly spinBox = viewChild.required<ElementRef<View>>('spinBox');
  private readonly fadeBox = viewChild.required<ElementRef<View>>('fadeBox');
  private readonly sequenceBoxes = viewChildren<ElementRef<View>>('sequenceBox');
  private readonly busy = new Set<() => Promise<unknown>>();

  readonly sequenceColors = ['#fdcb6e', '#00b894', '#0984e3'];

  /** Runs an animation, ignoring taps while it is already running. */
  async run(animation: () => Promise<unknown>): Promise<void> {
    if (this.busy.has(animation)) return;
    this.busy.add(animation);
    try {
      await animation();
    } finally {
      this.busy.delete(animation);
    }
  }

  readonly slide = async () => {
    const view = this.slideBox().nativeElement;
    await view.animate({ translate: { x: 140, y: 0 }, duration: 500, curve: easeInOut });
    await view.animate({ translate: { x: 0, y: 0 }, duration: 500, curve: easeInOut });
  };

  readonly spin = async () => {
    const view = this.spinBox().nativeElement;
    await view.animate({ rotate: 360, scale: { x: 1.4, y: 1.4 }, duration: 600, curve: easeInOut });
    await view.animate({ rotate: 0, scale: { x: 1, y: 1 }, duration: 400, curve: easeInOut });
  };

  readonly fade = async () => {
    const view = this.fadeBox().nativeElement;
    await view.animate({ opacity: 0, duration: 350 });
    await view.animate({ opacity: 1, duration: 350 });
  };

  readonly sequence = () =>
    Promise.all(
      this.sequenceBoxes().map(async ({ nativeElement: view }, i) => {
        await view.animate({ translate: { x: 0, y: -24 }, duration: 250, delay: i * 120, curve: easeOut });
        await view.animate({ translate: { x: 0, y: 0 }, duration: 250, curve: easeIn });
      }),
    );
}
