import { ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { GraphicsMusicScoreNote, Hand, MusicScoreNote } from 'src/app/core/models/global';
import { CoreMusicService } from 'src/app/core/services/core-music.service';
import { toHex, CSSVar } from '../../../../core/utils/global.utils';
import { KeyboardService } from '../../../keyboard/service/keyboard.service';
import { PlayService } from '../../services/play.service';

@Component({
  selector: 'app-play-renderer',
  template: `<div style="height: 100%" #renderer></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayRendererComponent implements OnInit, OnDestroy {
  @ViewChild('renderer', { static: true })
  private rendererRef: ElementRef<HTMLDivElement>;
  private renderer: Application;
  private backgroundContainer: Container;
  private container: Container;
  private rendererOptions = { autoDensity: true, antialias: true, backgroundColor: toHex(CSSVar('background')) };

  private ticksOnScreen = 2000;
  private initialGraphicsPoolSize = 40;
  private graphicPool: GraphicsMusicScoreNote[] = [];
  private displayedNoted: GraphicsMusicScoreNote[] = [];

  private unsubscribe$: Subject<void> = new Subject();

  constructor(
    private zone: NgZone,
    private keyboardService: KeyboardService,
    private playService: PlayService,
    private coreMusicService: CoreMusicService
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

      // Handle Selected Hands on hand change
      this.playService.selectedHands$.pipe(takeUntil(this.unsubscribe$)).subscribe((hands) => {
        this.handleSelectedHands(hands);
      });

      // Update on tick
      this.coreMusicService.tick$
        .pipe(
          takeUntil(this.unsubscribe$),
          tap((tick) => {
            this.update(tick);
          })
        )
        .subscribe();
    });
  }

  private handleSelectedHands(hands: Hand[]): void {
    this.displayedNoted.forEach((note) => {
      note.container.alpha = hands.includes(note.note.hand) ? 1 : 0.5;
    });
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

    // Update select notes
    noteGraphics.container.alpha = this.playService.selectedHands$.getValue().includes(note.hand) ? 1 : 0.5;

    // Bind the note data
    noteGraphics.note = note;

    return noteGraphics;
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
