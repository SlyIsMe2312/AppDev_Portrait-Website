import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArtistService } from './artist.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="settings-card" style="max-width:520px;margin:24px auto;padding:24px;border-radius:8px;border:1px solid var(--color-border);background:var(--color-white);">
        <h2 style="text-align:center;margin-bottom:8px;">Profile Settings</h2>
        <p style="text-align:center;margin-bottom:16px;color:var(--color-text-light);">Update your profile photo, display name, password and portfolio notes.</p>

        <div *ngIf="user">
          <div class="field" style="margin-bottom:12px;">
            <label>Profile Photo</label>
            <input #photoInput type="file" accept="image/*" (change)="onPhoto($event)" />
            <button (click)="clearPhotoInput()" class="btn" style="margin-left:8px;">Clear</button>
          </div>

          <div style="display:flex;flex-direction:column;gap:12px;align-items:center;">
            <div style="width:100%">
              <label>Nickname (optional)</label>
              <input type="text" [(ngModel)]="nickname" placeholder="Display name" />
            </div>

            <div style="width:100%">
              <label>Show email publicly</label>
              <input type="checkbox" [(ngModel)]="showEmail" />
            </div>

            <div style="width:100%;text-align:center;padding:8px 0;">
              <h3 style="margin:0 0 8px;">Change Password</h3>
              <div style="display:flex;flex-direction:column;gap:8px;align-items:center;">
                <input type="password" [(ngModel)]="oldPassword" placeholder="Old password" style="width:100%;max-width:360px;" />
                <input type="password" [(ngModel)]="newPassword" placeholder="New password" style="width:100%;max-width:360px;" />
                <input type="password" [(ngModel)]="confirmPassword" placeholder="Confirm new password" style="width:100%;max-width:360px;" />
              </div>
            </div>
          </div>

          <div class="field" style="margin-top:12px;">
            <label>Bio / About (appears on your public profile)</label>
            <textarea [(ngModel)]="bio" rows="4" style="width:100%;" placeholder="Hi — tell people a bit about yourself here. Keep it short and friendly."></textarea>
          </div>

          <div *ngIf="isArtist" class="field" style="margin-top:12px;">
            <label>Add Artwork</label>
            <input type="text" placeholder="Title" [(ngModel)]="artTitle" />
            <input #artInput type="file" accept="image/*" (change)="onArtworkFile($event)" />
            <button (click)="uploadArtwork()" class="btn btn-accent">Upload</button>
            <button (click)="clearArtworkInput()" class="btn" style="margin-left:8px;">Clear</button>
          </div>

          <div style="margin-top:16px; display:flex; gap:8px; justify-content:center;">
            <button (click)="saveSettings()" class="btn btn-primary">Save Settings</button>
            <button *ngIf="isArtist" (click)="saveArtistProfile()" class="btn">Save Profile</button>
            <button (click)="clearAll()" class="btn">Clear All</button>
          </div>
        </div>
      </div>
    </div>
  `
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
        next: () => { alert('Profile photo uploaded'); this.router.navigate(['/artists', this.artistId]); },
        error: (e) => { const msg = e?.error || e?.message || e?.statusText || 'Upload failed'; alert('Upload failed: ' + msg); }
      });
    } else {
      // upload user photo (for customers)
      this.svc.uploadUserPhoto(f).subscribe({
        next: () => { alert('Profile photo uploaded'); this.router.navigate(['/']); },
        error: (e) => { const msg = e?.error || e?.message || e?.statusText || 'Upload failed'; alert('Upload failed: ' + msg); }
      });
    }
    // clear the input after attempting upload
    try { if (this.photoInput && this.photoInput.nativeElement) this.photoInput.nativeElement.value = ''; } catch (e) {}
  }

  onArtworkFile(ev: Event) { this.artFile = (ev.target as HTMLInputElement).files?.[0] || null; }

  uploadArtwork() {
    if (!this.artistId || !this.artFile) { alert('Select a file and ensure you are an artist'); return; }
    this.svc.addArtwork(this.artistId, this.artTitle || '', this.artFile).subscribe({ next: () => { alert('Artwork uploaded'); this.router.navigate(['/artists', this.artistId]); }, error: () => alert('Upload failed') });
    try { if (this.artInput && this.artInput.nativeElement) this.artInput.nativeElement.value = ''; } catch (e) {}
  }

  saveSettings() {
    if (this.newPassword || this.confirmPassword) {
      if (this.newPassword !== this.confirmPassword) { alert('New password and confirmation do not match'); return; }
      if (!this.oldPassword) { alert('Old password is required to change your password'); return; }
    }
  const body: any = { nickname: this.nickname, showEmail: !!this.showEmail };
  if (this.bio !== undefined) body.bio = this.bio;
    if (this.newPassword) { body.newPassword = this.newPassword; body.oldPassword = this.oldPassword; }
    this.svc.updateUserSettings(body).subscribe({ next: () => { alert('Settings saved'); // clear password fields
        this.oldPassword = this.newPassword = this.confirmPassword = ''; }, error: (err) => { alert(err?.error || 'Failed to save settings'); } });
  }

  saveArtistProfile() {
    if (!this.artistId) return alert('Not an artist');
    this.svc.updateArtistProfile(this.artistId, this.nickname, this.bio).subscribe({ next: () => { alert('Profile updated'); this.router.navigate(['/artists', this.artistId]); }, error: () => alert('Failed to update profile') });
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
