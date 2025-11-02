import { Component } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  template: `
    <section style="padding:24px;">
      <h2>Artist Dashboard</h2>
      <p>Welcome, {{ auth.current()?.email }} (artist)</p>
      <p>Here you will see orders assigned to you (coming soon)</p>
    </section>
  `
})
export class ArtistDashboardComponent { constructor(public auth: AuthService) {} }
