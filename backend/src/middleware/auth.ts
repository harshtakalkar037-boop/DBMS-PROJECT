import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/api';
import * as authRepo from '../repositories/auth.repository';

export type Role =
  | 'ADMIN'
  | 'FACULTY'
  | 'STUDENT'
  | 'ACCOUNTANT'
  | 'HOSTEL_ADMIN'
  | 'EXAM_CELL'
  | 'HR';

export interface AuthUser {
  userId: number;
  role: Role;
  email: string;
  /** student_id when role = STUDENT */
  studentId?: number;
  /** faculty_id when role = FACULTY */
  facultyId?: number;
  name?: string;
  mustChangePassword?: boolean;
  /** True only for explicitly enabled, server-issued demo sessions. */
  isDemo?: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface AccessTokenPayload {
  sub: number;
  role: Role;
  email: string;
  studentId?: number;
  facultyId?: number;
  name?: string;
  mustChangePassword?: boolean;
  isDemo?: boolean;
}

export function signAccessToken(user: AuthUser): string {
  const payload: AccessTokenPayload = {
    sub: user.userId,
    role: user.role,
    email: user.email,
    ...(user.studentId ? { studentId: user.studentId } : {}),
    ...(user.facultyId ? { facultyId: user.facultyId } : {}),
    ...(user.name ? { name: user.name } : {}),
    ...(user.mustChangePassword ? { mustChangePassword: true } : {}),
    ...(user.isDemo ? { isDemo: true } : {}),
  };
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as jwt.SignOptions);
}

export function signRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.userId, role: user.role, type: 'refresh' },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn } as jwt.SignOptions,
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.secret) as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const payload = jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
  if (payload.type !== 'refresh') throw new AppError('Invalid refresh token', 'UNAUTHORIZED');
  return payload;
}

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  const cookie = (req as any).cookies?.accessToken;
  if (typeof cookie === 'string' && cookie.length) return cookie;
  return null;
};

/** Verifies the JWT and re-checks the live account/role before each protected request. */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) throw AppError.unauthorized('No authentication token was supplied');

    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId < 1) throw AppError.unauthorized('Invalid authentication token');

    const identity = await authRepo.findUserById(userId);
    if (!identity || !identity.is_active) {
      throw AppError.unauthorized('This account is no longer active. Please sign in again.');
    }
    const role = identity.role_code as Role;
    if (role === 'STUDENT' && (!identity.student_id || ['INACTIVE', 'SUSPENDED'].includes(String(identity.student_status ?? '')))) {
      throw AppError.unauthorized('This student account is not active. Please contact the administrator.');
    }
    if (role === 'FACULTY' && (!identity.faculty_id || ['RESIGNED', 'RETIRED', 'SUSPENDED'].includes(String(identity.faculty_status ?? '')))) {
      throw AppError.unauthorized('This faculty account is not active. Please contact the administrator.');
    }

    req.user = {
      userId: identity.user_id,
      role,
      email: identity.email,
      studentId: identity.student_id ?? undefined,
      facultyId: identity.faculty_id ?? undefined,
      mustChangePassword: Boolean(identity.is_first_login),
      isDemo: payload.isDemo === true && env.allowSeededDemoLogins,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(AppError.unauthorized('Your session has expired. Please sign in again.'));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(AppError.unauthorized('Invalid authentication token'));
    }
    next(err);
  }
}

/** Optional variant: populates req.user when a valid token is present. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: Number(payload.sub),
      role: payload.role,
      email: payload.email,
      studentId: payload.studentId,
      facultyId: payload.facultyId,
      name: payload.name,
    };
  } catch {
    /* ignore - the route decides whether identity is required */
  }
  next();
}

/**
 * Role Based Access Control.
 *
 * IMPORTANT: this runs in the backend on every request. Changing a route in the
 * browser, or calling the API directly with curl, cannot bypass it - the check
 * happens before the controller is ever executed.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `This action requires one of these roles: ${roles.join(', ')}. Your role is ${req.user.role}.`,
        ),
      );
    }
    next();
  };
}

/**
 * Scope guard: a student may only ever read their OWN records.
 * Controllers call this with the student_id taken from the route/query.
 */
export function requireSelfOrRole(role: Role, getStudentId: (req: Request) => number | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized());
    if (req.user.role === role) return next();
    const target = getStudentId(req);
    if (req.user.role === 'STUDENT') {
      if (!req.user.studentId || target !== req.user.studentId) {
        return next(AppError.forbidden('You may only access your own records'));
      }
      return next();
    }
    next(AppError.forbidden());
  };
}
