import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';

import { Story } from './models';

/**
 * A story row.
 *
 * The interesting part is what is *not* in the template: this component sets no
 * wrapper element of its own. `margin`, the background and the rounded corner
 * live on the `<hn-story-card>` host element via the `.card` class, which only
 * works because the host is a real MasonKit box. Under stock
 * `@nativescript/angular` the host is a `ProxyViewContainer` and all of that is
 * silently dropped.
 */
@Component({ selector: 'hn-story-card', templateUrl: 'story-card.component.html', imports: [NativeScriptCommonModule], schemas: [NO_ERRORS_SCHEMA] })
export class StoryCardComponent {
  @Input() story!: Story;
  @Input() rank!: number;
}
