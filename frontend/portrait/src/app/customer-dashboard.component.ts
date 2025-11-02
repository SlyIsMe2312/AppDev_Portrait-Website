import { Component } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  template: `
    <section style="padding:24px;">
      <h2>Customer Dashboard</h2>
      <p>Welcome, {{ auth.current()?.email }}</p>
      <p>Here you will see your orders (coming soon)</p>
    </section>
  `,
  imports: []
})
export class CustomerDashboardComponent { constructor(public auth: AuthService) {} }
