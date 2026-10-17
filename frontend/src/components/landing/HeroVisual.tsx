import { useMemo } from 'react';
import { usePrefersReducedMotion } from '../motion/Motion';

/**
 * Animated ERP network.
 *
 * A pure-SVG, GPU-cheap composition: the academic spine flows
 * Students → Academics → Attendance → Examinations → Results, and the campus
 * services (Finance, Hostel, Faculty, Feedback, Notifications) feed into it.
 * No canvas, no 3D, no video — just gradients, dashed strokes and opacity
 * pulses, all of which stop when the OS asks for reduced motion.
 */

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: 'spine' | 'service';
  /** Index into the spine for sequencing the glow. */
  step?: number;
}

const SPINE: Node[] = [
  { id: 'students', label: 'Students', x: 300, y: 62, kind: 'spine', step: 0 },
  { id: 'academics', label: 'Academics', x: 300, y: 152, kind: 'spine', step: 1 },
  { id: 'attendance', label: 'Attendance', x: 300, y: 242, kind: 'spine', step: 2 },
  { id: 'examinations', label: 'Examinations', x: 300, y: 332, kind: 'spine', step: 3 },
  { id: 'results', label: 'Results', x: 300, y: 418, kind: 'spine', step: 4 },
];

const SERVICES: Node[] = [
  { id: 'finance', label: 'Finance', x: 96, y: 128, kind: 'service' },
  { id: 'hostel', label: 'Hostel', x: 96, y: 246, kind: 'service' },
  { id: 'faculty', label: 'Faculty', x: 96, y: 360, kind: 'service' },
  { id: 'feedback', label: 'Feedback', x: 508, y: 128, kind: 'service' },
  { id: 'notifications', label: 'Notifications', x: 508, y: 246, kind: 'service' },
  { id: 'reports', label: 'Reports', x: 508, y: 360, kind: 'service' },
];

/** service id -> spine node it connects to */
const LINKS: [string, string][] = [
  ['finance', 'academics'],
  ['hostel', 'attendance'],
  ['faculty', 'attendance'],
  ['feedback', 'academics'],
  ['notifications', 'examinations'],
  ['reports', 'results'],
];

export function HeroVisual({ className = '' }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const byId = useMemo(() => {
    const m: Record<string, Node> = {};
    [...SPINE, ...SERVICES].forEach((n) => (m[n.id] = n));
    return m;
  }, []);

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-brand-500/10 blur-3xl" />

      <svg viewBox="0 0 600 480" className="h-full w-full" role="img" aria-label="">
        <defs>
          <linearGradient id="hv-line" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c64a8" />
            <stop offset="50%" stopColor="#4f86c6" />
            <stop offset="100%" stopColor="#149c8d" />
          </linearGradient>
          <linearGradient id="hv-svc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#85aedc" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2c64a8" stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id="hv-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#d8e5f6" stopOpacity="0.65" />
          </radialGradient>
        </defs>

        {/* ---- spine: the academic journey -------------------------------- */}
        {SPINE.slice(0, -1).map((n, i) => {
          const next = SPINE[i + 1];
          return (
            <g key={`spine-${n.id}`}>
              <line
                x1={n.x}
                y1={n.y + 16}
                x2={next.x}
                y2={next.y - 16}
                stroke="url(#hv-line)"
                strokeWidth="2"
                opacity="0.35"
              />
              {!reduced ? (
                <line
                  x1={n.x}
                  y1={n.y + 16}
                  x2={next.x}
                  y2={next.y - 16}
                  stroke="url(#hv-line)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="10 78"
                  className="animate-dash"
                  style={{ animationDelay: `${i * 0.45}s` }}
                />
              ) : null}
            </g>
          );
        })}

        {/* ---- service links --------------------------------------------- */}
        {LINKS.map(([fromId, toId], i) => {
          const a = byId[fromId];
          const b = byId[toId];
          if (!a || !b) return null;
          const midX = (a.x + b.x) / 2;
          return (
            <g key={`link-${fromId}`}>
              <path
                d={`M ${a.x + (a.kind === 'service' && a.x < b.x ? 52 : -52)} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`}
                fill="none"
                stroke="url(#hv-svc)"
                strokeWidth="1.6"
                strokeDasharray={reduced ? undefined : '4 6'}
                className={reduced ? undefined : 'animate-dash-slow'}
                style={{ animationDelay: `${0.2 + i * 0.25}s` }}
              />
            </g>
          );
        })}

        {/* ---- nodes ------------------------------------------------------ */}
        {SERVICES.map((n, i) => (
          <g key={n.id} className={reduced ? undefined : 'animate-float'} style={{ animationDelay: `${i * 0.7}s` }}>
            <rect
              x={n.x < 300 ? n.x - 52 : n.x - 52}
              y={n.y - 16}
              width="104"
              height="32"
              rx="16"
              className="fill-white/80 stroke-brand-200 dark:fill-white/5 dark:stroke-brand-400/30"
            />
            <text
              x={n.x}
              y={n.y + 4}
              textAnchor="middle"
              className="fill-ink-muted text-[11px] font-medium dark:fill-ink-muted"
            >
              {n.label}
            </text>
          </g>
        ))}

        {SPINE.map((n) => (
          <g key={n.id}>
            {!reduced ? (
              <circle
                cx={n.x}
                cy={n.y}
                r="26"
                className="fill-brand-400/20 animate-pulse-soft"
                style={{ animationDelay: `${(n.step ?? 0) * 0.35}s` }}
              />
            ) : null}
            <circle cx={n.x} cy={n.y} r="15" fill="url(#hv-node)" className="stroke-brand-600 dark:stroke-brand-300" strokeWidth="1.5" />
            <text
              x={n.x + 26}
              y={n.y + 4}
              className="fill-ink text-[12px] font-semibold dark:fill-white"
            >
              {n.label}
            </text>
          </g>
        ))}

        {/* ---- drifting particles ---------------------------------------- */}
        {!reduced
          ? [
              { cx: 180, cy: 70, r: 3, d: 0 },
              { cx: 430, cy: 120, r: 2.5, d: 1.2 },
              { cx: 150, cy: 400, r: 2, d: 2.1 },
              { cx: 470, cy: 420, r: 3, d: 0.6 },
              { cx: 60, cy: 210, r: 2, d: 1.8 },
              { cx: 545, cy: 300, r: 2.5, d: 2.6 },
            ].map((p, i) => (
              <circle
                key={i}
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                className="fill-brand-400/60 animate-float"
                style={{ animationDelay: `${p.d}s` }}
              />
            ))
          : null}
      </svg>
    </div>
  );
}

/**
 * Floating "dashboard preview" shown in the hero.
 *
 * IMPORTANT: this is a VISUAL PREVIEW of the product with illustrative sample
 * values. It is never fed into authenticated screens — every real number in
 * the app comes from GET /api/v1/dashboard.
 */
export function PreviewDashboard() {
  const reduced = usePrefersReducedMotion();
  return (
    <div
      className={`relative w-full max-w-md rounded-2xl border border-line bg-surface/95 p-5 shadow-2xl backdrop-blur ${
        reduced ? '' : 'animate-float'
      }`}
      style={{ animationDelay: '0.4s' }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-subtle">Preview · sample values</p>
          <p className="text-base font-semibold text-ink">Good morning, Harsh</p>
        </div>
        <span className="chip bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">E&amp;TC · Sem 5</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'CGPA', value: '8.72', tone: 'text-brand-700 dark:text-brand-300' },
          { label: 'Attendance', value: '87%', tone: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Fees', value: 'Paid', tone: 'text-accent-600 dark:text-accent-300' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-ink-subtle">{s.label}</p>
            <p className={`mt-0.5 text-lg font-semibold tabular ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3">
        <p className="text-[10px] uppercase tracking-wider text-ink-subtle">Upcoming exam</p>
        <p className="mt-1 text-sm font-medium text-ink">Database Management Systems</p>
        <p className="text-xs text-ink-muted">14 Oct • 10:00 AM • A-204</p>
      </div>

      <div className="mt-3 space-y-2">
        {['Attendance marked · DBMS', 'Result published · Sem 4', 'Fee receipt #R-2291 issued'].map((t, i) => (
          <div key={t} className="flex items-center gap-2 text-xs text-ink-muted">
            <span
              className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-brand-500' : i === 1 ? 'bg-emerald-500' : 'bg-accent-500'}`}
            />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}
