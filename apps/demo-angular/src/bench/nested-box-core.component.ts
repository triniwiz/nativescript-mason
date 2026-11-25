import { Component, computed, input, NO_ERRORS_SCHEMA } from '@angular/core';
import { NestedNode } from '@demo/shared/bench/data';

const isRow = (node: NestedNode): boolean => node.depth % 2 === 0 && node.children.length > 0;

/** A box of the nested screen. The host element is the box, so a level of the tree is one core layout. */
@Component({
  selector: '[benchBox]',
  imports: [NestedBoxCoreComponent],
  schemas: [NO_ERRORS_SCHEMA],
  styles: `
    :host {
      padding: 4;
      border-radius: 6;
      background-color: var(--surface);
      border-width: 1;
      border-color: var(--border);
    }

    .cell {
      margin: 2;
      vertical-alignment: top;
    }

    .text {
      font-size: 10;
      color: var(--text-2);
      margin: 2;
    }

    .branch {
      color: var(--muted);
    }
  `,
  template: `
    @if (showOdd() || !row()) {
      <Label class="text" [class.branch]="node().children.length" [text]="node().text" textWrap="true" colSpan="2"></Label>
    }
    @for (child of node().children; track child.id; let i = $index) {
      @if (isRow(child)) {
        <GridLayout class="cell" columns="*, *" rows="auto, auto" [benchBox]="child" [showOdd]="showOdd()" row="1" [col]="i"></GridLayout>
      } @else {
        <StackLayout class="cell" [benchBox]="child" [showOdd]="showOdd()" row="1" [col]="i"></StackLayout>
      }
    }
  `,
})
export class NestedBoxCoreComponent {
  readonly node = input.required<NestedNode>({ alias: 'benchBox' });
  readonly showOdd = input.required<boolean>();
  readonly row = computed(() => isRow(this.node()));
  protected readonly isRow = isRow;
}
