import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EditorModule } from './modules/editor/editor.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GuiModule } from './modules/gui/gui.module';
import { CoreModule } from './core/core.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { PublicModule } from './modules/public/public.module';
import { HttpClientModule } from '@angular/common/http';
import { PlayModule } from './modules/play/play.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,

    CoreModule,
    HttpClientModule,

    AppRoutingModule,

    PublicModule,
    GuiModule,
    PlayModule,
    EditorModule,

    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
