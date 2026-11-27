import { Component, effect, inject, input, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule, RouterExtensions } from '@nativescript/angular';
import { Page } from '@nativescript/core';

/**
 * The frame every demo screen shares: an action bar that goes back, above a MasonKit scroll view.
 *
 * Its host holds the `ActionBar` and a fill-parent scroll view, so `main.ts` lists it as a passthrough element: the
 * scroll view is then measured by the `Page` instead of growing with its content.
 */
@Component({
  selector: 'demo-page',
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <ActionBar [title]="title()">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" (tap)="router.back()"></NavigationButton>
    </ActionBar>
    <Scroll class="page" [style.backgroundColor]="background()" iosOverflowSafeAreaEnabled="false">
      <ng-content />
    </Scroll>
  `,
})
export class DemoPageComponent {
  readonly title = input.required<string>();

  /** For screens with a colour of their own; the theme's page colour otherwise. */
  readonly background = input<string>();

  protected readonly router = inject(RouterExtensions);

  constructor() {
    const page = inject(Page);
    effect(() => {
      // The scroll view paints its scrolled content only, so the rest of the screen is the page's.
      if (this.background()) page.backgroundColor = this.background();
    });
  }
}
