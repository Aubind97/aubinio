import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Hand } from 'src/app/core/models/global';
import { PlayService } from './../../services/play.service';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexComponent implements OnInit, OnDestroy {
  selectedHands$ = this.playService.selectedHands$;

  constructor(private playService: PlayService) {}

  ngOnDestroy(): void {
    this.playService.stopWaiting();
  }

  ngOnInit(): void {
    this.playService.startWaiting();
  }

  toggleSelectedHand(hand: Hand): void {
    this.playService.toogleSelectedHand(hand);
  }
}
