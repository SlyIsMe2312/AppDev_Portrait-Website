import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { toast } from './toast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-header">
        <h2>Welcome Back</h2>
        <p>Sign in to continue to Portrait Studio</p>
      </div>
      
      <form class="auth-form" (submit)="onSubmit($event)" #f="ngForm">
        <div class="form-group">
          <label>Email Address</label>
          <input 
            name="email" 
            type="email" 
            [(ngModel)]="email" 
            required 
            placeholder="Enter your email"
          />
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <input 
            name="password" 
            type="password" 
            [(ngModel)]="password" 
            required 
            placeholder="Enter your password"
          />
        </div>

        <button type="submit" [disabled]="loading">
          <ng-container *ngIf="!loading">Sign In</ng-container>
          <div *ngIf="loading" class="spinner"></div>
        </button>
      </form>

      <div class="auth-footer">
        Don't have an account? <a routerLink="/signup">Create Account</a>
      </div>
    </div>
  `
})
export class LoginComponent {
  loading = false;
  email = '';
  password = '';
  constructor(private auth: AuthService, private router: Router) {}
  onSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const email = data.get('email') as string;
    const password = data.get('password') as string;
  if (!email || !password) { toast.show('Email and password required'); return; }
    this.loading = true;
    this.auth.login(email, password).subscribe({
      next: (res: any) => {
        this.loading = false;
  this.auth.setToken(res.token, res.role, email);
        toast.show('Logged in successfully');
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.loading = false;
        toast.show(err.error || 'Login failed. Please check your credentials.');
      }
    });
  }
}
