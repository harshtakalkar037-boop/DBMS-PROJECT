import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import { usePrefersReducedMotion } from '../../components/motion/Motion';

/**
 * Shown when a signed-in user opens an area their role cannot use.
 *
 * Deliberately boring on detail: no endpoint names, no role names, no
 * "you need to be a student" phrasing — authorisation is the backend's job,
 * this screen only gets the user back somewhere useful.
 */
export default function AccessRestrictedPage({
  title = 'Access restricted',
  message = "You don't have permission to access this area.",
}: {
  title?: string;
  message?: string;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduced ? 0.001 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <span className="absolute inset-0 -z-10 rounded-full bg-brand-400/15 blur-2xl" />
        <motion.span
          className="flex h-20 w-20 items-center justify-center rounded-2xl border border-line bg-surface text-brand-700 shadow-lg dark:text-brand-300"
          animate={reduced ? undefined : { rotate: [0, -3, 3, 0] }}
          transition={{ duration: 1.6, delay: 0.25 }}
        >
          <Lock className="h-8 w-8" />
        </motion.span>
      </motion.div>

      <h1 className="mt-6 text-xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{message}</p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link to="/dashboard" className="btn-primary">
          <ArrowLeft className="h-4 w-4" /> Return to dashboard
        </Link>
        <Link to="/profile" className="btn-secondary">
          View my profile
        </Link>
      </div>
    </div>
  );
}
