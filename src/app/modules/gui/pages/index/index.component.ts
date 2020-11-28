import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { CoreMusicService } from 'src/app/core/services/core-music.service';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexComponent {
  constructor(private router: Router, private coreMusicService: CoreMusicService) {}

  public uploadFile($event) {
    this.coreMusicService.loadFromMidi($event.target.files[0]);
    this.router.navigate(['/editor']);
  }
}
