import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, map, startWith, tap } from 'rxjs/operators';
import { Hand, MusicScoreNote } from 'src/app/core/models/global';
import { CoreMusicService } from 'src/app/core/services/core-music.service';
import { KeyboardService } from '../../keyboard/service/keyboard.service';

@Injectable({
  providedIn: 'root',
})
export class PlayService implements OnDestroy {
  private isStarted = false;

  selectedHands$ = new BehaviorSubject(['RIGHT', 'LEFT'] as Hand[]);

  constructor(private coreMusicService: CoreMusicService, private keyboardService: KeyboardService) {}

  ngOnDestroy(): void {
    this.stopWaiting();
  }

  startWaiting(): void {
    this.isStarted = true;

    combineLatest([
      this.coreMusicService.currentNotes$.pipe(startWith([] as MusicScoreNote[])),
      this.keyboardService.currentKeyPressed$,
      this.selectedHands$,
    ])
      .pipe(
        filter(() => this.isStarted),
        map(
          ([notes, keys, selectedHands]) =>
            this.isSameNotes(
              notes.reduce((acc, curr) => {
                if (selectedHands.includes(curr.hand)) {
                  acc.push(curr.keyCode);
                }
                return acc;
              }, []),
              keys
            )
          // TODO: If Music player on, create 2 array, in the tap method, check is the slected hand notes are the same, play the others
        ),
        tap((isSame) => {
          this.coreMusicService.toggle(isSame);
        })
      )
      .subscribe();
  }

  stopWaiting(): void {
    this.coreMusicService.stop();
    this.isStarted = false;
  }

  /**
   * Toggle the select hand that will be used for waiting
   */
  toogleSelectedHand(hand: Hand): void {
    const currentSelected = this.selectedHands$.getValue();
    const handIdx = currentSelected.indexOf(hand);

    if (handIdx === -1) {
      this.selectedHands$.next([...currentSelected, hand]);
    } else {
      currentSelected.splice(handIdx, 1);
      this.selectedHands$.next(currentSelected);
    }
  }

  /**
   * Compage is array of keycode note are se same
   */
  private isSameNotes(requestedNotes: number[], playedNotes: number[]): boolean {
    return requestedNotes.every((note) => playedNotes.includes(note));
  }
}
