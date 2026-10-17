import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { AppShell, RoleGate } from './components/AppShell';
import { Loading } from './components/ui';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PasswordChangePage = lazy(() => import('./pages/PasswordChangePage'));

const StudentsPage = lazy(() => import('./pages/students/StudentsPage'));
const StudentDetailPage = lazy(() => import('./pages/students/StudentDetailPage'));
const AdmissionsPage = lazy(() => import('./pages/students/AdmissionsPage'));
const AdmissionApplyPage = lazy(() => import('./pages/students/AdmissionApplyPage'));
const EnrollmentsPage = lazy(() => import('./pages/students/EnrollmentsPage'));

const AcademicsMastersPage = lazy(() => import('./pages/academics/AcademicsMastersPage'));
const SubjectsPage = lazy(() => import('./pages/academics/SubjectsPage'));
const OfferingsPage = lazy(() => import('./pages/academics/OfferingsPage'));
const TimetablePage = lazy(() => import('./pages/academics/TimetablePage'));
const CalendarPage = lazy(() => import('./pages/academics/CalendarPage'));

const AttendanceSessionsPage = lazy(() => import('./pages/attendance/AttendanceSessionsPage'));
const AttendanceMarkPage = lazy(() => import('./pages/attendance/AttendanceMarkPage'));
const AttendanceReportsPage = lazy(() => import('./pages/attendance/AttendanceReportsPage'));
const MyAttendancePage = lazy(() => import('./pages/attendance/MyAttendancePage'));

const ExamsPage = lazy(() => import('./pages/exams/ExamsPage'));
const ExamRegistrationsPage = lazy(() => import('./pages/exams/ExamRegistrationsPage'));
const MarksPage = lazy(() => import('./pages/exams/MarksPage'));
const ResultsPage = lazy(() => import('./pages/exams/ResultsPage'));
const HallTicketPage = lazy(() => import('./pages/exams/HallTicketPage'));
const MockExamsPage = lazy(() => import('./pages/exams/MockExamsPage'));
const MockAttemptPage = lazy(() => import('./pages/exams/MockAttemptPage'));

const FeeStructuresPage = lazy(() => import('./pages/fees/FeeStructuresPage'));
const BillsPage = lazy(() => import('./pages/fees/BillsPage'));
const PaymentsPage = lazy(() => import('./pages/fees/PaymentsPage'));
const DefaultersPage = lazy(() => import('./pages/fees/DefaultersPage'));
const ScholarshipsPage = lazy(() => import('./pages/fees/ScholarshipsPage'));
const MyFeesPage = lazy(() => import('./pages/fees/MyFeesPage'));

const HostelDashboardPage = lazy(() => import('./pages/hostel/HostelDashboardPage'));
const HostelRoomsPage = lazy(() => import('./pages/hostel/HostelRoomsPage'));
const HostelApplicationsPage = lazy(() => import('./pages/hostel/HostelApplicationsPage'));
const HostelAllocationsPage = lazy(() => import('./pages/hostel/HostelAllocationsPage'));
const MyHostelPage = lazy(() => import('./pages/hostel/MyHostelPage'));

const FacultyPage = lazy(() => import('./pages/faculty/FacultyPage'));
const FacultyDetailPage = lazy(() => import('./pages/faculty/FacultyDetailPage'));
const LeavesPage = lazy(() => import('./pages/faculty/LeavesPage'));
const LeaveBalancesPage = lazy(() => import('./pages/faculty/LeaveBalancesPage'));
const PayrollPage = lazy(() => import('./pages/faculty/PayrollPage'));

const AiChatPage = lazy(() => import('./pages/ai/AiChatPage'));
const StudyPlanPage = lazy(() => import('./pages/ai/StudyPlanPage'));
const AtRiskPage = lazy(() => import('./pages/ai/AtRiskPage'));

const ReportsPage = lazy(() => import('./pages/system/ReportsPage'));
const NotificationsPage = lazy(() => import('./pages/system/NotificationsPage'));
const AuditPage = lazy(() => import('./pages/system/AuditPage'));
const SettingsPage = lazy(() => import('./pages/system/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/system/NotFoundPage'));
const AccessRestrictedPage = lazy(() => import('./pages/system/AccessRestrictedPage'));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loading label="Restoring your session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<Loading label="Loading PICT ERP…" />}>
    <Routes>
      {/* ------------------------------------------------------ public ---- */}
      {/* Login-first entry point; the separate /login URL remains a compatible alias. */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admissions/apply" element={<AdmissionApplyPage />} />
      <Route path="/change-password" element={<RequireAuth><PasswordChangePage /></RequireAuth>} />
      <Route path="/access-restricted" element={<AccessRestrictedPage />} />

      {/* --------------------------------------------------- protected ---- */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        {/* The one dashboard every role lands on. */}
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Legacy link: "/" used to be the dashboard while signed in. */}
        <Route path="/home" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Module 1 */}
        <Route path="/students" element={<RoleGate roles={['ADMIN', 'FACULTY', 'ACCOUNTANT', 'HOSTEL_ADMIN', 'EXAM_CELL', 'HR']}><StudentsPage /></RoleGate>} />
        <Route path="/students/:id" element={<RoleGate roles={['ADMIN']}><StudentDetailPage /></RoleGate>} />
        <Route path="/admissions" element={<RoleGate roles={['ADMIN']}><AdmissionsPage /></RoleGate>} />
        <Route path="/enrollments" element={<RoleGate roles={['ADMIN', 'EXAM_CELL']}><EnrollmentsPage /></RoleGate>} />

        {/* Module 2 */}
        <Route path="/academics/masters" element={<RoleGate roles={['ADMIN', 'FACULTY', 'ACCOUNTANT', 'HOSTEL_ADMIN', 'EXAM_CELL', 'HR']}><AcademicsMastersPage /></RoleGate>} />
        <Route path="/academics/subjects" element={<RoleGate roles={['ADMIN', 'FACULTY', 'ACCOUNTANT', 'HOSTEL_ADMIN', 'EXAM_CELL', 'HR']}><SubjectsPage /></RoleGate>} />
        <Route path="/academics/offerings" element={<RoleGate roles={['ADMIN', 'FACULTY', 'ACCOUNTANT', 'HOSTEL_ADMIN', 'EXAM_CELL', 'HR']}><OfferingsPage /></RoleGate>} />
        <Route path="/academics/timetable" element={<TimetablePage />} />
        <Route path="/academics/calendar" element={<CalendarPage />} />

        {/* Module 3 */}
        <Route path="/attendance/sessions" element={<RoleGate roles={['ADMIN', 'FACULTY']}><AttendanceSessionsPage /></RoleGate>} />
        <Route path="/attendance/sessions/:id" element={<RoleGate roles={['ADMIN', 'FACULTY']}><AttendanceMarkPage /></RoleGate>} />
        <Route path="/attendance/reports" element={<RoleGate roles={['ADMIN', 'FACULTY', 'EXAM_CELL']}><AttendanceReportsPage /></RoleGate>} />
        <Route path="/attendance/me" element={<RoleGate roles={['STUDENT']}><MyAttendancePage /></RoleGate>} />

        {/* Module 4 */}
        <Route path="/exams" element={<RoleGate roles={['ADMIN', 'FACULTY', 'EXAM_CELL', 'STUDENT']}><ExamsPage /></RoleGate>} />
        <Route path="/exams/registrations" element={<RoleGate roles={['ADMIN', 'EXAM_CELL']}><ExamRegistrationsPage /></RoleGate>} />
        <Route path="/exams/marks" element={<RoleGate roles={['ADMIN', 'EXAM_CELL', 'FACULTY']}><MarksPage /></RoleGate>} />
        <Route path="/exams/results" element={<RoleGate roles={['ADMIN', 'FACULTY', 'EXAM_CELL', 'STUDENT']}><ResultsPage /></RoleGate>} />
        <Route path="/exams/hall-ticket" element={<RoleGate roles={['STUDENT']}><HallTicketPage /></RoleGate>} />
        <Route path="/mock-exams" element={<MockExamsPage />} />
        <Route path="/mock-exams/attempts/:id" element={<MockAttemptPage />} />

        {/* Module 5 */}
        <Route path="/fees/structures" element={<RoleGate roles={['ADMIN', 'ACCOUNTANT']}><FeeStructuresPage /></RoleGate>} />
        <Route path="/fees/bills" element={<RoleGate roles={['ADMIN', 'ACCOUNTANT']}><BillsPage /></RoleGate>} />
        <Route path="/fees/payments" element={<RoleGate roles={['ADMIN', 'ACCOUNTANT']}><PaymentsPage /></RoleGate>} />
        <Route path="/fees/defaulters" element={<RoleGate roles={['ADMIN', 'ACCOUNTANT']}><DefaultersPage /></RoleGate>} />
        <Route path="/fees/scholarships" element={<RoleGate roles={['ADMIN', 'ACCOUNTANT', 'STUDENT']}><ScholarshipsPage /></RoleGate>} />
        <Route path="/fees/me" element={<RoleGate roles={['STUDENT']}><MyFeesPage /></RoleGate>} />

        {/* Module 6 */}
        <Route path="/hostel/dashboard" element={<RoleGate roles={['ADMIN', 'HOSTEL_ADMIN']}><HostelDashboardPage /></RoleGate>} />
        <Route path="/hostel/rooms" element={<RoleGate roles={['ADMIN', 'HOSTEL_ADMIN']}><HostelRoomsPage /></RoleGate>} />
        <Route path="/hostel/applications" element={<RoleGate roles={['ADMIN', 'HOSTEL_ADMIN']}><HostelApplicationsPage /></RoleGate>} />
        <Route path="/hostel/allocations" element={<RoleGate roles={['ADMIN', 'HOSTEL_ADMIN']}><HostelAllocationsPage /></RoleGate>} />
        <Route path="/hostel/me" element={<RoleGate roles={['STUDENT']}><MyHostelPage /></RoleGate>} />

        {/* Module 7 */}
        <Route path="/faculty" element={<RoleGate roles={['ADMIN', 'HR', 'FACULTY']}><FacultyPage /></RoleGate>} />
        <Route path="/faculty/:id" element={<RoleGate roles={['ADMIN', 'HR']}><FacultyDetailPage /></RoleGate>} />
        <Route path="/faculty/leaves" element={<RoleGate roles={['ADMIN', 'HR', 'FACULTY']}><LeavesPage /></RoleGate>} />
        <Route path="/faculty/balances" element={<RoleGate roles={['ADMIN', 'HR', 'FACULTY']}><LeaveBalancesPage /></RoleGate>} />
        <Route path="/faculty/payroll" element={<RoleGate roles={['ADMIN', 'HR']}><PayrollPage /></RoleGate>} />

        {/* AI */}
        <Route path="/ai/chat" element={<AiChatPage />} />
        <Route path="/ai/study-plan" element={<RoleGate roles={['ADMIN', 'FACULTY', 'STUDENT']}><StudyPlanPage /></RoleGate>} />
        <Route path="/ai/at-risk" element={<RoleGate roles={['ADMIN', 'FACULTY', 'EXAM_CELL']}><AtRiskPage /></RoleGate>} />

        {/* System */}
        <Route path="/reports" element={<RoleGate roles={['ADMIN', 'FACULTY', 'ACCOUNTANT', 'HOSTEL_ADMIN', 'EXAM_CELL', 'HR']}><ReportsPage /></RoleGate>} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/audit" element={<RoleGate roles={['ADMIN', 'ACCOUNTANT', 'HR']}><AuditPage /></RoleGate>} />
        <Route path="/settings" element={<RoleGate roles={['ADMIN']}><SettingsPage /></RoleGate>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
