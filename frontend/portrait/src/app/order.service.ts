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

  listOrdersForArtist(artistId: string|number) {
    return this.http.get(this.base + `/artists/${artistId}/orders`);
  }

  listOrdersForCustomer(email?: string) {
    const url = this.base + '/user/orders' + (email ? ('?email=' + encodeURIComponent(email)) : '');
    return this.http.get(url, { headers: this.auth.token() ? new HttpHeaders({ Authorization: 'Bearer ' + this.auth.token() }) : undefined as any });
  }
}
