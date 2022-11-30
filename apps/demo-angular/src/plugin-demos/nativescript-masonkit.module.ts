import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule, NativeScriptRouterModule } from '@nativescript/angular';
import { NativescriptMasonkitComponent } from './nativescript-masonkit.component';

@NgModule({
  imports: [NativeScriptCommonModule, NativeScriptRouterModule.forChild([{ path: '', component: NativescriptMasonkitComponent }])],
  declarations: [NativescriptMasonkitComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class NativescriptMasonkitModule {}
