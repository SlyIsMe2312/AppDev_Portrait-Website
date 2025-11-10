import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'progress-modal',
  template: `
    <div class="pm-overlay" (click)="close.emit()">
      <div class="pm-card" (click)="$event.stopPropagation()">
        <div class="pm-body">
          <img *ngIf="imageUrl" [src]="imageUrl" alt="Progress image" />
          <div *ngIf="!imageUrl">No progress image available.</div>
        </div>
        <div class="pm-actions">
          <button class="btn btn-primary" (click)="close.emit()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `:host { position: fixed; left:0; top:0; right:0; bottom:0; z-index:10000; }
    .pm-overlay{ position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; }
    .pm-card{ background:#fff; padding:12px; border-radius:6px; max-width:90%; max-height:90%; overflow:auto; }
    .pm-body img{ max-width:100%; max-height:70vh; display:block; }
    .pm-actions{ margin-top:8px; text-align:right; }
    `
  ]
})
export class ProgressModalComponent {
  @Input() imageUrl: string | null = null;
  @Output() close = new EventEmitter<void>();
}
