import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, UserCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { initials, colorFor } from '../../lib/format';
import { GlobalSearch } from '../GlobalSearch';
import { NotificationBell } from '../NotificationBell';
import { ThemeToggle } from '../../theme/ThemeProvider';
import { ROLE_LABELS } from '../nav';
import { demoMode } from '../../lib/demoMode';

/** Compact identity chip shown when the session is a seeded demo account. */
export function DemoBadge() {
  return (
    <span
      className="hidden items-center gap-1.5 rounded-full border border-amber-300/50 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 sm:inline-flex dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
      title="Seeded demo data — safe to explore, not real institute records"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Demo Environment
    </span>
  );
}

/**
 * Shared top bar for every role: global search, notifications, theme, profile.
 * Identical everywhere — only the data behind it changes.
 */
export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  if (!user) return null;
  const demo = demoMode.activeFor(user.email);
  const displayName = user.name && user.name !== user.email ? user.name : (ROLE_LABELS[user.role] ?? user.role);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-2.5 sm:px-5">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-lg p-2 text-ink-muted hover:bg-surface-3 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {demo ? <DemoBadge /> : null}
          <ThemeToggle className="hidden sm:inline-flex" />
          <NotificationBell />

          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-surface-3"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: colorFor(displayName) }}
              >
                {initials(displayName)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-[10rem] truncate text-xs font-semibold text-ink">{displayName}</span>
                <span className="block text-[10px] uppercase tracking-wide text-ink-subtle">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-ink-subtle sm:block" />
            </button>

            {profileOpen ? (
              <div
                className="absolute right-0 z-50 mt-2 w-60 animate-pop-in overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
                role="menu"
              >
                <div className="border-b border-line px-4 py-3">
                  <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                  <p className="truncate text-xs text-ink-muted">{user.email}</p>
                  <p className="mt-1.5 text-[11px] text-ink-subtle">{ROLE_LABELS[user.role] ?? user.role}</p>
                </div>
                <Link
                  to="/profile"
                  role="menuitem"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-ink-muted hover:bg-surface-3 hover:text-ink"
                >
                  <UserCircle className="h-4 w-4" /> My profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    logout();
                    navigate('/', { replace: true });
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
