import type { StoredProfile } from './types';

// unique per dashboard: sibling dashboards on the same GitHub Pages origin share localStorage
const KEY = 'cyber-trust-cv-dashboard:v1';

/** localStorage can be missing or throw (private mode, sandboxed previews) — never let it break the app. */
export function loadProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: StoredProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Quota exceeded (large PDF/photo) — retry without the original file.
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...profile, file: undefined }));
    } catch {
      /* ignore */
    }
  }
}

export function clearProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
