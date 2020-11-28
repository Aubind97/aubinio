import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { IndexComponent } from './pages/index/index.component';

const routes: Routes = [
  {
    path: 'editor',
    canActivate: [AuthGuard],
    children: [{ path: '', component: IndexComponent }],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditorRoutingModule {}
