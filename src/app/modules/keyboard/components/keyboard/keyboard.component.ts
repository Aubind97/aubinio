import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KeyboardEvent, KeyOffset, KeySet, KeySetStyle, KeyStyle } from '../../keyboard';
import { KeyboardService } from '../../service/keyboard.service';

@Component({
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyboardComponent implements OnInit, OnDestroy {
  @ViewChild('blackKeys', { static: true }) whiteKeysRef: ElementRef;
  @ViewChild('whiteKeys', { static: true }) blackKeysRef: ElementRef;

  private whiteKeysContext: CanvasRenderingContext2D;
  private blackKeysContext: CanvasRenderingContext2D;

  private unsubscribe$ = new Subject<void>();

  constructor(public keyboardService: KeyboardService, private changeDetector: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.keyboardService.stopListening();

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.loadContext();

    // Fit the keyboard laryes to the parent element
    this.fitToParent([this.whiteKeysRef.nativeElement, this.blackKeysRef.nativeElement]);

    // Draw the keyboard
    this.drawKeyboard(this.keyboardService.keySet, this.keyboardService.keyStyle);

    // Toggle a change detection on each keyboard connection to read the template observable
    this.keyboardService.isKeyboardConnected$.pipe(takeUntil(this.unsubscribe$)).subscribe((_) => {
      this.changeDetector.detectChanges();
    });

    // Listen at key updates
    this.keyboardService.keyTrigger$.pipe(takeUntil(this.unsubscribe$)).subscribe(this.handleKeyTriggered.bind(this));

    // Start keyboard Listening
    this.keyboardService.startListening();
  }

  /**
   * Load and save the layers contexts once
   */
  private loadContext() {
    this.whiteKeysContext = (this.whiteKeysRef.nativeElement as HTMLCanvasElement).getContext('2d');
    this.blackKeysContext = (this.blackKeysRef.nativeElement as HTMLCanvasElement).getContext('2d');
  }

  /**
   *  Resize an array of canvas to his parent size
   */
  private fitToParent(canvass: HTMLCanvasElement[]): void {
    canvass.forEach((canvas) => {
      const parentElt = canvas.parentElement;

      canvas.height = parentElt.clientHeight;
      canvas.width = parentElt.clientWidth;
    });
  }

  /**
   * Update the kayboard UI when an event is triggered
   */
  private handleKeyTriggered({ code, type, isBlack }: KeyboardEvent): void {
    const style = this.keyboardService.keyStyle;

    if (type === 'noteon') {
      if (isBlack) {
        this.drawPressedKey(this.blackKeysContext, style.offsets.get(code), style.black);
      } else {
        this.drawPressedKey(this.whiteKeysContext, style.offsets.get(code), style.white);
      }
    } else {
      if (isBlack) {
        this.drawKey(this.blackKeysContext, style.offsets.get(code), style.black);
      } else {
        this.drawKey(this.whiteKeysContext, style.offsets.get(code), style.white);
      }
    }
  }

  /**
   * Draw the hole keybaord on a graphic context
   */
  private drawKeyboard(keySet: KeySet, style: KeySetStyle): void {
    keySet.forEach((key) => {
      if (key.isBlack) {
        this.drawKey(this.blackKeysContext, style.offsets.get(key.code), style.black);
      } else {
        this.drawKey(this.whiteKeysContext, style.offsets.get(key.code), style.white);
      }
    });
  }

  /**
   * Draw a key on a graphic context
   */
  private drawKey(context: CanvasRenderingContext2D, offset: KeyOffset, style: KeyStyle): void {
    context.save();

    context.strokeStyle = style.key.stroke;
    context.fillStyle = style.key.fill;

    context.beginPath();
    context.moveTo(offset.x + style.radius, 0);
    context.lineTo(offset.x + style.width, 0);
    context.arcTo(offset.x + style.width, 0 + style.height, offset.x, style.height, style.radius);
    context.arcTo(offset.x, style.height, offset.x, 0, style.radius);
    context.lineTo(offset.x, 0);
    context.closePath();

    context.fill();
    context.stroke();

    context.restore();
  }

  /**
   * Draw a pressed key on a graphic context
   */
  private drawPressedKey(context: CanvasRenderingContext2D, offset: KeyOffset, style: KeyStyle): void {
    context.save();

    context.strokeStyle = style.pressed.stroke;
    context.fillStyle = style.pressed.fill;

    context.beginPath();
    context.moveTo(offset.x + style.radius, 0);
    context.lineTo(offset.x + style.width, 0);
    context.arcTo(offset.x + style.width, 0 + style.height, offset.x, style.height, style.radius);
    context.arcTo(offset.x, style.height, offset.x, 0, style.radius);
    context.lineTo(offset.x, 0);
    context.closePath();

    context.fill();
    context.stroke();

    context.restore();
  }
}
