import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArtistService } from './artist.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { toast } from './toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="content">
      <div class="settings-card">
        <h2 class="settings-title">Profile Settings</h2>
        <p class="settings-sub">Update your profile photo, display name, password and portfolio notes.</p>

        <div *ngIf="user">
          <div class="field">
            <label>Profile Photo</label>
            <div class="field-row">
              <input #photoInput type="file" accept="image/*" (change)="onPhoto($event)" />
              <button (click)="clearPhotoInput()" class="btn">Clear</button>
            </div>
          </div>

          <div class="grid-two">
            <div class="field">
              <label>Nickname (optional)</label>
              <input type="text" [(ngModel)]="nickname" placeholder="Display name" />
            </div>
            <div class="field">
              <label>Show email publicly</label>
              <div><input type="checkbox" [(ngModel)]="showEmail" /></div>
            </div>
          </div>

          <div class="password-box">
            <h3>Change Password</h3>
            <div class="pw-grid">
              <input type="password" [(ngModel)]="oldPassword" placeholder="Old password" />
              <input type="password" [(ngModel)]="newPassword" placeholder="New password" />
              <input type="password" [(ngModel)]="confirmPassword" placeholder="Confirm new password" />
            </div>
          </div>

          <div class="field">
            <label>Bio / About (appears on your public profile)</label>
            <textarea [(ngModel)]="bio" rows="4" placeholder="Hi — tell people a bit about yourself here. Keep it short and friendly."></textarea>
          </div>

          <div *ngIf="isArtist" class="field">
            <label>Add Artwork</label>
            <div class="field-row">
              <input type="text" placeholder="Title" [(ngModel)]="artTitle" />
              <input #artInput type="file" accept="image/*" (change)="onArtworkFile($event)" />
              <button (click)="uploadArtwork()" class="btn btn-accent">Upload</button>
              <button (click)="clearArtworkInput()" class="btn">Clear</button>
            </div>
          </div>

          <div class="actions-row">
            <button (click)="saveSettings()" class="btn btn-primary">Save Settings</button>
            <button *ngIf="isArtist" (click)="saveArtistProfile()" class="btn">Save Profile</button>
            <button (click)="clearAll()" class="btn">Clear All</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-card { max-width:720px; margin:24px auto; padding:24px; border-radius:12px; border:1px solid rgba(0,0,0,0.06); background:var(--color-white); box-shadow:var(--shadow-md); }
    .settings-title { text-align:center; margin-bottom:6px; }
    .settings-sub { text-align:center; margin-bottom:16px; color:var(--color-text-light); }
    .field { margin-bottom:14px; }
    .field label { display:block; margin-bottom:8px; font-weight:600; }
    input[type="text"], input[type="password"], textarea { width:100%; padding:10px 12px; border:1px solid #E6EEF6; border-radius:8px; background:var(--color-background); }
    .field-row { display:flex; gap:8px; align-items:center; }
    .grid-two { display:grid; grid-template-columns:1fr 180px; gap:12px; align-items:center; }
    .password-box { text-align:center; padding:12px 0; }
    .pw-grid { display:flex; flex-direction:column; gap:8px; align-items:center; }
    .pw-grid input { width:100%; max-width:420px; }
    .actions-row { margin-top:18px; display:flex; gap:10px; justify-content:center; }
    @media (max-width:640px) { .grid-two { grid-template-columns: 1fr; } .profile img { width:96px;height:96px; } }
  `]
})
export class ProfileSettingsComponent {
  user: any = null;
  artistId: string | null = null;
  artTitle = '';
  artFile: File | null = null;
  nickname = '';
  showEmail = false;
  // password fields
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  bio = '';
  isArtist = false;
  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('artInput') artInput!: ElementRef<HTMLInputElement>;
  constructor(private auth: AuthService, private svc: ArtistService, private router: Router){
    this.user = this.auth.current();
    // best-effort: fetch an artist id for the current user's email by listing artists and matching email
    this.svc.listArtists().subscribe((res:any) => {
      const arr = (res || []) as any[];
      const me = this.user;
      if (!me) return;
      const found = arr.find(a => a.email && a.email.toLowerCase() === (me.email || '').toLowerCase());
      if (found) this.artistId = String(found.id);
      if (found) {
        this.isArtist = true;
        this.bio = found.bio || '';
        this.nickname = found.nickname || '';
      }
      this.showEmail = me?.showEmail || false;
      this.nickname = this.nickname || me?.nickname || '';
    });
  }

  onPhoto(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (this.artistId) {
      this.svc.uploadProfilePhoto(this.artistId, f).subscribe({
        next: () => { toast.success('Profile photo uploaded'); this.router.navigate(['/artists', this.artistId]); },
        error: (e) => { const msg = e?.error || e?.message || e?.statusText || 'Upload failed'; toast.error('Upload failed: ' + msg); }
      });
    } else {
      // upload user photo (for customers)
      this.svc.uploadUserPhoto(f).subscribe({
        next: () => { toast.success('Profile photo uploaded'); this.router.navigate(['/']); },
        error: (e) => { const msg = e?.error || e?.message || e?.statusText || 'Upload failed'; toast.error('Upload failed: ' + msg); }
      });
    }
    // clear the input after attempting upload
    try { if (this.photoInput && this.photoInput.nativeElement) this.photoInput.nativeElement.value = ''; } catch (e) {}
  }

  onArtworkFile(ev: Event) { this.artFile = (ev.target as HTMLInputElement).files?.[0] || null; }

  uploadArtwork() {
  if (!this.artistId || !this.artFile) { toast.error('Select a file and ensure you are an artist'); return; }
  this.svc.addArtwork(this.artistId, this.artTitle || '', this.artFile).subscribe({ next: () => { toast.success('Artwork uploaded'); this.router.navigate(['/artists', this.artistId]); }, error: () => toast.error('Upload failed') });
    try { if (this.artInput && this.artInput.nativeElement) this.artInput.nativeElement.value = ''; } catch (e) {}
  }

  saveSettings() {
    if (this.newPassword || this.confirmPassword) {
  if (this.newPassword !== this.confirmPassword) { toast.error('New password and confirmation do not match'); return; }
  if (!this.oldPassword) { toast.error('Old password is required to change your password'); return; }
    }
  const body: any = { nickname: this.nickname, showEmail: !!this.showEmail };
  if (this.bio !== undefined) body.bio = this.bio;
    if (this.newPassword) { body.newPassword = this.newPassword; body.oldPassword = this.oldPassword; }
  this.svc.updateUserSettings(body).subscribe({ next: () => { toast.success('Settings saved'); // clear password fields
    this.oldPassword = this.newPassword = this.confirmPassword = ''; }, error: (err) => { toast.error(err?.error || 'Failed to save settings'); } });
  }

  saveArtistProfile() {
  if (!this.artistId) return toast.error('Not an artist');
  this.svc.updateArtistProfile(this.artistId, this.nickname, this.bio).subscribe({ next: () => { toast.success('Profile updated'); this.router.navigate(['/artists', this.artistId]); }, error: () => toast.error('Failed to update profile') });
  }

  clearPhotoInput() { try { if (this.photoInput && this.photoInput.nativeElement) this.photoInput.nativeElement.value = ''; } catch(e){} }
  clearArtworkInput() { try { if (this.artInput && this.artInput.nativeElement) this.artInput.nativeElement.value = ''; } catch(e){} }
  clearAll() {
    this.nickname = '';
    this.showEmail = false;
    this.oldPassword = this.newPassword = this.confirmPassword = '';
    this.bio = '';
    this.artTitle = '';
    this.artFile = null;
    this.clearPhotoInput(); this.clearArtworkInput();
  }
}
