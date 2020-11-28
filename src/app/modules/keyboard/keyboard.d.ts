import { Note, Pitch } from 'src/app/core/models/global';

export interface KeyboardDetails {
  lowestNote: Note;
  highestNote: Note;
  octavesAvailable: number;
  whiteKeys: number;
  blackKeys: number;
}

export interface KeyboardEvent {
  type: 'noteon' | 'noteoff';
  code: number;
  isBlack: boolean;
}

export type KeyCode = number;

export interface Key {
  pitch: Pitch;
  code: KeyCode;
  octave: number;
  isBlack: boolean;

  isPressed?: boolean;
  isHighlight?: boolean;
}

export interface KeyOffset {
  offset: number;
  x: number;
}

export type KeySet = Map<KeyCode, Key>;

export type KeySetOffsets = Map<KeyCode, KeyOffset>;

export interface KeyStyle {
  width: number;
  height: number;
  radius: number;
  key: KeyColorStyle;
  note: KeyColorStyle;
  pressed: KeyColorStyle;
  highlight: KeyColorStyle;
  strokeWidth: number;
}

export interface KeyColorStyle {
  fill: string;
  stroke: string;
  fillAlt: string;
  strokeAlt: string;
}

export interface KeySetStyle {
  white: KeyStyle;
  black: KeyStyle;
  offsets: KeySetOffsets;
}
