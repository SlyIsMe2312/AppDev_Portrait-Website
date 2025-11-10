import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './auth.service';
import { OrderService } from './order.service';
import { ProgressModalComponent } from './progress-modal.component';
import { toast } from './toast.service';

@Component({
  standalone: true,
  template: `
  <section style="padding:24px;">
      <h2>My Orders</h2>
      <p>Welcome, {{ auth.current()?.email }}</p>
      <div *ngIf="loading">Loading orders...</div>
      <div *ngIf="!loading && orders && orders.length === 0">You have no orders yet.</div>
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
            <div style="width:100%; max-width:640px;">
              <div style="display:flex; gap:6px; align-items:center; justify-content:center;">
                <div *ngFor="let s of statusSteps; let i = index" style="flex:1;">
                  <div [style.background]="segmentColor(o,s,i)" style="height:10px; border-radius:6px;"></div>
                  <div style="font-size:11px; text-align:center; margin-top:6px; color:#444">{{ prettyLabel(s) }}</div>
                </div>
              </div>
            </div>

            <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
              <button class="btn btn-sm btn-primary" *ngIf="o.progressImageUrl" (click)="openProgress(o)">View Progress</button>
              <!-- Pay button uses accent color to stand out from primary/download -->
              <button class="btn btn-sm btn-accent" *ngIf="!o.paid" (click)="pay(o)">Pay</button>
              <!-- Download intentionally hidden for customers in the list view -->
            </div>
          </div>

          <div style="flex:0 0 200px; min-width:180px; box-sizing:border-box;">
            <div>Artist: <a [routerLink]="['/artists', o.artistId]">View</a></div>
            <div style="margin-top:6px">Status: <strong>{{ o.status || 'RECEIVED' }}</strong> <span *ngIf="o.paid" style="color:green">(PAID)</span></div>
            <div *ngIf="o.progressImageUrl" style="margin-top:8px">
              <div style="font-size:12px">Latest Progress:</div>
              <img [src]="o.progressImageUrl" style="max-width:200px;margin-top:6px;border-radius:6px;" />
            </div>
          </div>
        </div>
      </div>
      <progress-modal *ngIf="showProgressModal" [imageUrl]="selectedProgressUrl" (close)="closeModal()"></progress-modal>
    </section>
  `,
  imports: [CommonModule, RouterModule, ProgressModalComponent]
})
export class CustomerDashboardComponent { 
  orders: any[] = [];
  loading = true;
  showProgressModal = false;
  selectedProgressUrl: string | null = null;
  statusSteps = ['SENT','RECEIVED','ACCEPTED','IN_PROGRESS','COMPLETED','AWAITING_PAYMENT','PAID'];
  constructor(public auth: AuthService, private ordersSvc: OrderService) {}
  ngOnInit(){
    const email = this.auth.current()?.email;
    this.ordersSvc.listOrdersForCustomer(email).subscribe((res:any)=>{ this.orders = res || []; this.loading = false; }, ()=> this.loading = false);
  }

  openProgress(o: any){
    this.selectedProgressUrl = o.progressImageUrl || null;
    this.showProgressModal = true;
  }

  closeModal(){ this.showProgressModal = false; this.selectedProgressUrl = null; }

  pay(o: any){
    if (!confirm('Simulate payment for order #' + o.id + '?')) return;
    this.ordersSvc.payOrder(o.id).subscribe((res:any)=>{ Object.assign(o, (res && res.order) ? res.order : res); toast.success('Payment simulated'); }, ()=> toast.error('Payment failed'));
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

  getStatusIndex(status: string | undefined) {
    if (!status) return 1; // default RECEIVED
    const s = (status || '').toUpperCase();
    if (s === 'REJECTED') return 2;
    const map: any = { SENT:0, RECEIVED:1, ACCEPTED:2, IN_PROGRESS:3, COMPLETED:4, AWAITING_PAYMENT:5, PAID:6 };
    return map[s] ?? 0;
  }

  segmentColor(o: any, step: string, idx: number) {
    const cur = this.getStatusIndex(o.status);
    if (o.status && o.status.toUpperCase() === 'REJECTED' && step === 'ACCEPTED') return '#dc3545';
    return idx <= cur ? '#0d6efd' : '#e9ecef';
  }

  prettyLabel(s: string) {
    if (s === 'IN_PROGRESS') return 'In Progress';
    if (s === 'AWAITING_PAYMENT') return 'Awaiting Pay';
    return s.charAt(0) + s.slice(1).toLowerCase();
  }
}
