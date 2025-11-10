import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ArtistService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  listArtists() { return this.http.get('/api/artists'); }
  getArtist(id: string | number) { return this.http.get(`/api/artists/${id}`); }
  
  // fetch all artworks (enriched with artist name)
  listArtworks() { return this.http.get('/api/artworks'); }

  uploadProfilePhoto(artistId: string|number, file: File) {
    const fd = new FormData(); fd.append('photo', file);
    return this.http.post(`/api/artists/${artistId}/photo`, fd, { headers: this.authHeader() });
  }

  addArtwork(artistId: string|number, title: string, file: File) {
    const fd = new FormData(); fd.append('image', file); fd.append('title', title || '');
    return this.http.post(`/api/artists/${artistId}/artworks`, fd, { headers: this.authHeader() });
  }

  updateArtistProfile(artistId: string|number, nickname?: string, bio?: string) {
    const fd = new FormData();
    if (nickname !== undefined) fd.append('nickname', nickname);
    if (bio !== undefined) fd.append('bio', bio);
    return this.http.post(`/api/artists/${artistId}/profile`, fd, { headers: this.authHeader() });
  }

  // user-level
  uploadUserPhoto(file: File) {
    const fd = new FormData(); fd.append('photo', file);
    return this.http.post(`/api/user/photo`, fd, { headers: this.authHeader() });
  }

  // archived orders for an artist (no images expected)
  listArchivedOrders(artistId: string|number) {
    return this.http.get(`/api/artists/${artistId}/orders/archived`);
  }

  updateUserSettings(body: any) {
    return this.http.post(`/api/user/settings`, body, { headers: this.authHeader() });
  }

  private authHeader() {
    const token = this.auth.token();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined as any;
  }
}
