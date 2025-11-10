import { Component, OnInit } from '@angular/core';
import { PhotoPreviewComponent } from './photo-preview/photo-preview.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { OrderService } from './order.service';
import { toast } from './toast.service';
import { HttpClient } from '@angular/common/http';


@Component({
  standalone: true,
  imports: [CommonModule, PhotoPreviewComponent],
  template: `
  <div class="content">
      <header class="page-header">
        <h2>Create Your Portrait Preview</h2>
        <p>Upload your photo, choose a frame, and adjust the preview to your liking.</p>
      </header>
      
      <div *ngIf="!auth.isAuthenticated()" class="guest-banner" style="background:#fff4e5;border:1px solid #ffd8a8;padding:12px;margin-bottom:12px;border-radius:6px;">
        <strong>Heads up:</strong> you can preview images without an account, but uploading and submitting a preview requires an account. <a routerLink="/signup">Sign up</a> or <a routerLink="/login">Log in</a> to enable uploads.
      </div>

      <app-photo-preview 
        [artists]="artists"
        [frames]="frames"
        [canUpload]="true"
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

  constructor(private order: OrderService, private http: HttpClient, public auth: AuthService) {}

  ngOnInit(): void {
    this.http.get<any[]>('/api/artists').subscribe({
      next: a => this.artists = (a || []).map(x => ({ id: String(x.id), name: x.name })),
      error: _ => toast.show('Failed to load artists')
    });

    this.http.get<any[]>('/api/frames').subscribe({
      next: f => this.frames = (f || []).map(x => ({ id: String(x.id), name: x.name, overlayUrl: x.overlayPath, aspectRatio: x.aspectRatio, basePrice: x.basePrice })),
      error: _ => toast.show('Failed to load frames')
    });
  }

  onPreview(fd: FormData) {
    this.loading = true;
    // attach customer info if available
    const cur = this.auth.current();
    if (cur && cur.email) {
      fd.append('customerEmail', cur.email);
      fd.append('customerName', cur.email);
    }
    this.order.submitOrder(fd).subscribe({
      next: res => { this.loading = false; toast.show('Order created #' + (res.id ?? '')); },
      error: err => { this.loading = false; toast.show('Failed to create order'); }
    });
  }
}
