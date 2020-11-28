import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Hand } from 'src/app/core/models/global';

import { defaultHand } from 'src/app/core/services/midi-loader.service';

@Injectable({
  providedIn: 'root',
})
export class EditorService {
  selectedHand$ = new BehaviorSubject<Hand>(defaultHand);

  public toggleHand(hand: Hand = this.selectedHand$.getValue() === 'RIGHT' ? 'LEFT' : 'RIGHT'): void {
    this.selectedHand$.next(hand);
  }
}
