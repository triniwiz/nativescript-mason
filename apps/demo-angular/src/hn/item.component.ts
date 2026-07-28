import { Component, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { ActivatedRoute } from '@angular/router';

import { findStory } from './fixtures';
import { Story } from './models';
import { CommentComponent } from './comment.component';

/**
 * Story detail, reached through a child route (`/hn/item/:id`) so the app
 * exercises nested routing, not just a flat route table.
 */
@Component({ selector: 'hn-item', templateUrl: 'item.component.html', imports: [NativeScriptCommonModule, CommentComponent], schemas: [NO_ERRORS_SCHEMA] })
export class ItemComponent implements OnInit {
  story?: Story;
  showComments = true;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    this.story = findStory(id);
  }

  toggleComments(): void {
    this.showComments = !this.showComments;
  }
}
