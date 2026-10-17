import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '../motion/Motion';
import { CountUp } from '../motion/Motion';

/* ------------------------------------------------------------------ helpers */

export const n = (v: unknown, d = 0): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};

export const s = (v: unknown, d = ''): string => (v === null || v === undefined ? d : String(v));

export type Row = Record<string, unknown>;

/* ------------------------------------------------------------------- tiles */

export type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_BG: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-200 dark:ring-brand-800',
  accent: 'bg-accent-50 text-accent-700 ring-accent-100 dark:bg-accent-900/25 dark:text-accent-200 dark:ring-accent-800',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-900/25 dark:text-emerald-300 dark:ring-emerald-800',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-900/25 dark:text-amber-300 dark:ring-amber-800',
  danger: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-900/25 dark:text-rose-300 dark:ring-rose-800',
  neutral: 'bg-surface-2 text-ink-muted ring-line',
};

const TONE_VALUE: Record<Tone, string> = {
  brand: 'text-brand-700 dark:text-brand-200',
  accent: 'text-accent-700 dark:text-accent-300',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
  neutral: 'text-ink',
};

/**
 * The single KPI tile used by every role. Numbers count up on first paint
 * (skipped automatically when reduced motion is requested).
 */
export function StatTile({
  label,
  value,
  icon,
  tone = 'brand',
  hint,
  to,
  decimals = 0,
  prefix = '',
  suffix = '',
  index = 0,
}: {
  label: string;
  value: number | string;
  icon?: ReactNode;
  tone?: Tone;
  hint?: string;
  to?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  index?: number;
}) {
  const body = (
    <div className="card card-pad h-full transition duration-200 ease-premium hover:border-brand-300 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">{label}</p>
        {icon ? (
          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${TONE_BG[tone]}`}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular tracking-tight ${TONE_VALUE[tone]}`}>
        {typeof value === 'number' ? (
          <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
        ) : (
          `${prefix}${value}${suffix}`
        )}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  );

  return (
    <Reveal delay={Math.min(index, 7) * 0.04} distance={8}>
      {to ? (
        <Link to={to} className="block h-full">
          {body}
        </Link>
      ) : (
        body
      )}
    </Reveal>
  );
}

/* ------------------------------------------------------------------ panels */

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal className={`card flex h-full flex-col ${className}`} delay={delay}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
          {subtitle ? <p className="mt-0.5 truncate text-xs text-ink-subtle">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="flex-1 p-4">{children}</div>
    </Reveal>
  );
}

export function PanelLink({ to, label = 'View all' }: { to: string; label?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
      {label} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

/** Chart wrapper — every chart in the app sits inside this so the look is identical. */
export function ChartCard({
  title,
  subtitle,
  action,
  height = 260,
  children,
  className = '',
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  height?: number;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Panel title={title} subtitle={subtitle} action={action} className={className} delay={delay}>
      <div style={{ height }} className="w-full">
        {children}
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------- activity --- */

export interface FeedItem {
  title: string;
  meta?: string;
  time?: string;
  tone?: Tone;
  to?: string;
}

const DOT: Record<Tone, string> = {
  brand: 'bg-brand-500',
  accent: 'bg-accent-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-slate-400',
};

export function ActivityFeed({ items, empty = 'Nothing to show yet.' }: { items: FeedItem[]; empty?: string }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-subtle">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {items.map((it, i) => {
        const inner = (
          <>
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[it.tone ?? 'neutral']}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">{it.title}</span>
              {it.meta ? <span className="block truncate text-xs text-ink-subtle">{it.meta}</span> : null}
            </span>
            {it.time ? <span className="shrink-0 text-[11px] text-ink-subtle">{it.time}</span> : null}
          </>
        );
        return (
          <li key={`${it.title}-${i}`}>
            {it.to ? (
              <Link to={it.to} className="-mx-2 flex items-start gap-2.5 rounded-lg px-2 py-2 transition hover:bg-surface-2">
                {inner}
              </Link>
            ) : (
              <div className="-mx-2 flex items-start gap-2.5 px-2 py-2">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ----------------------------------------------------------- quick actions */

export function QuickActions({
  actions,
  delay = 0,
}: {
  actions: { to: string; label: string; icon: ReactNode; hint?: string }[];
  delay?: number;
}) {
  return (
    <Reveal className="card card-pad" delay={delay}>
      <h2 className="mb-3 text-sm font-semibold text-ink">Quick actions</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((a) => (
          <Link
            key={a.to + a.label}
            to={a.to}
            className="group flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5 transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-brand-300 hover:bg-surface hover:shadow-sm"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-brand-700 ring-1 ring-line transition group-hover:bg-brand-600 group-hover:text-white dark:text-brand-300">
              {a.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">{a.label}</span>
              {a.hint ? <span className="block truncate text-[11px] text-ink-subtle">{a.hint}</span> : null}
            </span>
          </Link>
        ))}
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------ progress bar */

export function Meter({ value, max = 100, tone }: { value: number; max?: number; tone?: Tone }) {
  const p = max === 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const bar =
    tone === 'danger' ? 'bg-rose-500' : tone === 'warning' ? 'bg-amber-500' : tone === 'success' ? 'bg-emerald-500' : 'bg-brand-600';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
      <div className={`h-full rounded-full transition-[width] duration-700 ease-premium ${bar}`} style={{ width: `${p}%` }} />
    </div>
  );
}
