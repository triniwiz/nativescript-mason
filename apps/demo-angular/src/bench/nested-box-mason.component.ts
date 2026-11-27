import { Component, computed, input, NO_ERRORS_SCHEMA } from '@angular/core';
import { NestedNode } from '@demo/shared/bench/data';

/** A box of the nested screen. The host element is the box, so a level of the tree is one MasonKit view. */
@Component({
  selector: '[benchBox]',
  imports: [NestedBoxMasonComponent],
  schemas: [NO_ERRORS_SCHEMA],
  host: { '[class]': "row() ? 'row' : 'column'" },
  styles: `
    :host {
      display: flex;
      gap: 4;
      padding: 4;
      border-radius: 6;
      background-color: var(--surface);
      border-width: 1;
      border-color: var(--border);
    }

    :host.row {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    :host.column {
      flex-direction: column;
    }

    .cell {
      flex-grow: 1;
      flex-basis: 0;
      min-width: 0;
    }

    .text {
      font-size: 10;
      color: var(--text-2);
    }

    .branch {
      color: var(--muted);
    }

    .full {
      flex-basis: 100%;
    }
  `,
  template: `
    @if (showOdd() || !row() || !node().children.length) {
      <p class="text" [class.branch]="node().children.length" [class.full]="row()" [text]="node().text"></p>
    }
    @for (child of node().children; track child.id) {
      <div class="cell" [benchBox]="child" [showOdd]="showOdd()"></div>
    }
  `,
})
export class NestedBoxMasonComponent {
  readonly node = input.required<NestedNode>({ alias: 'benchBox' });
  readonly showOdd = input.required<boolean>();
  readonly row = computed(() => this.node().depth % 2 === 0);
}
