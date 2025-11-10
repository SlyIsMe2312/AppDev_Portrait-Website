import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
  <div class="content">
        <h1>Transform Your Photos into Timeless Portrait Art</h1>
        <p>Upload your photo and our talented artists will create a stunning portrait sketch that captures the essence of your memories.</p>
        <div class="hero-actions">
          <a routerLink="/preview" class="btn btn-accent">Create Your Portrait</a>
          <a [routerLink]="['/signup']" [queryParams]="{ role: 'artist' }" class="btn btn-primary">Join as Artist</a>
        </div>
      </div>
    </section>

    <section class="features">
  <div class="content">
        <h2>How It Works</h2>
        <div class="features-grid">
          <div class="feature-card card">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <h3>Upload Your Photo</h3>
            <p>Choose your favorite photo to be transformed into a beautiful portrait sketch.</p>
          </div>

          <div class="feature-card card">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0 1 12 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 0 0-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 0 1 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"/>
              <circle cx="6.5" cy="11.5" r="1.5"/>
              <circle cx="9.5" cy="7.5" r="1.5"/>
              <circle cx="14.5" cy="7.5" r="1.5"/>
              <circle cx="17.5" cy="11.5" r="1.5"/>
            </svg>
            <h3>Choose Your Style</h3>
            <p>Select from various frame styles and sizes to complement your portrait perfectly.</p>
          </div>

          <div class="feature-card card">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
              <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <h3>Review & Order</h3>
            <p>Preview your portrait, make any adjustments, and place your order securely.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="cta">
  <div class="content">
        <div class="card" style="text-align: center; padding: 48px;">
          <h2>Ready to Create Your Portrait?</h2>
          <p>Join thousands of satisfied customers who have transformed their photos into lasting memories.</p>
          <a [routerLink]="['/signup']" class="btn btn-accent" style="margin-top: 24px;">Get Started Now</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero { text-align: center; padding: 80px 0; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%); color: var(--color-white); }
    .hero h1 { font-size: 48px; margin-bottom: 24px; max-width: 800px; margin-left: auto; margin-right: auto; }
    .hero p { font-size: 20px; max-width: 600px; margin: 0 auto 32px; opacity: 0.9; }
    .hero-actions { display: flex; gap: 16px; justify-content: center; }
    .features { padding: 80px 0; }
    .features h2 { text-align: center; margin-bottom: 48px; color: var(--color-primary); }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; }
    .feature-card { text-align: center; transition: transform 0.2s; }
    .feature-card:hover { transform: translateY(-4px); }
    .feature-card svg { width: 48px; height: 48px; margin-bottom: 24px; fill: var(--color-accent); }
    .feature-card h3 { color: var(--color-primary); margin-bottom: 16px; }
    .cta { padding: 80px 0; background: var(--color-background); }
  `]
})
export class LandingComponent {
  constructor(public auth: AuthService) {}
}
