import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Sidebar } from './layout/Sidebar';
import { TopBar } from './layout/TopBar';
import { Breadcrumbs } from './layout/Breadcrumbs';
import { PageTransition } from './motion/Motion';
import AccessRestrictedPage from '../pages/system/AccessRestrictedPage';
import { SEED_DATA_NOTICE } from '../data/pict/institution';
import type { Role } from '../lib/types';

/**
 * The one and only application shell — DashboardLayout.
 *
 * Every role renders through this component: same sidebar, same top bar, same
 * breadcrumbs, same cards and charts. Only the widgets inside <Outlet /> and
 * the navigation entries change with the role.
 */
export function AppShell() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('erp_sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem('erp_sidebar', collapsed ? 'collapsed' : 'expanded');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-white/5 transition-[width] duration-300 ease-premium lg:block ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <Sidebar role={user.role} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-brand-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 animate-slide-in-right shadow-2xl">
            <Sidebar
              role={user.role}
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-3 rounded-lg bg-brand-900/90 p-2 text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMenu={() => setMobileOpen(true)} />

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-6">
          <Breadcrumbs />
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>

        <footer className="border-t border-line bg-surface px-4 py-3 text-center text-[11px] leading-relaxed text-ink-subtle">
          <span className="font-medium text-ink-muted">PICT University ERP</span> · SCTR&apos;s Pune Institute of
          Computer Technology, Dhankawadi, Pune-411043
          <span className="mx-2 hidden text-line-strong sm:inline">|</span>
          <span className="block sm:inline">{SEED_DATA_NOTICE}</span>
        </footer>
      </div>
    </div>
  );
}

/**
 * Route guard.
 *
 * A role that is not allowed here never sees a "you are not a student" panel —
 * it is shown the polished restricted screen and pointed back to the dashboard.
 * The API remains the real authority; this is only the graceful path.
 */
export function RoleGate({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { has } = useAuth();
  if (!has(...roles)) return <AccessRestrictedPage />;
  return <>{children}</>;
}
