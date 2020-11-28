import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlayRoutingModule } from './play-routing.module';
import { IndexComponent } from './pages/index/index.component';
import { PlayRendererComponent } from './components/play-renderer/play-renderer.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { KeyboardModule } from '../keyboard/keyboard.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@NgModule({
  declarations: [IndexComponent, PlayRendererComponent],
  imports: [
    CommonModule,
    PlayRoutingModule,

    SharedModule,
    KeyboardModule,

    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
  ],
})
export class PlayModule {}
