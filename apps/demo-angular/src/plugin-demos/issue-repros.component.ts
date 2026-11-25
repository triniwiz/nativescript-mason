import { NgTemplateOutlet } from '@angular/common';
import { afterNextRender, Component, ElementRef, NO_ERRORS_SCHEMA, signal, viewChild } from '@angular/core';
import { range } from '../shared/range';
import { DemoPageComponent } from '../shared/demo-page.component';

function probe(label: string, read: () => unknown): string {
  let result: string;
  try {
    result = JSON.stringify(read());
  } catch (e) {
    result = `threw ${(e as Error).message}`;
  }
  const line = `${label}=${result}`;
  console.log(`REPRO ${line}`);
  return line;
}

@Component({ selector: 'demo-issue-repros', templateUrl: 'issue-repros.component.html', styleUrl: 'issue-repros.component.scss', imports: [DemoPageComponent, NgTemplateOutlet], schemas: [NO_ERRORS_SCHEMA] })
export class IssueReprosComponent {
  // `any`: the probes call DOM methods the views may not have, which is what they report.
  private readonly probeButton = viewChild.required<ElementRef<any>>('probeButton');
  private readonly probeText = viewChild.required<ElementRef<any>>('probeText');
  private readonly progressFill = viewChild.required<ElementRef<any>>('progressFill');
  private readonly collapseThenHidden = viewChild.required<ElementRef<any>>('collapseThenHidden');

  readonly days = range(14);
  readonly weeks = [this.days.slice(0, 7), this.days.slice(7, 14)];
  readonly negTaps = signal(0);
  readonly probeTaps = signal(0);
  readonly probeSummary = signal('');

  constructor() {
    afterNextRender(() => {
      const hiddenBar = this.collapseThenHidden().nativeElement;
      hiddenBar.visibility = 'collapse';
      setTimeout(() => (hiddenBar.visibility = 'hidden'), 300);
      setTimeout(() => this.runProbes(), 1000);
    });
  }

  onNegTap(): void {
    this.negTaps.update((taps) => taps + 1);
    console.log(`REPRO 12 tapped ${this.negTaps()}`);
  }

  private runProbes(): void {
    const button = this.probeButton().nativeElement;
    const text = this.probeText().nativeElement;
    const fill = this.progressFill().nativeElement;
    const lines = [
      probe('11.hasListeners(tap)', () => button.hasListeners('tap')),
      probe('11.hasListeners(click)', () => button.hasListeners?.('click')),
      probe('14.setAttribute', () => {
        button.setAttribute('data-x', '1');
        return button.getAttribute('data-x');
      }),
      probe('14.textContent', () => text.textContent),
      probe('tagName', () => button.tagName),
      probe('getBoundingClientRect', () => {
        const r = button.getBoundingClientRect();
        return r && { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
      probe('15.Canvas', () => {
        text.style.color = 'Canvas';
        return String(text.style.color);
      }),
      probe('15.CanvasText', () => {
        text.style.backgroundColor = 'CanvasText';
        return String(text.style.backgroundColor);
      }),
      probe('17.fill', () => ({
        coreTranslateX: fill.translateX,
        styleTransform: String(fill.style.transform),
        nativeTranslationX: fill.nativeViewProtected?.getTranslationX?.(),
        nativeWidth: fill.nativeViewProtected?.getWidth?.(),
      })),
    ];
    this.probeSummary.set(lines.join('\n'));
  }
}
