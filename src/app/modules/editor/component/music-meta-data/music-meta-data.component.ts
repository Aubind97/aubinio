import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { Hand, MusicScoreDetails } from 'src/app/core/models/global';
import { guessKeyCode } from 'src/app/core/utils/music.utils';
import { KeyboardService } from 'src/app/modules/keyboard/service/keyboard.service';
import { MatSliderChange } from '@angular/material/slider';
import { CoreMusicService } from 'src/app/core/services/core-music.service';
import { DataMusicService } from 'src/app/core/services/data-music.service';

@Component({
  selector: 'app-music-meta-data',
  templateUrl: './music-meta-data.component.html',
  styleUrls: ['./music-meta-data.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicMetaDataComponent implements OnInit {
  minNoteCode = 21;
  maxNoteCode = 108;
  noteThreshold = 30;

  musicMeta$: Observable<MusicScoreDetails> = this.coreMusicService.music$.pipe(map((music) => (!!music ? music.details : null)));

  constructor(
    private keyboardService: KeyboardService,
    private coreMusicService: CoreMusicService,
    private dataMusicService: DataMusicService
  ) {}

  ngOnInit(): void {
    const keyboardDetails = this.keyboardService.KEYBOARD_DETAILS;
    this.minNoteCode = guessKeyCode(keyboardDetails.lowestNote.pitch, keyboardDetails.lowestNote.octave);
    this.maxNoteCode = guessKeyCode(keyboardDetails.highestNote.pitch, keyboardDetails.highestNote.octave);
  }

  get availableTracks$() {
    return this.coreMusicService.music$.pipe(map((music) => music?.availableTracks));
  }

  formatLabel(value: number) {
    const { pitch: key, octave } = this.keyboardService.keySet.get(value);
    return key + octave;
  }

  handleMetaDataUpdate(event, key: keyof MusicScoreDetails): void {
    this.dataMusicService.updateDetails(key, event.target.value);
  }

  setHandsValues(): void {
    this.dataMusicService.setHandFromThreshold(this.noteThreshold);
  }

  selectTrack(id: string, hand: Hand): void {
    this.dataMusicService.selectHandForTrackTrack(id, hand);
  }

  unselectTrack(id: string): void {
    this.dataMusicService.unselectTrack(id);
  }

  isSelectedTrack$(id: string) {
    return this.coreMusicService.music$.pipe(
      pluck('selectedTracks'),
      map((selectedTrack) => selectedTrack.find((track) => track.id === id)?.hand || 'NONE')
    );
  }
}
