/** @type {import('tailwindcss').Config} */
/**
 * PICT University ERP — design token source of truth.
 *
 * Every colour here is exposed to CSS as a variable in src/index.css under
 * `:root` (light) and `.dark` (dark), so the semantic tokens below stay
 * consistent between Tailwind utilities, hand-written CSS and Recharts
 * (which needs real colour strings, not class names — see src/theme/tokens.ts).
 */
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Institutional identity — deep academic navy. */
        brand: {
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
        },
        /* Restrained secondary — used sparingly for accents and data-viz. */
        accent: {
          50: '#eefbf8',
          100: '#d3f4ee',
          200: '#a8e8de',
          300: '#6fd5c6',
          400: '#34b8a8',
          500: '#149c8d',
          600: '#0d7c71',
          700: '#0d635c',
          800: '#0f4f4a',
          900: '#10423e',
          950: '#042726',
        },
        /* Semantic surfaces driven by CSS variables (flip with .dark). */
        canvas: withVar('--c-canvas'),
        surface: withVar('--c-surface'),
        'surface-2': withVar('--c-surface-2'),
        'surface-3': withVar('--c-surface-3'),
        line: withVar('--c-line'),
        'line-strong': withVar('--c-line-strong'),
        ink: withVar('--c-ink'),
        'ink-muted': withVar('--c-ink-muted'),
        'ink-subtle': withVar('--c-ink-subtle'),
      },
      fontFamily: {
        sans: ['"Inter var"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"Inter var"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        '4xl': '1.75rem',
      },
      boxShadow: {
        xs: '0 1px 2px rgb(15 23 42 / 0.04)',
        sm: '0 1px 2px rgb(15 23 42 / 0.06), 0 1px 3px rgb(15 23 42 / 0.06)',
        md: '0 4px 6px -1px rgb(15 23 42 / 0.07), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
        lg: '0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.06)',
        xl: '0 20px 25px -5px rgb(15 23 42 / 0.10), 0 8px 10px -6px rgb(15 23 42 / 0.06)',
        '2xl': '0 25px 50px -12px rgb(15 23 42 / 0.18)',
        glow: '0 0 0 1px rgb(44 100 168 / 0.18), 0 12px 32px -12px rgb(28 78 138 / 0.35)',
        'card-hover': '0 2px 4px rgb(15 23 42 / 0.04), 0 12px 24px -12px rgb(15 23 42 / 0.18)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
        snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(.97)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'none' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'ring-draw': { '0%': { strokeDashoffset: 'var(--ring-len)' }, '100%': { strokeDashoffset: 'var(--ring-to)' } },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '.45' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: {
        'fade-in': 'fade-in .2s cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-up': 'fade-up .35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-down': 'fade-down .2s cubic-bezier(0.4, 0, 0.2, 1) both',
        'pop-in': 'pop-in .16s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-right': 'slide-in-right .28s cubic-bezier(0.22, 1, 0.36, 1) both',
        'sheet-up': 'sheet-up .28s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(to right, rgb(15 23 42 / 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgb(15 23 42 / 0.045) 1px, transparent 1px)',
        'grid-dark':
          'linear-gradient(to right, rgb(148 163 184 / 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.08) 1px, transparent 1px)',
      },
      backgroundSize: { grid: '32px 32px' },
    },
  },
  plugins: [],
};
