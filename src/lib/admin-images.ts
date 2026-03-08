/**
 * Admin image overrides: load from Firestore, apply to main images;
 * when admin, click to replace and upload via Netlify function.
 */
import { getImageOverrides } from './firebase';

const ADMIN_PASSWORD =
  (typeof import.meta.env.PUBLIC_ADMIN_PASSWORD === 'string' && import.meta.env.PUBLIC_ADMIN_PASSWORD) ||
  'surfdelmar';
const UPLOAD_URL = '/.netlify/functions/upload-image';
const REVERT_URL = '/.netlify/functions/revert-image-override';

declare global {
  interface Window {
    showAdminToast?: (message: string) => void;
  }
}

function isProduction(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return false;
  return true; // any other host (e.g. surfdelmar.netlify.app) is production
}

function isAdmin(): boolean {
  return typeof sessionStorage !== 'undefined' && sessionStorage.getItem('admin') === 'true';
}

function setAdminBodyClass(): void {
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.toggle('admin-images-editable', isAdmin());
  }
}

export function initAdminImages(): void {
  setAdminBodyClass();
  if (typeof window !== 'undefined') {
    window.addEventListener('admin-login', setAdminBodyClass);
    window.addEventListener('admin-logout', setAdminBodyClass);
  }

  const modal = document.getElementById('image-change-modal');
  const overlay = modal?.querySelector('.image-change-overlay');
  const noBtn = document.getElementById('image-change-no');
  const input = document.getElementById('image-change-input') as HTMLInputElement | null;
  let targetImg: HTMLImageElement | null = null;

  function closeModal(): void {
    if (modal) modal.hidden = true;
    targetImg = null;
    if (input) input.value = '';
  }

  /** Normalize to pathname so keys match between load/save/revert (e.g. /surfers.jpg) */
  function normalizeImgKey(src: string): string {
    if (!src) return '';
    try {
      const u = new URL(src, 'https://x');
      return u.pathname || src;
    } catch {
      return src.startsWith('/') ? src : '/' + src.replace(/^\/+/, '');
    }
  }

  // Apply overrides from Firestore on load
  getImageOverrides().then((overrides) => {
    if (!overrides) return;
    document.querySelectorAll('main img').forEach((img) => {
      const el = img as HTMLImageElement;
      const rawOrig = el.getAttribute('data-original-src') || el.src || el.currentSrc || '';
      const orig = normalizeImgKey(rawOrig) || rawOrig;
      if (!el.getAttribute('data-original-src')) el.setAttribute('data-original-src', orig);
      const url = overrides[orig] ?? overrides[rawOrig];
      if (url) el.src = url;
    });
  });

  // Click to change (admin only)
  document.addEventListener(
    'click',
    (e) => {
      if (!isAdmin()) return;
      const img = (e.target as Element).closest('main img');
      if (!img) return;
      e.preventDefault();
      e.stopPropagation();
      targetImg = img as HTMLImageElement;
      if (!targetImg.getAttribute('data-original-src')) {
        targetImg.setAttribute('data-original-src', targetImg.src || targetImg.getAttribute('src') || '');
      }
      if (modal) modal.hidden = false;
    },
    true
  );

  overlay?.addEventListener('click', closeModal);
  noBtn?.addEventListener('click', closeModal);

  const revertBtn = document.getElementById('image-change-revert');
  revertBtn?.addEventListener('click', async () => {
    if (!targetImg) {
      closeModal();
      return;
    }
    const rawOrig = targetImg.getAttribute('data-original-src') || targetImg.src || '';
    const origSrc = normalizeImgKey(rawOrig) || rawOrig;
    try {
      const res = await fetch(REVERT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: ADMIN_PASSWORD,
          originalSrc: origSrc,
          originalSrcRaw: rawOrig !== origSrc ? rawOrig : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        targetImg.src = origSrc;
        window.showAdminToast?.('Reverted to original.');
      } else {
        alert(data.error || 'Revert failed.');
      }
    } catch (err) {
      console.error('Revert failed:', err);
      alert('Revert failed. Check network and Netlify env (ADMIN_PASSWORD, FIREBASE_SERVICE_ACCOUNT).');
    }
    closeModal();
  });

  input?.addEventListener('change', async function () {
    const file = this.files?.[0];
    if (!file || !targetImg) {
      closeModal();
      return;
    }
    const rawOrig = targetImg.getAttribute('data-original-src') || targetImg.src || '';
    const origSrc = normalizeImgKey(rawOrig) || rawOrig;
    const reader = new FileReader();
    reader.onload = async () => {
      if (!targetImg) return;
      const fileBase64 = (reader.result as string).split(',')[1];
      if (!fileBase64) {
        closeModal();
        return;
      }
      const dataUrl = `data:${file.type || 'image/jpeg'};base64,${fileBase64}`;
      try {
        const res = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: ADMIN_PASSWORD,
            originalSrc: origSrc,
            fileBase64,
            fileName: file.name,
            contentType: file.type,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (res.ok && data.url) {
          targetImg.src = data.url;
          window.showAdminToast?.('Image saved successfully.');
        } else {
          if (!isProduction()) {
            targetImg.src = dataUrl;
            alert('Image updated on this page only. For permanent save, run "npx netlify dev" or deploy to Netlify.');
          } else {
            alert(data.error || 'Save failed. Check Netlify env vars: ADMIN_PASSWORD, FIREBASE_SERVICE_ACCOUNT.');
          }
        }
      } catch {
        if (!isProduction()) {
          targetImg.src = dataUrl;
          alert('Image updated on this page only. For permanent save, run "npx netlify dev" or deploy to Netlify.');
        } else {
          alert('Save failed. Check Netlify env vars (ADMIN_PASSWORD, FIREBASE_SERVICE_ACCOUNT) and try again.');
        }
      }
      closeModal();
    };
    reader.readAsDataURL(file);
  });
}
