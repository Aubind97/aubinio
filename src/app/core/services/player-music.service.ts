import { Injectable } from '@angular/core';
import { combineLatest, Observable, Subject } from 'rxjs';
import { scan, share, shareReplay, startWith, tap } from 'rxjs/operators';
import webmidi from 'webmidi';
import { MusicScoreNote } from '../models/global';

interface PlayerState {
  isOn: boolean;
}

@Injectable({
  providedIn: 'root',
})
// Manage Music Play
export class PlayerMusicService {
  private readonly DEFAULT_STATE: PlayerState = {
    isOn: false,
  };

  private command$ = new Subject<Partial<PlayerState>>();

  private state$ = this.command$.pipe(
    startWith(this.DEFAULT_STATE),
    scan((state: PlayerState, command) => ({ ...state, ...command })),
    shareReplay(1)
  );

  player$(notes$: Observable<MusicScoreNote[]>) {
    return combineLatest([notes$, this.state$]).pipe(
      tap(([notes, state]) => {
        if (state.isOn) {
          const output = webmidi.outputs[0];

          if (output) {
            notes.forEach((note) => {
              output.playNote(note.keyCode, 1, {
                velocity: note.velocity,
                duration: note.durationInTicks,
              });
            });
          }
        }
      }),
      share()
    );
  }

  start(): void {
    this.command$.next({ isOn: true });
  }

  stop(): void {
    this.command$.next({ isOn: false });
  }
}
