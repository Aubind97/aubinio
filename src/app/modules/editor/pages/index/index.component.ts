import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { Hand } from 'src/app/core/models/global';
import { EditorService } from '../../services/editor.service';
import { CoreMusicService } from 'src/app/core/services/core-music.service';
import { DatabaseMusicService } from 'src/app/core/services/database-music.service';
import { PlayerMusicService } from 'src/app/core/services/player-music.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexComponent implements OnInit, OnDestroy {
  @ViewChild('menu') menu: MatExpansionPanel;

  isTicking$ = this.coreMusicService.isTicking$;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private editorService: EditorService,
    private coreMusicService: CoreMusicService,
    private databaseMusicService: DatabaseMusicService,
    private playerMusicService: PlayerMusicService
  ) {}

  ngOnDestroy(): void {
    this.playerMusicService.stop();

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.coreMusicService.stop();

    this.playerMusicService.player$(this.coreMusicService.currentNotes$).pipe(takeUntil(this.unsubscribe$)).subscribe();
    this.playerMusicService.start();
  }

  toggleHandTool(hand: Hand) {
    this.editorService.toggleHand(hand);
  }

  togglePlayPause(): void {
    this.coreMusicService.toggle();
  }

  handleMusicSave() {
    this.databaseMusicService.createOrUpdateCurrent();
  }
}
