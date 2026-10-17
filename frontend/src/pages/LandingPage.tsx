import { Link } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  IndianRupee,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { LandingNav } from '../components/landing/LandingNav';
import { PictLogo } from '../components/brand/PictLogo';
import { INSTITUTION } from '../data/pict/institution';

const MODULES: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: 'Student Management',
    description: 'Maintain student records, admissions and enrolments.',
    icon: GraduationCap,
  },
  {
    title: 'Academics',
    description: 'Manage departments, programs, subjects and timetables.',
    icon: BookOpen,
  },
  {
    title: 'Attendance',
    description: 'Record class attendance and review attendance summaries.',
    icon: ClipboardCheck,
  },
  {
    title: 'Examinations',
    description: 'Coordinate examination schedules, marks and results.',
    icon: FileText,
  },
  {
    title: 'Fees',
    description: 'Maintain fee structures, bills, payments and receipts.',
    icon: IndianRupee,
  },
  {
    title: 'Hostel',
    description: 'Manage hostel applications, rooms and allocations.',
    icon: Building2,
  },
  {
    title: 'Faculty Management',
    description: 'Maintain faculty records, leave and payroll workflows.',
    icon: Users,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LandingNav />

      <main>
        <section className="border-b border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-medium text-blue-900">DBMS-M7_ERP · M7 Batch project</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              University Higher Education ERP System
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              An integrated academic management system for students, faculty and college administration.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-blue-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
              >
                Login to ERP
              </Link>
              <a
                href="#modules"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-blue-900 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
              >
                Explore Modules
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              New applicant? <Link to="/admissions/apply" className="font-medium text-blue-900 underline-offset-4 hover:underline">Submit an admission application</Link>.
            </p>
          </div>
        </section>

        <section id="modules" className="scroll-mt-20 bg-slate-50 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">ERP Modules</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Core academic and administrative functions are available through one role-aware application.
              </p>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map(({ title, description, icon: Icon }) => (
                <article
                  key={title}
                  className="rounded-md border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-900">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-20 border-t border-slate-200 bg-white px-4 py-12 sm:px-6 sm:py-14">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">About the project</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                This college DBMS project brings student, academic, examination, finance, hostel and faculty workflows
                together. Access to records and actions is controlled by role permissions.
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Developed by the M7 Batch as an engineering project.
              </p>
            </div>
            <div className="border-t border-slate-200 pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <p className="text-sm font-medium text-slate-900">{INSTITUTION.legalName}</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">
                {INSTITUTION.address.line1}, {INSTITUTION.address.line2}, {INSTITUTION.address.city} {INSTITUTION.address.pincode}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PictLogo compact />
          <p className="text-xs text-slate-500">College DBMS project · M7 Batch</p>
        </div>
      </footer>
    </div>
  );
}
