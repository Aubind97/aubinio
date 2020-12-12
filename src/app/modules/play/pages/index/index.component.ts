import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { Subject } from 'rxjs';
import { first, map, takeUntil, tap } from 'rxjs/operators';
import { Hand } from 'src/app/core/models/global';
import { CoreMusicService } from 'src/app/core/services/core-music.service';
import { PlayerMusicService } from 'src/app/core/services/player-music.service';
import { PlayService } from './../../services/play.service';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexComponent implements OnInit, OnDestroy {
  selectedHands$ = this.playService.selectedHands$;
  playedHands: Hand[] = ['LEFT', 'RIGHT'];
  volume$ = this.playerMusicService.volume$.pipe(map((v) => v * 100));
  speed$ = this.coreMusicService.speed$.pipe(map((v) => v * 100));

  private unsubscribe$ = new Subject<void>();

  constructor(
    private playService: PlayService,
    private playerMusicService: PlayerMusicService,
    private coreMusicService: CoreMusicService
  ) {
    const playedNotes$ = this.coreMusicService.currentNotes$.pipe(
      map((notes) => notes.filter((note) => this.playedHands.includes(note.hand)))
    );

    this.playerMusicService.player$(playedNotes$).pipe(takeUntil(this.unsubscribe$)).subscribe();

    // Init the speed from the core music service
    this.speed$
      .pipe(
        first(),
        tap((speed) => {
          this.playerMusicService.setSpeed(speed);
        })
      )
      .subscribe();

    if (!!this.playedHands.length) {
      this.playerMusicService.start();
    }
  }

  ngOnDestroy(): void {
    this.playService.stopWaiting();
    this.playerMusicService.stop();

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.playService.startWaiting();
  }

  toggleSelectedHand(hand: Hand): void {
    this.playService.toogleSelectedHand(hand);
  }

  handleSpeedChange(evt: MatSliderChange) {
    this.coreMusicService.setSpeed(evt.value / 100);
    this.playerMusicService.setSpeed(evt.value / 100);
  }

  handleVolumeChange(evt: MatSliderChange) {
    this.playerMusicService.setVolume(evt.value / 100);
  }

  togglePlayedHand(hand: Hand): void {
    const handFound = this.playedHands.findIndex((h) => h === hand);

    if (handFound === -1) {
      this.playedHands.push(hand);
    } else {
      this.playedHands.splice(handFound, 1);
    }

    if (this.playedHands.length > 0) {
      this.playerMusicService.start();
    } else {
      this.playerMusicService.stop();
    }
  }
}
