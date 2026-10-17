import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { ErrorBox } from '../components/ui';
import { useFetch } from '../components/ui';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import {
  AdminWidgets, ExamCellWidgets, FacultyWidgets, FinanceWidgets, GenericWidgets,
  HostelWidgets, HrWidgets, StudentWidgets,
  type AdminDash, type ExamCellDash, type FacultyDash, type FinanceDash,
  type HostelDash, type HrDash, type StudentDash,
} from '../components/dashboard/widgets';
import { SkeletonChart, SkeletonList, SkeletonStatRow } from '../components/ui/Skeleton';
import { titleCase } from '../lib/format';
import type { Row } from '../components/dashboard/primitives';

/**
 * RoleAwareDashboard.
 *
 * ONE dashboard for every role: the shell (sidebar, top bar, header,
 * breadcrumbs) is identical, and only the widget set below changes. No role
 * gets its own application — the same <DashboardHeader /> and the same cards,
 * charts, tables and quick actions are reused everywhere.
 */
function RoleWidgets({ role, data }: { role: string; data: Record<string, unknown> | null }) {
  switch (role) {
    case 'STUDENT':
      return <StudentWidgets data={data as unknown as StudentDash} />;
    case 'FACULTY':
      return <FacultyWidgets data={data as unknown as FacultyDash} />;
    case 'EXAM_CELL':
      return <ExamCellWidgets data={data as unknown as ExamCellDash} />;
    case 'ACCOUNTANT':
      return <FinanceWidgets data={data as unknown as FinanceDash} />;
    case 'HOSTEL_ADMIN':
      return <HostelWidgets data={data as unknown as HostelDash} />;
    case 'HR':
      return <HrWidgets data={data as unknown as HrDash} />;
    case 'ADMIN':
      return <AdminWidgets data={data as unknown as AdminDash} />;
    default:
      return <GenericWidgets data={data as Row} />;
  }
}

/** Per-role greeting name and scope line, derived from the same payload. */
function identityFor(role: string, data: Record<string, unknown> | null): { name?: string; department?: string; meta?: { label: string; value: string }[] } {
  if (!data) return {};
  const rows = (k: string) => (data[k] ?? null) as Row | null;

  if (role === 'STUDENT') {
    const p = rows('profile');
    const first = String(p?.first_name ?? '');
    const last = String(p?.last_name ?? '');
    const name = [first, last].filter(Boolean).join(' ');
    return {
      name: name || undefined,
      department: String(p?.department_name ?? p?.department_code ?? '') || undefined,
      meta: p?.current_semester_no
        ? [{ label: 'Sem', value: String(p.current_semester_no) }]
        : undefined,
    };
  }

  if (role === 'FACULTY') {
    const p = rows('profile');
    const name = [String(p?.first_name ?? ''), String(p?.last_name ?? '')].filter(Boolean).join(' ');
    return {
      name: name ? `Prof. ${name}` : undefined,
      department: String(p?.departmentCode ?? '') || undefined,
      meta: p?.designation ? [{ label: 'Designation', value: titleCase(String(p.designation)) }] : undefined,
    };
  }

  if (role === 'ADMIN') {
    const c = (rows('counts') ?? {}) as Row;
    return { name: 'Administrator', department: 'All departments', meta: [{ label: 'Students', value: String(c.activeStudents ?? 0) }] };
  }

  const label: Record<string, string> = {
    EXAM_CELL: 'Examination Cell',
    ACCOUNTANT: 'Finance Office',
    HOSTEL_ADMIN: 'Hostel Administration',
    HR: 'Human Resources',
  };
  return { name: label[role] ?? undefined, department: 'Institute-wide' };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch<Record<string, unknown> | null>(
    () => api.get<Record<string, unknown>>('/dashboard'),
    [],
  );

  if (!user) return null;

  if (loading) {
    return (
      <>
        <div className="mb-5 space-y-2">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-8 w-64" />
        </div>
        <div className="space-y-4">
          <SkeletonStatRow />
          <div className="grid gap-4 lg:grid-cols-3">
            <SkeletonChart className="lg:col-span-2" />
            <SkeletonList />
          </div>
        </div>
      </>
    );
  }

  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const identity = identityFor(user.role, data ?? null);

  return (
    <>
      <DashboardHeader name={identity.name} department={identity.department} meta={identity.meta} />
      <RoleWidgets role={user.role} data={data ?? null} />
    </>
  );
}
