import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './auth';
import { isSeededDemoEmail } from '../services/demoAccountPolicy';
import { AppError } from '../utils/api';

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Blocks mutations for signed demo sessions at the API boundary, regardless of
 * which route or role-specific controller is called. Logout remains available.
 * The feature is fail-closed: only a valid signed demo claim plus the allow-list
 * can trigger the guard; stale demo tokens remain read-only after flag changes.
 */
export function enforceDemoReadOnly(req: Request, _res: Response, next: NextFunction): void {
  if (READ_ONLY_METHODS.has(req.method.toUpperCase())) return next();

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req as Request & { cookies?: Record<string, unknown> }).cookies?.accessToken;
  if (typeof token !== 'string' || !token) return next();

  try {
    const payload = verifyAccessToken(token);
    if (payload.isDemo !== true || !isSeededDemoEmail(payload.email)) return next();

    const path = req.path.replace(/\/+$/, '') || '/';
    if (req.method.toUpperCase() === 'POST' && path === '/auth/logout') return next();

    return next(AppError.forbidden('Demo sessions are read-only. Changes are disabled in the public demo.'));
  } catch {
    // Authentication middleware is responsible for invalid or expired tokens.
    return next();
  }
}
