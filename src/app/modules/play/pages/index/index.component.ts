import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Hand } from 'src/app/core/models/global';
import { CoreMusicService } from 'src/app/core/services/core-music.service';
import { PlayService } from './../../services/play.service';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexComponent implements OnInit, OnDestroy {
  selectedHands$ = this.playService.selectedHands$;

  speedAvailables = [0.1, 0.25, 0.33, 0.5, 0.75, 0.88, 1, 1.25, 1.5];
  currentSpeedIndex = 6;

  constructor(private playService: PlayService, private coreMusicService: CoreMusicService) {}

  ngOnDestroy(): void {
    this.playService.stopWaiting();
  }

  ngOnInit(): void {
    this.playService.startWaiting();
  }

  toggleSelectedHand(hand: Hand): void {
    this.playService.toogleSelectedHand(hand);
  }

  changeSpeed() {
    this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speedAvailables.length;
    this.coreMusicService.setSpeed(this.speedAvailables[this.currentSpeedIndex]);
  }
}
