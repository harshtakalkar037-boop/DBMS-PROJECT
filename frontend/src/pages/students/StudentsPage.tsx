import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Download, GraduationCap, Plus } from 'lucide-react';
import { api, errMsg } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/toast';
import {
  Card,
  PageHeader,
  StatCard,
  SearchInput,
  SelectField,
  Field,
  Modal,
  DataTable,
  Pagination,
  StatusBadge,
  ErrorBox,
  useFetch,
  useDebounced,
  type Column,
} from '../../components/ui';
import { downloadCsv } from '../../lib/csv';
import { money, num, titleCase } from '../../lib/format';

interface Student {
  student_id: number;
  roll_number: string;
  registration_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  department_code: string;
  department_name: string;
  program_code: string;
  batch_code: string;
  current_semester_no: number;
  admission_year: number;
  status: string;
  cgpa: string;
  backlog_count: number;
  outstanding_dues?: string;
  gender: string;
  login_active: boolean;
}
interface Stats { total: number; active: string; suspended: string; inactive: string; male: string; female: string; }
interface AdmissionStats { applied: string; underReview: string; }
interface Program { program_id: number; program_name: string; program_code: string; department_id: number; }
interface Department { department_id: number; department_code: string; name: string; }
interface Category { category_id: number; category_name: string; }
interface Batch { batch_id: number; batch_code: string; program_id: number; start_year: number; status: string; }
interface AcademicYear { year_label: string; is_current: boolean; }

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'ALUMNI'];
const EMPTY_FORM = {
  firstName: '', middleName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
  gender: '', programId: '', departmentId: '', categoryId: '', batchId: '',
  admissionYear: '', currentSemesterNo: '1', rollNumber: '', registrationNumber: '',
};

export default function StudentsPage() {
  const { has } = useAuth();
  const toast = useToast();
  const canEdit = has('ADMIN');
  const canViewDues = has('ADMIN', 'ACCOUNTANT');
  const canViewStats = has('ADMIN', 'FACULTY', 'EXAM_CELL');

  const [search, setSearch] = useState('');
  const [deptId, setDeptId] = useState('');
  const [status, setStatus] = useState('');
  const [semester, setSemester] = useState('');
  const [admissionYear, setAdmissionYear] = useState('');
  const [gender, setGender] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounced(search, 350);

  const depts = useFetch(() => api.get<Department[]>('/academics/departments', { limit: 100 }), []);
  const programs = useFetch(() => api.get<Program[]>('/academics/programs/all', { limit: 200 }), []);
  const categories = useFetch(() => api.get<Category[]>('/academics/categories'), []);
  const batches = useFetch(() => api.get<Batch[]>('/academics/batches', { limit: 300 }), []);
  const years = useFetch(() => api.get<AcademicYear[]>('/academics/years'), []);
  const stats = useFetch(
    () => (canViewStats ? api.get<Stats>('/students/stats') : Promise.resolve<Stats>({
      total: 0, active: '0', suspended: '0', inactive: '0', male: '0', female: '0',
    })),
    [canViewStats],
  );
  const approvalStats = useFetch(
    () => (canEdit ? api.get<AdmissionStats>('/students/admissions/stats') : Promise.resolve<AdmissionStats>({ applied: '0', underReview: '0' })),
    [canEdit],
  );

  const params = useMemo(() => ({
    page,
    limit: 25,
    search: term || undefined,
    departmentId: deptId || undefined,
    admissionYear: admissionYear || undefined,
    status: status || undefined,
    semester: semester || undefined,
    gender: gender || undefined,
  }), [page, term, deptId, admissionYear, status, semester, gender]);
  const { data, loading, error, reload } = useFetch(() => api.page<Student>('/students', params), [params]);
  const rows = data?.rows ?? [];

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [credentials, setCredentials] = useState<{ email: string; password: string; studentId: number; rollNumber: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedProgram = (programs.data ?? []).find((program) => String(program.program_id) === form.programId);
  const matchingBatches = (batches.data ?? []).filter((batch) =>
    String(batch.program_id) === form.programId
    && String(batch.start_year) === form.admissionYear
    && batch.status === 'ACTIVE');
  const yearValues = Array.from(new Set([
    ...(years.data ?? []).map((year) => Number(String(year.year_label).slice(0, 4))),
    ...(batches.data ?? []).map((batch) => Number(batch.start_year)),
  ])).filter(Number.isFinite).sort((a, b) => b - a);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.post<{ studentId: number; rollNumber: string; temporaryPassword?: string }>('/students', {
        firstName: form.firstName,
        middleName: form.middleName || undefined,
        lastName: form.lastName,
        email: form.email.trim().toLowerCase(),
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        programId: Number(form.programId),
        departmentId: Number(form.departmentId),
        categoryId: Number(form.categoryId),
        batchId: form.batchId ? Number(form.batchId) : undefined,
        admissionYear: Number(form.admissionYear),
        currentSemesterNo: Number(form.currentSemesterNo),
        rollNumber: form.rollNumber || undefined,
        registrationNumber: form.registrationNumber || undefined,
        status: 'ACTIVE',
      });
      toast.success(`Student ${result.rollNumber} was saved to the database.`);
      setOpen(false);
      setForm(EMPTY_FORM);
      reload();
      stats.reload();
      if (result.temporaryPassword) {
        setCredentials({ email: form.email.trim().toLowerCase(), password: result.temporaryPassword, studentId: result.studentId, rollNumber: result.rollNumber });
        setCopied(false);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const copyTemporaryPassword = async () => {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(credentials.password);
      setCopied(true);
      toast.success('Temporary password copied.');
    } catch {
      toast.error('Could not copy automatically; select the temporary password and copy it.');
    }
  };

  const columns: Column<Student>[] = [
    {
      key: 'roll_number',
      header: 'Roll / PRN',
      csv: (row) => `${row.roll_number} / ${row.registration_number}`,
      render: (row) => (
        <div>
          {canEdit ? (
            <Link to={`/students/${row.student_id}`} className="font-medium text-brand-700 hover:underline">{row.roll_number}</Link>
          ) : <span className="font-medium text-slate-800">{row.roll_number}</span>}
          <p className="max-w-44 truncate text-[11px] text-slate-500">PRN {row.registration_number}</p>
        </div>
      ),
    },
    { key: 'full_name', header: 'Name', csv: (row) => row.full_name, render: (row) => <span className="font-medium text-slate-800">{row.full_name}</span> },
    { key: 'program_code', header: 'Program' },
    { key: 'current_semester_no', header: 'Sem', align: 'right' },
    { key: 'cgpa', header: 'CGPA', align: 'right', render: (row) => num(row.cgpa, 2) },
    ...(canViewDues ? [{ key: 'outstanding_dues', header: 'Dues', align: 'right' as const, render: (row: Student) => money(row.outstanding_dues) }] : []),
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
  ];

  const pendingCount = Number(approvalStats.data?.applied ?? 0) + Number(approvalStats.data?.underReview ?? 0);

  return (
    <>
      <PageHeader
        title="Student Management"
        subtitle="Search the student master, review admission approvals, and manage student records and accounts."
        icon={<GraduationCap className="h-5 w-5" />}
        actions={(
          <>
            {canEdit ? (
              <Link to="/admissions" className="btn-secondary btn-sm">
                Pending approvals{pendingCount > 0 ? ` (${pendingCount})` : ''}
              </Link>
            ) : null}
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={!rows.length}
              onClick={() => downloadCsv('students.csv', rows as unknown as Record<string, unknown>[], columns.map((column) => ({ key: column.key, label: column.header })))}
            ><Download className="h-4 w-4" /> Export CSV</button>
            {canEdit ? (
              <button type="button" className="btn-primary btn-sm" onClick={() => { setForm(EMPTY_FORM); setOpen(true); }}>
                <Plus className="h-4 w-4" /> Add student
              </button>
            ) : null}
          </>
        )}
      />

      {canViewStats ? (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Total students" value={num(stats.data?.total)} icon={<GraduationCap className="h-5 w-5" />} />
          <StatCard label="Active" value={num(stats.data?.active)} tone="emerald" />
          <StatCard label="Suspended" value={num(stats.data?.suspended)} tone="rose" />
          <StatCard label="Male" value={num(stats.data?.male)} tone="sky" />
          <StatCard label="Female" value={num(stats.data?.female)} tone="amber" />
        </div>
      ) : null}

      <Card className="mb-4">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Name, PRN, roll number or email…" className="lg:col-span-2" />
          <SelectField
            placeholder="All branches"
            value={deptId}
            onChange={(event) => { setDeptId(event.target.value); setPage(1); }}
            options={(depts.data ?? []).map((department) => ({ value: department.department_id, label: department.department_code }))}
          />
          <SelectField
            placeholder="All admission years"
            value={admissionYear}
            onChange={(event) => { setAdmissionYear(event.target.value); setPage(1); }}
            options={yearValues.map((year) => ({ value: year, label: String(year) }))}
          />
          <SelectField placeholder="All student statuses" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} options={STATUSES.map((value) => ({ value, label: titleCase(value) }))} />
          <SelectField placeholder="All semesters" value={semester} onChange={(event) => { setSemester(event.target.value); setPage(1); }} options={Array.from({ length: 8 }, (_, index) => ({ value: index + 1, label: `Semester ${index + 1}` }))} />
          <SelectField placeholder="All genders" value={gender} onChange={(event) => { setGender(event.target.value); setPage(1); }} options={GENDERS.map((value) => ({ value, label: titleCase(value) }))} />
        </div>
      </Card>

      <Card>
        {error ? <ErrorBox message={error} onRetry={reload} /> : (
          <>
            <DataTable columns={columns} rows={rows} loading={loading} rowKey={(row) => row.student_id} empty="No students match these filters" />
            <Pagination page={data?.meta.page ?? 1} totalPages={data?.meta.totalPages ?? 1} total={data?.meta.total ?? 0} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => { if (!busy) setOpen(false); }}
        title="Add an approved student record"
        size="lg"
        footer={(
          <>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
            <button type="submit" form="student-create-form" className="btn-primary btn-sm" disabled={busy}>
              {busy ? 'Saving…' : 'Save student'}
            </button>
          </>
        )}
      >
        <p className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900">
          This form creates a student account directly with ACTIVE status. Use Pending Approvals for applicants who still need a decision. A temporary password will be shown once after a successful save.
        </p>
        <form id="student-create-form" onSubmit={submit} className="grid gap-x-4 sm:grid-cols-2">
          <Field label="First name" required maxLength={80} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          <Field label="Middle name" maxLength={80} value={form.middleName} onChange={(event) => setForm({ ...form, middleName: event.target.value })} />
          <Field label="Last name" required maxLength={80} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          <Field label="College email" type="email" required maxLength={150} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Field label="Phone" type="tel" minLength={6} maxLength={20} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <Field label="Date of birth" type="date" required value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} />
          <SelectField label="Gender" placeholder="Select" required value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} options={GENDERS.map((value) => ({ value, label: titleCase(value) }))} />
          <SelectField
            label="Branch"
            placeholder="Select a branch"
            required
            value={form.departmentId}
            onChange={(event) => setForm({ ...form, departmentId: event.target.value, programId: '', batchId: '' })}
            options={(depts.data ?? []).map((department) => ({ value: department.department_id, label: `${department.department_code} — ${department.name}` }))}
          />
          <SelectField
            label="Program"
            placeholder="Select a program"
            required
            value={form.programId}
            onChange={(event) => {
              const program = (programs.data ?? []).find((item) => String(item.program_id) === event.target.value);
              setForm({ ...form, programId: event.target.value, departmentId: program ? String(program.department_id) : '', batchId: '' });
            }}
            options={(programs.data ?? []).map((program) => ({ value: program.program_id, label: `${program.program_name} (${program.program_code})` }))}
            className="sm:col-span-2"
          />
          <SelectField label="Category" placeholder="Select a category" required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} options={(categories.data ?? []).map((category) => ({ value: category.category_id, label: category.category_name }))} />
          <SelectField label="Admission year" placeholder="Select a year" required value={form.admissionYear} onChange={(event) => setForm({ ...form, admissionYear: event.target.value, batchId: '' })} options={yearValues.map((year) => ({ value: year, label: String(year) }))} />
          <SelectField label="Batch" placeholder={form.programId && form.admissionYear ? 'Select a batch' : 'Choose program and year first'} required value={form.batchId} onChange={(event) => setForm({ ...form, batchId: event.target.value })} options={matchingBatches.map((batch) => ({ value: batch.batch_id, label: batch.batch_code }))} />
          <Field label="Current semester" type="number" required min={1} max={12} value={form.currentSemesterNo} onChange={(event) => setForm({ ...form, currentSemesterNo: event.target.value })} />
          <Field label="Roll number (leave blank to generate)" maxLength={20} value={form.rollNumber} onChange={(event) => setForm({ ...form, rollNumber: event.target.value })} />
          <Field label="PRN / registration number (optional)" maxLength={30} value={form.registrationNumber} onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })} className="sm:col-span-2" />
          {selectedProgram ? <p className="sm:col-span-2 text-xs text-slate-500">Program branch: {selectedProgram.program_name}</p> : null}
        </form>
      </Modal>

      <Modal
        open={!!credentials}
        onClose={() => setCredentials(null)}
        title="Student saved"
        size="sm"
        footer={<button type="button" className="btn-primary btn-sm" onClick={() => setCredentials(null)}>Done</button>}
      >
        {credentials ? (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">The student is in the database with ACTIVE status. Share these credentials through a trusted channel; the temporary password is shown once.</p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Student / roll number</p>
              <p className="font-medium text-slate-900">{credentials.studentId} · {credentials.rollNumber}</p>
              <p className="mt-3 text-xs text-slate-500">Login email</p>
              <p className="break-all font-medium text-slate-900">{credentials.email}</p>
              <p className="mt-3 text-xs text-slate-500">Temporary password</p>
              <code className="mt-1 block select-all break-all rounded bg-white px-2 py-1.5 font-mono text-slate-900">{credentials.password}</code>
            </div>
            <button type="button" className="btn-secondary btn-sm" onClick={copyTemporaryPassword}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy temporary password'}
            </button>
            <p className="text-xs text-slate-500">The student will be asked to change this password at first sign-in.</p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
