import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', loadComponent: () => import('./landing.component').then(m => m.LandingComponent) },
	{ path: 'login', loadComponent: () => import('./login.component').then(m => m.LoginComponent) },
	{ path: 'signup', loadComponent: () => import('./signup.component').then(m => m.SignupComponent) },
		{ path: 'preview', loadComponent: () => import('./preview-page.component').then(m => m.PreviewPageComponent), canActivate: [() => import('./auth.guard').then(m => m.authGuard) ] },
		{ path: 'customer', loadComponent: () => import('./customer-dashboard.component').then(m => m.CustomerDashboardComponent), canActivate: [() => import('./auth.guard').then(m => m.authGuard) ] },
		{ path: 'artist', loadComponent: () => import('./artist-dashboard.component').then(m => m.ArtistDashboardComponent), canActivate: [() => import('./auth.guard').then(m => m.authGuard) ] }
];
