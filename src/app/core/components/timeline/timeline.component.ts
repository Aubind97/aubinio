import { CdkDragEnd } from '@angular/cdk/drag-drop';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, tap, throttleTime } from 'rxjs/operators';
import { CoreMusicService } from '../../services/core-music.service';
import { CSSVar } from '../../utils/global.utils';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('progress', { static: true }) barRef: ElementRef<HTMLCanvasElement>;
  @ViewChild('handle', { static: true }) handleRef: ElementRef<HTMLDivElement>;
  @ViewChild('range', { static: true }) rangeRef: ElementRef<HTMLDivElement>;

  handlePosition = { x: 0, y: 0 };

  private context: CanvasRenderingContext2D;
  private style: { backgroundColor: string; foregroundColor: string };

  private unsubscribe$ = new Subject<void>();

  constructor(private coreMusicService: CoreMusicService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.context = this.barRef.nativeElement.getContext('2d');
    this.loadStyle();

    this.coreMusicService.percentage$
      .pipe(
        takeUntil(this.unsubscribe$),
        throttleTime(200),
        tap((percentage) => {
          this.render(percentage);
        })
      )
      .subscribe();
  }

  ngAfterViewInit(): void {
    this.fitToParent(this.barRef.nativeElement);
    this.render(0);
  }

  /**
   * Manage the manual handle move
   */
  handlePositionMove(evt: CdkDragEnd) {
    const range = this.rangeRef.nativeElement.getBoundingClientRect();
    const percentage = (this.handlePosition.x + evt.distance.x) / range.width;
    const clampedPercentage = percentage < 0 ? 0 : percentage > 1 ? 1 : percentage;

    this.coreMusicService.jumpToPercentage(clampedPercentage);
  }

  /**
   * Render the timeline
   */
  private render(percentage: number) {
    this.drawBackground();
    this.updateProgress(percentage);
  }

  /**
   * Draw the progresstion of the music
   */
  private updateProgress(percentage: number): void {
    const width = this.barRef.nativeElement.clientWidth * percentage;

    this.context.save();

    this.context.fillStyle = this.style.foregroundColor;
    this.context.fillRect(0, 0, width, this.barRef.nativeElement.clientHeight);

    this.context.restore();

    this.handlePosition = { x: width - 4, y: this.handlePosition.y };
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Draw the background
   */
  private drawBackground(): void {
    this.context.save();

    this.context.fillStyle = this.style.backgroundColor;
    this.context.fillRect(0, 0, this.barRef.nativeElement.clientWidth, this.barRef.nativeElement.clientHeight);

    this.context.restore();
  }

  /**
   * Load a style from css varibles
   */
  private loadStyle(): void {
    this.style = {
      backgroundColor: CSSVar('background'),
      foregroundColor: CSSVar('accent'),
    };
  }

  /**
   * Resize a canvas to his parent size
   */
  private fitToParent(canvas: HTMLCanvasElement): void {
    const parentElt = canvas.parentElement;

    canvas.height = parentElt.clientHeight;
    canvas.width = parentElt.clientWidth;
  }
}
