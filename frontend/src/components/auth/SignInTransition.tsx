import { motion, AnimatePresence } from 'framer-motion';
import { usePrefersReducedMotion } from '../motion/Motion';
import { PictLogo } from '../brand/PictLogo';

/**
 * Short, calm bridge between the login screen and the dashboard (≈650 ms).
 * No spinner theatre — just the mark, one line of text and a progress bar.
 */
export function SignInTransition({ show, name }: { show: boolean; name?: string }) {
  const reduced = usePrefersReducedMotion();

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-canvas/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.001 : 0.18 }}
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduced ? 0.001 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <PictLogo />
            <p className="text-sm font-medium text-ink">Welcome back{name ? `, ${name}` : ''}</p>
            <p className="text-xs text-ink-subtle">Opening your workspace…</p>
          </motion.div>

          <div className="h-0.5 w-40 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-brand-600"
              initial={{ width: '4%' }}
              animate={{ width: '100%' }}
              transition={{ duration: reduced ? 0.001 : 0.62, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
