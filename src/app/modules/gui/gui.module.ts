import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CoreModule } from 'src/app/core/core.module';
import { GuiRoutingModule } from './gui-routing.module';
import { BasicLayoutComponent } from './layout/basic/basic.component';
import { IndexComponent } from './pages/index/index.component';
import { MusicListComponent } from './pages/music-list/music-list.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MusicsComponent } from './pages/profile/musics/musics.component';

@NgModule({
  declarations: [IndexComponent, MusicListComponent, BasicLayoutComponent, MusicsComponent],
  imports: [CommonModule, CoreModule, GuiRoutingModule, MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule],
})
export class GuiModule {}
