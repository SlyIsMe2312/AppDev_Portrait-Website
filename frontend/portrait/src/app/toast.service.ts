export class ToastService {
  private containerId = 'app-toasts-container';

  private ensureContainer() {
    let c = document.getElementById(this.containerId);
    if (!c) {
      c = document.createElement('div');
      c.id = this.containerId;
      c.style.position = 'fixed';
      c.style.right = '16px';
      c.style.top = '16px';
      c.style.zIndex = '12000';
      c.style.display = 'flex';
      c.style.flexDirection = 'column';
      c.style.gap = '8px';
      document.body.appendChild(c);
    }
    return c;
  }

  show(message: string, type: 'info'|'success'|'error' = 'info', duration = 3000) {
    const c = this.ensureContainer();
    const t = document.createElement('div');
    t.textContent = message;
    t.style.padding = '8px 12px';
    t.style.borderRadius = '6px';
    t.style.color = '#fff';
    t.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    t.style.maxWidth = '320px';
    t.style.fontSize = '13px';
    t.style.opacity = '0';
    t.style.transition = 'opacity 160ms ease, transform 160ms ease';
    t.style.transform = 'translateY(-6px)';
    if (type === 'success') t.style.background = '#28a745';
    else if (type === 'error') t.style.background = '#dc3545';
    else t.style.background = '#007bff';
    c.appendChild(t);
    // force reflow
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = t.clientHeight;
    t.style.opacity = '1';
    t.style.transform = 'translateY(0)';
    const tm = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(-6px)';
      setTimeout(() => { try { c.removeChild(t); } catch (e) { /* ignore */ } }, 180);
    }, duration);
    // allow manual dismiss on click
    t.addEventListener('click', () => { clearTimeout(tm); t.style.opacity = '0'; setTimeout(() => { try { c.removeChild(t); } catch (e) {} }, 180); });
  }

  success(msg: string, duration = 3000) { this.show(msg, 'success', duration); }
  error(msg: string, duration = 4000) { this.show(msg, 'error', duration); }
  info(msg: string, duration = 3000) { this.show(msg, 'info', duration); }
}

// convenience singleton
export const toast = new ToastService();

