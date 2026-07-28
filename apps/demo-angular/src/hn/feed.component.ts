import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule, NativeScriptRouterModule, RouterExtensions } from '@nativescript/angular';

import { STORIES } from './fixtures';
import { Story } from './models';
import { StoryCardComponent } from './story-card.component';

type SortMode = 'top' | 'new' | 'discussed';

/**
 * The feed. Deliberately renders through a MasonKit column rather than a core
 * `ListView`, so that re-sorting reorders real MasonKit children — the
 * insertion-order path — instead of recycling templates.
 *
 * The `/hn/list` route covers the core `ListView` case separately.
 */
@Component({
  selector: 'hn-feed',
  templateUrl: 'feed.component.html',
  imports: [NativeScriptCommonModule, NativeScriptRouterModule, StoryCardComponent],
  // NativeScript elements are not Angular components; NO_ERRORS_SCHEMA is what
  // lets <ActionBar>, <ScrollView> and the MasonKit tags through.
  schemas: [NO_ERRORS_SCHEMA],
})
export class FeedComponent {
  sort: SortMode = 'top';

  constructor(private router: RouterExtensions) {}

  get stories(): Story[] {
    const stories = [...STORIES];
    switch (this.sort) {
      case 'new':
        return stories.sort((a, b) => a.agoHours - b.agoHours);
      case 'discussed':
        return stories.sort((a, b) => b.descendants - a.descendants);
      default:
        return stories.sort((a, b) => b.score - a.score);
    }
  }

  setSort(mode: SortMode): void {
    this.sort = mode;
  }

  open(story: Story): void {
    this.router.navigate(['/hn/item', story.id]);
  }

  /** Keeps host instances stable across re-sorts, so a re-sort is a move. */
  trackById(_index: number, story: Story): number {
    return story.id;
  }
}
