import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  http = inject(HttpClient);
  base = '/api';
  auth = inject(AuthService);

  submitOrder(fd: FormData): Observable<any> {
    const token = this.auth.token();
    const headers = token ? new HttpHeaders({ Authorization: 'Bearer ' + token }) : undefined;
    return this.http.post(this.base + '/orders', fd, { headers });
  }
}
