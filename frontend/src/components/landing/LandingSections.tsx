import { Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, ClipboardCheck, FileBadge, Wallet, BedDouble, Users,
  ClipboardList, Award, Sparkles, LayoutDashboard, Bell, MessageSquare, BarChart3,
  TrendingUp, Target, PieChart, Receipt, DoorOpen, ArrowRight, ShieldCheck, Lock,
} from 'lucide-react';
import {
  BookMarked, CalendarClock, IndianRupee, Layers,
} from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '../motion/Motion';
import { PictLogo } from '../brand/PictLogo';
import { INSTITUTION, OFFICIAL_LINKS } from '../../data/pict/institution';

/* ------------------------------------------------------------------ shared */

export function SectionHeading({
  eyebrow,
  title,
  lead,
  center = true,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">{eyebrow}</p>
      <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
      {lead ? <p className="mt-3 text-pretty text-sm leading-relaxed text-ink-muted sm:text-base">{lead}</p> : null}
    </Reveal>
  );
}

export function SectionShell({
  id,
  className = '',
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:py-24 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

/* --------------------------------------------------- SECTION 2 · modules --- */

const MODULES = [
  {
    icon: GraduationCap,
    title: 'Student & Admission',
    body: 'Applications, merit lists, enrolment, profile, documents and the full student lifecycle.',
    to: '/students',
  },
  {
    icon: BookOpen,
    title: 'Academic & Courses',
    body: 'Departments, programs, subjects, offerings, timetable and the academic calendar.',
    to: '/academics/masters',
  },
  {
    icon: ClipboardCheck,
    title: 'Attendance',
    body: 'Session-wise marking, live defaulter tracking and the 75% examination eligibility gate.',
    to: '/attendance/reports',
  },
  {
    icon: FileBadge,
    title: 'Examinations & Results',
    body: 'Schedules, eligibility, registrations, marks entry, grading, SGPA/CGPA and hall tickets.',
    to: '/exams',
  },
  {
    icon: Wallet,
    title: 'Fees & Finance',
    body: 'Fee structures, bills, payments, receipts, scholarships, defaulters and financial reports.',
    to: '/fees/bills',
  },
  {
    icon: BedDouble,
    title: 'Hostel',
    body: 'Applications, room and bed allocation, transfers, occupancy and hostel fees.',
    to: '/hostel/dashboard',
  },
  {
    icon: Users,
    title: 'Faculty & Payroll',
    body: 'Faculty records, workload, leave management, balances and monthly payroll.',
    to: '/faculty',
  },
];

export function ModulesSection() {
  return (
    <SectionShell id="modules" className="border-t border-line bg-surface">
      <SectionHeading
        eyebrow="Everything connected"
        title="Seven modules. One database. Zero duplication."
        lead="Every module reads and writes the same shared masters — student, faculty, department, program and subject exist exactly once, so a mark entered here is a result there."
      />
      <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
        {MODULES.map((m) => (
          <StaggerItem key={m.title}>
            <Link
              to={m.to}
              className="group card card-pad card-hover flex h-full flex-col"
              aria-label={`${m.title} module`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-800">
                <m.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">{m.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">{m.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 opacity-0 transition group-hover:opacity-100 dark:text-brand-300">
                Open module <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}

/* --------------------------------------------------- SECTION 3 · journey --- */

const JOURNEY = [
  { icon: ClipboardList, label: 'Admission', body: 'Application, category and merit-based intake — FE, DSE lateral entry or institute level.' },
  { icon: Layers, label: 'Enrollment', body: 'Program, batch, section and subject registration for the semester.' },
  { icon: ClipboardCheck, label: 'Attendance', body: 'Every session recorded; live percentage drives examination eligibility.' },
  { icon: FileBadge, label: 'Examination', body: 'Eligibility check, hall ticket, schedule and seating.' },
  { icon: Award, label: 'Results', body: 'Marks → grade → SGPA → CGPA, with department and subject analytics.' },
  { icon: GraduationCap, label: 'Graduation', body: 'Complete history, documents and the final academic record.' },
];

export function JourneySection() {
  return (
    <SectionShell id="journey">
      <SectionHeading
        eyebrow="Built around the student journey"
        title="From application to graduation — one continuous record"
        lead="Nothing is re-entered. Each stage reads what the previous stage wrote, which is exactly what a normalized relational schema is for."
      />
      <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {JOURNEY.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.05}>
            <li className="card card-pad h-full">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-brand-700 ring-1 ring-line dark:text-brand-300">
                  <s.icon className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold text-ink">{s.label}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{s.body}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </SectionShell>
  );
}

/* ---------------------------------------------- SECTION 4 · perspectives --- */

const PERSPECTIVES = [
  { label: 'Student', body: 'Own attendance, timetable, results, fees, hostel and mock tests.', perms: 'Reads own records' },
  { label: 'Faculty', body: 'Assigned classes, attendance marking, marks entry, leaves and payslips.', perms: 'Writes for assigned classes' },
  { label: 'Exam Cell', body: 'Examinations, schedules, eligibility, registrations, marks and results.', perms: 'Owns the examination cycle' },
  { label: 'Finance', body: 'Fee structures, bills, payments, receipts, scholarships and reports.', perms: 'Owns finance operations' },
  { label: 'Hostel', body: 'Applications, rooms, beds, allocations, transfers and hostel fees.', perms: 'Owns hostel operations' },
  { label: 'Administration', body: 'University-wide oversight: students, faculty, academics, finance, exams, hostel.', perms: 'Full authorised access' },
];

export function PerspectivesSection() {
  return (
    <SectionShell id="roles" className="border-y border-line bg-surface">
      <SectionHeading
        eyebrow="One platform. Multiple perspectives."
        title="The same ERP, adapted to whoever signs in"
        lead="There is exactly one dashboard. Role decides which widgets, which navigation and which actions appear — never a second application."
      />
      <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
        {PERSPECTIVES.map((p) => (
          <StaggerItem key={p.label}>
            <div className="card card-pad h-full">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">{p.label}</h3>
                <span className="chip bg-surface-2 text-ink-muted ring-1 ring-line">{p.perms}</span>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{p.body}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}

/* --------------------------------------------- SECTION 5 · intelligence --- */

const INTELLIGENCE = [
  { icon: ClipboardCheck, title: 'Attendance analytics', body: 'Session, subject and cohort trends with automatic defaulter detection below 75%.' },
  { icon: TrendingUp, title: 'Performance analytics', body: 'Marks distributions, subject failure rates and department-level comparison.' },
  { icon: Target, title: 'CGPA tracking', body: 'Rolling SGPA/CGPA progression computed from graded marks, not stored by hand.' },
  { icon: PieChart, title: 'Exam analytics', body: 'Registration, eligibility, rejection reasons and result-publishing status.' },
  { icon: BarChart3, title: 'Department analytics', body: 'Per-department strength, performance and average SGPA from live aggregates.' },
  { icon: Sparkles, title: 'At-risk identification', body: 'A stored procedure scores every student from attendance, marks and backlog history.' },
];

export function IntelligenceSection() {
  return (
    <SectionShell id="intelligence">
      <SectionHeading
        eyebrow="Academic intelligence"
        title="Answers computed by the database, not guessed by the UI"
        lead="Views, stored functions and procedures do the aggregation; the interface only visualises what the engine already knows."
      />
      <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
        {INTELLIGENCE.map((i) => (
          <StaggerItem key={i.title}>
            <div className="card card-pad card-hover h-full">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-700 ring-1 ring-accent-100 dark:bg-accent-900/30 dark:text-accent-200 dark:ring-accent-800">
                <i.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-ink">{i.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{i.body}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}

/* ---------------------------------------------- SECTION 6 · operations --- */

const OPERATIONS = [
  { icon: IndianRupee, title: 'Fees', body: 'Bill generation, payment capture, receipts, fines, refunds and defaulter lists.' },
  { icon: DoorOpen, title: 'Hostel', body: 'Beds update automatically through triggers whenever an allocation changes.' },
  { icon: Users, title: 'Faculty', body: 'Workload, leave workflow with balance ledger, and monthly payroll runs.' },
  { icon: Bell, title: 'Notifications', body: 'Targeted and broadcast notices for results, fees, exams and approvals.' },
  { icon: MessageSquare, title: 'Feedback', body: 'Course, faculty, infrastructure and hostel feedback with lifecycle tracking.' },
  { icon: ShieldCheck, title: 'Audit trail', body: 'Every sensitive change is logged with actor, action, entity and timestamp.' },
];

export function OperationsSection() {
  return (
    <SectionShell id="operations" className="border-t border-line bg-surface">
      <SectionHeading
        eyebrow="Campus operations"
        title="The non-academic half of campus, on the same spine"
      />
      <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
        {OPERATIONS.map((o) => (
          <StaggerItem key={o.title}>
            <div className="card card-pad h-full">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-brand-700 ring-1 ring-line dark:text-brand-300">
                  <o.icon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{o.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{o.body}</p>
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}

/* ------------------------------------------------- SECTION 7 · feedback --- */

export function FeedbackSection() {
  return (
    <SectionShell id="feedback">
      <SectionHeading
        eyebrow="Feedback"
        title="Every voice on campus, in one loop"
        lead="Students raise it, the right office owns it, and the response comes back through the same thread — with anonymity enforced by the database, not by the interface."
      />
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {[
          { icon: MessageSquare, title: 'Student feedback', body: 'Course, faculty, infrastructure, hostel, ERP and general categories with 1–5 star rating.' },
          { icon: Users, title: 'Faculty & staff feedback', body: 'Curriculum and process feedback routed to the owning department or office.' },
          { icon: BarChart3, title: 'Campus analytics', body: 'Category trends, resolution times and satisfaction scores across departments.' },
        ].map((f, i) => (
          <Reveal key={f.title} delay={i * 0.06}>
            <div className="card card-pad h-full">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/10 text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-300">
                <f.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-6" delay={0.1}>
        <div className="card card-pad flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Lifecycle: DRAFT → SUBMITTED → UNDER REVIEW → RESOLVED → CLOSED</p>
            <p className="mt-1 text-sm text-ink-muted">
              Status, assignment and the response thread are stored per feedback item, so nothing is lost in an inbox.
            </p>
          </div>
          <Link to="/login" className="btn-primary btn-sm shrink-0">
            Open feedback <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Reveal>
    </SectionShell>
  );
}

/* ------------------------------------------------- SECTION 8 · identity --- */

export function IdentitySection() {
  return (
    <SectionShell id="about" className="border-t border-line bg-brand-950 text-white">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <PictLogo tone="light" />
          <h2 className="mt-6 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {INSTITUTION.legalName}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100/70">
            An autonomous institute affiliated to Savitribai Phule Pune University, offering undergraduate programmes in
            Computer Engineering, Electronics and Telecommunication Engineering, Information Technology, Artificial
            Intelligence and Data Science, and Electronics and Computer Engineering.
          </p>
          <p className="mt-4 text-sm text-brand-100/60">
            {INSTITUTION.address.line1}, {INSTITUTION.address.line2}, {INSTITUTION.address.city}-{INSTITUTION.address.pincode},{' '}
            {INSTITUTION.address.state}, {INSTITUTION.address.country}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/login" className="btn bg-white text-brand-900 hover:bg-brand-50">
              Access ERP
            </Link>
            <a
              href={OFFICIAL_LINKS.website}
              target="_blank"
              rel="noreferrer noopener"
              className="btn border border-white/25 text-white hover:bg-white/10"
            >
              pict.edu
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-200/70">Project</p>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['System', 'University Higher Education ERP'],
                ['Batch', 'M7 · DBMS major project'],
                ['Stack', 'React + TypeScript · Node/Express · MySQL/MariaDB'],
                ['Database', '7 modules · 61 tables · procedures, triggers, functions, views'],
                ['Access model', 'JWT + role-based authorisation, enforced server-side'],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <dt className="text-xs uppercase tracking-wide text-brand-200/60">{k}</dt>
                  <dd className="text-white/85">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}

/* ---------------------------------------------------- SECTION 9 · CTA --- */

export function FinalCta() {
  return (
    <SectionShell className="border-t border-line">
      <Reveal className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 px-6 py-14 text-center sm:px-12">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80">
            <Lock className="h-3 w-3" /> Sign-in required
          </span>
          <h2 className="mt-5 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">Ready to enter the ERP?</h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-brand-100/70">
            Sign in with your institute account, or explore the platform with one of the seeded demo accounts — the same
            dashboard adapts itself to your role.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login" className="btn bg-white px-5 py-2.5 text-brand-900 shadow-lg hover:bg-brand-50">
              Access ERP <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login#demo" className="btn border border-white/25 px-5 py-2.5 text-white hover:bg-white/10">
              View demo accounts
            </Link>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}

/* ------------------------------------------------------- small helpers --- */

export function FeatureStrip() {
  const items = [
    { icon: LayoutDashboard, label: 'One dashboard for every role' },
    { icon: BookMarked, label: 'Real relational schema, not mock data' },
    { icon: CalendarClock, label: 'Live attendance and timetable' },
    { icon: Receipt, label: 'Fee, receipt and scholarship trail' },
    { icon: ShieldCheck, label: 'Server-side authorisation' },
    { icon: Sparkles, label: 'Analytics straight from SQL' },
  ];
  return (
    <div className="border-y border-line bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:grid-cols-6">
        {items.map((i) => (
          <div key={i.label} className="flex items-start gap-2">
            <i.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" />
            <span className="text-xs leading-relaxed text-ink-muted">{i.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
