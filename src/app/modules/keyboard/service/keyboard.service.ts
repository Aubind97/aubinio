import { Injectable } from '@angular/core';
import { Key, KeyboardEvent, KeyboardDetails, KeyCode, KeySet, KeySetOffsets, KeySetStyle } from '../keyboard';
import webmidi, { Input, InputEventNoteon, InputEventNoteoff } from 'webmidi';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Pitch } from 'src/app/core/models/global';
import { guessKeyCode, OCTAVE, isBlack } from 'src/app/core/utils/music.utils';
import { CSSVar } from 'src/app/core/utils/global.utils';
import { filter, map, scan, shareReplay, startWith, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class KeyboardService {
  readonly KEYBOARD_DETAILS: KeyboardDetails = {
    octavesAvailable: 9,
    lowestNote: { pitch: 'A', octave: 0 },
    highestNote: { pitch: 'C', octave: 8 },
    whiteKeys: 52,
    blackKeys: 36,
  };

  // Default windows keuboard
  private windowSize = {
    width: window.innerWidth,
    height: (() => {
      const keyboardHeight = CSSVar('keyboard-height');
      return (+keyboardHeight.substr(0, keyboardHeight.length - 2) / 100) * window.innerHeight;
    })(),
  };

  private keyboardInput = new BehaviorSubject<Input>(null);
  private keyboardEvent = new Subject<KeyboardEvent>();

  keySet: KeySet = null;
  keyStyle: KeySetStyle = null;

  keyTrigger$ = this.keyboardEvent.asObservable();
  isKeyboardConnected$ = this.keyboardInput.asObservable().pipe(map((input) => !!input));

  currentKeyPressed$ = this.keyTrigger$.pipe(
    scan((currentPressedKeys, keyTriggered) => {
      if (keyTriggered.type === 'noteon') {
        currentPressedKeys.push(keyTriggered.code);
      } else {
        currentPressedKeys.splice(
          currentPressedKeys.findIndex((keyCode) => keyCode === keyTriggered.code),
          1
        );
      }
      return currentPressedKeys;
    }, []),
    startWith([]),
    shareReplay(1)
  ) as Observable<number[]>;

  constructor() {
    this.buildKeySet(this.KEYBOARD_DETAILS);
    this.detectAndListen();
    this.resizeFor(this.windowSize.width, this.windowSize.height);
  }

  /**
   * Compute style of the keyboard to fit the container size
   */
  async resizeFor(containerWidth: number, containerHeight: number): Promise<void> {
    const keyWidth = containerWidth / this.KEYBOARD_DETAILS.whiteKeys;

    const offsets = await this.computeOffsets(containerWidth);

    const color = {
      primary: CSSVar('primary'),
      primaryAlt: CSSVar('primary-alt'),
      accent: CSSVar('accent'),
      accentAlt: CSSVar('accent-alt'),
    };

    this.keyStyle = {
      white: {
        width: keyWidth,
        height: containerHeight,
        radius: 4,
        strokeWidth: 2,
        key: { fill: '#FFFFFF', stroke: '#CCCCCC', fillAlt: '#FFFFFF', strokeAlt: '#CCCCCC' },
        note: { fill: color.primary, stroke: color.primaryAlt, fillAlt: color.accent, strokeAlt: color.accentAlt },
        pressed: {
          fill: color.primary,
          stroke: color.primaryAlt,
          fillAlt: color.accent,
          strokeAlt: color.accentAlt,
        },
        highlight: { fill: '#FFFFFF', stroke: '#CCCCCC', fillAlt: '#FFFFFF', strokeAlt: '#CCCCCC' },
      },
      black: {
        width: keyWidth / 2,
        height: containerHeight * 0.6,
        radius: 4,
        strokeWidth: 2,
        key: { fill: '#010101', stroke: '#000000', fillAlt: '#010101', strokeAlt: '#000000' },
        note: { fill: color.primary, stroke: color.primaryAlt, fillAlt: color.accent, strokeAlt: color.accentAlt },
        pressed: {
          fill: color.primary,
          stroke: color.primaryAlt,
          fillAlt: color.accent,
          strokeAlt: color.accentAlt,
        },
        highlight: { fill: '#010101', stroke: '#000000', fillAlt: '#010101', strokeAlt: '#000000' },
      },
      offsets,
    };
  }

  startListening(): void {
    this.listenInputEvent();
  }

  stopListening(): void {
    this.keyboardInput.getValue()?.removeListener();
  }

  /**
   * Wait for a noteon event on the selected keyboard to selecte
   */
  private detectAndListen(): void {
    webmidi.enable((err) => {
      if (err) {
        return console.error(`🛑 ${err}`);
      }

      webmidi.addListener('connected', (evt) => {
        if (!this.keyboardInput.getValue()) {
          const connectedInput = webmidi.getInputById(evt.port.id);

          if (connectedInput) {
            this.keyboardInput.next(connectedInput);
            this.startListening();
          }
        }
      });

      webmidi.addListener('disconnected', (evt) => {
        if (this.keyboardInput.getValue()?.id === evt.port.id) {
          this.keyboardInput.next(null);
        }
      });
    });
  }

  /**
   * Listen to keyboard event
   */
  private listenInputEvent(): void {
    this.keyboardInput.getValue()?.on('noteon', 'all', this.trigger.bind(this));
    this.keyboardInput.getValue()?.on('noteoff', 'all', this.trigger.bind(this));
  }

  /**
   * Emit a keyboard event
   */
  private trigger(note: InputEventNoteon | InputEventNoteoff): void {
    this.keyboardEvent.next({
      code: note.note.number,
      type: note.type,
      isBlack: this.keySet.get(note.note.number).isBlack,
    });
  }

  /**
   * Build the keyset from the keyboard configuration
   */
  private async buildKeySet({ lowestNote, highestNote, octavesAvailable }: KeyboardDetails): Promise<void> {
    const keySet: KeySet = new Map();

    const lowestNoteCode: KeyCode = guessKeyCode(lowestNote.pitch, lowestNote.octave);
    const highestNoteCode: KeyCode = guessKeyCode(highestNote.pitch, highestNote.octave);

    // Generate all octaves
    for (let i = 0; i < octavesAvailable; ++i) {
      OCTAVE.forEach((pitch: Pitch): void => {
        const code: KeyCode = guessKeyCode(pitch, i);

        if (code >= lowestNoteCode && code <= highestNoteCode) {
          keySet.set(code, {
            pitch,
            code,
            octave: i,
            isBlack: isBlack(pitch),
          });
        }
      });
    }

    this.keySet = keySet;
  }

  /**
   * Compute all keys offsets
   */
  private async computeOffsets(containerWidth: number): Promise<KeySetOffsets> {
    const whiteKeyWidth = containerWidth / this.KEYBOARD_DETAILS.whiteKeys;
    const offsets: KeySetOffsets = new Map();

    let offset = 0;
    let lastWasBlack = false;
    this.keySet.forEach((key: Key) => {
      offset += key.isBlack || lastWasBlack ? 0.5 : 1;

      offsets.set(key.code, {
        offset: offset - 1,
        x: whiteKeyWidth * (offset - 1) + (key.isBlack ? whiteKeyWidth / 4 : 0),
      });

      lastWasBlack = key.isBlack;
    });

    return offsets;
  }
}
