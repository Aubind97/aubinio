import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreCollectionGroup } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { forkJoin } from 'rxjs';
import { finalize, first, map, switchMap, tap } from 'rxjs/operators';
import firebase from 'firebase/app';
import { MusicScoreDetails, MusicScore } from './../models/global';
import { AuthService } from './auth.service';
import { CoreMusicService } from './core-music.service';
import { User } from './../models/user';

const { serverTimestamp } = firebase.firestore.FieldValue;

@Injectable({
  providedIn: 'root',
})
// Manage Database Music data
export class DatabaseMusicService {
  constructor(
    private afStore: AngularFirestore,
    private afStorage: AngularFireStorage,
    private authService: AuthService,
    private http: HttpClient,
    private musicCoreService: CoreMusicService
  ) {}

  /**
   * Create or update the current track selected
   */
  createOrUpdateCurrent() {
    const { details: meta, ...musicScoreData } = this.musicCoreService.music$.getValue();

    const id = meta?.id ? meta.id : this.afStore.createId();
    const now = serverTimestamp();

    let user: User;
    let dataPath: string;

    this.authService.user$
      .pipe(
        first(),
        tap((currentUser: User) => {
          user = currentUser;
          dataPath = `musicScores/${user.uid}/${id}.json`;
        }),
        switchMap(() => {
          // Upload the midi data
          const scoreData = new Blob([JSON.stringify(musicScoreData)], { type: 'application/json' });

          return this.afStorage
            .ref(dataPath)
            .put(scoreData, { customMetadata: { title: meta.title || 'Unknown' } })
            .snapshotChanges();
        }),
        finalize(async () => {
          const url = await this.afStorage.ref(dataPath).getDownloadURL().toPromise();

          // Create music meta
          this.afStore.doc(`users/${user.uid}/musicScores/${id}`).set(
            {
              id,
              url,
              author: user,
              isPublic: false,
              createdAt: now,
              updatedAt: now,
              ...meta,
            },
            { merge: true }
          );
        })
      )
      .subscribe();
  }

  /**
   * Delete a music (music details + music score)
   */
  delete(id: string) {
    this.authService.user$
      .pipe(
        tap((user) => {
          this.afStore.doc(`users/${user.uid}/musicScores/${id}`).delete();
          this.afStorage.ref(`musicScores/${user.uid}/${id}.json`).delete();
        })
      )
      .subscribe();
  }

  /**
   * Toggle visibility of a music (public or not)
   */
  toggleAccessTo(id: string, visibility: boolean) {
    this.authService.user$
      .pipe(
        tap((user) => {
          this.afStore.doc(`users/${user.uid}/musicScores/${id}`).update({ isPublic: visibility });
        })
      )
      .subscribe();
  }

  /**
   * Get the all music list
   */
  getAll$(): AngularFirestoreCollectionGroup<MusicScoreDetails> {
    return this.afStore.collectionGroup('musicScores', (ref) => ref.where('isPublic', '==', true).orderBy('title', 'asc'));
  }

  /**
   * Get the music list of a user
   */
  getAllOf$(userId: string): AngularFirestoreCollection<MusicScoreDetails> {
    return this.afStore.collection(`users/${userId}/musicScores`, (ref) => ref.orderBy('title', 'asc'));
  }

  /**
   * Get the all midi data of a music
   */
  loadFullMusicScore$(musicScoreDetails: MusicScoreDetails) {
    return forkJoin([
      this.afStore.doc(`users/${musicScoreDetails.author.uid}/musicScores/${musicScoreDetails.id}`).get(),
      this.http.get<MusicScore>(musicScoreDetails.url, { responseType: 'json' }),
    ]).pipe(map(([meta, data]) => ({ details: meta.data(), ...data })));
  }
}
