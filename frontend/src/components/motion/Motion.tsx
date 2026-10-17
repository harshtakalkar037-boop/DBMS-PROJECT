import { motion, useInView, useReducedMotion, type MotionProps, type Variants } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DURATION, EASE } from '../../theme/tokens';

/**
 * Motion primitives.
 *
 * Rules baked in here so every page inherits them:
 *  - durations stay inside 150–500 ms (DURATION.fast / base / slow)
 *  - `useReducedMotion()` is honoured — when the OS asks for reduced motion the
 *    elements render in their final state with no transform.
 *  - nothing animates layout-heavy properties (no width/height grows).
 */

export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}

const fadeUp = (reduced: boolean, distance = 10): Variants => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, y: distance },
  show: { opacity: 1, y: 0, transition: { duration: reduced ? 0.001 : DURATION.slow, ease: EASE.premium } },
});

/** Fade + rise once when the element scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  distance = 10,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const Cmp = motion[as] as typeof motion.div;

  return (
    <Cmp
      ref={ref as never}
      className={className}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={fadeUp(reduced, distance)}
      transition={{ delay }}
    >
      {children}
    </Cmp>
  );
}

const staggerParent = (stagger: number, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

const child = (reduced: boolean): Variants => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: reduced ? 0.001 : DURATION.base, ease: EASE.premium } },
});

/** Parent for lists/grids: wrap items in <StaggerItem>. */
export function Stagger({
  children,
  className = '',
  stagger = 0.05,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div className={className} initial="hidden" animate="show" variants={staggerParent(reduced ? 0 : stagger, delay)}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div className={className} variants={child(reduced)}>
      {children}
    </motion.div>
  );
}

/** Route-level enter animation. Keep it short — it runs on every navigation. */
export function PageTransition({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.001 : DURATION.base, ease: EASE.premium }}
    >
      {children}
    </motion.div>
  );
}

/** Hover/press feedback for cards and buttons. */
export const pressable: MotionProps = {
  whileHover: { y: -2, transition: { duration: DURATION.fast, ease: EASE.snappy } },
  whileTap: { scale: 0.985, transition: { duration: 0.08 } },
};

/** Animated integer/decimal counter — used by KPI tiles and the CGPA ring. */
export function CountUp({
  value,
  decimals = 0,
  duration = 500,
  prefix = '',
  suffix = '',
  className = '',
}: {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = shown;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reduced]);

  return (
    <span className={className}>
      {prefix}
      {shown.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/**
 * SVG progress ring used for CGPA and attendance. CSS variables let the stroke
 * animate without Framer Motion so it stays cheap on low-end devices.
 */
export function ProgressRing({
  value,
  max = 10,
  size = 128,
  thickness = 10,
  label,
  sublabel,
  tone = 'brand',
}: {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  label?: string;
  sublabel?: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  const reduced = usePrefersReducedMotion();
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;

  const stroke =
    tone === 'success' ? '#15803d' : tone === 'warning' ? '#b45309' : tone === 'danger' ? '#be123c' : tone === 'accent' ? '#149c8d' : '#2c64a8';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${label ?? value} of ${max}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--c-line))" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={reduced ? circumference - dash : circumference}
          style={
            reduced
              ? undefined
              : {
                  transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1) 80ms',
                  strokeDashoffset: circumference - dash,
                }
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-2xl font-semibold text-ink">{label ?? value.toFixed(2)}</span>
        {sublabel ? <span className="text-[11px] uppercase tracking-wide text-ink-subtle">{sublabel}</span> : null}
      </div>
    </div>
  );
}
