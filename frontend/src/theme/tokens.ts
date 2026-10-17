/**
 * Shared design tokens for JavaScript consumers (Recharts, non-Tailwind inline
 * styles, canvas). Tailwind utilities cover most styling; this file exists so
 * charts can share the exact same palette as the rest of the app.
 */

export const BRAND = {
  50: '#eff4fb',
  100: '#d8e5f6',
  200: '#b4cdeb',
  300: '#85aedc',
  400: '#4f86c6',
  500: '#2c64a8',
  600: '#1c4e8a',
  700: '#163e6e',
  800: '#14345b',
  900: '#12294a',
  950: '#0b1b33',
} as const;

export const ACCENT = {
  100: '#d3f4ee',
  300: '#6fd5c6',
  500: '#149c8d',
  600: '#0d7c71',
  700: '#0d635c',
} as const;

/** Categorical palette for charts — calm, distinguishable, colour-blind aware. */
export const CHART_SERIES = ['#2c64a8', '#149c8d', '#c2872b', '#8b5cf6', '#d1495b', '#0e7490', '#5b8c5a', '#7c6bd4'];

/** Semantic status colours used by charts, badges and maps alike. */
export const STATUS = {
  success: '#15803d',
  successSoft: '#dcfce7',
  warning: '#b45309',
  warningSoft: '#fef3c7',
  danger: '#be123c',
  dangerSoft: '#ffe4e6',
  info: '#1d4ed8',
  infoSoft: '#dbeafe',
  neutral: '#64748b',
  neutralSoft: '#e2e8f0',
} as const;

/** Attendance / performance thresholds shared by progress bars and gauges. */
export const THRESHOLDS = { attendanceLow: 75, attendanceWarn: 85 } as const;

export function toneForPercent(pct: number): keyof typeof STATUS {
  if (pct < THRESHOLDS.attendanceLow) return 'danger';
  if (pct < THRESHOLDS.attendanceWarn) return 'warning';
  return 'success';
}

/** Common easing curves, mirrored from tailwind.config.js. */
export const EASE = {
  premium: [0.22, 1, 0.36, 1],
  snappy: [0.4, 0, 0.2, 1],
} as const;

/** Animation durations in seconds — keep everything inside 150–500 ms. */
export const DURATION = { fast: 0.15, base: 0.24, slow: 0.4 } as const;
