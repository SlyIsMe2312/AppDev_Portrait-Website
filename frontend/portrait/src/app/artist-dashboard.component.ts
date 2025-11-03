import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { ArtistService } from './artist.service';
import { OrderService } from './order.service';

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
        <div class="order-card card" *ngFor="let o of orders">
          <div><strong>#{{ o.id }}</strong> — {{ o.sizeLabel }} — ₱{{ o.price }}</div>
          <div>Customer: {{ o.customerName }} ({{ o.customerEmail }})</div>
          <div>
            <img [src]="o.processedImageUrl ? o.processedImageUrl : ('/api/orders/' + o.id + '/image')" style="max-width:200px;display:block;margin-top:8px;" *ngIf="o.id" />
          </div>
        </div>
      </div>
    </section>
  `
})
export class ArtistDashboardComponent { 
  orders: any[] = [];
  loading = true;
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
}
