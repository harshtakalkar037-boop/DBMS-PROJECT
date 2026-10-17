import { useEffect, useRef, useState, type ComponentType, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { errMsg } from '../lib/api';
import { Field } from '../components/ui';
import { BrandLogo } from '../components/brand/BrandLogo';
import type { DemoAccount } from '../config/demoAccounts';
import { demoMode } from '../lib/demoMode';
import { SEED_DATA_NOTICE } from '../data/pict/institution';

type DemoPanelProps = { onPick: (account: DemoAccount) => void; disabled?: boolean };

export default function LoginPage() {
  const { login, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const submittingRef = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoPicked, setDemoPicked] = useState(false);
  const [DemoPanel, setDemoPanel] = useState<ComponentType<DemoPanelProps> | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let active = true;
    void import('../components/auth/DemoAccountPanel')
      .then((module) => { if (active) setDemoPanel(() => module.DemoAccountPanel); })
      .catch(() => { if (active) setError('The local demo account panel could not be loaded.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || location.hash !== '#demo' || !DemoPanel) return;
    const frame = requestAnimationFrame(() => document.getElementById('demo')?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [location.hash, DemoPanel]);

  useEffect(() => {
    if (user && !submittingRef.current) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const pickDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setDemoPicked(true);
    setError(null);
    requestAnimationFrame(() => emailRef.current?.focus());
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return;

    submittingRef.current = true;
    setBusy(true);
    setError(null);

    try {
      await login(email.trim(), password, remember);
      if (import.meta.env.DEV && demoPicked) demoMode.enable();
      else demoMode.disable();

      submittingRef.current = false;
      setBusy(false);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      submittingRef.current = false;
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="login-page min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <header className="mb-6 text-center">
              <BrandLogo offlineOnly size={42} className="mx-auto" />
              <h1 className="mt-3 text-xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-2xl">
                University Higher Education ERP System
              </h1>
              <p className="mt-2 text-sm text-slate-600">Academic and campus management portal</p>
            </header>

            <form onSubmit={submit} className="space-y-1">
              <Field
                id="login-email"
                label="College email"
                type="email"
                inputRef={emailRef}
                value={email}
                onChange={(event) => { setEmail(event.target.value); setDemoPicked(false); }}
                placeholder="name@pict.edu"
                required
                autoComplete="username"
                autoFocus
                className="bg-white text-slate-900 placeholder:text-slate-400"
              />

              <div className="field">
                <label className="label" htmlFor="login-password">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    className="input bg-white pr-11 text-slate-900 placeholder:text-slate-400"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setDemoPicked(false); }}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-slate-500 transition-colors hover:text-slate-900"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
                  />
                  Remember me
                </label>
              </div>

              {error ? (
                <p role="alert" className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="btn-primary w-full justify-center rounded-md bg-blue-900 hover:bg-blue-800"
                disabled={busy}
              >
                {busy ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  <><LogIn className="h-4 w-4" aria-hidden="true" /> Login</>
                )}
              </button>
            </form>

            <div className="mt-5 border-t border-slate-200 pt-4 text-center">
              <p className="text-sm text-slate-600">
                New student?{' '}
                <Link to="/admissions/apply" className="font-semibold text-blue-900 underline-offset-4 hover:underline">
                  Create New Account
                </Link>
              </p>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Student access is activated only after an application is approved.
              </p>
            </div>
          </section>

          {import.meta.env.DEV && DemoPanel ? (
            <>
              <div className="mt-4">
                <DemoPanel onPick={pickDemo} disabled={busy} />
              </div>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">{SEED_DATA_NOTICE}</p>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
