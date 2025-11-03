import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storageKey = 'portrait_auth';
  private http = inject(HttpClient);

  signup(name: string, email: string, password: string, role?: string) {
    const body: any = { name, email, password };
    if (role) body.role = role;
    return this.http.post('/api/auth/signup', body);
  }

  login(email: string, password: string) {
    return this.http.post('/api/auth/login', { email, password });
  }

  setToken(token: string, role: string, email?: string) {
    localStorage.setItem(this.storageKey, JSON.stringify({ token, role, email }));
  }

  logout() { localStorage.removeItem(this.storageKey); }

  current() {
    const s = localStorage.getItem(this.storageKey);
    return s ? JSON.parse(s) : null;
  }

  isAuthenticated() { return !!this.current(); }
  token() { const c = this.current(); return c ? c.token : null; }
}
