import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { environment } from 'src/environments/environment';
import { TimelineComponent } from './components/timeline/timeline.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [TimelineComponent],
  imports: [
    CommonModule,
    DragDropModule,

    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireAuthModule,
  ],
  exports: [TimelineComponent],
})
export class CoreModule {}
