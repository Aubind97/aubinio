import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyboardComponent } from './components/keyboard/keyboard.component';

@NgModule({
  declarations: [KeyboardComponent],
  exports: [KeyboardComponent],
  imports: [CommonModule],
})
export class KeyboardModule {}
