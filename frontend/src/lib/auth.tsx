import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, tokenStore, errMsg } from './api';
import type { AuthUser, LoginResult, Role } from './types';

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  logout: () => void;
  completePasswordChange: () => void;
  has: (...roles: Role[]) => boolean;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Restore a previous session (the JWT is kept in localStorage so a page
  // refresh does not bounce the user back to the login screen).
  useEffect(() => {
    const token = tokenStore.restore();
    if (!token) {
      setReady(true);
      return;
    }
    api
      .get<{ user_id: number; role_code: Role; email: string; is_first_login?: boolean | number }>('/auth/me')
      .then((profile) => {
        // Keep the friendly name from the signed token, but use the database
        // profile for the live first-login/password-change state.
        setUser({ ...decodeUser(token), mustChangePassword: Boolean(profile.is_first_login) });
      })
      .catch(() => {
        tokenStore.set(null);
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  // A 401 on any request drops the session everywhere.
  useEffect(() => {
    tokenStore.onUnauthorized(() => {
      tokenStore.set(null);
      setUser(null);
    });
  }, []);

  const login = useCallback(async (email: string, password: string, remember = true) => {
    const res = await api.post<LoginResult>('/auth/login', { email, password });
    tokenStore.set(res.accessToken, remember);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    api.post('/auth/logout').catch(() => undefined);
    tokenStore.set(null);
    setUser(null);
  }, []);

  const completePasswordChange = useCallback(() => {
    setUser((current) => current ? { ...current, mustChangePassword: false } : current);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      login,
      logout,
      completePasswordChange,
      has: (...roles: Role[]) => !!user && roles.includes(user.role),
    }),
    [user, ready, login, logout, completePasswordChange],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

function decodeUser(token: string): AuthUser {
  try {
    const payload = token.split('.')[1] ?? '';
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return {
      userId: Number(json.sub),
      role: json.role,
      email: json.email,
      name: json.name ?? json.email,
      studentId: json.studentId ?? null,
      facultyId: json.facultyId ?? null,
      mustChangePassword: Boolean(json.mustChangePassword),
    };
  } catch {
    return { userId: 0, role: 'STUDENT', email: '', name: '' };
  }
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export { errMsg };
