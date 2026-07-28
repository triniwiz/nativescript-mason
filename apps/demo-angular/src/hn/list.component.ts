import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';

import { STORIES } from './fixtures';
import { Story } from './models';

/**
 * The same feed rendered through a core NativeScript `ListView` whose item
 * template is MasonKit.
 *
 * This is the other half of the mixed-view story: `ListView` recycles item
 * views and measures them with classic NativeScript measurement, so each item
 * root is a MasonKit box being driven by a non-MasonKit parent. It also runs
 * MasonKit through a code path where views are detached and re-bound rather
 * than created once.
 */
@Component({ selector: 'hn-list', templateUrl: 'list.component.html', imports: [NativeScriptCommonModule], schemas: [NO_ERRORS_SCHEMA] })
export class ListComponent {
  stories: Story[] = STORIES;
}
