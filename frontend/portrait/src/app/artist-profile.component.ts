import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ArtistService } from './artist.service';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="content">
      <div *ngIf="artist">
        <div class="profile">
          <div class="profile-info">
            <img [src]="artist.profilePhotoPath || '/assets/images/default-profile.png'" alt="Profile" />
            <div class="meta">
              <h2>{{ displayName || artist.name }}</h2>
              <p *ngIf="showEmail">{{ artist.email }}</p>
              <p class="bio" *ngIf="artist.bio">{{ artist.bio }}</p>
            </div>
          </div>
          <div class="profile-actions" *ngIf="isOwner">
            <a routerLink="/profile/settings" class="btn btn-accent edit-btn">Edit Profile</a>
          </div>
        </div>

        <h3>Portfolio</h3>
        <div class="portfolio-grid">
          <div class="art-card card" *ngFor="let art of artworks">
            <img [src]="art.imagePath" alt="Artwork" />
            <div class="art-title">{{ art.title }}</div>
          </div>
        </div>
        
        <h3 style="margin-top:20px">Archived Transactions</h3>
        <div *ngIf="archivedOrders && archivedOrders.length === 0" style="color:var(--color-text-light)">No archived transactions.</div>
        <div *ngIf="archivedOrders && archivedOrders.length > 0" class="archived-list" style="margin-top:12px">
          <div class="card" *ngFor="let a of archivedOrders" style="padding:10px; margin-bottom:8px; display:flex; gap:12px; align-items:center; justify-content:space-between;">
            <div style="flex:1">
              <div><strong>#{{ a.id }}</strong> — {{ a.customerName }} ({{ a.customerEmail }})</div>
              <div style="color:var(--color-text-light); font-size:13px">Status: {{ a.status }} • Price: ₱{{ a.price }}</div>
            </div>
            <div style="white-space:nowrap; color:var(--color-text-light); font-size:13px">{{ a.createdAt | date:'short' }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile { display:flex; gap:16px; align-items:center; justify-content:space-between; }
    .profile-info { display:flex; gap:16px; align-items:center; }
    .profile img { width:128px; height:128px; border-radius:50%; object-fit:cover; }
    .meta h2 { margin:0 0 6px 0; }
    .meta p { margin:0; color:var(--color-text-light); }
    .bio { margin-top:8px; max-width:640px; color:var(--color-text); }
    .profile-actions { margin-left:auto; }
    .edit-btn { min-width:120px; }
    .portfolio-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:12px; margin-top:18px; }
    .art-card img { width:100%; height:160px; object-fit:cover; }
  `]
})
export class ArtistProfileComponent implements OnInit {
  artist: any = null;
  artworks: any[] = [];
  archivedOrders: any[] = [];
  isOwner = false;
  displayName: string | null = null;
  showEmail = false;
  constructor(private route: ActivatedRoute, private svc: ArtistService, private auth: AuthService) {}
  ngOnInit(){
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getArtist(id).subscribe((res:any) => {
      this.artist = res.artist;
      this.artworks = res.artworks || [];
      this.displayName = res.displayName || null;
      this.showEmail = !!res.showEmail;
      const cur = this.auth.current();
      // ownership check: compare logged-in user's email with artist.email
      this.isOwner = !!(cur && cur.role === 'artist' && cur.email && this.artist && this.artist.email && cur.email.toLowerCase() === this.artist.email.toLowerCase());
      // fetch archived transactions for this artist (simple list)
      this.svc.listArchivedOrders(id).subscribe((ords:any) => {
        this.archivedOrders = (ords || []).map((o: any) => ({
          id: o.id,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          price: o.price,
          status: o.status,
          createdAt: o.createdAt
        }));
      }, () => { /* ignore errors */ });
    });
  }
}
