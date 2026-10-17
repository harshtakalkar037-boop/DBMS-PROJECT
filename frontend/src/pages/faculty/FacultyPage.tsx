import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Download, Pencil, Plus, Users } from 'lucide-react';
import { api, errMsg } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/toast';
import {
  Card, PageHeader, StatCard, SearchInput, SelectField, Field, Modal,
  DataTable, Pagination, StatusBadge, ErrorBox, useFetch, useDebounced, type Column,
} from '../../components/ui';
import { downloadCsv } from '../../lib/csv';
import { dateStr, money, num, titleCase } from '../../lib/format';

interface FacultyRow {
  faculty_id: number; user_id: number; employee_code: string; first_name: string; last_name: string;
  email: string; phone: string | null; departmentCode: string; departmentName: string;
  designation: string; designation_id: number; department_id: number;
  employment_type: string; experience_years: number; basic_salary: string; hra: string; da: string;
  ta: string; special_allowance: string; pf_percent: string; bank_account: string | null;
  qualification: string | null; specialization: string | null; date_of_birth: string; joining_date: string;
  gender: string; status: string; loginActive: boolean | number; latestNetSalary?: string;
}
interface Stats { total: number; active: string; onLeave: string; pendingLeaves: number; payslips: number; }
interface Department { department_id: number; department_code: string; name: string; }
interface Designation { designation_id: number; designation_code: string; title: string; grade: string | null; }
interface Options { departments: Department[]; designations: Designation[]; }
interface Credentials { facultyId: number; employeeCode: string; email: string; password: string; }

const STATUSES = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'RETIRED'];
const EMPLOYMENT_TYPES = ['REGULAR', 'CONTRACT', 'VISITING', 'ADJUNCT'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const EMPTY = {
  employeeCode: '', firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '',
  departmentId: '', designationId: '', joiningDate: '', employmentType: 'REGULAR', qualification: '',
  specialization: '', experienceYears: '', basicSalary: '', hra: '', da: '', ta: '',
  specialAllowance: '', pfPercent: '12', bankAccount: '', status: 'ACTIVE',
};

export default function FacultyPage() {
  const toast = useToast();
  const { has } = useAuth();
  const canManage = has('ADMIN', 'HR');
  const canViewStats = canManage;
  const canViewCompensation = canManage;

  const [search, setSearch] = useState('');
  const [deptId, setDeptId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounced(search, 350);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FacultyRow | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [accountBusy, setAccountBusy] = useState<number | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  const params = useMemo(() => ({
    page, limit: 25, search: term || undefined,
    departmentId: deptId || undefined, status: status || undefined,
  }), [page, term, deptId, status]);
  const { data, loading, error, reload } = useFetch(() => api.page<FacultyRow>('/faculty', params), [params]);
  const stats = useFetch(
    () => (canViewStats ? api.get<Stats>('/faculty/stats') : Promise.resolve<Stats>({ total: 0, active: '0', onLeave: '0', pendingLeaves: 0, payslips: 0 })),
    [canViewStats],
  );
  const departments = useFetch(
    () => api.get<Department[]>('/academics/departments', { limit: 100 }), [],
  );
  const masterOptions = useFetch(
    () => (canManage ? api.get<Options>('/faculty/options') : Promise.resolve<Options>({ departments: [], designations: [] })),
    [canManage],
  );
  const rows = data?.rows ?? [];
  const departmentChoices = masterOptions.data?.departments?.length ? masterOptions.data.departments : (departments.data ?? []);

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const startEdit = (row: FacultyRow) => {
    setEditing(row);
    setForm({
      employeeCode: row.employee_code,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone ?? '',
      dateOfBirth: String(row.date_of_birth ?? '').slice(0, 10),
      gender: row.gender,
      departmentId: String(row.department_id),
      designationId: String(row.designation_id),
      joiningDate: String(row.joining_date ?? '').slice(0, 10),
      employmentType: row.employment_type,
      qualification: row.qualification ?? '',
      specialization: row.specialization ?? '',
      experienceYears: String(row.experience_years ?? 0),
      basicSalary: String(row.basic_salary ?? ''),
      hra: String(row.hra ?? ''),
      da: String(row.da ?? ''),
      ta: String(row.ta ?? ''),
      specialAllowance: String(row.special_allowance ?? ''),
      pfPercent: String(row.pf_percent ?? 12),
      bankAccount: row.bank_account ?? '',
      status: row.status,
    });
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const body = {
      employeeCode: form.employeeCode.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone || undefined,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      departmentId: Number(form.departmentId),
      designationId: Number(form.designationId),
      joiningDate: form.joiningDate,
      employmentType: form.employmentType,
      qualification: form.qualification || undefined,
      specialization: form.specialization || undefined,
      experienceYears: form.experienceYears === '' ? undefined : Number(form.experienceYears),
      basicSalary: form.basicSalary === '' ? undefined : Number(form.basicSalary),
      hra: form.hra === '' ? undefined : Number(form.hra),
      da: form.da === '' ? undefined : Number(form.da),
      ta: form.ta === '' ? undefined : Number(form.ta),
      specialAllowance: form.specialAllowance === '' ? undefined : Number(form.specialAllowance),
      pfPercent: form.pfPercent === '' ? undefined : Number(form.pfPercent),
      bankAccount: form.bankAccount || undefined,
      status: form.status,
    };
    try {
      if (editing) {
        const { employeeCode: _employeeCode, dateOfBirth: _dob, joiningDate: _joiningDate, ...patch } = body;
        await api.put(`/faculty/${editing.faculty_id}`, patch);
        toast.success(`Faculty record ${editing.employee_code} was updated.`);
      } else {
        const result = await api.post<{ facultyId: number; userId: number; temporaryPassword?: string }>('/faculty', body);
        toast.success(`Faculty member ${form.employeeCode} was saved to the database.`);
        if (result.temporaryPassword) {
          setCredentials({ facultyId: result.facultyId, employeeCode: form.employeeCode.trim(), email: form.email.trim().toLowerCase(), password: result.temporaryPassword });
          setCopied(false);
        }
      }
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
      reload();
      stats.reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleAccount = async (row: FacultyRow) => {
    const active = row.loginActive === true || Number(row.loginActive) === 1;
    if (active && !window.confirm(`Deactivate the login for ${row.first_name} ${row.last_name}? They will no longer be able to sign in.`)) return;
    const next = !active;
    if (next && ['SUSPENDED', 'RESIGNED', 'RETIRED'].includes(row.status)) {
      toast.error('Set the faculty status to Active or On leave before reactivating the login.');
      return;
    }
    setAccountBusy(row.faculty_id);
    try {
      await api.patch(`/faculty/${row.faculty_id}/account-status`, { active: next });
      toast.success(next ? 'Faculty login activated.' : 'Faculty login deactivated.');
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setAccountBusy(null); }
  };

  const copyTemporaryPassword = async () => {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(credentials.password);
      setCopied(true);
      toast.success('Temporary password copied.');
    } catch { toast.error('Could not copy automatically; select the password and copy it.'); }
  };

  const columns: Column<FacultyRow>[] = [
    {
      key: 'employee_code', header: 'Employee',
      render: (row) => (
        <div>
          {canManage
            ? <Link to={`/faculty/${row.faculty_id}`} className="font-medium text-brand-700 hover:underline">{row.employee_code}</Link>
            : <span className="font-medium text-slate-800">{row.employee_code}</span>}
          <p className="text-[11px] text-slate-500">{row.email}</p>
        </div>
      ),
    },
    { key: 'name', header: 'Name', csv: (row) => `${row.first_name} ${row.last_name}`, render: (row) => <span className="font-medium text-slate-800">{row.first_name} {row.last_name}</span> },
    { key: 'designation', header: 'Designation' },
    { key: 'departmentCode', header: 'Dept', render: (row) => <span className="chip bg-slate-100 text-slate-600">{row.departmentCode}</span> },
    { key: 'employment_type', header: 'Employment', render: (row) => titleCase(row.employment_type) },
    { key: 'experience_years', header: 'Exp (yrs)', align: 'right' },
    ...(canViewCompensation ? [
      { key: 'basic_salary', header: 'Basic', align: 'right' as const, render: (row: FacultyRow) => money(row.basic_salary) },
      { key: 'latestNetSalary', header: 'Latest net', align: 'right' as const, render: (row: FacultyRow) => row.latestNetSalary ? money(row.latestNetSalary) : <span className="text-slate-400">—</span> },
    ] : []),
    { key: 'joining_date', header: 'Joined', render: (row) => dateStr(row.joining_date) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    ...(canManage ? [{
      key: 'actions', header: 'Manage', align: 'right' as const,
      render: (row: FacultyRow) => (
        <div className="flex justify-end gap-1.5">
          <button type="button" className="btn-secondary btn-xs" onClick={() => startEdit(row)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
          <button type="button" className={row.loginActive === true || Number(row.loginActive) === 1 ? 'btn-danger btn-xs' : 'btn-secondary btn-xs'} onClick={() => toggleAccount(row)} disabled={accountBusy === row.faculty_id}>
            {accountBusy === row.faculty_id ? 'Updating…' : row.loginActive === true || Number(row.loginActive) === 1 ? 'Deactivate login' : 'Activate login'}
          </button>
        </div>
      ),
    }] : []),
  ];

  return (
    <>
      <PageHeader
        title="Faculty"
        subtitle="One shared faculty master used by academics, attendance, leave and payroll."
        icon={<Users className="h-5 w-5" />}
        actions={(
          <>
            <button type="button" className="btn-secondary btn-sm" disabled={!rows.length} onClick={() => downloadCsv('faculty.csv', rows as unknown as Record<string, unknown>[], columns.map((column) => ({ key: column.key, label: column.header })))}>
              <Download className="h-4 w-4" /> Export CSV
            </button>
            {canManage ? <button type="button" className="btn-primary btn-sm" onClick={startCreate}><Plus className="h-4 w-4" /> Add faculty</button> : null}
          </>
        )}
      />

      {canViewStats ? (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Faculty" value={num(stats.data?.total)} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Active" value={num(stats.data?.active)} tone="emerald" />
          <StatCard label="On leave" value={num(stats.data?.onLeave)} tone="sky" />
          <StatCard label="Pending leave requests" value={num(stats.data?.pendingLeaves)} tone="amber" />
          <StatCard label="Payslips issued" value={num(stats.data?.payslips)} tone="slate" />
        </div>
      ) : null}

      <Card className="mb-4">
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Name, employee code or email…" />
          <SelectField placeholder="All departments" value={deptId} onChange={(event) => { setDeptId(event.target.value); setPage(1); }} options={departmentChoices.map((department) => ({ value: department.department_id, label: `${department.department_code} — ${department.name}` }))} />
          <SelectField placeholder="All statuses" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} options={STATUSES.map((value) => ({ value, label: titleCase(value) }))} />
        </div>
      </Card>

      <Card>
        {error ? <ErrorBox message={error} onRetry={reload} /> : (
          <>
            <DataTable columns={columns} rows={rows} loading={loading} rowKey={(row) => row.faculty_id} empty="No faculty match these filters" />
            <Pagination page={data?.meta.page ?? 1} totalPages={data?.meta.totalPages ?? 1} total={data?.meta.total ?? 0} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => { if (!busy) setOpen(false); }}
        title={editing ? `Edit ${editing.employee_code}` : 'Add faculty member'}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
            <button type="submit" form="faculty-form" className="btn-primary btn-sm" disabled={busy || masterOptions.loading || !!masterOptions.error}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create faculty account'}
            </button>
          </>
        )}
      >
        <form id="faculty-form" onSubmit={submit} className="grid gap-x-4 sm:grid-cols-2">
          {masterOptions.loading ? <p className="sm:col-span-2 text-sm text-slate-500">Loading departments and designations…</p> : null}
          {masterOptions.error ? (
            <div role="alert" className="sm:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              Could not load faculty master options: {masterOptions.error}{' '}
              <button type="button" className="font-medium underline" onClick={masterOptions.reload}>Retry</button>
            </div>
          ) : null}
          <Field label="Employee code" required maxLength={20} value={form.employeeCode} onChange={(event) => setForm({ ...form, employeeCode: event.target.value })} disabled={!!editing} />
          <Field label="First name" required maxLength={80} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          <Field label="Last name" required maxLength={80} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          <Field label="Login email" type="email" required maxLength={150} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Field label="Phone" type="tel" minLength={6} maxLength={20} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <Field label="Date of birth" type="date" required value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} disabled={!!editing} />
          <SelectField label="Gender" placeholder="Select gender" required value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} options={GENDERS.map((value) => ({ value, label: titleCase(value) }))} disabled={!!editing} />
          <SelectField
            label="Department / branch"
            placeholder="Select a department"
            required
            value={form.departmentId}
            onChange={(event) => setForm({ ...form, departmentId: event.target.value })}
            options={(masterOptions.data?.departments ?? []).map((department) => ({ value: department.department_id, label: `${department.department_code} — ${department.name}` }))}
          />
          <SelectField
            label="Designation"
            placeholder="Select a designation"
            required
            value={form.designationId}
            onChange={(event) => setForm({ ...form, designationId: event.target.value })}
            options={(masterOptions.data?.designations ?? []).map((designation) => ({ value: designation.designation_id, label: `${designation.title} (${designation.designation_code})` }))}
          />
          <Field label="Joining date" type="date" required value={form.joiningDate} onChange={(event) => setForm({ ...form, joiningDate: event.target.value })} disabled={!!editing} />
          <SelectField label="Employment type" required value={form.employmentType} onChange={(event) => setForm({ ...form, employmentType: event.target.value })} options={EMPLOYMENT_TYPES.map((value) => ({ value, label: titleCase(value) }))} />
          <Field label="Qualification" maxLength={150} value={form.qualification} onChange={(event) => setForm({ ...form, qualification: event.target.value })} />
          <Field label="Specialization" maxLength={150} value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} />
          <Field label="Experience (years)" type="number" min={0} max={80} value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: event.target.value })} />
          <SelectField label="Access role" value="FACULTY" disabled options={[{ value: 'FACULTY', label: 'Faculty — permissions managed by RBAC' }]} />
          {canViewCompensation ? (
            <>
              <Field label="Basic salary" type="number" min={0} step="0.01" value={form.basicSalary} onChange={(event) => setForm({ ...form, basicSalary: event.target.value })} />
              <Field label="HRA" type="number" min={0} step="0.01" value={form.hra} onChange={(event) => setForm({ ...form, hra: event.target.value })} />
              <Field label="DA" type="number" min={0} step="0.01" value={form.da} onChange={(event) => setForm({ ...form, da: event.target.value })} />
              <Field label="TA" type="number" min={0} step="0.01" value={form.ta} onChange={(event) => setForm({ ...form, ta: event.target.value })} />
              <Field label="Special allowance" type="number" min={0} step="0.01" value={form.specialAllowance} onChange={(event) => setForm({ ...form, specialAllowance: event.target.value })} />
              <Field label="PF (%)" type="number" min={0} max={25} step="0.01" value={form.pfPercent} onChange={(event) => setForm({ ...form, pfPercent: event.target.value })} />
              <Field label="Bank account (optional)" maxLength={30} value={form.bankAccount} onChange={(event) => setForm({ ...form, bankAccount: event.target.value })} />
            </>
          ) : null}
          {editing ? <SelectField label="Employment status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} options={STATUSES.map((value) => ({ value, label: titleCase(value) }))} /> : null}
          {!editing ? <p className="sm:col-span-2 text-xs leading-5 text-slate-500">A secure temporary password is generated if one is not supplied. It will be shown only once after the record is saved. The new account has the Faculty role; access is controlled by the existing RBAC permissions.</p> : null}
        </form>
      </Modal>

      <Modal
        open={!!credentials}
        onClose={() => setCredentials(null)}
        title="Faculty account created"
        size="sm"
        footer={<button type="button" className="btn-primary btn-sm" onClick={() => setCredentials(null)}>Done</button>}
      >
        {credentials ? (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">The faculty record and login were saved. Share the temporary password through a trusted channel; this is the only time it will be shown.</p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Faculty / employee code</p>
              <p className="font-medium text-slate-900">{credentials.facultyId} · {credentials.employeeCode}</p>
              <p className="mt-3 text-xs text-slate-500">Login email</p>
              <p className="break-all font-medium text-slate-900">{credentials.email}</p>
              <p className="mt-3 text-xs text-slate-500">Temporary password</p>
              <code className="mt-1 block select-all break-all rounded bg-white px-2 py-1.5 font-mono text-slate-900">{credentials.password}</code>
            </div>
            <button type="button" className="btn-secondary btn-sm" onClick={copyTemporaryPassword}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy temporary password'}</button>
            <p className="text-xs text-slate-500">The user will be asked to change the password at first sign-in.</p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
