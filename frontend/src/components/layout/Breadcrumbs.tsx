import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { PATH_LABELS } from '../nav';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  profile: 'My Profile',
  students: 'Students',
  admissions: 'Admissions',
  enrollments: 'Enrollment',
  academics: 'Academics',
  masters: 'Departments & Programs',
  subjects: 'Subjects',
  offerings: 'Course Offerings',
  timetable: 'Timetable',
  calendar: 'Academic Calendar',
  attendance: 'Attendance',
  sessions: 'Sessions',
  reports: 'Reports',
  exams: 'Examinations',
  registrations: 'Registrations',
  marks: 'Marks Entry',
  results: 'Results',
  'hall-ticket': 'Hall Ticket',
  'mock-exams': 'Mock Tests',
  fees: 'Fees & Finance',
  structures: 'Fee Structures',
  bills: 'Bills',
  payments: 'Payments',
  defaulters: 'Defaulters',
  scholarships: 'Scholarships',
  hostel: 'Hostel',
  rooms: 'Rooms & Beds',
  applications: 'Applications',
  allocations: 'Allocations',
  faculty: 'Faculty',
  leaves: 'Leave Requests',
  balances: 'Leave Balances',
  payroll: 'Payroll',
  ai: 'AI Assistant',
  chat: 'Ask the Assistant',
  'study-plan': 'Study Plan',
  'at-risk': 'At-Risk Students',
  notifications: 'Notifications',
  audit: 'Audit Log',
  settings: 'Settings',
  me: 'Mine',
  apply: 'Apply',
};

function labelFor(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  // numeric ids and raw codes keep their value
  if (/^\d+$/.test(segment)) return `#${segment}`;
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Breadcrumb trail derived from the current URL and the navigation model. */
export function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const crumbs = parts.map((part, i) => {
    const to = '/' + parts.slice(0, i + 1).join('/');
    return { to, label: PATH_LABELS[to] ?? labelFor(part), last: i === parts.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-subtle">
        <li>
          <Link to="/dashboard" className="inline-flex items-center gap-1 hover:text-ink" aria-label="Dashboard">
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {crumbs.map((c) => (
          <li key={c.to} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 opacity-60" />
            {c.last ? (
              <span className="font-medium text-ink-muted" aria-current="page">
                {c.label}
              </span>
            ) : (
              <Link to={c.to} className="hover:text-ink">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
