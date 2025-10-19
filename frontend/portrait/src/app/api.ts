import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = '/api';
  constructor(private http: HttpClient) {}
  hello() {
    return this.http.get<string>(`${this.baseUrl}/hello`);
  }
}
