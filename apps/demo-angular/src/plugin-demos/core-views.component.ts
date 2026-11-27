import { afterNextRender, Component, ElementRef, NO_ERRORS_SCHEMA, signal, viewChild } from '@angular/core';
import { NativeScriptFormsModule } from '@nativescript/angular';
import { Utils, View } from '@nativescript/core';
import { range } from '../shared/range';
import { DemoPageComponent } from '../shared/demo-page.component';

const dp = (px: number): number => Math.round(Utils.layout.toDeviceIndependentPixels(px));

@Component({ selector: 'demo-core-views', templateUrl: 'core-views.component.html', styleUrl: 'core-views.component.scss', imports: [DemoPageComponent, NativeScriptFormsModule], schemas: [NO_ERRORS_SCHEMA] })
export class CoreViewsComponent {
  private readonly stackHost = viewChild.required<ElementRef<View>>('stackHost');
  private readonly gridHost = viewChild.required<ElementRef<View>>('gridHost');
  private readonly rowHost = viewChild.required<ElementRef<View>>('rowHost');
  private readonly wrapHost = viewChild.required<ElementRef<View>>('wrapHost');
  private readonly deepHost = viewChild.required<ElementRef<View>>('deepHost');

  readonly range = range;

  readonly name = signal('');
  readonly bio = signal('');
  readonly lastReturn = signal('');

  readonly airplane = signal(false);
  readonly wifiOnly = signal(true);
  readonly spinning = signal(true);

  readonly views = ['List', 'Grid', 'Map'];
  readonly viewIndex = signal(0);

  readonly volume = signal(40);
  readonly planets = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter'];
  readonly planetIndex = signal(2);

  readonly notes = signal('');
  readonly allDisabled = signal(false);

  readonly extraLines = signal(0);
  readonly tags = signal(['flex', 'grid', 'taffy', 'stack', 'wrap', 'nested']);

  /**
   * Measured size of each core host, read back after the deferred nested-root compute has run, so the readouts prove
   * the outer Mason tree saw the real size. (layoutChanged fires on the first, pre-deferral pass and reports 0/padding.)
   */
  readonly sizes = signal({ stack: 0, grid: 0, row: 0, rowWidth: 0, wrap: 0, deep: 0 });

  constructor() {
    afterNextRender(() => this.scheduleRead(400));
  }

  bump(): void {
    this.volume.update((volume) => (volume + 10) % 110);
  }

  addLine(): void {
    this.extraLines.update((lines) => lines + 1);
    this.scheduleRead();
  }

  addTag(): void {
    this.tags.update((tags) => [...tags, `chip ${tags.length + 1}`]);
    this.scheduleRead();
  }

  removeTag(): void {
    this.tags.update((tags) => (tags.length > 1 ? tags.slice(0, -1) : tags));
    this.scheduleRead();
  }

  readSizes(): void {
    const height = (host: ElementRef<View>) => dp(host.nativeElement.getMeasuredHeight());
    this.sizes.set({
      stack: height(this.stackHost()),
      grid: height(this.gridHost()),
      row: height(this.rowHost()),
      rowWidth: dp(this.rowHost().nativeElement.getMeasuredWidth()),
      wrap: height(this.wrapHost()),
      deep: height(this.deepHost()),
    });
  }

  private scheduleRead(delay = 150): void {
    setTimeout(() => this.readSizes(), delay);
  }
}
