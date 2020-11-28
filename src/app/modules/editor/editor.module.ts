import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';

import { EditorRoutingModule } from './editor-routing.module';
import { KeyboardModule } from '../keyboard/keyboard.module';

import { IndexComponent } from './pages/index/index.component';
import { MusicMetaDataComponent } from './component/music-meta-data/music-meta-data.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EditRendererComponent } from './component/edit-renderer/edit-renderer.component';

@NgModule({
  declarations: [IndexComponent, MusicMetaDataComponent, EditRendererComponent],
  imports: [
    CommonModule,
    SharedModule,
    KeyboardModule,
    EditorRoutingModule,

    MatToolbarModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatExpansionModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
})
export class EditorModule {}
