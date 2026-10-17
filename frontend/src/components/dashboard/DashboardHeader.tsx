import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { ROLE_LABELS } from '../nav';
import { usePrefersReducedMotion } from '../motion/Motion';
import { INSTITUTION } from '../../data/pict/institution';

interface CurrentSemester {
  semester_no?: number;
  yearLabel?: string;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * The one dashboard header every role sees.
 *
 * Same layout everywhere: greeting, role badge, department, academic year.
 * Only the name, the badge and the department change with the signed-in role.
 */
export function DashboardHeader({
  name,
  department,
  meta,
}: {
  /** Display name — may be overridden by a role widget (e.g. "Prof. Sharma"). */
  name?: string;
  /** Department / scope line. */
  department?: string | null;
  /** Extra chips rendered after the department. */
  meta?: { label: string; value: string }[];
}) {
  const { user } = useAuth();
  const reduced = usePrefersReducedMotion();
  const [term, setTerm] = useState<CurrentSemester | null>(null);

  useEffect(() => {
    api
      .get<CurrentSemester>('/academics/semesters/current')
      .then(setTerm)
      .catch(() => setTerm(null));
  }, []);

  if (!user) return null;

  const displayName =
    name ??
    (user.name && user.name !== user.email
      ? user.name
      : (ROLE_LABELS[user.role] ?? user.role));

  return (
    <motion.div
      className="mb-5"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.001 : 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
            {greeting()},
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{displayName}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-800">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <MapPin className="h-3.5 w-3.5" />
              {department ?? INSTITUTION.shortName}
            </span>
            {term?.yearLabel ? (
              <span className="inline-flex items-center gap-1 text-ink-muted">
                <CalendarDays className="h-3.5 w-3.5" />
                A.Y. {term.yearLabel}
                {term.semester_no ? ` · Sem ${term.semester_no}` : ''}
              </span>
            ) : null}
            {meta?.map((m) => (
              <span key={m.label} className="chip bg-surface-2 text-ink-muted ring-1 ring-line">
                {m.label}: <span className="font-semibold text-ink">{m.value}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link to="/notifications" className="btn-secondary btn-sm">
            Notifications
          </Link>
          <Link to="/profile" className="btn-secondary btn-sm">
            My profile
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
