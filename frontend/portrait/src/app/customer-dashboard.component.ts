import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './auth.service';
import { OrderService } from './order.service';

@Component({
  standalone: true,
  template: `
    <section style="padding:24px;">
      <h2>My Orders</h2>
      <p>Welcome, {{ auth.current()?.email }}</p>
      <div *ngIf="loading">Loading orders...</div>
      <div *ngIf="!loading && orders && orders.length === 0">You have no orders yet.</div>
      <div *ngIf="orders && orders.length > 0" class="orders-grid">
        <div class="order-card card" *ngFor="let o of orders">
          <div><strong>#{{ o.id }}</strong> — {{ o.sizeLabel }} — ₱{{ o.price }}</div>
          <div>Artist: <a [routerLink]="['/artists', o.artistId]">View</a></div>
          <div>Customer: {{ o.customerName }} ({{ o.customerEmail }})</div>
          <div>
            <img [src]="o.processedImageUrl ? o.processedImageUrl : ('/api/orders/' + o.id + '/image')" style="max-width:200px;display:block;margin-top:8px;" *ngIf="o.id" />
          </div>
        </div>
      </div>
    </section>
  `,
  imports: [CommonModule, RouterModule]
})
export class CustomerDashboardComponent { 
  orders: any[] = [];
  loading = true;
  constructor(public auth: AuthService, private ordersSvc: OrderService) {}
  ngOnInit(){
    const email = this.auth.current()?.email;
    this.ordersSvc.listOrdersForCustomer(email).subscribe((res:any)=>{ this.orders = res || []; this.loading = false; }, ()=> this.loading = false);
  }
}
