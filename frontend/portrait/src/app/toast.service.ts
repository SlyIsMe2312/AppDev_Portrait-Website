import { Injectable } from '@angular/core';

type ToastEntry = { el: HTMLElement; timer: any };

@Injectable({ providedIn: 'root' })
export class ToastService {
  // keep track of active toasts to prevent duplicates and limit stacking
  private active = new Map<string, ToastEntry>();
  private maxToasts = 5;

  show(message: string, ms = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // If a toast with same message exists, reset its timer and return
    const existing = this.active.get(message);
    if (existing) {
      clearTimeout(existing.timer);
      existing.timer = this.scheduleHide(message, existing.el, ms);
      return;
    }

    // If too many toasts, remove the oldest
    if (this.active.size >= this.maxToasts) {
      const firstKey = this.active.keys().next().value as string | undefined;
      if (firstKey) {
        const entry = this.active.get(firstKey);
        if (entry) {
          this.hideAndRemove(entry.el);
          clearTimeout(entry.timer);
          this.active.delete(firstKey);
        }
      }
    }

    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    container.appendChild(el);

    const timer = this.scheduleHide(message, el, ms);
    this.active.set(message, { el, timer });
  }

  private scheduleHide(message: string, el: HTMLElement, ms: number) {
    return setTimeout(() => {
      this.hideAndRemove(el);
      // remove from active map when transition finishes
      el.addEventListener('transitionend', () => this.active.delete(message), { once: true });
    }, ms);
  }

  private hideAndRemove(el: HTMLElement) {
    el.classList.add('hide');
    // fallback removal in case transitionend doesn't fire
    setTimeout(() => { if (el.parentElement) el.parentElement.removeChild(el); }, 500);
  }
}
