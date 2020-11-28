import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, NEVER, Observable, pipe, Subject, timer, UnaryFunction } from 'rxjs';
import {
  distinctUntilChanged,
  first,
  map,
  pluck,
  scan,
  share,
  shareReplay,
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { MusicScore, MusicScoreNote } from './../models/global';
import { MidiLoaderService } from './midi-loader.service';

interface TickerState {
  tick: number;
  speed: number;
  optimalStartTick: number;
  startingTickAdjustment: number;
  isTicking: boolean;
  tickDuration: number;
  clockRefreshRate: number;
  tickUpdatedAt: number;
  lastEmittedNoteIndexes: { [delay: number]: number };
}

@Injectable({
  providedIn: 'root',
})
// Manage Music State Data
export class CoreMusicService {
  private readonly DEFAULT_STATE: TickerState = {
    tick: 0,
    speed: 1,
    optimalStartTick: 0,
    startingTickAdjustment: 0,
    isTicking: false,
    tickDuration: 1,
    clockRefreshRate: 16,
    tickUpdatedAt: null,
    lastEmittedNoteIndexes: {},
  };

  private readonly SECONDS_BEFORE_FIRST_NOTES = 3;

  private commands$ = new Subject<Partial<TickerState>>();

  /**
   * Ticker state
   */
  private state$ = this.commands$.pipe(
    startWith(this.DEFAULT_STATE),
    scan((state: TickerState, command) => ({ ...state, ...command })),
    shareReplay(1)
  );

  private jump$ = new Subject<void>();
  private clockRefreshRate$: Observable<number> = this.state$.pipe(this.queryChange('clockRefreshRate'));
  isTicking$: Observable<number> = this.state$.pipe(this.queryChange('isTicking'));

  /**
   * Ticker clock
   */
  private clock$ = combineLatest([this.isTicking$, this.clockRefreshRate$]).pipe(
    switchMap(([isTicking, clockRefreshRate]) => (isTicking ? timer(0, clockRefreshRate) : NEVER)),
    startWith(0)
  );

  /**
   * Music data
   */
  music$ = new BehaviorSubject<MusicScore>(null);

  /**
   * Emit at all music tick
   */
  tick$ = combineLatest([
    this.jump$.pipe(startWith(0)),
    this.clock$,
    this.music$.pipe(
      tap((music) => {
        const tickDuration = music?.details.duration / music?.details.durationInTicks;
        const startingTickAdjustment = -(this.SECONDS_BEFORE_FIRST_NOTES / tickDuration);
        const optimalStartTick = music?.notes?.[0]?.tick + startingTickAdjustment;

        this.commands$.next({ ...this.DEFAULT_STATE, tickDuration, optimalStartTick, startingTickAdjustment });
      })
    ),
  ]).pipe(
    withLatestFrom(this.state$, (_, { tickUpdatedAt, tick, tickDuration, speed }) => ({ tickUpdatedAt, tick, tickDuration, speed })),
    tap(({ tickUpdatedAt, tick, tickDuration, speed }) => {
      const now = Date.now();
      const elapsed = (now - (tickUpdatedAt ?? now) * speed) / 1000;
      const elapsedTick = elapsed / tickDuration;

      this.commands$.next({ tick: tick + elapsedTick, tickUpdatedAt: now });
    }),
    pluck('tick'),
    shareReplay(1)
  ) as Observable<number>;

  /**
   * Percentage of the musics between 0 and 1
   */
  percentage$ = combineLatest([this.tick$, this.music$]).pipe(map(([tick, music]) => tick / music?.details.durationInTicks));

  /**
   * Emit all notes that pass tick + delay
   */
  notesFromCurrent$(delay: number): Observable<MusicScoreNote[]> {
    return combineLatest([this.tick$, this.music$]).pipe(
      withLatestFrom(this.state$, ([tick, music], { lastEmittedNoteIndexes }) => ({ tick, music, lastEmittedNoteIndexes })),
      map(({ tick, music, lastEmittedNoteIndexes }) => {
        const notes = [];
        let lastEmittedNoteIndex = lastEmittedNoteIndexes[delay] ?? 0;

        while (music?.notes[lastEmittedNoteIndex]?.tick <= tick + delay) {
          notes.push(music.notes[lastEmittedNoteIndex]);
          lastEmittedNoteIndex++;
        }

        this.commands$.next({
          lastEmittedNoteIndexes: {
            ...lastEmittedNoteIndexes,
            [delay]: lastEmittedNoteIndex,
          },
        });

        return notes;
      }),
      distinctUntilChanged((notesBefore, notesAfter) => JSON.stringify(notesBefore) === JSON.stringify(notesAfter)),
      share(),
    );
  }

  currentNotes$ = this.notesFromCurrent$(0);

  constructor(private musicLoader: MidiLoaderService) {}

  /**
   * The the midi object as the current music score
   */
  load(music: MusicScore): void {
    this.music$.next(music);
  }

  /**
   * Load a midi file as current music score file
   */
  async loadFromMidi(file: File) {
    const music = await this.musicLoader.loadMidiFromFile(file);
    this.load(music);
  }

  /**
   * Start the music
   */
  start() {
    this.commands$.next({ isTicking: true });
  }

  /**
   * Stop the music
   */
  stop() {
    this.commands$.next({ isTicking: false, tickUpdatedAt: null });
  }

  /**
   * Switch to start/stop, if the toggle is known toggle to this value
   */
  toggle(toggle?: boolean) {
    const startOrStop = (value: boolean) => (value ? this.start() : this.stop());

    if (toggle !== undefined) {
      startOrStop(toggle);
    } else {
      this.isTicking$
        .pipe(
          first(),
          tap((isTicking) => {
            startOrStop(!isTicking);
          })
        )
        .subscribe();
    }
  }

  /**
   * Set the music speed
   */
  setSpeed(speed: number) {
    this.commands$.next({ speed });
  }

  /**
   * Jump to a tick
   * And set the last emitted note index
   */
  jumpTo(tick: number) {
    this.state$
      .pipe(
        first(),
        tap(({ lastEmittedNoteIndexes }) => {
          // Note consider the delay to rerender note on the screen
          const index = this.music$.getValue()?.notes.findIndex((note) => note.tick + note.durationInTicks >= tick);

          Object.entries(lastEmittedNoteIndexes).forEach(([delay, _]) => {
            lastEmittedNoteIndexes[delay] = index;
          });

          this.commands$.next({ tick, lastEmittedNoteIndexes });
          this.jump$.next();
          this.stop();
        })
      )
      .subscribe();
  }

  /**
   * Jump to the computed beginning
   */
  jumpToBeginning() {
    this.state$
      .pipe(
        first(),
        tap((state) => {
          this.jumpTo(state.optimalStartTick);
        })
      )
      .subscribe();
  }

  /**
   * Jump to a percentage in the music
   */
  jumpToPercentage(percentage: number) {
    this.state$
      .pipe(
        first(),
        tap(({ startingTickAdjustment }) => {
          this.jumpTo((this.music$.getValue()?.details.durationInTicks - startingTickAdjustment) * percentage);
        })
      )
      .subscribe();
  }

  /**
   * Return a sub-value of an observable only when the value change
   */
  private queryChange<T, I>(key: string): UnaryFunction<Observable<T>, Observable<I>> {
    return pipe(pluck<T, I>(key), distinctUntilChanged<I>());
  }
}
