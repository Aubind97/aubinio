import { Container, Graphics, Text } from 'pixi.js';
import { User } from './user';

export type Pitch = 'A' | 'A#' | 'B' | 'C' | 'C#' | 'D#' | 'D' | 'E' | 'F' | 'F#' | 'G' | 'G#';

export interface Note {
  pitch: Pitch;
  octave: number;
}

export type Hand = 'LEFT' | 'RIGHT';

export interface SelectedTrack {
  id: string;
  hand: Hand;
}

export interface MusicScore {
  details: MusicScoreDetails;
  availableTracks: MusicScoreTrack[];
  selectedTracks?: SelectedTrack[];
  notes?: MusicScoreNote[];
}

export interface MusicScoreDetails {
  id?: string;
  author?: User;
  createdAt?: number;
  updatedAt?: number;
  url?: string;
  isPublic?: boolean;

  title: string;
  compositor: string;
  duration: number;
  durationInTicks: number;
  bpm: number;
}

export interface MusicScoreTrackDetails {
  channel: number;
}

export interface MusicScoreTrack {
  id: string;
  details: MusicScoreTrackDetails;
  notes: MusicScoreNote[];
}

export interface MusicScoreNote {
  keyCode: number;
  note: Note;
  isBlack: boolean;
  tick: number;
  durationInTicks: number;
  velocity: number;
  hand?: Hand;
}

export interface GraphicsMusicScoreNote {
  container: Container;
  block: Graphics;
  text: Text;
  note?: MusicScoreNote;
}
