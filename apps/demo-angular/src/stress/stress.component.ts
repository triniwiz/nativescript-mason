import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule, NativeScriptRouterModule } from '@nativescript/angular';
import { ChipAltComponent, ChipComponent } from './chip.component';

interface Item {
  id: number;
  label: string;
}

/**
 * Targeted regression cases, each one a labelled operation with an expected
 * order printed next to it, so a failure reads as "expected A,B,C — got A,C,B"
 * rather than "the screen looks wrong".
 *
 * Every case here maps to a specific fallback in `@nativescript/angular`'s
 * `ViewUtil` that a MasonKit container hits when it is registered without the
 * child-bookkeeping meta.
 */
@Component({ selector: 'stress-root', templateUrl: 'stress.component.html', imports: [NativeScriptCommonModule, NativeScriptRouterModule, ChipComponent, ChipAltComponent], schemas: [NO_ERRORS_SCHEMA] })
export class StressComponent {
  private nextId = 4;

  /** Case 1 & 2: insertion into, and removal from, the middle of a container. */
  items: Item[] = [
    { id: 1, label: 'A' },
    { id: 2, label: 'B' },
    { id: 3, label: 'C' },
  ];

  /** Case 3: a conditional sibling between two static ones. */
  showMiddle = true;

  /** Case 4: hosts styled entirely from the host element. */
  hostBoxes = [1, 2, 3];

  /** Case 6: component hosts placed as grid cells. */
  gridCells = [1, 2, 3, 4, 5, 6];

  /** Case 5: swapping which of two component types occupies a slot. */
  useAlternate = false;

  get expectedOrder(): string {
    return this.items.map((item) => item.label).join(', ');
  }

  insertMiddle(): void {
    const at = Math.floor(this.items.length / 2);
    this.items.splice(at, 0, { id: this.nextId, label: `M${this.nextId}` });
    this.nextId++;
    this.items = [...this.items];
  }

  removeMiddle(): void {
    if (this.items.length < 2) {
      return;
    }
    const at = Math.floor(this.items.length / 2);
    this.items.splice(at, 1);
    this.items = [...this.items];
  }

  prepend(): void {
    this.items = [{ id: this.nextId, label: `P${this.nextId++}` }, ...this.items];
  }

  reverse(): void {
    this.items = [...this.items].reverse();
  }

  shuffle(): void {
    const next = [...this.items];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    this.items = next;
  }

  reset(): void {
    this.nextId = 4;
    this.items = [
      { id: 1, label: 'A' },
      { id: 2, label: 'B' },
      { id: 3, label: 'C' },
    ];
    this.showMiddle = true;
    this.useAlternate = false;
  }

  toggleMiddle(): void {
    this.showMiddle = !this.showMiddle;
  }

  toggleAlternate(): void {
    this.useAlternate = !this.useAlternate;
  }

  trackById(_index: number, item: Item): number {
    return item.id;
  }
}
