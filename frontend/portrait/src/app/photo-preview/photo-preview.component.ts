import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Frame = { id: string; name: string; overlayUrl: string; aspectRatio?: number; basePrice?: number };

@Component({
  selector: 'app-photo-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './photo-preview.component.html',
  styleUrls: ['./photo-preview.component.css']
})
export class PhotoPreviewComponent implements OnChanges {
  @Input() artists: { id: string; name: string }[] = [];
  @Input() frames: Frame[] = [];
  @Output() readyForUpload = new EventEmitter<FormData>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput', { static: true }) fileInputRef!: ElementRef<HTMLInputElement>;

  selectedArtistId?: string;
  selectedFrame?: Frame;
  selectedFrameId?: string;
  size = 'medium';
  image = new Image();
  overlayImage = new Image();
  // transform state
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  isPanning = false;
  lastPanX = 0;
  lastPanY = 0;

  onPointerDown(e: PointerEvent) {
    this.isPanning = true;
    this.lastPanX = e.clientX;
    this.lastPanY = e.clientY;
    try { (e.target as Element).setPointerCapture(e.pointerId); } catch (err) {}
  }

  onPointerMove(e: PointerEvent) {
    if (!this.isPanning) return;
    this.offsetX += (e.clientX - this.lastPanX);
    this.offsetY += (e.clientY - this.lastPanY);
    this.lastPanX = e.clientX;
    this.lastPanY = e.clientY;
    this.draw();
  }

  onPointerUp(_e: PointerEvent) {
    this.isPanning = false;
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.image = new Image();
    this.image.onload = () => {
      this.draw();
    };
    this.image.src = url;
    // reset transforms
    this.scale = 1; this.offsetX = 0; this.offsetY = 0;
  }

  onFrameChange(frameId: string|undefined) {
    this.selectedFrameId = frameId;
    this.selectedFrame = this.frames.find(f => f.id === frameId as any);
    if (this.selectedFrame) {
      this.overlayImage = new Image();
      this.overlayImage.crossOrigin = 'anonymous';
      this.overlayImage.onload = () => {
        // Reset transforms when changing frame
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.draw();
      };
      this.overlayImage.src = this.selectedFrame.overlayUrl;
    } else {
      this.overlayImage = new Image();
      this.draw();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['frames'] && this.frames && this.frames.length > 0) {
      // default to first frame if none selected
      if (!this.selectedFrame && !this.selectedFrameId) {
        const f = this.frames[0];
        this.selectedFrame = f;
        this.selectedFrameId = f.id;
        this.overlayImage = new Image();
        this.overlayImage.crossOrigin = 'anonymous';
        this.overlayImage.onload = () => this.draw();
        this.overlayImage.src = f.overlayUrl;
      } else if (this.selectedFrameId && !this.selectedFrame) {
        // if an id is present but object not set, try to resolve it
        const f = this.frames.find(x => x.id === this.selectedFrameId);
        if (f) {
          this.selectedFrame = f;
          this.overlayImage = new Image();
          this.overlayImage.crossOrigin = 'anonymous';
          this.overlayImage.onload = () => this.draw();
          this.overlayImage.src = f.overlayUrl;
        }
      }
    }
    if (changes['artists'] && this.artists && this.artists.length > 0) {
      if (!this.selectedArtistId) this.selectedArtistId = this.artists[0].id;
    }
  }

  getPrice(): number {
    if (!this.selectedFrame || !this.selectedFrame.basePrice) return 0;
    const base = Number(this.selectedFrame.basePrice) || 0;
    let mult = 1.0;
    if (this.size === 'small') mult = 1.0;
    else if (this.size === 'medium') mult = 1.5;
    else if (this.size === 'large') mult = 2.0;
    return Math.round(base * mult * 100) / 100;
  }

  draw() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    if (!this.image.width) return;
    
  // Set canvas size based on selected frame aspect ratio (fallback 4:3)
  const containerWidth = canvas.parentElement?.clientWidth || 800;
  const aspect = this.selectedFrame?.aspectRatio || (4/3);
  const containerHeight = Math.round(containerWidth / aspect);
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const ox = off.getContext('2d')!;

    // Clear the canvas
    ox.clearRect(0, 0, off.width, off.height);
    ox.fillStyle = '#F7FAFC';
    ox.fillRect(0, 0, off.width, off.height);

    // Calculate fit scale (fit the image inside canvas) and apply user scale
    const fitScale = Math.min(canvas.width / this.image.width, canvas.height / this.image.height);
    const drawScale = fitScale * this.scale;

    // apply pan/zoom when drawing source into offscreen; draw the image centered
    ox.save();
    ox.translate(canvas.width / 2 + this.offsetX, canvas.height / 2 + this.offsetY);
    ox.scale(drawScale, drawScale);
    // draw the image centered at translated origin
    ox.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
    ox.restore();

    const id = ox.getImageData(0, 0, off.width, off.height);
    const px = id.data;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const gray = 0.21 * r + 0.72 * g + 0.07 * b;
      px[i] = px[i + 1] = px[i + 2] = gray;
    }
    ox.putImageData(id, 0, 0);

    const sobel = this.sobelFilter(ox, off.width, off.height);

    ctx.fillStyle = '#f7f2ea';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(sobel, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    if (this.overlayImage && this.overlayImage.complete) {
      ctx.drawImage(this.overlayImage, 0, 0, canvas.width, canvas.height);
    }
  }

  sobelFilter(ctxSource: CanvasRenderingContext2D, w: number, h: number): HTMLCanvasElement {
    const src = ctxSource.getImageData(0, 0, w, h);
    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = w;
    dstCanvas.height = h;
    const dstCtx = dstCanvas.getContext('2d')!;
    const dst = dstCtx.createImageData(w, h);

    const gx = [-1,0,1,-2,0,2,-1,0,1];
    const gy = [1,2,1,0,0,0,-1,-2,-1];

    for (let y = 1; y < h-1; y++) {
      for (let x = 1; x < w-1; x++) {
        let sumX = 0, sumY = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = ((y+ky)*w + (x+kx)) * 4;
            const val = src.data[px];
            const idx = (ky+1)*3 + (kx+1);
            sumX += gx[idx] * val;
            sumY += gy[idx] * val;
          }
        }
        const mag = Math.min(255, Math.sqrt(sumX*sumX + sumY*sumY));
        const di = (y*w + x) * 4;
        dst.data[di] = dst.data[di+1] = dst.data[di+2] = 255 - mag;
        dst.data[di+3] = 255;
      }
    }
    dstCtx.putImageData(dst, 0, 0);
    return dstCanvas;
  }

  exportPreview() {
    // create a final canvas applying transforms at natural resolution
    const canvas = document.createElement('canvas');
    const w = this.image.width; const h = this.image.height;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f7f2ea'; ctx.fillRect(0,0,w,h);
    ctx.save();
    ctx.translate(this.offsetX * (w / this.canvasRef.nativeElement.width), this.offsetY * (h / this.canvasRef.nativeElement.height));
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(this.image, 0, 0, w, h);
    ctx.restore();
    if (this.overlayImage && this.overlayImage.complete) ctx.drawImage(this.overlayImage, 0, 0, w, h);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const fd = new FormData();
      fd.append('image', blob, 'preview.png');
      if (this.selectedArtistId) fd.append('artistId', this.selectedArtistId);
      if (this.selectedFrame) fd.append('frameId', this.selectedFrame.id);
      fd.append('size', String(this.size));
      fd.append('price', String(this.getPrice()));
      this.readyForUpload.emit(fd);
    }, 'image/png');
  }

  clear() {
    this.fileInputRef.nativeElement.value = '';
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
