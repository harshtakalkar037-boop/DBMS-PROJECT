/**
 * Development-only demo-environment flag.
 *
 * It is set by the local demo-account picker so the UI can show the
 * "Demo Environment" badge. Purely cosmetic — it changes no authorisation.
 * This module deliberately does not import demo credentials, keeping them out
 * of production bundles.
 */
const KEY = 'erp_demo_mode';

export const demoMode = {
  enable() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* storage unavailable */
    }
  },
  disable() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  },
  isEnabled(): boolean {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  },
  /** Display the demo badge only for a session chosen through the local picker. */
  activeFor(_email: string | undefined | null): boolean {
    // Production builds never display a demo badge, even if a browser has an old localStorage flag.
    return import.meta.env.DEV && this.isEnabled();
  },
};
