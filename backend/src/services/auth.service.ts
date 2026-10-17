import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { env } from '../config/env';
import * as repo from '../repositories/auth.repository';
import { AuthUser } from '../middleware/auth';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth';
import { AppError } from '../utils/api';
import { audit } from '../utils/audit';

export interface LoginContext { ip?: string | null; userAgent?: string | null }

const SEEDED_DEMO_EMAILS = new Set([
  'admin@pict.edu',
  '2024etc1001@pict.edu',
  'karan.shinde@pict.edu',
  'examcell@pict.edu',
  'accountant@pict.edu',
  'hostel.admin@pict.edu',
  'hr@pict.edu',
]);

function assertLinkedAccountIsUsable(user: repo.UserRecord): void {
  if (user.role_code === 'STUDENT') {
    if (!user.student_id) throw AppError.forbidden('This student account is not linked to an approved student record.');
    if (['INACTIVE', 'SUSPENDED'].includes(String(user.student_status ?? '')))
      throw AppError.forbidden('This student account is inactive. Contact the administrator.');
  }
  if (user.role_code === 'FACULTY') {
    if (!user.faculty_id) throw AppError.forbidden('This faculty account is not linked to a faculty record.');
    if (['RESIGNED', 'RETIRED', 'SUSPENDED'].includes(String(user.faculty_status ?? '')))
      throw AppError.forbidden('This faculty account is inactive. Contact the administrator.');
  }
}

/** A cryptographically random, one-time credential returned only to the administrator creating the account. */
export function generateTemporaryPassword(): string {
  return randomBytes(18).toString('base64url');
}

export async function login(email: string, password: string, ctx: LoginContext = {}) {
  const normalizedEmail = email.toLowerCase().trim();
  if (env.nodeEnv === 'production' && SEEDED_DEMO_EMAILS.has(normalizedEmail)) {
    throw AppError.unauthorized('Seeded demo accounts are disabled in production.');
  }
  const user = await repo.findUserByEmail(normalizedEmail);

  if (!user) {
    await audit({ action: 'LOGIN_FAILED', entity: 'users', description: `Unknown email ${email}`, ip: ctx.ip, userAgent: ctx.userAgent });
    throw AppError.unauthorized('Invalid email or password');
  }
  if (!user.is_active) throw AppError.forbidden('This account has been deactivated. Contact the administrator.');
  assertLinkedAccountIsUsable(user);
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw AppError.forbidden('Account locked after too many failed attempts. Try again in 15 minutes.');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const attempts = Number(user.failed_attempts ?? 0) + 1;
    await repo.registerFailedLogin(user.user_id, attempts);
    await audit({
      userId: user.user_id, action: 'LOGIN_FAILED', entity: 'users', entityId: user.user_id,
      description: `Failed login attempt ${attempts}`, ip: ctx.ip, userAgent: ctx.userAgent,
    });
    throw AppError.unauthorized('Invalid email or password');
  }

  const authUser: AuthUser = {
    userId: user.user_id,
    role: user.role_code as AuthUser['role'],
    email: user.email,
    studentId: user.student_id ?? undefined,
    facultyId: user.faculty_id ?? undefined,
    name: [user.s_first ?? user.f_first, user.s_last ?? user.f_last].filter(Boolean).join(' ')
      || user.roll_number || user.employee_code || user.email,
    mustChangePassword: Boolean(user.is_first_login),
  };

  const accessToken = signAccessToken(authUser);
  const refreshToken = signRefreshToken(authUser);
  await repo.touchLogin(user.user_id);
  await repo.saveRefreshToken(user.user_id, refreshToken);
  await audit({
    userId: user.user_id, action: 'LOGIN', entity: 'users', entityId: user.user_id,
    description: `${authUser.role} signed in`, ip: ctx.ip, userAgent: ctx.userAgent,
  });

  return {
    user: { ...authUser, mustChangePassword: Boolean(user.is_first_login) },
    accessToken,
    refreshToken,
    expiresIn: env.jwt.expiresIn,
  };
}

export async function refresh(token: string, ctx: LoginContext = {}) {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
  const user = await repo.findUserById(Number(payload.sub));
  if (!user || !user.is_active) throw AppError.unauthorized('Account no longer active');
  if (env.nodeEnv === 'production' && SEEDED_DEMO_EMAILS.has(user.email.toLowerCase())) {
    throw AppError.unauthorized('Seeded demo accounts are disabled in production.');
  }
  assertLinkedAccountIsUsable(user);
  if (user.refresh_token !== token) throw AppError.unauthorized('Refresh token has been revoked');

  const authUser: AuthUser = {
    userId: user.user_id,
    role: user.role_code as AuthUser['role'],
    email: user.email,
    studentId: user.student_id ?? undefined,
    facultyId: user.faculty_id ?? undefined,
    mustChangePassword: Boolean(user.is_first_login),
  };
  const accessToken = signAccessToken(authUser);
  const refreshToken = signRefreshToken(authUser);
  await repo.saveRefreshToken(user.user_id, refreshToken);
  return { accessToken, refreshToken, expiresIn: env.jwt.expiresIn };
}

export async function logout(userId: number, ctx: LoginContext = {}) {
  await repo.clearRefreshToken(userId);
  await audit({ userId, action: 'LOGOUT', entity: 'users', entityId: userId, description: 'Signed out', ip: ctx.ip });
  return { loggedOut: true };
}

export async function me(userId: number) {
  const user = await repo.findUserById(userId);
  if (!user) throw AppError.notFound('User');
  return user;
}

export async function changePassword(userId: number, current: string, next: string) {
  const hashCurrent = await repo.hashForUser(userId);
  if (!hashCurrent) throw AppError.notFound('User');
  const valid = await bcrypt.compare(current, hashCurrent);
  if (!valid) throw AppError.validation('Your current password is incorrect');
  if (next.length < 8) throw AppError.validation('The new password must be at least 8 characters long');
  const hash = await bcrypt.hash(next, env.bcryptRounds);
  await repo.updatePassword(userId, hash);
  await audit({ userId, action: 'UPDATE', entity: 'users', entityId: userId, description: 'Password changed' });
  return { changed: true };
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.bcryptRounds);
}

export const listRoles = repo.roles;
export const listUsers = repo.listUsers;
export const createUser = repo.createUser;
