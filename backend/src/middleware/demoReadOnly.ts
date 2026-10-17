import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { verifyAccessToken } from './auth';
import { isSeededDemoEmail } from '../services/demoAccountPolicy';
import { AppError } from '../utils/api';

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Blocks mutations for signed demo sessions at the API boundary, regardless of
 * which route or role-specific controller is called. Logout remains available.
 * The feature is fail-closed: demo claims are honoured only while the explicit
 * server-side feature flag is enabled and the token email is allow-listed.
 */
export function enforceDemoReadOnly(req: Request, _res: Response, next: NextFunction): void {
  if (!env.allowSeededDemoLogins || READ_ONLY_METHODS.has(req.method.toUpperCase())) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const payload = verifyAccessToken(authHeader.slice(7).trim());
    if (payload.isDemo !== true || !isSeededDemoEmail(payload.email)) return next();

    const path = req.path.replace(/\/+$/, '') || '/';
    if (req.method.toUpperCase() === 'POST' && path === '/auth/logout') return next();

    return next(AppError.forbidden('Demo sessions are read-only. Changes are disabled in the public demo.'));
  } catch {
    // Authentication middleware is responsible for invalid or expired tokens.
    return next();
  }
}
