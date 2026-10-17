import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Send } from 'lucide-react';
import { api, errMsg } from '../../lib/api';
import { Card, Field, SelectField, Loading, useFetch, EmptyState, ErrorBox } from '../../components/ui';
import { PictLogo } from '../../components/brand/PictLogo';
import { titleCase } from '../../lib/format';

interface Program { program_id: number; program_name: string; program_code: string; duration_years: number; }
interface Category { category_id: number; category_name: string; category_code: string; }
interface Options { programs: Program[]; categories: Category[]; }

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
  gender: '', programId: '', categoryId: '', guardianName: '', guardianPhone: '',
  previousSchool: '', qualification: 'HSC', marks10: '', marks12: '',
  entranceScore: '', addressLine1: '', city: '', state: '', pincode: '',
};

export default function AdmissionApplyPage() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: number; applicationNo: string } | null>(null);
  const options = useFetch(() => api.get<Options>('/students/admissions/options'), []);
  const programOptions = options.data?.programs ?? [];
  const categoryOptions = options.data?.categories ?? [];

  const set = (key: keyof typeof EMPTY) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.post<{ id: number; applicationNo: string }>('/students/admissions/apply', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        programId: Number(form.programId),
        categoryId: Number(form.categoryId),
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
        previousSchool: form.previousSchool || undefined,
        qualification: form.qualification || undefined,
        marks10: Number(form.marks10),
        marks12: Number(form.marks12),
        ...(form.entranceScore.trim() ? { entranceScore: Number(form.entranceScore) } : {}),
        addressLine1: form.addressLine1 || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
      });
      setDone(result);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" aria-label="PICT ERP home"><PictLogo compact /></Link>
          <Link to="/login" className="text-sm font-medium text-blue-900 hover:underline">ERP login</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {done ? (
          <Card className="p-6 text-center sm:p-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
            <h1 className="mt-3 text-xl font-semibold text-slate-950">Application submitted</h1>
            <p className="mt-2 text-sm text-slate-600">
              Your application number is <b className="text-blue-900">{done.applicationNo}</b>. Keep it for reference.
            </p>
            <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              Your application is pending administrator review. This submission has not created an active login. After approval, the existing workflow creates the student record and account; the administrator will provide the temporary password through a trusted channel. Pending or rejected applications cannot access student services.
            </p>
            <Link to="/" className="btn-secondary mt-5">Return to login</Link>
          </Card>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Create a student account</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Complete the existing admission application below. It is submitted for administrator review; it does not create an active login immediately. On approval, the database workflow creates the student record, roll number/PRN, and login account. The temporary password is issued by the administrator, and must be changed at first sign-in.
            </p>

            {options.error ? (
              <div className="mt-5"><ErrorBox message={options.error} onRetry={options.reload} /></div>
            ) : options.loading ? (
              <div className="py-8"><Loading label="Loading current programs…" /></div>
            ) : programOptions.length ? (
              <form onSubmit={submit} className="mt-5 space-y-4">
                <Card className="p-5">
                  <h2 className="mb-3 text-sm font-semibold text-slate-900">Program and category</h2>
                  <div className="grid gap-x-4 sm:grid-cols-2">
                    <SelectField
                      label="Program applied for"
                      placeholder="Select a program"
                      required
                      value={form.programId}
                      onChange={set('programId')}
                      options={programOptions.map((program) => ({
                        value: program.program_id,
                        label: `${program.program_name} (${program.program_code})`,
                      }))}
                      className="sm:col-span-2"
                    />
                    <SelectField
                      label="Category"
                      placeholder="Select a category"
                      required
                      value={form.categoryId}
                      onChange={set('categoryId')}
                      options={categoryOptions.map((category) => ({
                        value: category.category_id,
                        label: `${category.category_code} — ${category.category_name}`,
                      }))}
                    />
                    <Field label="Entrance score (optional)" type="number" min="0" max="200" step="0.01" value={form.entranceScore} onChange={set('entranceScore')} />
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="mb-3 text-sm font-semibold text-slate-900">Applicant details</h2>
                  <div className="grid gap-x-4 sm:grid-cols-2">
                    <Field label="First name" required maxLength={80} value={form.firstName} onChange={set('firstName')} />
                    <Field label="Last name" required maxLength={80} value={form.lastName} onChange={set('lastName')} />
                    <Field label="Email" type="email" required maxLength={150} value={form.email} onChange={set('email')} />
                    <Field label="Phone" type="tel" required minLength={6} maxLength={20} value={form.phone} onChange={set('phone')} />
                    <Field label="Date of birth" type="date" required value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                    <SelectField
                      label="Gender"
                      placeholder="Select"
                      required
                      value={form.gender}
                      onChange={set('gender')}
                      options={['MALE', 'FEMALE', 'OTHER'].map((gender) => ({ value: gender, label: titleCase(gender) }))}
                    />
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="mb-3 text-sm font-semibold text-slate-900">Qualifications</h2>
                  <div className="grid gap-x-4 sm:grid-cols-2">
                    <Field label="Previous school / college" maxLength={160} value={form.previousSchool} onChange={set('previousSchool')} />
                    <Field label="Qualification" maxLength={80} value={form.qualification} onChange={set('qualification')} />
                    <Field label="10th marks (%)" type="number" required step="0.01" min="0" max="100" value={form.marks10} onChange={set('marks10')} />
                    <Field label="12th marks (%)" type="number" required step="0.01" min="35" max="100" value={form.marks12} onChange={set('marks12')} hint="Minimum qualifying marks: 35%." />
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="mb-3 text-sm font-semibold text-slate-900">Guardian and address</h2>
                  <div className="grid gap-x-4 sm:grid-cols-2">
                    <Field label="Guardian name" required maxLength={120} value={form.guardianName} onChange={set('guardianName')} />
                    <Field label="Guardian phone" type="tel" required minLength={6} maxLength={20} value={form.guardianPhone} onChange={set('guardianPhone')} />
                    <Field label="Address" maxLength={160} value={form.addressLine1} onChange={set('addressLine1')} className="sm:col-span-2" />
                    <Field label="City" maxLength={80} value={form.city} onChange={set('city')} />
                    <Field label="State" maxLength={80} value={form.state} onChange={set('state')} />
                    <Field label="PIN code" minLength={4} maxLength={10} value={form.pincode} onChange={set('pincode')} />
                  </div>
                </Card>

                {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
                <button type="submit" className="btn-primary" disabled={busy || !form.programId || !form.categoryId}>
                  {busy ? 'Submitting…' : <><Send className="h-4 w-4" /> Submit application</>}
                </button>
              </form>
            ) : (
              <div className="mt-5"><EmptyState title="No current programs are accepting applications" /></div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
