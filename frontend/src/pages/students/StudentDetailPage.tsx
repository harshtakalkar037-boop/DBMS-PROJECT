import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, UserCog, FileText, IndianRupee, ClipboardCheck, Award, MapPin, Users as UsersIcon } from 'lucide-react';
import { api, errMsg } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/toast';
import { Card, StatCard, Tabs, StatusBadge, ProgressBar, Loading, ErrorBox, Modal, Field, SelectField, useFetch, type Column, DataTable, EmptyState } from '../../components/ui';
import { initials, colorFor, dateStr, dateTimeStr, money, num, pct, titleCase } from '../../lib/format';
interface Detail {
  student: Record<string, any>;
  addresses: Record<string, any>[];
  guardians: Record<string, any>[];
  documents: Record<string, any>[];
  history: Record<string, any>[];
  fees: Record<string, any>[];
  attendance: Record<string, any>[];
  academics: Record<string, any>[];
}
interface Department { department_id: number; department_code: string; name: string; }
interface Program { program_id: number; program_name: string; program_code: string; department_id: number; }
interface Category { category_id: number; category_name: string; }
interface Batch { batch_id: number; batch_code: string; program_id: number; start_year: number; }

const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'ALUMNI'];
const EMPTY_EDIT = {
  firstName: '', middleName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '',
  departmentId: '', programId: '', categoryId: '', batchId: '', admissionYear: '',
  currentSemesterNo: '1', rollNumber: '', registrationNumber: '',
};

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { has } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('ACTIVE');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [accountBusy, setAccountBusy] = useState(false);
  const departments = useFetch(() => api.get<Department[]>('/academics/departments', { limit: 100 }), []);
  const programs = useFetch(() => api.get<Program[]>('/academics/programs/all', { limit: 200 }), []);
  const categories = useFetch(() => api.get<Category[]>('/academics/categories'), []);
  const batches = useFetch(() => api.get<Batch[]>('/academics/batches', { limit: 300 }), []);

  const { data, loading, error, reload } = useFetch<Detail>(() => api.get<Detail>(`/students/${id}`), [id]);

  if (loading) return <Loading label="Loading student record…" />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const s = data.student ?? {};
  const canManage = has('ADMIN');
  const due = (data.fees ?? []).reduce((t, f) => t + Number(f.due_amount ?? 0), 0);
  const avgAttendance = data.attendance?.length
    ? data.attendance.reduce((t, a) => t + Number(a.attendance_percentage ?? 0), 0) / data.attendance.length
    : 0;
  const latestResult = (data.academics ?? [])[0];
  const accountActive = s.login_active === true || Number(s.login_active) === 1;
  const matchingBatches = (batches.data ?? []).filter((batch) => String(batch.program_id) === editForm.programId && String(batch.start_year) === editForm.admissionYear);

  const openEdit = () => {
    setEditForm({
      firstName: String(s.first_name ?? ''),
      middleName: String(s.middle_name ?? ''),
      lastName: String(s.last_name ?? ''),
      email: String(s.email ?? ''),
      phone: String(s.phone ?? ''),
      dateOfBirth: String(s.date_of_birth ?? '').slice(0, 10),
      gender: String(s.gender ?? ''),
      departmentId: String(s.department_id ?? ''),
      programId: String(s.program_id ?? ''),
      categoryId: String(s.category_id ?? ''),
      batchId: String(s.batch_id ?? ''),
      admissionYear: String(s.admission_year ?? ''),
      currentSemesterNo: String(s.current_semester_no ?? 1),
      rollNumber: String(s.roll_number ?? ''),
      registrationNumber: String(s.registration_number ?? ''),
    });
    setEditOpen(true);
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (editBusy) return;
    setEditBusy(true);
    try {
      await api.put(`/students/${id}`, {
        firstName: editForm.firstName,
        middleName: editForm.middleName || undefined,
        lastName: editForm.lastName,
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone || undefined,
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
        departmentId: Number(editForm.departmentId),
        programId: Number(editForm.programId),
        categoryId: Number(editForm.categoryId),
        batchId: Number(editForm.batchId),
        admissionYear: Number(editForm.admissionYear),
        currentSemesterNo: Number(editForm.currentSemesterNo),
        rollNumber: editForm.rollNumber.trim(),
        registrationNumber: editForm.registrationNumber.trim(),
      });
      toast.success('Student changes were saved to the database.');
      setEditOpen(false);
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setEditBusy(false); }
  };

  const toggleAccount = async () => {
    if (accountBusy) return;
    const active = !accountActive;
    if (!active && !window.confirm('Deactivate this student login? The student will no longer be able to sign in.')) return;
    if (active && ['INACTIVE', 'SUSPENDED'].includes(String(s.status))) {
      toast.error('Set the student record status to Active before reactivating the login.');
      return;
    }
    setAccountBusy(true);
    try {
      await api.patch(`/students/${id}/account-status`, { active });
      toast.success(active ? 'Student login activated.' : 'Student login deactivated.');
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setAccountBusy(false); }
  };

  const saveStatus = async () => {
    if (!reason.trim()) { toast.error('Enter a reason for the status change.'); return; }
    setBusy(true);
    try {
      await api.patch(`/students/${id}/status`, { status: newStatus, reason });
      toast.success(`Status changed to ${titleCase(newStatus)}.`);
      setStatusOpen(false);
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm('Deactivate this student record and block its login? The academic record will remain in the database.')) return;
    setBusy(true);
    try {
      await api.del(`/students/${id}`);
      toast.success('Student account deactivated; the record is retained.');
      navigate('/students');
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const feeCols: Column<Record<string, any>>[] = [
    { key: 'feeCode', header: 'Bill', render: (r) => <span className="font-medium">{String(r.feeCode)}</span> },
    { key: 'semesterNo', header: 'Sem', align: 'right', render: (r) => `Sem ${r.semesterNo}` },
    { key: 'total_amount', header: 'Billed', align: 'right', render: (r) => money(r.total_amount) },
    { key: 'paid_amount', header: 'Paid', align: 'right', render: (r) => money(r.paid_amount) },
    { key: 'due_amount', header: 'Due', align: 'right', render: (r) => <span className={Number(r.due_amount) > 0 ? 'font-semibold text-rose-600' : ''}>{money(r.due_amount)}</span> },
    { key: 'due_date', header: 'Due date', render: (r) => dateStr(r.due_date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ];

  const attCols: Column<Record<string, any>>[] = [
    { key: 'subject_code', header: 'Subject', render: (r) => <span className="font-medium">{String(r.subject_code)}</span> },
    { key: 'subject_name', header: 'Name' },
    { key: 'total_classes', header: 'Classes', align: 'right', render: (r) => num(r.total_classes) },
    { key: 'attended_classes', header: 'Attended', align: 'right', render: (r) => num(r.attended_classes) },
    {
      key: 'attendance_percentage', header: 'Attendance', render: (r) => (
        <div className="flex w-40 items-center gap-2">
          <ProgressBar value={Number(r.attendance_percentage)} />
          <span className="w-14 shrink-0 text-right text-xs">{pct(r.attendance_percentage, 1)}</span>
        </div>
      ),
    },
    { key: 'attendance_status', header: 'Status', render: (r) => <StatusBadge value={r.attendance_status} /> },
  ];

  const acadCols: Column<Record<string, any>>[] = [
    { key: 'semester_id', header: 'Semester', render: (r) => `Semester ${r.semester_no ?? r.semester_id}` },
    { key: 'sgpa', header: 'SGPA', align: 'right', render: (r) => num(r.sgpa, 2) },
    { key: 'cgpa', header: 'CGPA', align: 'right', render: (r) => <b>{num(r.cgpa, 2)}</b> },
    { key: 'earned_credits', header: 'Credits', align: 'right', render: (r) => `${num(r.earned_credits)}/${num(r.total_credits)}` },
    { key: 'backlog_count', header: 'Backlogs', align: 'right', render: (r) => (Number(r.backlog_count) ? <span className="chip bg-rose-100 text-rose-700">{r.backlog_count}</span> : '0') },
    { key: 'result_status', header: 'Result', render: (r) => <StatusBadge value={r.result_status} /> },
  ];

  return (
    <>
      <Link to="/students" className="mb-3 inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>

      <Card className="card-pad mb-4">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white" style={{ background: colorFor(s.full_name) }}>
            {initials(s.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">{String(s.full_name)}</h1>
              <StatusBadge value={s.status} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {String(s.roll_number)} · {String(s.registration_number ?? '')}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {String(s.program_name)} · {String(s.department_name)} · Batch {String(s.batch_code)} · Semester {String(s.current_semester_no)}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {String(s.email)} · {String(s.phone)} · Admitted {dateStr(s.admission_date)}
            </p>
          </div>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary btn-sm" onClick={openEdit}>
                <Pencil className="h-4 w-4" /> Edit details
              </button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => { setNewStatus(String(s.status ?? 'ACTIVE')); setReason(''); setStatusOpen(true); }}>
                <UserCog className="h-4 w-4" /> Change status
              </button>
              <button type="button" className={accountActive ? 'btn-danger btn-sm' : 'btn-secondary btn-sm'} onClick={toggleAccount} disabled={accountBusy}>
                {accountBusy ? 'Updating…' : accountActive ? 'Deactivate login' : 'Activate login'}
              </button>
              <button type="button" className="btn-danger btn-sm" onClick={remove} disabled={busy}><Trash2 className="h-4 w-4" /> Deactivate record</button>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="CGPA" value={num(s.cgpa, 2)} icon={<Award className="h-5 w-5" />} hint={latestResult ? `Latest SGPA ${num(latestResult.sgpa, 2)}` : 'No results yet'} />
        <StatCard label="Backlogs" value={num(s.backlog_count)} icon={<FileText className="h-5 w-5" />} tone={Number(s.backlog_count) > 0 ? 'rose' : 'emerald'} />
        <StatCard label="Attendance" value={pct(avgAttendance, 1)} icon={<ClipboardCheck className="h-5 w-5" />} tone={avgAttendance >= 75 ? 'emerald' : 'rose'} hint={`${data.attendance?.length ?? 0} subjects`} />
        <StatCard label="Outstanding dues" value={money(due)} icon={<IndianRupee className="h-5 w-5" />} tone={due > 0 ? 'amber' : 'emerald'} hint={`${data.fees?.length ?? 0} bills`} />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'attendance', label: 'Attendance', count: data.attendance?.length },
          { key: 'academics', label: 'Results', count: data.academics?.length },
          { key: 'fees', label: 'Fees', count: data.fees?.length },
          { key: 'contacts', label: 'Contacts & documents' },
          { key: 'history', label: 'Status history', count: data.history?.length },
        ]}
      />

      {tab === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Academic profile</h2></div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 text-sm">
              {[
                ['Roll number', s.roll_number], ['Registration no.', s.registration_number],
                ['Program', s.program_name], ['Department', s.department_name],
                ['Batch', s.batch_code], ['Current semester', s.current_semester_no],
                ['Admission year', s.admission_year], ['Category', s.category_name],
                ['Gender', titleCase(s.gender)], ['Blood group', s.blood_group],
                ['Date of birth', dateStr(s.date_of_birth)], ['Enrollments', s.enrollment_count],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">{k}</dt>
                  <dd className="truncate font-medium text-slate-800">{String(v ?? '—')}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <div className="border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Attendance at a glance</h2></div>
            <div className="space-y-2.5 px-4 py-4">
              {(data.attendance ?? []).slice(0, 8).map((a) => (
                <div key={String(a.offering_id)}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="truncate font-medium text-slate-700">{String(a.subject_code)} · {String(a.subject_name)}</span>
                    <span className="shrink-0 text-slate-500">{pct(a.attendance_percentage, 1)}</span>
                  </div>
                  <ProgressBar value={Number(a.attendance_percentage)} />
                </div>
              ))}
              {!data.attendance?.length ? <EmptyState title="No attendance records" /> : null}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'attendance' ? <Card><DataTable columns={attCols} rows={data.attendance ?? []} rowKey={(r) => r.offering_id} empty="No attendance records" /></Card> : null}
      {tab === 'academics' ? <Card><DataTable columns={acadCols} rows={data.academics ?? []} rowKey={(_row, i) => i} empty="No published results" /></Card> : null}
      {tab === 'fees' ? <Card><DataTable columns={feeCols} rows={data.fees ?? []} rowKey={(r) => r.student_fee_id} empty="No fee bills" /></Card> : null}

      {tab === 'contacts' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <MapPin className="h-4 w-4 text-slate-400" /><h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Addresses</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(data.addresses ?? []).map((a) => (
                <div key={a.address_id} className="px-4 py-3 text-sm">
                  <p className="font-medium text-slate-800">{titleCase(a.address_type)}</p>
                  <p className="text-slate-600">{String(a.line1)}{a.line2 ? `, ${a.line2}` : ''}</p>
                  <p className="text-slate-500">{String(a.city)}, {String(a.state)} {String(a.pincode)}</p>
                </div>
              ))}
              {!data.addresses?.length ? <EmptyState title="No addresses on file" /> : null}
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <UsersIcon className="h-4 w-4 text-slate-400" /><h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Guardians</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(data.guardians ?? []).map((g) => (
                <div key={g.guardian_id} className="px-4 py-3 text-sm">
                  <p className="font-medium text-slate-800">{String(g.name)} <span className="text-xs text-slate-500">({titleCase(g.relation)})</span></p>
                  <p className="text-slate-600">{String(g.phone)}{g.email ? ` · ${g.email}` : ''}</p>
                  {g.occupation ? <p className="text-xs text-slate-500">{String(g.occupation)}{g.annual_income ? ` · Annual income ${money(g.annual_income)}` : ''}</p> : null}
                </div>
              ))}
              {!data.guardians?.length ? <EmptyState title="No guardians on file" /> : null}
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <FileText className="h-4 w-4 text-slate-400" /><h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Documents</h2>
            </div>
            <DataTable
              rowKey={(r) => r.id}
              rows={data.documents ?? []}
              empty="No documents uploaded"
              columns={[
                { key: 'docType', header: 'Type', render: (r) => titleCase(r.docType) },
                { key: 'fileName', header: 'File' },
                { key: 'sizeBytes', header: 'Size', align: 'right', render: (r) => `${num(Number(r.sizeBytes) / 1024, 1)} KB` },
                { key: 'isVerified', header: 'Verified', render: (r) => <StatusBadge value={r.isVerified ? 'ACTIVE' : 'PENDING'} /> },
                { key: 'uploadedAt', header: 'Uploaded', render: (r) => dateTimeStr(r.uploadedAt) },
              ]}
            />
          </Card>
        </div>
      ) : null}

      {tab === 'history' ? (
        <Card>
          {data.history?.length ? (
            <DataTable
              rowKey={(_row, i) => i}
              rows={data.history}
              empty="No status changes"
              columns={[
                { key: 'old_status', header: 'From', render: (r) => <StatusBadge value={r.old_status} /> },
                { key: 'new_status', header: 'To', render: (r) => <StatusBadge value={r.new_status} /> },
                { key: 'reason', header: 'Reason', render: (r) => String(r.reason ?? '—') },
                { key: 'changed_at', header: 'When', render: (r) => dateTimeStr(r.changed_at ?? r.created_at) },
              ]}
            />
          ) : <EmptyState title="Status has never changed" hint="The trigger trg_students_au_status_history records every change." />}
        </Card>
      ) : null}

      <Modal
        open={editOpen}
        onClose={() => { if (!editBusy) setEditOpen(false); }}
        title={`Edit ${String(s.roll_number ?? 'student')}`}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setEditOpen(false)} disabled={editBusy}>Cancel</button>
            <button type="submit" form="student-edit-form" className="btn-primary btn-sm" disabled={editBusy}>{editBusy ? 'Saving…' : 'Save changes'}</button>
          </>
        )}
      >
        <form id="student-edit-form" onSubmit={saveEdit} className="grid gap-x-4 sm:grid-cols-2">
          <Field label="First name" required maxLength={80} value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
          <Field label="Middle name" maxLength={80} value={editForm.middleName} onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })} />
          <Field label="Last name" required maxLength={80} value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
          <Field label="Login email" type="email" required maxLength={150} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <Field label="Phone" type="tel" minLength={6} maxLength={20} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <Field label="Date of birth" type="date" required value={editForm.dateOfBirth} onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })} />
          <SelectField label="Gender" required value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} options={['MALE', 'FEMALE', 'OTHER'].map((x) => ({ value: x, label: titleCase(x) }))} />
          <SelectField
            label="Department / branch"
            required
            value={editForm.departmentId}
            onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value, programId: '' })}
            options={(departments.data ?? []).map((department) => ({ value: department.department_id, label: `${department.department_code} — ${department.name}` }))}
          />
          <SelectField
            label="Program"
            required
            value={editForm.programId}
            onChange={(e) => {
              const program = (programs.data ?? []).find((item) => String(item.program_id) === e.target.value);
              setEditForm({ ...editForm, programId: e.target.value, departmentId: program ? String(program.department_id) : '', batchId: '' });
            }}
            options={(programs.data ?? []).filter((program) => !editForm.departmentId || String(program.department_id) === editForm.departmentId).map((program) => ({ value: program.program_id, label: `${program.program_name} (${program.program_code})` }))}
            className="sm:col-span-2"
          />
          <SelectField label="Category" required value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })} options={(categories.data ?? []).map((category) => ({ value: category.category_id, label: category.category_name }))} />
          <Field label="Admission year" type="number" required min={1990} max={2100} value={editForm.admissionYear} onChange={(e) => setEditForm({ ...editForm, admissionYear: e.target.value, batchId: '' })} />
          <SelectField label="Batch" required value={editForm.batchId} onChange={(e) => setEditForm({ ...editForm, batchId: e.target.value })} options={matchingBatches.map((batch) => ({ value: batch.batch_id, label: batch.batch_code }))} />
          <Field label="Current semester" type="number" required min={1} max={12} value={editForm.currentSemesterNo} onChange={(e) => setEditForm({ ...editForm, currentSemesterNo: e.target.value })} />
          <Field label="Roll number" required maxLength={20} value={editForm.rollNumber} onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })} />
          <Field label="PRN / registration number" required maxLength={30} value={editForm.registrationNumber} onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })} className="sm:col-span-2" />
          <p className="sm:col-span-2 text-xs leading-5 text-slate-500">The changed email will also update this student's linked login. Duplicate emails, PRNs and roll numbers are rejected by the database.</p>
        </form>
      </Modal>

      <Modal
        open={statusOpen}
        onClose={() => { if (!busy) setStatusOpen(false); }}
        title="Change student status"
        size="sm"
        footer={(
          <>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setStatusOpen(false)} disabled={busy}>Cancel</button>
            <button type="button" className="btn-primary btn-sm" onClick={saveStatus} disabled={busy || !reason.trim()}>{busy ? 'Saving…' : 'Save'}</button>
          </>
        )}
      >
        <SelectField label="New status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} options={STATUSES.map((x) => ({ value: x, label: titleCase(x) }))} />
        <Field label="Reason" required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required note recorded in the status history" />
        <p className="mt-1 text-xs text-slate-500">Marking the student Inactive or Suspended also disables the linked login. Reactivating a disabled login is a separate action.</p>
      </Modal>
    </>
  );
}
