import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { PictLogo } from '../brand/PictLogo';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '#modules', label: 'Modules' },
  { href: '#about', label: 'About' },
];

/** A small, plain navigation bar for the public ERP entry page. */
export function LandingNav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const destination = user ? '/dashboard' : '/login';
  const actionLabel = user ? 'Open dashboard' : 'Login';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="inline-flex min-w-0 items-center" aria-label="PICT ERP home">
          <PictLogo compact />
        </Link>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-700 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
          {LINKS.map((item) => (
            item.href === '/' ? (
              <Link key={item.label} to="/" className="text-sm text-slate-700 hover:text-blue-900">
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className="text-sm text-slate-700 hover:text-blue-900">
                {item.label}
              </a>
            )
          ))}
          <Link to={destination} className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2">
            {actionLabel}
          </Link>
        </nav>
      </div>

      {open ? (
        <nav aria-label="Mobile navigation" className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {LINKS.map((item) => (
              item.href === '/' ? (
                <Link key={item.label} to="/" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  {item.label}
                </Link>
              ) : (
                <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  {item.label}
                </a>
              )
            ))}
            <Link to={destination} onClick={() => setOpen(false)} className="mt-1 rounded-md bg-blue-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-800">
              {actionLabel}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
