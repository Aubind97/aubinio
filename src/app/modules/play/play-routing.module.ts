import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';

import {IndexComponent as PlayIndex} from './pages/index/index.component';

const routes: Routes = [{
  path: 'play',
  canActivate: [AuthGuard],
  children: [{ path: '', component: PlayIndex }],
},];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlayRoutingModule { }
