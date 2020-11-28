import { Injectable } from '@angular/core';
import { Midi, Track } from '@tonejs/midi';
import { Note } from '@tonejs/midi/dist/Note';
import { v4 as uuidv4 } from 'uuid';
import { MusicScoreDetails, MusicScoreTrack, MusicScoreNote, Pitch, MusicScore, Hand } from '../models/global';
import { isBlack } from '../utils/music.utils';

export const defaultHand: Hand = 'RIGHT';

@Injectable({
  providedIn: 'root',
})
export class MidiLoaderService {
  /**
   * Load a midi file and format it
   */
  async loadMidiFromFile(file: File): Promise<MusicScore> {
    const midiContent: Promise<Midi> = new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (evt) => {
        const midi = new Midi(evt.target.result as ArrayBuffer);
        resolve(midi);
      };

      reader.onerror = reject;

      reader.readAsArrayBuffer(file);
    });

    return this.mergeSelectedTracksNotes(this.format(await midiContent));
  }

  /**
   * Computes all notes from selected track index and available tracks
   */
  mergeSelectedTracksNotes(music: MusicScore): MusicScore {
    music.notes = music.selectedTracks
      .reduce((acc, curr) => {
        const trak = music.availableTracks.find((track) => track.id === curr.id);

        // Define the hand
        trak.notes.forEach((note) => {
          note.hand = curr.hand;
        });

        // Merge notes
        return acc.concat(trak.notes);
      }, [])
      .sort((a, b) => a.tick - b.tick);

    return music;
  }

  /**
   * Format a ToneJS MIDI data to an internal representation of MIDI data
   */
  private format(midi: Midi): MusicScore {
    const music: Partial<MusicScore> = {};

    music.details = this.formatDetails(midi);

    music.availableTracks = [];
    midi.tracks.forEach((track) => {
      if (!!track.notes.length) {
        music.availableTracks.push(this.formatTrack(track));
      }
    });

    // Select the first one by default
    music.selectedTracks = [
      {
        id: music.availableTracks?.[0].id,
        hand: defaultHand,
      },
    ];

    return music as MusicScore;
  }

  /**
   * Format a ToneJS data to internat representation of MIDI meta data
   */
  private formatDetails(midi: Midi): MusicScoreDetails {
    return {
      title: midi.name ?? 'Unknown',
      compositor: 'Unknown',
      duration: midi.duration,
      durationInTicks: midi.durationTicks,
      bpm: midi.header.tempos[0].bpm,
    };
  }

  /**
   * Format a ToneJS Track to an internal representation of a MIDI Track
   */
  private formatTrack(track: Track): MusicScoreTrack {
    const notes = track.notes.map((note) => this.formatNote(note));

    return {
      id: uuidv4(),
      details: { channel: track.channel },
      notes,
    };
  }

  /**
   * Convert a ToneJS Note to an internal representation of a MIDI Note
   */
  private formatNote(note: Note): MusicScoreNote {
    return {
      keyCode: note.midi,
      note: { octave: note.octave, pitch: note.pitch as Pitch },
      isBlack: isBlack(note.pitch as Pitch),
      tick: note.ticks,
      durationInTicks: note.durationTicks,
      velocity: note.velocity,
    };
  }
}
