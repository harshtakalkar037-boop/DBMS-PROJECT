import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Download, FileText } from 'lucide-react';
import { api, errMsg } from '../../lib/api';
import { useToast } from '../../components/toast';
import {
  Card,
  PageHeader,
  StatCard,
  SearchInput,
  SelectField,
  Tabs,
  DataTable,
  Pagination,
  StatusBadge,
  ErrorBox,
  Modal,
  TextAreaField,
  useFetch,
  useDebounced,
  type Column,
} from '../../components/ui';
import { downloadCsv } from '../../lib/csv';
import { dateStr, num } from '../../lib/format';

interface Application {
  admission_id: number;
  application_no: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  programCode: string;
  programName: string;
  categoryCode: string;
  marks_10: string;
  marks_12: string;
  entrance_score: string;
  status: string;
  application_date: string;
  rollNumber: string | null;
  student_id: number | null;
  city: string;
  state: string;
  pincode: string;
  address_line1: string;
  guardian_name: string;
  guardian_phone: string;
  previous_school: string;
  qualification: string;
  remarks: string | null;
}
interface Stats {
  total: number;
  applied: string;
  underReview: string;
  approved: string;
  rejected: string;
  waitlisted: string;
  avgEntranceMarks: string;
}
interface ReviewResult {
  applicationId: number;
  approved: boolean;
  studentId: number | null;
  message: string;
  temporaryPassword?: string;
}

export default function AdmissionsPage() {
  const toast = useToast();
  const [tab, setTab] = useState('APPLIED');
  const [search, setSearch] = useState('');
  const [programId, setProgramId] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounced(search, 350);

  const stats = useFetch(() => api.get<Stats>('/students/admissions/stats'), []);
  const programs = useFetch(() => api.get<{ program_id: number; program_name: string }[]>('/academics/programs/all', { limit: 200 }), []);
  const params = useMemo(() => ({
    page,
    limit: 25,
    status: tab === 'ALL' ? undefined : tab,
    search: term || undefined,
    programId: programId || undefined,
  }), [page, tab, term, programId]);

  const { data, loading, error, reload } = useFetch(
    () => api.page<Application>('/students/admissions', params), [params],
  );
  const rows = data?.rows ?? [];
  const [review, setReview] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string; studentId: number | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const decide = async (approve: boolean) => {
    if (!review || busy) return;
    if (!approve && !window.confirm(`Reject application ${review.application_no}? This decision will be recorded.`)) return;
    setBusy(true);
    try {
      const result = await api.post<ReviewResult>(`/students/admissions/${review.admission_id}/review`, {
        approve,
        remarks: remarks.trim() || undefined,
      });
      toast.success(result.message || (approve ? 'Application approved.' : 'Application rejected.'));
      if (approve && result.temporaryPassword) {
        setCredentials({ email: review.email, password: result.temporaryPassword, studentId: result.studentId });
        setCopied(false);
      }
      setReview(null);
      setRemarks('');
      reload();
      stats.reload();
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

  const columns: Column<Application>[] = [
    {
      key: 'application_no',
      header: 'Application',
      render: (row) => <span className="font-medium text-brand-700">{row.application_no}</span>,
    },
    {
      key: 'first_name',
      header: 'Applicant',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.first_name} {row.last_name}</p>
          <p className="text-[11px] text-slate-500">{row.email}</p>
        </div>
      ),
    },
    { key: 'programCode', header: 'Program', render: (row) => <span className="text-xs">{row.programCode}</span> },
    { key: 'categoryCode', header: 'Category' },
    { key: 'marks_12', header: '12th %', align: 'right', render: (row) => num(row.marks_12, 2) },
    { key: 'application_date', header: 'Applied on', render: (row) => dateStr(row.application_date) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (['APPLIED', 'UNDER_REVIEW', 'WAITLISTED'].includes(row.status) ? (
        <button
          type="button"
          className="btn-secondary btn-xs"
          onClick={() => { setReview(row); setRemarks(row.remarks ?? ''); }}
        >
          Review
        </button>
      ) : row.student_id ? (
        <Link to={`/students/${row.student_id}`} className="text-xs text-brand-700 hover:underline">
          {row.rollNumber ?? 'View student'}
        </Link>
      ) : null),
    },
  ];

  return (
    <>
      <PageHeader
        title="Pending Approvals"
        subtitle="Review the saved admission applications. Approval creates a linked student record and login account in the database."
        icon={<FileText className="h-5 w-5" />}
        actions={(
          <>
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={!rows.length}
              onClick={() => downloadCsv('admissions.csv', rows as unknown as Record<string, unknown>[])}
            ><Download className="h-4 w-4" /> Export CSV</button>
            <Link to="/admissions/apply" className="btn-primary btn-sm">Open application form</Link>
          </>
        )}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Total" value={num(stats.data?.total)} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="New" value={num(stats.data?.applied)} tone="sky" />
        <StatCard label="Under review" value={num(stats.data?.underReview)} tone="amber" />
        <StatCard label="Approved" value={num(stats.data?.approved)} tone="emerald" />
        <StatCard label="Waitlisted" value={num(stats.data?.waitlisted)} tone="slate" />
        <StatCard label="Rejected" value={num(stats.data?.rejected)} tone="rose" />
      </div>

      <Tabs
        active={tab}
        onChange={(key) => { setTab(key); setPage(1); }}
        tabs={[
          { key: 'APPLIED', label: 'New' },
          { key: 'UNDER_REVIEW', label: 'Under review' },
          { key: 'WAITLISTED', label: 'Waitlisted' },
          { key: 'APPROVED', label: 'Approved' },
          { key: 'REJECTED', label: 'Rejected' },
          { key: 'ALL', label: 'All' },
        ]}
      />

      <Card className="mb-4">
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Name, application number or email…" />
          <SelectField
            placeholder="All programs"
            value={programId}
            onChange={(event) => { setProgramId(event.target.value); setPage(1); }}
            options={(programs.data ?? []).map((program) => ({ value: program.program_id, label: program.program_name }))}
          />
        </div>
      </Card>

      <Card>
        {error ? <ErrorBox message={error} onRetry={reload} /> : (
          <>
            <DataTable columns={columns} rows={rows} loading={loading} rowKey={(row) => row.admission_id} empty="No applications in this status" />
            <Pagination page={data?.meta.page ?? 1} totalPages={data?.meta.totalPages ?? 1} total={data?.meta.total ?? 0} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={!!review}
        onClose={() => { if (!busy) setReview(null); }}
        title={`Review ${review?.application_no ?? ''}`}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setReview(null)} disabled={busy}>Cancel</button>
            <button type="button" className="btn-danger btn-sm" onClick={() => decide(false)} disabled={busy}>
              {busy ? 'Working…' : 'Reject'}
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={() => decide(true)} disabled={busy}>
              {busy ? 'Working…' : 'Approve and create account'}
            </button>
          </>
        )}
      >
        {review ? (
          <>
            <dl className="grid gap-x-5 gap-y-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Applicant</dt><dd className="font-medium">{review.first_name} {review.last_name}</dd></div>
              <div><dt className="text-xs text-slate-500">Application status</dt><dd><StatusBadge value={review.status} /></dd></div>
              <div><dt className="text-xs text-slate-500">Email</dt><dd className="break-all font-medium">{review.email}</dd></div>
              <div><dt className="text-xs text-slate-500">Phone</dt><dd className="font-medium">{review.phone}</dd></div>
              <div><dt className="text-xs text-slate-500">Date of birth / gender</dt><dd className="font-medium">{dateStr(review.date_of_birth)} · {review.gender}</dd></div>
              <div><dt className="text-xs text-slate-500">Program / category</dt><dd className="font-medium">{review.programName} · {review.categoryCode}</dd></div>
              <div><dt className="text-xs text-slate-500">Qualification</dt><dd className="font-medium">{review.qualification || '—'}{review.previous_school ? ` · ${review.previous_school}` : ''}</dd></div>
              <div><dt className="text-xs text-slate-500">10th / 12th marks</dt><dd className="font-medium">{num(review.marks_10, 1)}% / {num(review.marks_12, 1)}%</dd></div>
              <div><dt className="text-xs text-slate-500">Entrance score</dt><dd className="font-medium">{review.entrance_score ? num(review.entrance_score, 2) : '—'}</dd></div>
              <div><dt className="text-xs text-slate-500">Guardian</dt><dd className="font-medium">{review.guardian_name} · {review.guardian_phone}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Address</dt><dd className="font-medium">{[review.address_line1, review.city, review.state, review.pincode].filter(Boolean).join(', ') || '—'}</dd></div>
            </dl>
            <TextAreaField
              label="Review remarks"
              maxLength={500}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Optional note recorded with the decision"
              className="mt-3"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Approval creates a student and account only after the database procedure succeeds. The returned temporary password is displayed once to the administrator; the account must change it at first sign-in.
            </p>
          </>
        ) : null}
      </Modal>

      <Modal
        open={!!credentials}
        onClose={() => setCredentials(null)}
        title="Student account created"
        size="sm"
        footer={<button type="button" className="btn-primary btn-sm" onClick={() => setCredentials(null)}>Done</button>}
      >
        {credentials ? (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              The application is approved and the student record is saved. Share these credentials with the applicant through a trusted channel; this password is shown only once.
            </p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Login email</p>
              <p className="break-all font-medium text-slate-900">{credentials.email}</p>
              <p className="mt-3 text-xs text-slate-500">Temporary password</p>
              <code className="mt-1 block select-all break-all rounded bg-white px-2 py-1.5 font-mono text-slate-900">{credentials.password}</code>
              <p className="mt-3 text-xs text-slate-500">Student record ID: {credentials.studentId ?? '—'}</p>
            </div>
            <button type="button" className="btn-secondary btn-sm" onClick={copyTemporaryPassword}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy temporary password'}
            </button>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
