import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { navFor } from '../nav';
import { PictLogo } from '../brand/PictLogo';
import type { Role } from '../../lib/types';

/**
 * Role-aware sidebar.
 *
 * It renders only the entries the signed-in role may open — everything else is
 * filtered out server-side too, so a hidden item is a UX decision, never the
 * security boundary.
 */
export function Sidebar({
  role,
  collapsed,
  onToggle,
  onNavigate,
}: {
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const sections = navFor(role);

  return (
    <div className="flex h-full flex-col bg-brand-950">
      <div className={`flex items-center gap-2 border-b border-white/5 px-3 py-3.5 ${collapsed ? 'justify-center' : ''}`}>
        {collapsed ? (
          <PictLogo variant="mark" tone="light" />
        ) : (
          <>
            <PictLogo tone="light" />
            <button
              type="button"
              onClick={onToggle}
              className="ml-auto rounded-md p-1.5 text-brand-200/70 transition hover:bg-white/5 hover:text-white"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {collapsed ? (
        <button
          type="button"
          onClick={onToggle}
          className="mx-auto mt-2 rounded-md p-1.5 text-brand-200/70 transition hover:bg-white/5 hover:text-white"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4" aria-label="Main navigation">
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed ? (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-200/40">
                {section.title}
              </p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition duration-150 ${
                        collapsed ? 'justify-center px-0' : ''
                      } ${
                        isActive
                          ? 'bg-brand-600/90 font-medium text-white shadow-sm'
                          : 'text-brand-100/70 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed ? (
        <p className="border-t border-white/5 px-4 py-3 text-[10px] leading-relaxed text-brand-200/35">
          PICT University ERP · M7 Batch
        </p>
      ) : null}
    </div>
  );
}
