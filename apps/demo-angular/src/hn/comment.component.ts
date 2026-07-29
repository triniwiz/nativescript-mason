import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';

import { Comment } from './models';

/**
 * A comment and its replies — recursive: the template renders `<hn-comment>`
 * for each reply, so the fixture's eight-deep thread becomes eight nested
 * component host elements.
 *
 * This is the sharpest test in the app. Every level is a host box that must
 * exist, must nest inside its parent, and must keep its position when a sibling
 * above it collapses. Collapsing a thread removes a subtree from the middle of
 * its parent's children, which is exactly the operation that leaves MasonKit's
 * `_children` stale without the registration meta.
 */
@Component({ selector: 'hn-comment', templateUrl: 'comment.component.html', imports: [NativeScriptCommonModule, CommentComponent], schemas: [NO_ERRORS_SCHEMA] })
export class CommentComponent {
  @Input() comment!: Comment;
  @Input() depth = 0;

  collapsed = false;

  toggle(): void {
    this.collapsed = !this.collapsed;
  }

  get replyCount(): number {
    let total = this.comment.kids.length;
    for (const kid of this.comment.kids) {
      total += countDescendants(kid);
    }
    return total;
  }
}

function countDescendants(comment: Comment): number {
  let total = comment.kids.length;
  for (const kid of comment.kids) {
    total += countDescendants(kid);
  }
  return total;
}
