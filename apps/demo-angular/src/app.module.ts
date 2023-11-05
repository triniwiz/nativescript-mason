import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptModule, registerElement } from '@nativescript/angular';
import { TSCView } from '@triniwiz/nativescript-masonkit';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './home.component';

registerElement('TSCView', () => TSCView);

@NgModule({
  schemas: [NO_ERRORS_SCHEMA],
  declarations: [AppComponent, HomeComponent],
  bootstrap: [AppComponent],
  imports: [NativeScriptModule, AppRoutingModule],
})
export class AppModule {}
