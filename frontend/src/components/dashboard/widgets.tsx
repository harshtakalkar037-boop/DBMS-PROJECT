import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart,
} from 'recharts';
import {
  GraduationCap, Wallet, ClipboardCheck, CalendarClock, BookOpen, Users, BedDouble,
  Building2, IndianRupee, Award, TriangleAlert, FileBadge, Activity, Percent, DoorOpen,
  Umbrella, Receipt, TrendingUp, UserCog,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { ErrorBox, Loading } from '../ui';
import { useFetch } from '../ui';
import { dateStr, dateTimeStr, money, pct, titleCase } from '../../lib/format';
import { Panel, PanelLink, ChartCard, StatTile, ActivityFeed, QuickActions, Meter, n, s, type Row } from './primitives';
import { CHART_SERIES } from '../../theme/tokens';
import { SkeletonChart, SkeletonList, SkeletonStatRow } from '../ui/Skeleton';

function WidgetSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonStatRow />
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonChart className="lg:col-span-2" />
        <SkeletonList />
      </div>
    </div>
  );
}

function WidgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <ErrorBox message={message} onRetry={onRetry} />;
}

/* ------------------------------------------------------ payload contracts --
   These mirror the shapes returned by GET /api/v1/dashboard for each role
   (backend/src/repositories/dashboard.repository.ts).                        */

export interface StudentDash {
  profile: Row | null; academic: Row | null; attendance: Row | null; subjects: Row[];
  fees: Row | null; exams: Row[]; hostel: Row | null; notifications: Row[]; dues: Row | null;
}
export interface FacultyDash {
  profile: Row | null; subjects: Row[]; todayClasses: Row[]; pendingLeaves: Row | null;
  payroll: Row | null; lowAttendance: Row[]; exams: Row[];
}
export interface ExamCellDash { exams: Row[]; stats: Row | null; failure: Row[]; results: Row[] }
export interface FinanceDash { totals: Row | null; monthly: Row[]; defaulters: Row[]; recent: Row[] }
export interface HostelDash { occupancy: Row[]; stats: Row | null; pending: Row[]; rooms: Row[] }
export interface HrDash { counts: Row | null; leaves: Row[]; payroll: Row[]; departments: Row[] }
export interface AdminDash {
  counts: Row | null; departments: Row[]; attendance: Row | null; fees: Row | null;
  risk: Row | null; recentActivity: Row[];
}

/**
 * The dashboard page fetches GET /dashboard once and hands the payload to the
 * active role widget, so a sign-in costs exactly one dashboard request. A
 * widget rendered on its own (tests, deep links) fetches for itself.
 */
function useDashboard<T>(provided?: T | null) {
  const skip = provided !== undefined && provided !== null;
  const fetched = useFetch<T | null>(
    () => (skip ? Promise.resolve(null as T | null) : api.get<T>('/dashboard')),
    [skip],
  );
  if (skip) {
    return { data: provided as T, loading: false, error: null as string | null, reload: () => undefined };
  }
  return {
    data: fetched.data ?? null,
    loading: fetched.loading,
    error: fetched.error,
    reload: fetched.reload,
  };
}

/** Shared grid so every role's widgets line up identically. */
function Grid({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

/* ============================================================== STUDENT === */

export function StudentWidgets({ data: provided }: { data?: StudentDash | null } = {}) {
  const { user } = useAuth();
  const { data, loading, error, reload } = useDashboard<StudentDash>(provided);

  if (loading) return <WidgetSkeleton />;
  if (error) return <WidgetError message={error} onRetry={reload} />;
  if (!data) return null;

  const attendancePct = n(data.attendance?.overall_percentage);
  const cgpa = n(data.academic?.cgpa ?? data.profile?.cgpa);
  const outstanding = n(data.dues?.outstanding ?? data.fees?.due_amount);
  const backlogs = n(data.profile?.backlog_count ?? data.academic?.backlog_count);

  const subjectChart = (data.subjects ?? []).slice(0, 8).map((x) => ({
    name: s(x.subjectCode) || s(x.subjectName).slice(0, 10),
    value: n(x.percentage),
  }));

  const upcoming = (data.exams ?? []).slice(0, 5);

  return (
    <Grid>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile index={0} label="CGPA" value={cgpa} decimals={2} icon={<Award className="h-4 w-4" />} tone="brand" hint="Cumulative grade point average" />
        <StatTile
          index={1}
          label="Attendance"
          value={attendancePct}
          decimals={1}
          suffix="%"
          icon={<ClipboardCheck className="h-4 w-4" />}
          tone={attendancePct < 75 ? 'danger' : attendancePct < 85 ? 'warning' : 'success'}
          hint={attendancePct < 75 ? 'Below the 75% examination bar' : 'Eligible for examinations'}
        />
        <StatTile
          index={2}
          label="Fees outstanding"
          value={outstanding}
          prefix="₹"
          icon={<Wallet className="h-4 w-4" />}
          tone={outstanding > 0 ? 'warning' : 'success'}
          hint={outstanding > 0 ? 'Payable' : 'All dues cleared'}
          to="/fees/me"
        />
        <StatTile index={3} label="Backlogs" value={backlogs} icon={<TriangleAlert className="h-4 w-4" />} tone={backlogs > 0 ? 'warning' : 'success'} hint="Subjects pending clearance" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Subject-wise attendance" subtitle="Live percentage per enrolled subject" className="lg:col-span-2" delay={0.05}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectChart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={46} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Attendance']} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {subjectChart.map((d, i) => (
                  <Cell key={i} fill={d.value < 75 ? '#be123c' : d.value < 85 ? '#b45309' : '#2c64a8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Panel title="Upcoming examinations" subtitle="From your published schedule" action={<PanelLink to="/exams" label="All exams" />} delay={0.1}>
          <ActivityFeed
            items={upcoming.map((e) => ({
              title: s(e.examName),
              meta: `${dateStr(e.examDate)} · ${s(e.examType)}`,
              tone: 'brand' as const,
              to: '/exams',
            }))}
            empty="No future examinations are present in the published schedule."
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Recent notifications" action={<PanelLink to="/notifications" />} className="lg:col-span-2" delay={0.12}>
          <ActivityFeed
            items={(data.notifications ?? []).slice(0, 6).map((x) => ({
              title: s(x.title),
              meta: s(x.message).slice(0, 90),
              time: dateStr(x.createdAt),
              tone: s(x.severity) === 'ERROR' ? ('danger' as const) : ('neutral' as const),
              to: '/notifications',
            }))}
            empty="No notifications yet."
          />
        </Panel>

        <QuickActions
          delay={0.14}
          actions={[
            { to: '/attendance/me', label: 'My attendance', icon: <ClipboardCheck className="h-4 w-4" />, hint: 'Subject-wise record' },
            { to: '/academics/timetable', label: 'Timetable', icon: <CalendarClock className="h-4 w-4" />, hint: 'Weekly schedule' },
            { to: '/exams/results', label: 'Results', icon: <Award className="h-4 w-4" />, hint: 'Semester marks & SGPA' },
            { to: '/fees/me', label: 'My fees', icon: <IndianRupee className="h-4 w-4" />, hint: 'Bills and receipts' },
            { to: '/hostel/me', label: 'My hostel', icon: <BedDouble className="h-4 w-4" />, hint: 'Room and bed details' },
            { to: '/mock-exams', label: 'Mock tests', icon: <FileBadge className="h-4 w-4" />, hint: 'Practice engine' },
          ]}
        />
      </div>

      {data.hostel ? (
        <Panel title="Hostel" subtitle="Current allocation" delay={0.16}>
          <p className="text-sm text-ink">
            {s(data.hostel.hostelName)} · Room {s(data.hostel.roomNumber)} · Bed {s(data.hostel.bedCode)}
          </p>
          <p className="mt-1 text-xs text-ink-subtle">Allocated on {dateStr(data.hostel.allocatedOn)}</p>
        </Panel>
      ) : null}

      {user?.studentId ? (
        <p className="text-[11px] text-ink-subtle">
          Student #{user.studentId} · every figure above is computed from your live records.
        </p>
      ) : null}
    </Grid>
  );
}

/* ============================================================== FACULTY === */

export function FacultyWidgets({ data: provided }: { data?: FacultyDash | null } = {}) {
  const { data, loading, error, reload } = useDashboard<FacultyDash>(provided);

  if (loading) return <WidgetSkeleton />;
  if (error) return <WidgetError message={error} onRetry={reload} />;
  if (!data) return null;

  const offerings = data.subjects ?? [];
  const students = offerings.reduce((sum, o) => sum + n(o.enrolled), 0);

  return (
    <Grid>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile index={0} label="Classes today" value={n(data.todayClasses?.[0]?.sessions)} icon={<CalendarClock className="h-4 w-4" />} tone="brand" hint="Sessions scheduled for today" />
        <StatTile index={1} label="Assigned offerings" value={offerings.length} icon={<BookOpen className="h-4 w-4" />} tone="accent" hint={`${students} enrolled students`} />
        <StatTile
          index={2}
          label="Below 75% attendance"
          value={(data.lowAttendance ?? []).length}
          icon={<TriangleAlert className="h-4 w-4" />}
          tone={(data.lowAttendance ?? []).length > 0 ? 'danger' : 'success'}
          hint="Students in your offerings"
        />
        <StatTile index={3} label="Leave balance requests" value={n(data.pendingLeaves?.pending)} icon={<Umbrella className="h-4 w-4" />} tone="warning" hint="Awaiting approval" to="/faculty/leaves" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="My offerings" subtitle="Current semester teaching load" action={<PanelLink to="/academics/offerings" />} className="lg:col-span-2" delay={0.05}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Program</th>
                  <th>Sem</th>
                  <th className="text-right">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {offerings.slice(0, 8).map((o) => (
                  <tr key={s(o.offeringId)}>
                    <td className="font-medium">{s(o.subjectName)}</td>
                    <td className="text-ink-muted">{s(o.programCode)}</td>
                    <td className="text-ink-muted">{s(o.semesterNo)}</td>
                    <td className="text-right tabular">{n(o.enrolled)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <QuickActions
          delay={0.1}
          actions={[
            { to: '/attendance/sessions', label: 'Mark attendance', icon: <ClipboardCheck className="h-4 w-4" />, hint: 'Today’s sessions' },
            { to: '/exams/marks', label: 'Enter marks', icon: <FileBadge className="h-4 w-4" />, hint: 'For your offerings' },
            { to: '/attendance/reports', label: 'Defaulter report', icon: <TrendingUp className="h-4 w-4" />, hint: 'Below 75%' },
            { to: '/faculty/leaves', label: 'Apply for leave', icon: <Umbrella className="h-4 w-4" />, hint: 'Balance & requests' },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Students needing attention" subtitle="Attendance below 75% in your offerings" className="lg:col-span-2" delay={0.12}>
          <ActivityFeed
            items={(data.lowAttendance ?? []).slice(0, 8).map((x) => ({
              title: `${s(x.studentName)} · ${s(x.rollNumber)}`,
              meta: `${s(x.subjectCode)} — ${n(x.percentage).toFixed(1)}%`,
              tone: 'danger' as const,
            }))}
            empty="No student is below the attendance bar."
          />
        </Panel>

        <Panel title="Examinations" subtitle="Latest schedules" action={<PanelLink to="/exams" />} delay={0.14}>
          <ActivityFeed
            items={(data.exams ?? []).slice(0, 5).map((e) => ({
              title: s(e.name),
              meta: `${dateStr(e.startDate)} · ${n(e.registrations)} registrations`,
              tone: 'brand' as const,
              to: '/exams',
            }))}
            empty="No examinations scheduled."
          />
        </Panel>
      </div>
    </Grid>
  );
}

/* ============================================================ EXAM CELL === */

export function ExamCellWidgets({ data: provided }: { data?: ExamCellDash | null } = {}) {
  const { data, loading, error, reload } = useDashboard<ExamCellDash>(provided);

  if (loading) return <WidgetSkeleton />;
  if (error) return <WidgetError message={error} onRetry={reload} />;
  if (!data) return null;

  const st = data.stats ?? {};
  const failureData = (data.failure ?? []).slice(0, 8).map((f) => ({
    name: s(f.subject_code ?? f.subjectCode).slice(0, 12),
    rate: n(f.failure_rate ?? f.failureRate),
  }));
  const deptData = (data.results ?? []).map((r) => ({ name: s(r.departmentCode), sgpa: n(r.averageSgpa) }));

  return (
    <Grid>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile index={0} label="Examinations" value={n(st.exams)} icon={<FileBadge className="h-4 w-4" />} tone="brand" hint="Total configured" />
        <StatTile index={1} label="Registration open" value={n(st.open)} icon={<ClipboardCheck className="h-4 w-4" />} tone="accent" hint="Accepting registrations" to="/exams/registrations" />
        <StatTile index={2} label="Registrations" value={n(st.registrations)} icon={<Users className="h-4 w-4" />} tone="success" hint={`${n(st.rejected)} rejected`} />
        <StatTile index={3} label="Results pending" value={Math.max(0, n(st.exams) - n(st.published))} icon={<Activity className="h-4 w-4" />} tone="warning" hint="Not yet published" to="/exams/results" />
        <StatTile index={4} label="Results published" value={n(st.published)} icon={<Award className="h-4 w-4" />} tone="brand" hint="Published exams" to="/exams/results" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Subject failure rate" subtitle="Top subjects by failure percentage" delay={0.05}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={failureData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-12} textAnchor="end" height={46} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Failure rate']} />
              <Bar dataKey="rate" fill="#be123c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Average SGPA by department" subtitle="From published results" delay={0.08}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [v.toFixed(2), 'Avg SGPA']} />
              <Bar dataKey="sgpa" fill="#2c64a8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Examination schedule" subtitle="Latest first" action={<PanelLink to="/exams" label="Manage" />} className="lg:col-span-2" delay={0.1}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Examination</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>Status</th>
                  <th className="text-right">Registered</th>
                </tr>
              </thead>
              <tbody>
                {(data.exams ?? []).slice(0, 8).map((e) => (
                  <tr key={n(e.exam_id ?? e.examId)}>
                    <td className="font-medium">{s(e.name)}</td>
                    <td className="text-ink-muted">{titleCase(s(e.exam_type ?? e.examType))}</td>
                    <td className="text-ink-muted">{dateStr(e.start_date ?? e.startDate)}</td>
                    <td>
                      <span className="chip bg-surface-2 text-ink-muted ring-1 ring-line">{titleCase(s(e.status))}</span>
                    </td>
                    <td className="text-right tabular">{n(e.registrations)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <QuickActions
          delay={0.12}
          actions={[
            { to: '/exams/registrations', label: 'Registrations', icon: <ClipboardCheck className="h-4 w-4" />, hint: 'Eligibility & approvals' },
            { to: '/exams/marks', label: 'Marks entry', icon: <FileBadge className="h-4 w-4" />, hint: 'Per subject' },
            { to: '/exams/results', label: 'Results', icon: <Award className="h-4 w-4" />, hint: 'Process & publish' },
            { to: '/students', label: 'Students', icon: <Users className="h-4 w-4" />, hint: 'Read-only directory' },
          ]}
        />
      </div>
    </Grid>
  );
}

/* ============================================================== FINANCE === */

export function FinanceWidgets({ data: provided }: { data?: FinanceDash | null } = {}) {
  const { data, loading, error, reload } = useDashboard<FinanceDash>(provided);

  if (loading) return <WidgetSkeleton />;
  if (error) return <WidgetError message={error} onRetry={reload} />;
  if (!data) return null;

  const t = data.totals ?? {};
  const monthly = (data.monthly ?? []).map((m) => ({
    name: `${s(m.program_code ?? m.programCode)} · S${s(m.semester_no ?? m.semesterNo)}`,
    collected: n(m.amount_collected ?? m.collected),
    billed: n(m.amount_billed ?? m.billed),
  }));

  return (
    <Grid>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile index={0} label="Billed" value={n(t.billed)} prefix="₹" icon={<Receipt className="h-4 w-4" />} tone="brand" hint="All fee bills" />
        <StatTile index={1} label="Collected" value={n(t.collected)} prefix="₹" icon={<IndianRupee className="h-4 w-4" />} tone="success" hint="Payments received" />
        <StatTile index={2} label="Outstanding" value={n(t.outstanding)} prefix="₹" icon={<Wallet className="h-4 w-4" />} tone="warning" hint="Pending collection" to="/fees/defaulters" />
        <StatTile index={3} label="Overdue bills" value={n(t.overdueBills)} icon={<TriangleAlert className="h-4 w-4" />} tone="danger" hint={`${n(t.paidBills)} fully paid`} />
      </div>

      <ChartCard title="Fee collection by program & semester" subtitle="Billed vs collected · live fee summary" delay={0.05}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthly} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="finFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2c64a8" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#2c64a8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => [money(v), 'Amount']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="billed" name="Billed" stroke={CHART_SERIES[1]} fill="url(#finFill)" strokeWidth={2} />
            <Line type="monotone" dataKey="collected" name="Collected" stroke={CHART_SERIES[0]} strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top defaulters" subtitle="Highest outstanding amounts" action={<PanelLink to="/fees/defaulters" />} delay={0.1}>
          <ActivityFeed
            items={(data.defaulters ?? []).slice(0, 8).map((d) => ({
              title: `${s(d.studentName)} · ${s(d.rollNumber)}`,
              meta: money(d.outstanding),
              tone: 'danger' as const,
              to: '/fees/defaulters',
            }))}
            empty="No outstanding dues."
          />
        </Panel>

        <Panel title="Recent payments" subtitle="Latest receipts" action={<PanelLink to="/fees/payments" />} delay={0.12}>
          <ActivityFeed
            items={(data.recent ?? []).slice(0, 8).map((p) => ({
              title: `${s(p.rollNumber)} · ${money(p.amount)}`,
              meta: `${s(p.mode)} · ${s(p.receiptNo)}`,
              time: dateStr(p.date),
              tone: 'success' as const,
              to: '/fees/payments',
            }))}
            empty="No payments recorded yet."
          />
        </Panel>
      </div>

      <QuickActions
        delay={0.14}
        actions={[
          { to: '/fees/structures', label: 'Fee structures', icon: <Receipt className="h-4 w-4" />, hint: 'Per program & semester' },
          { to: '/fees/bills', label: 'Bills', icon: <Wallet className="h-4 w-4" />, hint: 'Generate & track' },
          { to: '/fees/payments', label: 'Payments', icon: <IndianRupee className="h-4 w-4" />, hint: 'Record receipts' },
          { to: '/fees/defaulters', label: 'Defaulters', icon: <TriangleAlert className="h-4 w-4" />, hint: 'Follow-up list' },
          { to: '/fees/scholarships', label: 'Scholarships', icon: <Award className="h-4 w-4" />, hint: 'Schemes & awards' },
          { to: '/reports', label: 'Financial reports', icon: <Activity className="h-4 w-4" />, hint: 'Exports & analytics' },
        ]}
      />
    </Grid>
  );
}

/* =============================================================== HOSTEL === */

export function HostelWidgets({ data: provided }: { data?: HostelDash | null } = {}) {
  const { data, loading, error, reload } = useDashboard<HostelDash>(provided);
  const hostelFees = useFetch<Row[]>(() => api.get<Row[]>('/hostel/fees'), []);

  if (loading) return <WidgetSkeleton />;
  if (error) return <WidgetError message={error} onRetry={reload} />;
  if (!data) return null;

  const st = data.stats ?? {};
  const beds = n(st.beds);
  const occupied = n(st.occupied);
  const occPct = beds ? (occupied / beds) * 100 : 0;

  const chart = (data.occupancy ?? []).map((h) => ({
    name: s(h.hostel_code ?? h.hostelCode),
    occupied: n(h.occupied_beds ?? h.occupiedBeds),
    vacant: Math.max(0, n(h.total_beds ?? h.totalBeds) - n(h.occupied_beds ?? h.occupiedBeds)),
  }));
  const unpaidHostelFees = (hostelFees.data ?? []).filter((f) => !['PAID', 'REFUNDED'].includes(s(f.status).toUpperCase()));
  const hostelFeesDue = unpaidHostelFees.reduce((sum, f) => sum + Math.max(0, n(f.amount) - n(f.paid_amount)), 0);

  return (
    <Grid>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile index={0} label="Total beds" value={beds} icon={<BedDouble className="h-4 w-4" />} tone="brand" hint="Across all hostels" />
        <StatTile index={1} label="Occupied" value={occupied} icon={<Users className="h-4 w-4" />} tone="accent" hint={`${occPct.toFixed(1)}% occupancy`} />
        <StatTile index={2} label="Available beds" value={Math.max(0, beds - occupied)} icon={<DoorOpen className="h-4 w-4" />} tone="success" hint="Ready for allocation" />
        <StatTile index={3} label="Pending applications" value={n(st.pendingApplications)} icon={<ClipboardCheck className="h-4 w-4" />} tone="warning" hint="Awaiting decision" to="/hostel/applications" />
        <StatTile index={4} label="Hostel fees due" value={hostelFeesDue} prefix="₹" icon={<IndianRupee className="h-4 w-4" />} tone={hostelFeesDue > 0 ? 'warning' : 'success'} hint={hostelFees.loading ? 'Loading fee ledger…' : `${unpaidHostelFees.length} unpaid or partial bills`} />
      </div>

      <ChartCard title="Occupancy by hostel" subtitle="Occupied vs available beds" delay={0.05}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="occupied" name="Occupied" stackId="a" fill="#2c64a8" radius={[0, 0, 0, 0]} />
            <Bar dataKey="vacant" name="Available" stackId="a" fill="#a8e8de" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Pending applications" action={<PanelLink to="/hostel/applications" label="Review" />} className="lg:col-span-2" delay={0.1}>
          <ActivityFeed
            items={(data.pending ?? []).slice(0, 8).map((a) => ({
              title: `${s(a.studentName)} · ${s(a.rollNumber)}`,
              meta: `${s(a.hostelCode)} · applied ${dateStr(a.appliedOn)}`,
              tone: 'warning' as const,
              to: '/hostel/applications',
            }))}
            empty="No pending applications."
          />
        </Panel>

        <QuickActions
          delay={0.12}
          actions={[
            { to: '/hostel/rooms', label: 'Rooms & beds', icon: <DoorOpen className="h-4 w-4" />, hint: 'Inventory' },
            { to: '/hostel/applications', label: 'Applications', icon: <ClipboardCheck className="h-4 w-4" />, hint: 'Approve / reject' },
            { to: '/hostel/allocations', label: 'Allocations & transfers', icon: <BedDouble className="h-4 w-4" />, hint: 'Assign, transfer or vacate' },
            { to: '/hostel/dashboard', label: 'Occupancy', icon: <Building2 className="h-4 w-4" />, hint: 'Live map' },
          ]}
        />
      </div>

      <Panel title="Room vacancy" subtitle="Latest rooms" action={<PanelLink to="/hostel/rooms" />} delay={0.14}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(data.rooms ?? []).slice(0, 12).map((r, i) => {
            const total = n(r.total_beds ?? r.capacity);
            const occ = n(r.occupied_count ?? r.occupied);
            return (
              <div key={i} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                <p className="text-xs font-medium text-ink">
                  {s(r.hostel_code ?? r.hostelCode)} · Room {s(r.room_number ?? r.roomNumber)}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-subtle">
                  {occ}/{total} beds occupied
                </p>
                <div className="mt-1.5">
                  <Meter value={total ? (occ / total) * 100 : 0} tone={total && occ >= total ? 'danger' : 'brand'} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Hostel fee ledger" subtitle="Open fee records from the existing hostel-fees API" delay={0.16}>
        {hostelFees.error ? <WidgetError message={hostelFees.error} onRetry={hostelFees.reload} /> : (
          <ActivityFeed
            items={unpaidHostelFees.slice(0, 8).map((f) => ({
              title: `${s(f.studentName)} · ${s(f.rollNumber)}`,
              meta: `${s(f.hostelCode)} · ${money(Math.max(0, n(f.amount) - n(f.paid_amount)))} due · ${titleCase(s(f.status))}`,
              time: dateStr(f.due_date),
              tone: 'warning' as const,
              to: '/hostel/allocations',
            }))}
            empty="No open hostel fee records."
          />
        )}
      </Panel>
    </Grid>
  );
}

/* ================================================================== HR === */

export function HrWidgets({ data: provided }: { data?: HrDash | null } = {}) {
  const { data, loading, error, reload } = useDashboard<HrDash>(provided);

  if (loading) return <WidgetSkeleton />;
  if (error) return <WidgetError message={error} onRetry={reload} />;
  if (!data) return null;

  const c = data.counts ?? {};
  const deptData = (data.departments ?? []).map((d) => ({ name: s(d.departmentCode), faculty: n(d.faculty) }));

  return (
    <Grid>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile index={0} label="Faculty" value={n(c.faculty)} icon={<Users className="h-4 w-4" />} tone="brand" hint="All records" to="/faculty" />
        <StatTile index={1} label="Active" value={n(c.active)} icon={<UserCog className="h-4 w-4" />} tone="success" hint="Currently active" />
        <StatTile index={2} label="On leave" value={n(c.onLeave)} icon={<Umbrella className="h-4 w-4" />} tone="warning" hint="Approved leave today" />
        <StatTile index={3} label="Leave requests" value={(data.leaves ?? []).length} icon={<ClipboardCheck className="h-4 w-4" />} tone="accent" hint="Pending approval" to="/faculty/leaves" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Faculty by department" className="lg:col-span-2" delay={0.05}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="faculty" fill="#149c8d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Panel title="Pending leave requests" action={<PanelLink to="/faculty/leaves" label="Review" />} delay={0.1}>
          <ActivityFeed
            items={(data.leaves ?? []).slice(0, 6).map((l) => ({
              title: s(l.facultyName),
              meta: `${titleCase(s(l.leave_type ?? l.leaveType))} · ${n(l.days)} days`,
              time: dateStr(l.applied_on ?? l.appliedOn),
              tone: 'warning' as const,
              to: '/faculty/leaves',
            }))}
            empty="No pending leave requests."
          />
        </Panel>
      </div>

      <QuickActions
        delay={0.12}
        actions={[
          { to: '/faculty', label: 'Faculty records', icon: <Users className="h-4 w-4" />, hint: 'Directory & profile' },
          { to: '/faculty/leaves', label: 'Leave approvals', icon: <Umbrella className="h-4 w-4" />, hint: 'Approve / reject' },
          { to: '/faculty/payroll', label: 'Payroll', icon: <IndianRupee className="h-4 w-4" />, hint: 'Generate & payslips' },
          { to: '/faculty/balances', label: 'Leave balances', icon: <Percent className="h-4 w-4" />, hint: 'Ledger' },
        ]}
      />
    </Grid>
  );
}

/* =============================================================== ADMIN === */

export function AdminWidgets({ data: provided }: { data?: AdminDash | null } = {}) {
  const { data, loading, error, reload } = useDashboard<AdminDash>(provided);

  if (loading) return <WidgetSkeleton />;
  if (error) return <WidgetError message={error} onRetry={reload} />;
  if (!data) return null;

  const c = data.counts ?? {};
  const attendancePie = [
    { name: 'Safe (≥75%)', value: n(data.attendance?.safe), color: '#15803d' },
    { name: 'Warning', value: n(data.attendance?.warning), color: '#b45309' },
    { name: 'Critical (<65%)', value: n(data.attendance?.critical), color: '#be123c' },
  ];
  const riskPie = [
    { name: 'Critical', value: n(data.risk?.critical), color: '#be123c' },
    { name: 'High', value: n(data.risk?.high), color: '#f97316' },
    { name: 'Medium', value: n(data.risk?.medium), color: '#b45309' },
    { name: 'Low', value: n(data.risk?.low), color: '#15803d' },
  ];
  const deptData = (data.departments ?? []).slice(0, 8).map((d) => ({
    name: s(d.department_code ?? d.departmentCode),
    students: n(d.student_count ?? d.students),
    avg: n(d.average_attendance ?? d.averageAttendance),
  }));

  return (
    <Grid>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile index={0} label="Active students" value={n(c.activeStudents)} icon={<GraduationCap className="h-4 w-4" />} tone="brand" hint="Across all programs" to="/students" />
        <StatTile index={1} label="Faculty" value={n(c.activeFaculty)} icon={<Users className="h-4 w-4" />} tone="accent" hint="Active teaching staff" to="/faculty" />
        <StatTile index={2} label="Departments" value={n(c.departments)} icon={<Building2 className="h-4 w-4" />} tone="neutral" hint={`${n(c.programs)} programs`} to="/academics/masters" />
        <StatTile
          index={3}
          label="Fees outstanding"
          value={n(data.fees?.outstanding)}
          prefix="₹"
          icon={<Wallet className="h-4 w-4" />}
          tone="warning"
          hint={`${money(data.fees?.collected ?? 0)} collected`}
          to="/fees/bills"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile index={4} label="Average attendance" value={n(data.attendance?.average)} decimals={1} suffix="%" icon={<ClipboardCheck className="h-4 w-4" />} tone="success" hint="Institute-wide" />
        <StatTile index={5} label="Hostel residents" value={n(c.hostelResidents)} icon={<BedDouble className="h-4 w-4" />} tone="accent" hint={`${n(c.pendingHostelApps)} applications pending`} to="/hostel/dashboard" />
        <StatTile index={6} label="Examinations" value={n(c.exams)} icon={<FileBadge className="h-4 w-4" />} tone="brand" hint="Configured" to="/exams" />
        <StatTile index={7} label="Open items" value={n(c.pendingAdmissions) + n(c.pendingLeaves)} icon={<Activity className="h-4 w-4" />} tone="warning" hint="Admissions + leave requests" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Department performance" subtitle="Students and average attendance · by department" className="lg:col-span-2" delay={0.05}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="students" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="attendance" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="students" dataKey="students" name="Students" fill="#2c64a8" radius={[6, 6, 0, 0]} />
              <Line yAxisId="attendance" type="monotone" dataKey="avg" name="Avg attendance %" stroke="#149c8d" strokeWidth={2} dot={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attendance health" subtitle="Students by band" delay={0.08}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={attendancePie} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
                {attendancePie.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Recent activity" subtitle="Audit trail" action={<PanelLink to="/audit" label="Audit log" />} className="lg:col-span-2" delay={0.1}>
          <ActivityFeed
            items={(data.recentActivity ?? []).slice(0, 8).map((a) => ({
              title: s(a.description) || `${s(a.action)} · ${s(a.entity)}`,
              meta: `${s(a.action)} · ${s(a.entity)}`,
              time: dateTimeStr(a.createdAt),
              tone: 'neutral' as const,
              to: '/audit',
            }))}
            empty="No activity recorded."
          />
        </Panel>

        <ChartCard title="Student risk" subtitle="Computed by stored procedure" delay={0.12}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskPie} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
                {riskPie.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <QuickActions
        delay={0.14}
        actions={[
          { to: '/students', label: 'Students', icon: <GraduationCap className="h-4 w-4" />, hint: 'Master records' },
          { to: '/admissions', label: 'Admissions', icon: <ClipboardCheck className="h-4 w-4" />, hint: 'Applications' },
          { to: '/fees/bills', label: 'Fee bills', icon: <Receipt className="h-4 w-4" />, hint: 'Finance' },
          { to: '/exams', label: 'Examinations', icon: <FileBadge className="h-4 w-4" />, hint: 'Schedule & results' },
          { to: '/hostel/dashboard', label: 'Hostel', icon: <BedDouble className="h-4 w-4" />, hint: 'Occupancy' },
          { to: '/reports', label: 'Reports', icon: <Activity className="h-4 w-4" />, hint: 'Exports & analytics' },
        ]}
      />
    </Grid>
  );
}

/** Fallback for roles without a dedicated widget set (keeps the shell identical). */
export function GenericWidgets({ data: provided }: { data?: Row | null } = {}) {
  const { data, loading, error, reload } = useDashboard<Row>(provided);
  if (loading) return <Loading label="Loading dashboard…" />;
  if (error) return <WidgetError message={error} onRetry={reload} />;
  return (
    <Panel title="Dashboard" subtitle="No dedicated widgets for this role yet">
      <pre className="overflow-x-auto text-[11px] text-ink-muted">{JSON.stringify(data, null, 2).slice(0, 1200)}</pre>
      <p className="mt-3 text-xs text-ink-subtle">
        <Link to="/profile" className="link">
          View my profile
        </Link>{' '}
        to see what this account can access.
      </p>
    </Panel>
  );
}

export { pct };
