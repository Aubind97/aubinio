import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { first, switchMap, tap } from 'rxjs/operators';
import { MusicScoreDetails, MusicScore } from 'src/app/core/models/global';
import { AuthService } from 'src/app/core/services/auth.service';
import { CoreMusicService } from 'src/app/core/services/core-music.service';
import { DatabaseMusicService } from 'src/app/core/services/database-music.service';

@Component({
  selector: 'app-music',
  templateUrl: './musics.component.html',
  styleUrls: ['./musics.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicsComponent {
  musicList$ = this.authService.user$.pipe(switchMap(({ uid }) => this.databaseMusicService.getAllOf$(uid).valueChanges()));

  constructor(
    private databaseMusicService: DatabaseMusicService,
    private coreMusicService: CoreMusicService,
    private router: Router,
    private authService: AuthService
  ) {}

  loadFullTrack(meta: MusicScoreDetails) {
    this.databaseMusicService
      .loadFullMusicScore$(meta)
      .pipe(
        first(),
        tap((music: MusicScore) => {
          this.coreMusicService.load(music);
          this.router.navigate(['editor']);
        })
      )
      .subscribe();
  }

  toggleAccess(music: MusicScoreDetails) {
    this.databaseMusicService.toggleAccessTo(music.id, !music.isPublic);
  }

  delete(music: MusicScoreDetails) {
    this.databaseMusicService.delete(music.id);
  }
}
