import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { CoreMusicService } from 'src/app/core/services/core-music.service';
import { CSSVar } from 'src/app/core/utils/global.utils';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.sass'],
})
export class TimelineComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('bar', { static: true }) barRef: ElementRef<HTMLCanvasElement>;

  private context: CanvasRenderingContext2D;
  private style: { backgroundColor: string; foregroundColor: string };

  private unsubscribe$ = new Subject<void>();

  constructor(private coreMusicService: CoreMusicService) {}
  /**
   * Update the cursor position and the music status
   */
  @HostListener('click', ['$event'])
  public goTo(evt: any): void {
    const percentage = (evt.clientX - evt.target.getBoundingClientRect().x) / evt.target.getBoundingClientRect().width;
    this.coreMusicService.jumpToPercentage(percentage);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit(): void {
    this.fitToParent(this.barRef.nativeElement);
    this.drawBackground();
  }

  ngOnInit(): void {
    this.context = (this.barRef.nativeElement as HTMLCanvasElement).getContext('2d');
    this.loadStyle();
    this.coreMusicService.percentage$
      .pipe(
        takeUntil(this.unsubscribe$),
        tap((percentage) => {
          this.render(percentage);
        })
      )
      .subscribe();
  }

  private render(percentage: number): void {
    this.drawBackground();
    this.drawProgressBar(this.barRef.nativeElement.clientWidth * percentage);
  }

  /**
   * Draw the progresstion of the music
   */
  private drawProgressBar(width: number): void {
    this.context.save();

    this.context.fillStyle = this.style.foregroundColor;
    this.context.fillRect(0, 0, width, this.barRef.nativeElement.clientHeight);

    this.context.restore();
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
   * Load the style
   */
  private loadStyle(): void {
    this.style = {
      backgroundColor: CSSVar('background'),
      foregroundColor: CSSVar('primary'),
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
