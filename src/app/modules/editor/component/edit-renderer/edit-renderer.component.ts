import { ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { fromEvent, merge, Subject, defer, Observable } from 'rxjs';
import { map, takeUntil, tap, timeoutWith, bufferCount, throttleTime, withLatestFrom, debounceTime } from 'rxjs/operators';
import { GraphicsMusicScoreNote, MusicScoreNote } from 'src/app/core/models/global';
import { CoreMusicService } from '../../../../core/services/core-music.service';
import { DataMusicService } from '../../../../core/services/data-music.service';
import { KeyStyle } from 'src/app/modules/keyboard/keyboard';
import { toHex, CSSVar } from '../../../../core/utils/global.utils';
import { KeyboardService } from '../../../keyboard/service/keyboard.service';
import { EditorService } from '../../services/editor.service';

@Component({
  selector: 'app-edit-renderer',
  template: `<div style="height: 100%" #renderer></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditRendererComponent implements OnInit, OnDestroy {
  @ViewChild('renderer', { static: true })
  private rendererRef: ElementRef<HTMLDivElement>;
  private renderer: Application;
  private container: Container;
  private backgroundContainer: Container;
  private rendererOptions = { autoDensity: true, antialias: true, backgroundColor: toHex(CSSVar('background')) };

  private ticksOnScreen = 2000;
  private initialGraphicsPoolSize = 40;
  private graphicPool: GraphicsMusicScoreNote[] = [];
  private displayedNoted: GraphicsMusicScoreNote[] = [];

  private unsubscribe$: Subject<void> = new Subject();

  constructor(
    private zone: NgZone,
    private keyboardService: KeyboardService,
    private editorService: EditorService,
    private coreMusicService: CoreMusicService,
    private dataMusicService: DataMusicService
  ) {}

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    this.renderer.destroy(true, { children: true, texture: true, baseTexture: true });
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      const rendererElt = this.rendererRef.nativeElement;

      // Init the renderer
      this.renderer = new Application(this.rendererOptions);
      this.renderer.view.style.position = 'absolute';
      this.renderer.view.style.display = 'block';
      this.renderer.renderer.resize(rendererElt.clientWidth, rendererElt.clientHeight);

      this.backgroundContainer = new Container();
      this.container = new Container();
      this.renderer.stage.addChild(this.backgroundContainer, this.container);

      // Add the renderer to the DOM
      rendererElt.appendChild(this.renderer.view);

      // Draw the background
      this.drawBackground(this.backgroundContainer);

      // Init graphical pool
      this.allocateNewGraphics(this.initialGraphicsPoolSize);

      // Handle all incoming note in the viewport
      this.coreMusicService
        .notesFromCurrent$(this.ticksOnScreen)
        .pipe(
          takeUntil(this.unsubscribe$),
          tap((notes) => {
            this.handleNewNotes(notes);
          })
        )
        .subscribe();

      // Update on tick
      this.coreMusicService.tick$
        .pipe(
          takeUntil(this.unsubscribe$),
          tap((tick) => {
            this.update(tick);
          })
        )
        .subscribe();

      // Handle scroll
      this.handleScroll();
    });
  }

  /**
   * Allow to scroll in the viewport
   */
  private handleScroll(): void {
    const TICK_RATIO = this.ticksOnScreen / this.rendererRef.nativeElement.clientHeight;

    const touch$: Observable<number[]> = fromEvent<TouchEvent>(this.rendererRef.nativeElement, 'touchmove').pipe(
      throttleTime(50),
      map((evt) => evt.touches[0].clientY),
      bufferCount(2, 1),
      timeoutWith(
        200,
        defer(() => touch$)
      )
    );

    const scroll$ = fromEvent(this.rendererRef.nativeElement, 'wheel').pipe(map(({ deltaY }: WheelEvent) => deltaY));

    merge(touch$.pipe(map(([prev, curr]) => Math.abs(curr - prev) * (curr > prev ? TICK_RATIO : -TICK_RATIO))), scroll$)
      .pipe(
        withLatestFrom(this.coreMusicService.tick$),
        tap(([offset, tick]) => {
          const newTick = tick + offset;

          if (newTick < -this.ticksOnScreen) {
            this.coreMusicService.jumpToBeginning();
          } else if (newTick <= this.coreMusicService.music$.getValue()?.details.durationInTicks) {
            this.coreMusicService.jumpTo(newTick);
          }
        }),
        debounceTime(300),
        tap(() => {
          // If to much graphics have been initialised, remove them
          if (this.graphicPool.length > this.initialGraphicsPoolSize) {
            const graphicsToRemove = this.graphicPool.length - this.initialGraphicsPoolSize;

            this.graphicPool.splice(0, graphicsToRemove - 1).forEach((graphic) => {
              graphic.container.destroy({ children: true });
            });
          }
        })
      )
      .subscribe();
  }

  private update(currentTick: number): void {
    for (let i = this.displayedNoted.length - 1; i >= 0; --i) {
      const graphicsNote = this.displayedNoted[i];

      if (currentTick > graphicsNote.note.tick + graphicsNote.note.durationInTicks) {
        this.freeGraphics(graphicsNote, i);
      } else {
        this.moveNote(graphicsNote, currentTick);
      }
    }
  }

  private drawBackground(container: Container): void {
    const height = this.rendererRef.nativeElement.clientHeight;
    const keyWidth = this.keyboardService.keyStyle.white.width;
    const idxOfFirstC = 'C'.codePointAt(0) - this.keyboardService.KEYBOARD_DETAILS.lowestNote.pitch.codePointAt(0);
    const lines = new Graphics();

    Array(this.keyboardService.KEYBOARD_DETAILS.whiteKeys)
      .fill(undefined)
      .forEach((_, idx) => {
        const isOctave = !((idx - idxOfFirstC) % 7);

        if (isOctave) {
          lines.beginFill(0x000000, 0.2);
          lines.drawRect(idx * keyWidth - 1, 0, 2, height);
        } else {
          lines.beginFill(0x000000, 0.1);
          lines.drawRect(idx * keyWidth, 0, 1, height);
        }

        lines.endFill();
      });

    container.addChild(lines);
  }

  /**
   * Update the note y position based on a tick
   */
  private moveNote(graphicsNote: GraphicsMusicScoreNote, tick: number): void {
    const height = this.rendererRef.nativeElement.clientHeight;
    graphicsNote.container.y = height - graphicsNote.container.height + ((tick - graphicsNote.note.tick) * height) / this.ticksOnScreen;
  }

  /**
   * Bind notes to graphics element and display them in the renderer
   */
  private handleNewNotes(notes: MusicScoreNote[]): void {
    notes.forEach((note) => {
      const graphics = this.bindNoteWithGraphics(note);

      this.displayedNoted.push(graphics);
      graphics.container.visible = true;
    });
  }

  /**
   * Bind a note to a Graphics element
   */
  private bindNoteWithGraphics(note: MusicScoreNote): GraphicsMusicScoreNote {
    const noteGraphics = this.getGraphics();

    // Get meta data
    const style = note.isBlack ? this.keyboardService.keyStyle.black : this.keyboardService.keyStyle.white;
    const height = (note.durationInTicks * this.rendererRef.nativeElement.clientHeight) / this.ticksOnScreen;
    const x = this.keyboardService.keyStyle.offsets.get(note.keyCode).x;

    // Update note block
    noteGraphics.block.lineStyle(2, 0xcccccc);
    noteGraphics.block.beginFill(0xffffff, 1);
    noteGraphics.block.drawRoundedRect(x, 0, style.width, height, style.radius);
    noteGraphics.block.tint = toHex(note.hand === 'LEFT' ? style.note.fillAlt : style.note.fill);
    noteGraphics.block.endFill();

    // Update note text
    noteGraphics.text.text = note.note.pitch;
    noteGraphics.text.style.fontSize = style.width * 0.6;
    noteGraphics.text.x = x + style.width / 2 - noteGraphics.text.width / 2;
    noteGraphics.text.y = height - noteGraphics.text.height;

    // Handle the hand selection
    noteGraphics.container.interactive = true;
    noteGraphics.container.cursor = 'pointer';
    noteGraphics.container.on('pointerdown', () => {
      this.selectNoteHand(noteGraphics, style);
    });

    // Bind the note data
    noteGraphics.note = note;

    return noteGraphics;
  }

  /**
   * Define the note hand
   */
  private selectNoteHand(noteGraphics: GraphicsMusicScoreNote, style: KeyStyle): void {
    const selectedHand = this.editorService.selectedHand$.getValue();

    this.dataMusicService.defineNoteHand(noteGraphics.note, selectedHand);

    noteGraphics.block.tint = toHex(selectedHand === 'LEFT' ? style.note.fillAlt : style.note.fill);
  }

  /**
   * Create an emptu graphic note and push it in the available graphics pool
   */
  private allocateNewGraphics(quantity: number = 1): void {
    for (let i = 0; i < quantity; ++i) {
      const container = new Container();

      const block = new Graphics();
      const text = new Text('', { fontFamily: 'Arial', fontWeight: 'bold', fill: ['rgba(0,0,0,0.8)'] });

      container.addChild(block, text);

      this.graphicPool.push({ container, block, text });
      container.visible = false;
      this.container.addChild(container);
    }
  }

  /**
   * Make a note invisible and available
   */
  private freeGraphics(graphicsNote: GraphicsMusicScoreNote, index: number): void {
    graphicsNote.container.visible = false;
    graphicsNote.block.clear();
    this.graphicPool.push(this.displayedNoted.splice(index, 1)[0]);
  }

  /**
   * Give a reference to an available graphics element
   */
  private getGraphics(): GraphicsMusicScoreNote {
    if (!this.graphicPool.length) {
      this.allocateNewGraphics();
    }

    return this.graphicPool.splice(0, 1)[0];
  }
}
