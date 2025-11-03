import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="container">
        <div class="nav-left">
          <a routerLink="/" class="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8c0 4.41-3.59 8-8 8zm-1-11c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm6 0c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/>
            </svg>
            <span>Portrait Studio</span>
          </a>
        </div>

        <div class="nav-center">
          <a [routerLink]="homeLink()" routerLinkActive="active" class="nav-link">Home</a>
          <a routerLink="/preview" routerLinkActive="active" class="nav-link">New Portrait</a>
          <a routerLink="/explore" routerLinkActive="active" class="nav-link">Explore</a>
        </div>

        <div class="nav-right">
          <ng-container *ngIf="!auth.isAuthenticated()">
            <a routerLink="/login" routerLinkActive="active" class="nav-link">Login</a>
            <a routerLink="/signup" routerLinkActive="active" class="btn btn-accent">Sign up</a>
          </ng-container>

          <ng-container *ngIf="auth.isAuthenticated()">
            <ng-container *ngIf="auth.current()?.role === 'customer'">
              <a routerLink="/customer" routerLinkActive="active" class="nav-link">My Orders</a>
            </ng-container>
            <ng-container *ngIf="auth.current()?.role === 'artist'">
              <a routerLink="/artist" routerLinkActive="active" class="nav-link">Artist Dashboard</a>
            </ng-container>
            <a routerLink="/profile/settings" class="nav-link">Settings</a>
            <button class="btn btn-primary" (click)="logout()">Logout</button>
          </ng-container>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
  homeLink() {
    if (!this.auth.isAuthenticated()) return '/';
    const c = this.auth.current();
    if (!c) return '/';
    if (c.role === 'artist') return '/artist';
    if (c.role === 'customer') return '/customer';
    return '/';
  }
  logout(){ this.auth.logout(); location.href = '/'; }
}
