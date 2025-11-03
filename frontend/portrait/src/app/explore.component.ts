import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ArtistService } from './artist.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <h2>Explore Artworks</h2>

      <div class="artworks-grid" *ngIf="artworks && artworks.length > 0">
        <div class="art-tile card" *ngFor="let art of artworks">
          <img [src]="art.imagePath" alt="{{art.title}}" />
          <div class="art-info">
            <div class="art-title">{{ art.title || 'Untitled' }}</div>
            <div class="art-footer">by <a [routerLink]="['/artists', art.artistId]">{{ art.artistName }}</a></div>
          </div>
        </div>
      </div>

      <h3 style="margin-top:28px;">Artists</h3>
      <div class="artists-grid">
        <div class="artist-card card" *ngFor="let a of artists">
          <img [src]="a.profilePhotoPath || '/assets/images/default-profile.png'" alt="Profile" />
          <h3>{{ a.nickname || a.name }}</h3>
          <a [routerLink]="['/artists', a.id]" class="btn">View Profile</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .artworks-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:12px; }
    .art-tile { overflow:hidden; }
    .art-tile img { width:100%; height:220px; object-fit:cover; display:block; }
    .art-info { padding:8px; background:var(--color-white); }
    .art-title { font-weight:600; margin-bottom:6px; }
    .art-footer { font-size:12px; color:var(--color-text-light); }

    .artists-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 16px; margin-top:12px; }
    .artist-card img { width: 128px; height: 128px; object-fit: cover; border-radius: 50%; }
    .artist-card { text-align: center; padding: 16px; }
  `]
})
export class ExploreComponent implements OnInit {
  artists: any[] = [];
  artworks: any[] = [];
  constructor(private svc: ArtistService) {}
  ngOnInit(){ 
    // load artworks and display them in random order
    this.svc.listArtworks().subscribe((res:any) => {
      this.artworks = (res || []).slice();
      // shuffle
      for (let i = this.artworks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.artworks[i], this.artworks[j]] = [this.artworks[j], this.artworks[i]];
      }
    }, _ => {
      // fallback: load artists only
      this.svc.listArtists().subscribe((r:any)=> this.artists = r || []);
    });
    // also load artists for profile links if needed
    this.svc.listArtists().subscribe((res:any)=> this.artists = res || []);
  }
}
