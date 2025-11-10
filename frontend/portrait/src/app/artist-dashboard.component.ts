import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { ArtistService } from './artist.service';
import { OrderService } from './order.service';
import { toast } from './toast.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
  <section style="padding:24px;">
      <h2>Artist Dashboard</h2>
      <p>Welcome, {{ auth.current()?.email }} (artist)</p>
      <div *ngIf="loading">Loading orders...</div>
      <div *ngIf="!loading && orders && orders.length === 0">No orders yet.</div>
      <div *ngIf="orders && orders.length > 0" class="orders-grid">
  <div class="order-card card" *ngFor="let o of orders" style="padding:12px; display:flex; gap:12px; align-items:flex-start; width:100%; margin:8px 0; box-sizing:border-box;">
          <div style="flex:0 0 240px; min-width:0">
            <div style="font-weight:600;margin-bottom:6px"><strong>#{{ o.id }}</strong> — {{ o.sizeLabel }}</div>
            <div>Price: ₱{{ o.price }}</div>
            <div style="margin-top:8px">
              <img [src]="o.processedImageUrl ? o.processedImageUrl : ('/api/orders/' + o.id + '/image')" style="width:200px;height:auto;border-radius:6px;" *ngIf="o.id" />
            </div>
          </div>

          <div style="flex:1 1 480px; min-width:480px; display:flex; flex-direction:column; align-items:center;">
            <!-- status progress bar -->
            <div style="width:100%; max-width:640px;">
              <div style="display:flex; gap:6px; align-items:center; justify-content:center;">
                <div *ngFor="let s of statusSteps; let i = index" style="flex:1;">
                  <div [style.background]="segmentColor(o,s,i)" style="height:10px; border-radius:6px;"></div>
                  <div style="font-size:11px; text-align:center; margin-top:6px; color:#444">{{ prettyLabel(s) }}</div>
                </div>
              </div>
            </div>

            <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
              <button class="btn btn-sm btn-primary" (click)="download(o)">Download</button>
              <!-- Accept/Reject should only appear for new/received orders -->
              <button *ngIf="isNew(o)" class="btn btn-sm btn-primary" (click)="setStatus(o, 'ACCEPTED')">Accept</button>
              <button *ngIf="isNew(o)" class="btn btn-sm btn-primary" (click)="confirmReject(o)">Reject</button>

              <!-- Move to In Progress after accepted -->
              <button *ngIf="o.status && o.status.toUpperCase() === 'ACCEPTED'" class="btn btn-sm btn-warning" (click)="setStatus(o, 'IN_PROGRESS')">In Progress</button>

              <label class="btn btn-sm btn-outline" title="Upload progress">
                Upload Progress <input type="file" accept="image/*" (change)="onProgressFileChange($event, o)" style="display:none" />
              </label>

              <!-- Complete only when in progress -->
              <button *ngIf="o.status && o.status.toUpperCase() === 'IN_PROGRESS'" class="btn btn-sm btn-primary" (click)="confirmComplete(o)">Complete</button>

              <!-- Awaiting payment can be set when completed (optional) -->
              <button *ngIf="o.status && o.status.toUpperCase() === 'COMPLETED' && !o.paid" class="btn btn-sm btn-info" (click)="setStatus(o, 'AWAITING_PAYMENT')">Awaiting Payment</button>
            </div>
          </div>

          <div style="flex:0 0 200px; min-width:180px; box-sizing:border-box;">
            <div>Customer: {{ o.customerName }} ({{ o.customerEmail }})</div>
            <div style="margin-top:6px">Status: <strong>{{ o.status || 'RECEIVED' }}</strong> <span *ngIf="o.paid" style="color:green">(PAID)</span></div>
            <div *ngIf="o.progressImageUrl" style="margin-top:8px">
              <div style="font-size:12px">Latest Progress:</div>
              <img [src]="o.progressImageUrl" style="max-width:200px;margin-top:6px;border-radius:6px;" />
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class ArtistDashboardComponent { 
  orders: any[] = [];
  loading = true;
  statusSteps = ['SENT','RECEIVED','ACCEPTED','IN_PROGRESS','COMPLETED','AWAITING_PAYMENT','PAID'];
  constructor(public auth: AuthService, private artistSvc: ArtistService, private ordersSvc: OrderService) {}
  ngOnInit(){
    const email = this.auth.current()?.email;
    if (!email) { this.loading = false; return; }
    // find artist by email then fetch orders
    this.artistSvc.listArtists().subscribe((res:any) => {
      const artists = res || [];
      const me = artists.find((a:any) => a.email && a.email.toLowerCase() === (email || '').toLowerCase());
      if (!me) { this.loading = false; return; }
      this.ordersSvc.listOrdersForArtist(me.id).subscribe((ords:any) => { this.orders = ords || []; this.loading = false; }, () => this.loading = false);
    }, () => this.loading = false);
  }

  download(o: any){
    this.ordersSvc.downloadOrderImage(o.id).subscribe((b:any) => {
      const blob = new Blob([b], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-${o.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }, (err:any) => toast.error('Download failed'));
  }

  setStatus(o: any, status: string){
    this.ordersSvc.updateOrderStatus(o.id, status).subscribe((res:any) => { Object.assign(o, res); toast.success('Status updated'); }, (err:any) => toast.error('Failed to update status'));
  }

  onProgressFileChange(ev: any, o: any){
    const f: File = ev.target.files && ev.target.files[0];
    if (!f) return;
    this.ordersSvc.uploadOrderProgress(o.id, f).subscribe((res:any) => { Object.assign(o, res); toast.success('Progress uploaded'); }, (err:any) => toast.error('Failed to upload progress'));
  }

  getStatusIndex(status: string | undefined) {
    if (!status) return 1; // default RECEIVED
    const s = (status || '').toUpperCase();
    if (s === 'REJECTED') return 2;
    const map: any = { SENT:0, RECEIVED:1, ACCEPTED:2, IN_PROGRESS:3, COMPLETED:4, AWAITING_PAYMENT:5, PAID:6 };
    return map[s] ?? 0;
  }

  isNew(o: any) {
    const s = (o && o.status) ? (o.status || '').toUpperCase() : 'RECEIVED';
    return s === 'SENT' || s === 'RECEIVED' || s === '' || s == null;
  }

  confirmReject(o: any) {
    if (!confirm('Reject order #' + o.id + '? This will archive the order.')) return;
    this.setStatus(o, 'REJECTED');
  }

  confirmComplete(o: any) {
    if (!confirm('Mark order #' + o.id + ' as complete?')) return;
    this.setStatus(o, 'COMPLETED');
  }

  segmentColor(o: any, step: string, idx: number) {
    const cur = this.getStatusIndex(o.status);
    // if rejected, show rejected color on accepted step
    if (o.status && o.status.toUpperCase() === 'REJECTED' && step === 'ACCEPTED') return '#dc3545';
    return idx <= cur ? '#0d6efd' : '#e9ecef';
  }

  prettyLabel(s: string) {
    if (s === 'IN_PROGRESS') return 'In Progress';
    if (s === 'AWAITING_PAYMENT') return 'Awaiting Pay';
    return s.charAt(0) + s.slice(1).toLowerCase();
  }
}
