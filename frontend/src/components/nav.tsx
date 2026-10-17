import { ReactNode } from 'react';
import {
  LayoutDashboard, GraduationCap, FileText, UserPlus, BookOpen, Building2, Library,
  CalendarDays, CalendarClock, ClipboardCheck, PenLine, BarChart3, FileBadge, Award,
  Ticket, BrainCircuit, Wallet, Receipt, CreditCard, TriangleAlert, Percent, BedDouble,
  Home, ClipboardList, DoorOpen, Users, Umbrella, CalendarRange, IndianRupee, Sparkles,
  Lightbulb, ShieldAlert, PieChart, Bell, ScrollText, Settings2, UserCircle, ListChecks,
} from 'lucide-react';
import { Role } from '../lib/types';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: Role[];
  badge?: 'unread';
  /** Optional short description used by the command palette. */
  hint?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const ALL: Role[] = ['ADMIN', 'FACULTY', 'STUDENT', 'ACCOUNTANT', 'HOSTEL_ADMIN', 'EXAM_CELL', 'HR'];
/** Everyone except students — i.e. people who work with institutional data. */
const STAFF: Role[] = ['ADMIN', 'FACULTY', 'ACCOUNTANT', 'HOSTEL_ADMIN', 'EXAM_CELL', 'HR'];
const ADMIN: Role[] = ['ADMIN'];
const ADMIN_HR: Role[] = ['ADMIN', 'HR'];
const ADMIN_ACCT: Role[] = ['ADMIN', 'ACCOUNTANT'];
const ADMIN_HOSTEL: Role[] = ['ADMIN', 'HOSTEL_ADMIN'];
const ADMIN_EXAM: Role[] = ['ADMIN', 'EXAM_CELL'];
const TEACHING: Role[] = ['ADMIN', 'FACULTY'];
const EXAM_READ: Role[] = ['ADMIN', 'EXAM_CELL', 'FACULTY'];
const HR_FACULTY: Role[] = ['ADMIN', 'HR', 'FACULTY'];

/**
 * One navigation model for every role.
 *
 * Role decides only which entries exist — never which application renders.
 * Anything a role may not open is absent here AND rejected by the API, so no
 * user ever lands on a page just to be told they are not allowed.
 */
export const NAV: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, roles: ALL, hint: 'Your workspace' },
      { to: '/profile', label: 'My Profile', icon: <UserCircle className="h-4 w-4" />, roles: ALL, hint: 'Account and role details' },
    ],
  },
  {
    title: 'Students & Admission',
    items: [
      { to: '/students', label: 'Students', icon: <GraduationCap className="h-4 w-4" />, roles: STAFF, hint: 'Student master' },
      { to: '/admissions', label: 'Admissions', icon: <FileText className="h-4 w-4" />, roles: ADMIN, hint: 'Applications and review' },
      { to: '/admissions/apply', label: 'Apply for Admission', icon: <UserPlus className="h-4 w-4" />, roles: ALL, hint: 'New application' },
      { to: '/enrollments', label: 'Enrollment', icon: <ListChecks className="h-4 w-4" />, roles: ADMIN_EXAM, hint: 'Subject enrollment' },
    ],
  },
  {
    title: 'Academics',
    items: [
      { to: '/academics/masters', label: 'Departments & Programs', icon: <Building2 className="h-4 w-4" />, roles: STAFF },
      { to: '/academics/subjects', label: 'Subjects', icon: <BookOpen className="h-4 w-4" />, roles: STAFF },
      { to: '/academics/offerings', label: 'Course Offerings', icon: <Library className="h-4 w-4" />, roles: STAFF },
      { to: '/academics/timetable', label: 'Timetable', icon: <CalendarClock className="h-4 w-4" />, roles: ALL },
      { to: '/academics/calendar', label: 'Academic Calendar', icon: <CalendarDays className="h-4 w-4" />, roles: ALL },
    ],
  },
  {
    title: 'Attendance',
    items: [
      { to: '/attendance/sessions', label: 'Sessions', icon: <ClipboardCheck className="h-4 w-4" />, roles: TEACHING },
      { to: '/attendance/reports', label: 'Reports & Defaulters', icon: <BarChart3 className="h-4 w-4" />, roles: [...TEACHING, 'EXAM_CELL'] },
      { to: '/attendance/me', label: 'My Attendance', icon: <PenLine className="h-4 w-4" />, roles: ['STUDENT'] },
    ],
  },
  {
    title: 'Examinations & Results',
    items: [
      { to: '/exams', label: 'Examinations', icon: <FileBadge className="h-4 w-4" />, roles: [...EXAM_READ, 'STUDENT'] },
      { to: '/exams/registrations', label: 'Registrations', icon: <ClipboardList className="h-4 w-4" />, roles: ADMIN_EXAM },
      { to: '/exams/marks', label: 'Marks Entry', icon: <PenLine className="h-4 w-4" />, roles: EXAM_READ },
      { to: '/exams/results', label: 'Results', icon: <Award className="h-4 w-4" />, roles: ['ADMIN', 'EXAM_CELL', 'FACULTY', 'STUDENT'] },
      { to: '/exams/hall-ticket', label: 'Hall Ticket', icon: <Ticket className="h-4 w-4" />, roles: ['STUDENT'] },
      { to: '/mock-exams', label: 'Mock Test Engine', icon: <BrainCircuit className="h-4 w-4" />, roles: ALL },
    ],
  },
  {
    title: 'Fees & Finance',
    items: [
      { to: '/fees/structures', label: 'Fee Structures', icon: <Wallet className="h-4 w-4" />, roles: ADMIN_ACCT },
      { to: '/fees/bills', label: 'Fee Bills', icon: <Receipt className="h-4 w-4" />, roles: ADMIN_ACCT },
      { to: '/fees/payments', label: 'Payments', icon: <CreditCard className="h-4 w-4" />, roles: ADMIN_ACCT },
      { to: '/fees/defaulters', label: 'Defaulters', icon: <TriangleAlert className="h-4 w-4" />, roles: ADMIN_ACCT },
      { to: '/fees/scholarships', label: 'Scholarships', icon: <Percent className="h-4 w-4" />, roles: [...ADMIN_ACCT, 'STUDENT'] },
      { to: '/fees/me', label: 'My Fees', icon: <IndianRupee className="h-4 w-4" />, roles: ['STUDENT'] },
    ],
  },
  {
    title: 'Hostel',
    items: [
      { to: '/hostel/dashboard', label: 'Occupancy', icon: <BedDouble className="h-4 w-4" />, roles: ADMIN_HOSTEL },
      { to: '/hostel/rooms', label: 'Rooms & Beds', icon: <DoorOpen className="h-4 w-4" />, roles: ADMIN_HOSTEL },
      { to: '/hostel/applications', label: 'Applications', icon: <ClipboardList className="h-4 w-4" />, roles: ADMIN_HOSTEL },
      { to: '/hostel/allocations', label: 'Allocations', icon: <Home className="h-4 w-4" />, roles: ADMIN_HOSTEL },
      { to: '/hostel/me', label: 'My Hostel', icon: <BedDouble className="h-4 w-4" />, roles: ['STUDENT'] },
    ],
  },
  {
    title: 'Faculty & Payroll',
    items: [
      { to: '/faculty', label: 'Faculty', icon: <Users className="h-4 w-4" />, roles: HR_FACULTY },
      { to: '/faculty/leaves', label: 'Leave Requests', icon: <Umbrella className="h-4 w-4" />, roles: HR_FACULTY },
      { to: '/faculty/balances', label: 'Leave Balances', icon: <CalendarRange className="h-4 w-4" />, roles: HR_FACULTY },
      { to: '/faculty/payroll', label: 'Payroll', icon: <IndianRupee className="h-4 w-4" />, roles: ADMIN_HR },
    ],
  },
  {
    title: 'AI Assistant',
    items: [
      { to: '/ai/chat', label: 'Ask the Assistant', icon: <Sparkles className="h-4 w-4" />, roles: ALL },
      { to: '/ai/study-plan', label: 'Study Plan', icon: <Lightbulb className="h-4 w-4" />, roles: ['ADMIN', 'FACULTY', 'STUDENT'] },
      { to: '/ai/at-risk', label: 'At-Risk Students', icon: <ShieldAlert className="h-4 w-4" />, roles: ['ADMIN', 'FACULTY', 'EXAM_CELL'] },
    ],
  },
  {
    title: 'Reports & System',
    items: [
      { to: '/reports', label: 'Reports & Exports', icon: <PieChart className="h-4 w-4" />, roles: STAFF },
      { to: '/notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" />, roles: ALL, badge: 'unread' },
      { to: '/audit', label: 'Audit Log', icon: <ScrollText className="h-4 w-4" />, roles: ['ADMIN', 'ACCOUNTANT', 'HR'] },
      { to: '/settings', label: 'Settings', icon: <Settings2 className="h-4 w-4" />, roles: ADMIN },
    ],
  },
];

/** Sections for one role, with empty sections removed. */
export function navFor(role: Role | undefined): NavSection[] {
  if (!role) return [];
  return NAV.map((s) => ({
    ...s,
    items: s.items.filter((i) => i.roles.includes(role)),
  })).filter((s) => s.items.length > 0);
}

/** Flat list used by the command palette. */
export function navItemsFor(role: Role | undefined): NavItem[] {
  return navFor(role).flatMap((s) => s.items);
}

/** path -> human label, used for breadcrumbs and page headings. */
export const PATH_LABELS: Record<string, string> = NAV.reduce((acc, s) => {
  s.items.forEach((i) => {
    acc[i.to] = i.label;
  });
  return acc;
}, {} as Record<string, string>);

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ACCOUNTANT: 'Finance Office',
  HOSTEL_ADMIN: 'Hostel Administration',
  EXAM_CELL: 'Examination Cell',
  HR: 'Human Resources',
};
