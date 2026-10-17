import type { Role } from '../lib/types';

/**
 * ONE source of truth for the seeded demo accounts.
 *
 * The login screen, the "Demo accounts" panel and the demo-environment badge
 * all read from here — nothing else in the app is allowed to hard-code a
 * credential. Every account below must exist in the generated seed
 * (scripts/generate_seed.py), otherwise the button simply fails to sign in.
 */

export type DemoIcon = 'admin' | 'faculty' | 'student' | 'exam' | 'finance' | 'hostel' | 'hr';

export interface DemoAccount {
  role: Role;
  /** Title shown on the card, e.g. "Exam Cell". */
  label: string;
  /** Human role name, e.g. "Examination Cell". */
  title: string;
  email: string;
  password: string;
  /** Card body. */
  blurb: string;
  /** Short access-level summary. */
  access: string;
  icon: DemoIcon;
  /** Tailwind classes for the card accent (light + dark). */
  accent: string;
  /** Landing order. */
  order: number;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'ADMIN',
    label: 'Admin',
    title: 'System Administrator',
    email: 'admin@pict.edu',
    password: 'Admin@123',
    blurb: 'Manage the complete ERP — every module, every setting, the audit log.',
    access: 'Full access · all modules',
    icon: 'admin',
    accent: 'from-brand-600/15 to-brand-500/5 text-brand-700 dark:text-brand-200 border-brand-500/25',
    order: 1,
  },
  {
    role: 'STUDENT',
    label: 'Student',
    title: 'Student',
    email: '2024ETC1001@pict.edu',
    password: 'Student@123',
    blurb: 'View your academic journey, attendance, examinations and fees.',
    access: 'Own records only',
    icon: 'student',
    accent: 'from-sky-500/15 to-sky-400/5 text-sky-700 dark:text-sky-200 border-sky-500/25',
    order: 2,
  },
  {
    role: 'FACULTY',
    label: 'Faculty',
    title: 'Faculty Member',
    email: 'karan.shinde@pict.edu',
    password: 'Faculty@123',
    blurb: 'Manage classes, attendance, marks and academic activities.',
    access: 'Assigned classes & students',
    icon: 'faculty',
    accent: 'from-emerald-500/15 to-emerald-400/5 text-emerald-700 dark:text-emerald-200 border-emerald-500/25',
    order: 3,
  },
  {
    role: 'EXAM_CELL',
    label: 'Exam Cell',
    title: 'Examination Cell',
    email: 'examcell@pict.edu',
    password: 'Exam@123',
    blurb: 'Manage examinations, schedules, registrations and results.',
    access: 'Examinations & results',
    icon: 'exam',
    accent: 'from-violet-500/15 to-violet-400/5 text-violet-700 dark:text-violet-200 border-violet-500/25',
    order: 4,
  },
  {
    role: 'ACCOUNTANT',
    label: 'Finance',
    title: 'Finance Office',
    email: 'accountant@pict.edu',
    password: 'Account@123',
    blurb: 'Manage fees, payments, scholarships and financial reports.',
    access: 'Fees & finance',
    icon: 'finance',
    accent: 'from-amber-500/15 to-amber-400/5 text-amber-700 dark:text-amber-200 border-amber-500/25',
    order: 5,
  },
  {
    role: 'HOSTEL_ADMIN',
    label: 'Hostel',
    title: 'Hostel Administration',
    email: 'hostel.admin@pict.edu',
    password: 'Hostel@123',
    blurb: 'Manage rooms, beds, applications and hostel allocations.',
    access: 'Hostel operations',
    icon: 'hostel',
    accent: 'from-teal-500/15 to-teal-400/5 text-teal-700 dark:text-teal-200 border-teal-500/25',
    order: 6,
  },
  {
    role: 'HR',
    label: 'HR',
    title: 'Human Resources',
    email: 'hr@pict.edu',
    password: 'Hr@123',
    blurb: 'Manage faculty records, leave approvals and monthly payroll.',
    access: 'Faculty, leave & payroll',
    icon: 'hr',
    accent: 'from-rose-500/15 to-rose-400/5 text-rose-700 dark:text-rose-200 border-rose-500/25',
    order: 7,
  },
];

export const DEMO_ACCOUNTS_BY_ROLE: Record<Role, DemoAccount | undefined> = DEMO_ACCOUNTS.reduce(
  (acc, a) => ({ ...acc, [a.role]: a }),
  {} as Record<Role, DemoAccount | undefined>,
);

export function demoAccountFor(role: Role | undefined): DemoAccount | undefined {
  return role ? DEMO_ACCOUNTS_BY_ROLE[role] : undefined;
}

/** True when the signed-in identity is one of the seeded demo accounts. */
export function isDemoEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  return DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === e);
}
