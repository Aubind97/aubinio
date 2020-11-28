import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { BasicLayoutComponent } from './layout/basic/basic.component';

import { IndexComponent as ProfileIndex } from './pages/profile/index/index.component';
import { MusicsComponent as ProfileMusics } from './pages/profile/musics/musics.component';

import { IndexComponent as Index } from './pages/index/index.component';
import { MusicListComponent as MusicList } from './pages/music-list/music-list.component';

const guiRoutes = [
  { path: '', component: Index },
  { path: 'musics', component: MusicList }
];

const profileRoutes = {
  path: 'profile',
  children: [
    { path: '', component: ProfileIndex },
    { path: 'musics', component: ProfileMusics },
  ],
};

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: BasicLayoutComponent,
    children: [
      ...guiRoutes,
      profileRoutes
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GuiRoutingModule {}
