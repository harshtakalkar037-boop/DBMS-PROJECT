import { useState } from 'react';
import { UserCircle, KeyRound, ShieldCheck } from 'lucide-react';
import { api, errMsg } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/toast';
import { Card, PageHeader, Field, Loading, ErrorBox, useFetch, Badge } from '../components/ui';
import { dateTimeStr, initials, colorFor, titleCase } from '../lib/format';
import { ROLE_LABELS } from '../components/nav';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const me = useFetch<Record<string, unknown>>(() => api.get<Record<string, unknown>>('/auth/me'), []);
  const extra = useFetch<Record<string, unknown> | null>(
    () => (user?.role === 'STUDENT'
      ? api.get<Record<string, unknown>>(`/students/${user.studentId}`)
      : user?.role === 'FACULTY'
        ? api.get<Record<string, unknown>>('/faculty/me')
        : Promise.resolve(null)),
    [user?.role, user?.studentId],
  );

  // /students/:id wraps the profile under `student`; /faculty/me returns it flat.
  const profile = ((extra.data as Record<string, unknown> | undefined)?.student
    ?? extra.data) as Record<string, unknown> | null | undefined;

  const changePassword = async () => {
    if (next.length < 8) { toast.error('The new password must be at least 8 characters.'); return; }
    if (next !== confirm) { toast.error('The two new passwords do not match.'); return; }
    setBusy(true);
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      toast.success('Password changed. Please sign in again.');
      setCurrent(''); setNext(''); setConfirm('');
      window.setTimeout(logout, 1200);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const fields: [string, unknown][] = profile
    ? (user?.role === 'STUDENT'
      ? [
        ['Roll number', profile.roll_number], ['Registration no.', profile.registration_number],
        ['Program', profile.program_name], ['Department', profile.department_name],
        ['Batch', profile.batch_code], ['Current semester', profile.current_semester_no],
        ['Admission year', profile.admission_year], ['Category', profile.category_name],
        ['Blood group', profile.blood_group], ['Date of birth', profile.date_of_birth],
      ]
      : user?.role === 'FACULTY'
        ? [
          ['Employee code', profile.employee_code], ['Designation', profile.designation],
          ['Department', profile.department_name], ['Employment type', profile.employment_type],
          ['Qualification', profile.qualification], ['Specialization', profile.specialization],
          ['Experience (years)', profile.experience_years], ['Joining date', profile.joining_date],
        ]
        : [])
    : [];

  const roleLabel = user ? (ROLE_LABELS[user.role] ?? titleCase(user.role)) : 'User';
  const displayName = user?.name && user.name !== user.email ? user.name : roleLabel;
  const department = String(profile?.department_name ?? profile?.departmentName ?? '').trim()
    || (user?.role === 'ADMIN' ? 'All departments' : user?.role === 'ACCOUNTANT' ? 'Finance Office'
      : user?.role === 'EXAM_CELL' ? 'Examination Cell' : user?.role === 'HOSTEL_ADMIN' ? 'Hostel Administration'
      : user?.role === 'HR' ? 'Human Resources' : 'Not linked');
  const photoUrl = String(profile?.photo_url ?? profile?.photoUrl ?? '').trim();
  const phone = me.data?.phone ?? profile?.phone;
  const active = me.data?.is_active === true || Number(me.data?.is_active) === 1;
  const summaryFields: [string, string][] = [
    ['Role', roleLabel],
    ['Department / scope', department],
    ['Contact', phone ? String(phone) : 'Not provided'],
    ['Account status', me.data ? (active ? 'Active' : 'Inactive') : 'Loading'],
  ];

  return (
    <>
      <PageHeader title="My profile" subtitle="Your account, role and record as stored in the ERP database." icon={<UserCircle className="h-5 w-5" />} />

      <Card className="card-pad mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-bold text-white ring-2 ring-brand-100 dark:ring-brand-900"
            style={{ background: colorFor(displayName) }}
            aria-label="Profile photo"
          >
            {photoUrl && !photoFailed ? (
              <img src={photoUrl} alt={`${displayName} profile`} className="h-full w-full object-cover" onError={() => setPhotoFailed(true)} />
            ) : initials(displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-ink">{displayName}</h2>
            <p className="text-sm text-ink-muted">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge className="bg-brand-100 text-brand-700">{roleLabel}</Badge>
              <Badge className="bg-surface-2 text-ink-muted">{department}</Badge>
              {user?.studentId ? <Badge className="bg-surface-2 text-ink-muted">Student #{user.studentId}</Badge> : null}
              {user?.facultyId ? <Badge className="bg-surface-2 text-ink-muted">Faculty #{user.facultyId}</Badge> : null}
              {me.data ? <Badge className={active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>{active ? 'Active account' : 'Inactive account'}</Badge> : null}
            </div>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryFields.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">{k}</dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-ink">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Account</h2></div>
          {me.loading ? <Loading /> : me.error ? <ErrorBox message={me.error} onRetry={me.reload} /> : (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 text-sm">
              {[
                ['User id', me.data?.user_id], ['Role', titleCase(String(me.data?.role_code))],
                ['Phone', me.data?.phone], ['Active', me.data?.is_active ? 'Yes' : 'No'],
                ['Last login', dateTimeStr(me.data?.last_login_at)], ['Created', dateTimeStr(me.data?.created_at)],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">{String(k)}</dt>
                  <dd className="truncate font-medium text-slate-800">{String(v ?? '—')}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>

        <Card>
          <div className="border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">My record</h2></div>
          {extra.loading ? <Loading /> : !fields.length ? (
            <p className="px-4 py-6 text-sm text-slate-500">
              This account is authorised by its assigned role and is not linked to a student or faculty master record.
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 text-sm">
              {fields.map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">{k}</dt>
                  <dd className="truncate font-medium text-slate-800">{String(v ?? '—')}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      </div>

      <Card className="card-pad mt-4 max-w-xl">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <ShieldCheck className="h-4 w-4" /> Change password
        </h2>
        <Field label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        <Field label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" hint="At least 8 characters" />
        <Field label="Confirm new password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        <button type="button" className="btn-primary btn-sm" onClick={changePassword} disabled={busy || !current || !next || !confirm}>
          <KeyRound className="h-4 w-4" /> {busy ? 'Changing…' : 'Change password'}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Passwords are stored as bcrypt hashes. You will be signed out after a successful change.
        </p>
      </Card>
    </>
  );
}
