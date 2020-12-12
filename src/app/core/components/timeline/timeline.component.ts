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

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('range', { static: true }) rangeRef: ElementRef<HTMLDivElement>;
  @ViewChild('handle', { static: true }) handleRef: ElementRef<HTMLDivElement>;
  @ViewChild('minHandle', { static: true }) minHandleRef: ElementRef<HTMLDivElement>;
  @ViewChild('maxHandle', { static: true }) maxHandleRef: ElementRef<HTMLDivElement>;

  handlePosition = { x: 0, y: 0 };
  handleMinPosition = { x: 0, y: 0 };
  handleMaxPosition = { x: 0, y: 0 };
  progress$ = this.coreMusicService.percentage$.pipe(throttleTime(120));

  private range = { min: 0, max: 1 };
  private handleHalfWidth = 4;

  private unsubscribe$ = new Subject<void>();

  constructor(private coreMusicService: CoreMusicService, private changeDetector: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    // Move the handle on each progress update
    this.progress$
      .pipe(
        takeUntil(this.unsubscribe$),
        tap((progress) => {
          const width = this.rangeRef.nativeElement.getBoundingClientRect().width * progress;
          this.handlePosition = { x: width, y: this.handlePosition.y };
          this.changeDetector.detectChanges();

          // Handle range jump
          if (progress >= this.range.max) {
            this.coreMusicService.jumpToPercentage(this.range.min);
            this.coreMusicService.start();
          }
        })
      )
      .subscribe();
  }

  ngAfterViewInit(): void {
    const rangeWidth = this.rangeRef.nativeElement.getBoundingClientRect().width;

    // Set the range position to the min and max value
    this.handleMinPosition.x = rangeWidth * this.range.min - this.handleHalfWidth;
    this.handleMaxPosition.x = rangeWidth * this.range.max - this.handleHalfWidth;
  }

  /**
   * Manage the manual handle move
   */
  handlePositionMove(evt: CdkDragEnd) {
    const range = this.rangeRef.nativeElement.getBoundingClientRect();
    const xPosition = this.handlePosition.x + evt.distance.x;
    const percentage = xPosition / range.width;

    const clampPercentage = percentage < this.range.min || percentage > this.range.max ? this.range.min : percentage;
    this.coreMusicService.jumpToPercentage(clampPercentage);
  }

  /**
   * Manage the manual minimum range handle move
   */
  handleMinPositionMove(evt: CdkDragEnd) {
    const range = this.rangeRef.nativeElement.getBoundingClientRect();
    const xPosition = this.handleMinPosition.x + evt.distance.x;
    const percentage = xPosition / range.width;

    this.handleMinPosition.x = xPosition;
    this.range.min = percentage < 0 ? 0 : percentage > this.range.max ? this.range.max : percentage;

    // Change the current position if the min handle is greater than the current position
    if (this.handlePosition.x < this.handleMinPosition.x) {
      this.handlePosition.x = this.handleMinPosition.x;
      this.coreMusicService.jumpToPercentage(this.range.min);
    }
  }

  /**
   * Manage the manual maximum range handle move
   */
  handleMaxPositionMove(evt: CdkDragEnd) {
    const range = this.rangeRef.nativeElement.getBoundingClientRect();
    const xPosition = this.handleMaxPosition.x + evt.distance.x;
    const percentage = xPosition / range.width;

    this.handleMaxPosition.x = xPosition;
    this.range.max = percentage < this.range.min ? this.range.min : percentage > 1 ? 1 : percentage;

    // Change the current position if the max handle is lower than the current position
    if (this.handlePosition.x > this.handleMaxPosition.x) {
      this.handlePosition.x = this.handleMinPosition.x;
      this.coreMusicService.jumpToPercentage(this.range.min);
    }
  }
}
