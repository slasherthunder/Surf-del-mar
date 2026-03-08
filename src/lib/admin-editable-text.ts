/**
 * Admin editable text: load overrides from Firestore, apply to [data-editable],
 * and when admin, allow click-to-edit and save via Netlify function.
 */
import { getEditableText } from './firebase';

const ADMIN_PASSWORD =
  (typeof import.meta.env.PUBLIC_ADMIN_PASSWORD === 'string' && import.meta.env.PUBLIC_ADMIN_PASSWORD) ||
  'surfdelmar';
const SAVE_URL = '/.netlify/functions/save-page-text';

declare global {
  interface Window {
    showAdminToast?: (message: string) => void;
  }
}

function isAdmin(): boolean {
  return typeof sessionStorage !== 'undefined' && sessionStorage.getItem('admin') === 'true';
}

function setAdminBodyClass(): void {
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.toggle('admin-text-editable', isAdmin());
  }
}

export function initEditableText(): void {
  setAdminBodyClass();
  if (typeof window !== 'undefined') {
    window.addEventListener('admin-login', setAdminBodyClass);
    window.addEventListener('admin-logout', setAdminBodyClass);
  }

  const modal = document.getElementById('edit-text-modal');
  const overlay = modal?.querySelector('.edit-text-overlay');
  const textarea = document.getElementById('edit-text-field') as HTMLTextAreaElement | null;
  const saveBtn = document.getElementById('edit-text-save');
  const cancelBtn = document.getElementById('edit-text-cancel');
  let currentKey: string | null = null;
  let currentEl: Element | null = null;

  function closeModal(): void {
    if (modal) modal.hidden = true;
    currentKey = null;
    currentEl = null;
  }

  function openModal(key: string, el: Element, currentText: string): void {
    currentKey = key;
    currentEl = el;
    if (textarea) textarea.value = currentText;
    if (modal) modal.hidden = false;
    textarea?.focus();
  }

  overlay?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  saveBtn?.addEventListener('click', async () => {
    if (!currentKey || !currentEl || !textarea) {
      closeModal();
      return;
    }
    const value = textarea.value.trim();
    try {
      const res = await fetch(SAVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: ADMIN_PASSWORD,
          key: currentKey,
          value: value,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        currentEl.textContent = value;
        window.showAdminToast?.('Text saved.');
      } else {
        alert(data.error || 'Save failed.');
      }
    } catch {
      alert('Save failed. Check network and Netlify env.');
    }
    closeModal();
  });

  getEditableText().then((overrides) => {
    if (!overrides) return;
    document.querySelectorAll('[data-editable]').forEach((el) => {
      const key = el.getAttribute('data-editable');
      if (!key) return;
      const override = overrides[key];
      if (override != null) el.textContent = override;
    });
  });

  document.addEventListener(
    'click',
    (e) => {
      if (!isAdmin()) return;
      const el = (e.target as Element).closest('[data-editable]');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      const key = el.getAttribute('data-editable');
      if (!key) return;
      const currentText = el.textContent || '';
      openModal(key, el, currentText);
    },
    true
  );
}
