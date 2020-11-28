import { KeyCode } from 'src/app/modules/keyboard/keyboard';
import { Pitch } from 'src/app/core/models/global';
import webmidi from 'webmidi';

/**
 * All pitchs of an octave
 */
export const OCTAVE: Pitch[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Guess the MIDI code corresponding to the pictch and the octave
 */
export const guessKeyCode = (pitch: Pitch, octave: number): KeyCode => webmidi.guessNoteNumber(pitch + octave);

/**
 * Return of a note is black or white
 */
export const isBlack = (pitch: Pitch) => pitch[pitch.length - 1] === '#';
