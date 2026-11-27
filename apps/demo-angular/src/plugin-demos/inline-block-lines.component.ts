import { afterNextRender, Component, ElementRef, NO_ERRORS_SCHEMA, viewChildren } from '@angular/core';
import { View } from '@nativescript/core';
import { DemoPageComponent } from '../shared/demo-page.component';

const wrapsLine1 = 'Line one of the paragraph wraps onto a second line here, then ';
const fixedBox = 'display: inline-block; width: 150px; background-color: #fde68a; padding: 1px 4px';
const autoBox = 'display: inline-block; background-color: #fde68a; padding: 1px 4px';
const importText = "import HlmSwitchImports from '.../packages/ui/native/shims/helm-switch'";
const shimSentence = 'Native-only code imports the shim, as the native docs demo does: ';

function windowY(view: android.view.View): number {
  const loc = Array.create('int', 2);
  view.getLocationInWindow(loc);
  return loc[1];
}

@Component({ selector: 'demo-inline-block-lines', templateUrl: 'inline-block-lines.component.html', styleUrl: 'inline-block-lines.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class InlineBlockLinesComponent {
  /** One per case, in order. */
  private readonly paragraphs = viewChildren<ElementRef<View>>('paragraph');
  private readonly boxes = viewChildren<ElementRef<View>>('box');

  readonly cases = [
    { id: 1, line: 1, pStyle: 'line-height: 1.5', before: 'Before text ', tag: 'code', boxStyle: autoBox, box: 'short', after: ' after.' },
    { id: 5, line: 1, pStyle: 'line-height: 1.5', before: 'Before text ', tag: 'code', boxStyle: fixedBox, box: 'this text wraps inside a fixed width box', after: ' after.' },
    { id: 8, line: 1, pStyle: 'line-height: 1.5', before: '', tag: 'code', boxStyle: autoBox, box: importText, after: ' after.' },
    { id: 9, line: 1, pStyle: '', before: '', tag: 'code', boxStyle: autoBox, box: importText, after: ' after, then more text that wraps to a third line.' },
    { id: 7, line: 2, pStyle: 'line-height: 1.5', before: wrapsLine1, tag: 'code', boxStyle: fixedBox, box: 'this text wraps inside a fixed width box', after: ' after.' },
    { id: 4, line: 2, pStyle: 'line-height: 1.5', before: wrapsLine1, tag: 'span', boxStyle: 'display: inline-block; height: 60px; background-color: #fca5a5', box: 'tall', after: ' after.' },
    { id: 2, line: 3, pStyle: 'line-height: 1.5', before: shimSentence, tag: 'code', boxStyle: autoBox, box: importText, after: '' },
    { id: 3, line: 3, pStyle: '', before: shimSentence, tag: 'code', boxStyle: autoBox, box: importText, after: '' },
    { id: 6, line: 3, pStyle: 'line-height: 1.5', before: shimSentence, tag: 'code', boxStyle: 'display: inline; background-color: #fde68a; padding: 1px 4px', box: importText, after: '' },
  ];

  constructor() {
    if (__ANDROID__) {
      afterNextRender(() => setTimeout(() => this.logGeometry(), 1500));
    }
  }

  private logGeometry(): void {
    const density = android.content.res.Resources.getSystem().getDisplayMetrics().density;
    this.cases.forEach((c, i) => {
      const p = this.paragraphs()[i]?.nativeElement.nativeViewProtected;
      const box = this.boxes()[i]?.nativeElement.nativeViewProtected;
      if (!p || !box) {
        console.log(`INLINE_REPRO case=${c.id} missing p=${!!p} box=${!!box}`);
        return;
      }
      const top = (windowY(box) - windowY(p)) / density;
      const height = box.getHeight() / density;
      const pHeight = p.getHeight() / density;
      const insideP = top + height <= pHeight + 0.5;
      console.log(`INLINE_REPRO case=${c.id} line=${c.line} p.h=${pHeight.toFixed(1)} box.top=${top.toFixed(1)} box.h=${height.toFixed(1)} box.bottom=${(top + height).toFixed(1)} insideP=${insideP}`);
    });
  }
}
