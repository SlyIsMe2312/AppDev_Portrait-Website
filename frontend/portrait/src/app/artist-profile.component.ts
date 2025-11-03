import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ArtistService } from './artist.service';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <div *ngIf="artist">
        <div class="profile">
          <img [src]="artist.profilePhotoPath || '/assets/images/default-profile.png'" alt="Profile" />
          <h2>{{ displayName || artist.name }}</h2>
          <p *ngIf="showEmail">{{ artist.email }}</p>
          <div *ngIf="isOwner">
            <a routerLink="/profile/settings" class="btn btn-accent">Edit Profile</a>
          </div>
        </div>

        <h3>Portfolio</h3>
        <div class="portfolio-grid">
          <div class="art-card card" *ngFor="let art of artworks">
            <img [src]="art.imagePath" alt="Artwork" />
            <div class="art-title">{{ art.title }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile { display:flex; gap:16px; align-items:center; }
    .profile img { width:128px; height:128px; border-radius:50%; object-fit:cover; }
    .portfolio-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:12px; }
    .art-card img { width:100%; height:160px; object-fit:cover; }
  `]
})
export class ArtistProfileComponent implements OnInit {
  artist: any = null;
  artworks: any[] = [];
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
    });
  }
}
