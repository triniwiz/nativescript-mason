import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';

/**
 * A component whose entire visual box is its host element — the template adds
 * only text. If the host is not a real MasonKit view, these render as bare
 * unstyled labels with no background, padding or spacing.
 */
@Component({
  selector: 'stress-chip',
  template: `<Text class="chip-text">{{ label }}</Text>`,
  schemas: [NO_ERRORS_SCHEMA],
})
export class ChipComponent {
  @Input() label = '';
}

/**
 * A second component type with the same shape, used to swap which component
 * occupies a slot. The swap removes one host and inserts another at the same
 * index, which is the remove-then-insert path.
 */
@Component({
  selector: 'stress-chip-alt',
  template: `<Text class="chip-text">alt {{ label }}</Text>`,
  schemas: [NO_ERRORS_SCHEMA],
})
export class ChipAltComponent {
  @Input() label = '';
}
