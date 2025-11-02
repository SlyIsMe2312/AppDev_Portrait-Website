import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-header">
        <h2>Create Account</h2>
        <p>Join Portrait Studio and start creating beautiful portraits</p>
      </div>
      
      <form class="auth-form" (submit)="onSubmit($event)" #f="ngForm">
        <div class="form-group">
          <label>Full Name</label>
          <input 
            name="name" 
            [(ngModel)]="name" 
            required 
            placeholder="Enter your full name"
          />
        </div>

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
            placeholder="Choose a password"
          />
        </div>

        <button type="submit" [disabled]="loading">
          <ng-container *ngIf="!loading">Create Account</ng-container>
          <div *ngIf="loading" class="spinner"></div>
        </button>
      </form>

      <div class="auth-footer">
        Already have an account? <a routerLink="/login">Sign In</a>
      </div>
    </div>
  `
})
export class SignupComponent {
  loading = false;
  name = '';
  email = '';
  password = '';
  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}
  onSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const name = data.get('name') as string;
    const email = data.get('email') as string;
    const password = data.get('password') as string;
    if (!name || !email || !password) { this.toast.show('All fields required'); return; }
    this.loading = true;
    this.auth.signup(name, email, password).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.auth.setToken(res.token, res.role);
        this.toast.show('Account created successfully');
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.loading = false;
        this.toast.show(err.error || 'Signup failed. Please try again.');
      }
    });
  }
}
