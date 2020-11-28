import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { first, tap } from 'rxjs/operators';
import { MusicScore, MusicScoreDetails } from 'src/app/core/models/global';
import { CoreMusicService } from 'src/app/core/services/core-music.service';
import { DatabaseMusicService } from 'src/app/core/services/database-music.service';

@Component({
  selector: 'app-music-list',
  templateUrl: './music-list.component.html',
  styleUrls: ['./music-list.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicListComponent {
  musicList$ = this.databaseMusicService.getAll$().valueChanges();

  constructor(private databaseMusicService: DatabaseMusicService, private coreMusicService: CoreMusicService, private router: Router) {}

  loadFullTrack(meta: MusicScoreDetails) {
    this.databaseMusicService
      .loadFullMusicScore$(meta)
      .pipe(
        first(),
        tap((music: MusicScore) => {
          this.coreMusicService.load(music);
          this.router.navigate(['play']);
        })
      )
      .subscribe();
  }
}
