import { Injectable } from '@angular/core';
import { Hand, MusicScoreDetails, MusicScoreNote, SelectedTrack } from './../models/global';
import { defaultHand, MidiLoaderService } from './midi-loader.service';
import { CoreMusicService } from './core-music.service';

@Injectable({
  providedIn: 'root',
})
// Manage Music Data
export class DataMusicService {
  constructor(private coreMusicService: CoreMusicService, private midiLoaderService: MidiLoaderService) {}

  /**
   * Define the binding hand to a note
   */
  defineNoteHand(note: MusicScoreNote, hand: Hand) {
    note.hand = hand;
  }

  /**
   * Bind all notes before the threshold to the left hand and the other to the right
   */
  setHandFromThreshold(threshold: number) {
    this.coreMusicService.music$.getValue().notes.forEach((note) => {
      if (note.keyCode < threshold) {
        this.defineNoteHand(note, 'LEFT');
      } else {
        this.defineNoteHand(note, 'RIGHT');
      }
    });
  }

  /**
   * Update a detail props of a music and trigger emit the new value
   */
  updateDetails(key: keyof MusicScoreDetails, value: unknown) {
    const music = this.coreMusicService.music$.getValue();

    this.coreMusicService.music$.next({
      ...music,
      details: { ...music.details, [key]: value },
    });
  }

  /**
   * Add a track to the selected tracks array (with an associated hand)
   */
  selectHandForTrackTrack(id: string, hand: Hand = defaultHand): void {
    const music = this.coreMusicService.music$.getValue();
    const findedTrack = music.selectedTracks.find(track => track.id === id);
    const updateNoteHand = (tId: string, h: Hand) => {
      music.availableTracks.find(track => track.id === tId)?.notes.forEach(note => {
        note.hand = h;
      });
    };

    if (!findedTrack) {
      // Track note already selected
      updateNoteHand(id, hand);
      music.selectedTracks.push({id, hand});
    } else if (findedTrack.hand !== hand) {
      // Track already selcted but with an other hand
      updateNoteHand(id, hand);
      findedTrack.hand = hand;
    }

    this.coreMusicService.music$.next(this.midiLoaderService.mergeSelectedTracksNotes(music));
  }

  /**
   * Remove a selected track
   */
  unselectTrack(id: string): void {
    const music = this.coreMusicService.music$.getValue();
    const findedTrackIndex = music.selectedTracks.findIndex(track => track.id === id);

    if (findedTrackIndex !== -1) {
      music.selectedTracks.splice(findedTrackIndex, 1);
      this.coreMusicService.music$.next(this.midiLoaderService.mergeSelectedTracksNotes(music));
    }
  }
}
