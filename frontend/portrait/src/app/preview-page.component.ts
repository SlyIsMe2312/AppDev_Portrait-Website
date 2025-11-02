import { Component, OnInit } from '@angular/core';
import { PhotoPreviewComponent } from './photo-preview/photo-preview.component';
import { OrderService } from './order.service';
import { ToastService } from './toast.service';
import { HttpClient } from '@angular/common/http';


@Component({
  standalone: true,
  imports: [PhotoPreviewComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <h2>Create Your Portrait Preview</h2>
        <p>Upload your photo, choose a frame, and adjust the preview to your liking.</p>
      </header>
      
      <app-photo-preview 
        [artists]="artists"
        [frames]="frames"
        (readyForUpload)="onPreview($event)"
        [class.loading]="loading">
      </app-photo-preview>
    </div>
  `,
  styles: [`
    .page-header {
      text-align: center;
      margin-bottom: 32px;
      padding: 48px 0;
    }
    .page-header h2 {
      font-size: 32px;
      color: var(--color-primary);
      margin-bottom: 16px;
    }
    .page-header p {
      color: var(--color-text-light);
      font-size: 18px;
    }
    .loading {
      opacity: 0.7;
      pointer-events: none;
    }
  `]
})
export class PreviewPageComponent implements OnInit {
  loading = false;
  artists: { id: string; name: string }[] = [];
  frames: any[] = [];

  constructor(private order: OrderService, private toast: ToastService, private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>('/api/artists').subscribe({
      next: a => this.artists = (a || []).map(x => ({ id: String(x.id), name: x.name })),
      error: _ => this.toast.show('Failed to load artists')
    });

    this.http.get<any[]>('/api/frames').subscribe({
      next: f => this.frames = (f || []).map(x => ({ id: String(x.id), name: x.name, overlayUrl: x.overlayPath, aspectRatio: x.aspectRatio, basePrice: x.basePrice })),
      error: _ => this.toast.show('Failed to load frames')
    });
  }

  onPreview(fd: FormData) {
    this.loading = true;
    this.order.submitOrder(fd).subscribe({
      next: res => { this.loading = false; this.toast.show('Order created #' + (res.id ?? '')); },
      error: err => { this.loading = false; this.toast.show('Failed to create order'); }
    });
  }
}
