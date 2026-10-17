import { useEffect, useMemo, useState } from 'react';
import { PieChart as PieIcon, Download, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { api, errMsg } from '../../lib/api';
import { useToast } from '../../components/toast';
import {
  Card,
  PageHeader,
  SearchInput,
  SelectField,
  Field,
  DataTable,
  Pagination,
  Loading,
  ErrorBox,
  useFetch,
  useDebounced,
  EmptyState,
} from '../../components/ui';
import { downloadCsv } from '../../lib/csv';
import { money, num } from '../../lib/format';
import { normalizeReportColumns, normalizeReportRows } from '../../lib/reportColumns';

interface ReportMeta { key: string; title: string; }
interface ReportResult {
  key?: string;
  title?: string;
  columns?: unknown;
  rows?: unknown;
  generatedAt?: string | null;
}
interface Kpis {
  students?: number | string | null;
  faculty?: number | string | null;
  avgAttendance?: number | string | null;
  collected?: number | string | null;
  outstanding?: number | string | null;
  residents?: number | string | null;
}

const PAGE_SIZE = 25;

export default function ReportsPage() {
  const toast = useToast();
  const [key, setKey] = useState('attendance_summary');
  const [search, setSearch] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounced(search, 350);

  const catalogue = useFetch(() => api.get<ReportMeta[]>('/reports'), []);
  const kpis = useFetch(() => api.get<Kpis>('/reports/kpis'), []);
  const semesters = useFetch(() => api.get<{ semester_id: number; name: string }[]>('/academics/semesters', { limit: 200 }), []);
  const depts = useFetch(() => api.get<{ department_id: number; department_code: string; name: string }[]>('/academics/departments', { limit: 100 }), []);

  const reportCatalogue = Array.isArray(catalogue.data) ? catalogue.data : [];
  const semesterOptions = Array.isArray(semesters.data) ? semesters.data : [];
  const departmentOptions = Array.isArray(depts.data) ? depts.data : [];

  // The API returns the whole report result, so filtering and paging stay client-side.
  const params = useMemo(() => ({
    semesterId: semesterId || undefined,
    departmentId: departmentId || undefined,
    from: from || undefined,
    to: to || undefined,
  }), [semesterId, departmentId, from, to]);

  const { data, loading, error, reload } = useFetch(
    () => api.get<ReportResult>(`/reports/${key}`, params),
    [key, params],
  );

  const reportRows = useMemo(() => normalizeReportRows(data?.rows), [data?.rows]);
  const rows = useMemo(() => reportRows.filter((row) => {
    const query = term.toLowerCase();
    return !query || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(query));
  }), [reportRows, term]);
  const paged = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [rows, page]);

  const columns = useMemo(() => normalizeReportColumns(data?.columns, reportRows).map((column) => ({
    key: column.key,
    header: column.label.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    render: (row: Record<string, unknown>) => {
      const value = row[column.key];
      if (typeof value === 'number') return num(value, Number.isInteger(value) ? 0 : 2);
      if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value) && /amount|fee|salary|due|paid|total|collected|outstanding/i.test(column.key)) {
        return money(value);
      }
      return String(value ?? '—');
    },
  })), [data?.columns, reportRows]);

  const selected = reportCatalogue.find((report) => report.key === key);

  const exportCsv = async (useApi: boolean) => {
    try {
      if (useApi) {
        await api.download(`/reports/${key}/csv`, `${key}-${new Date().toISOString().slice(0, 10)}.csv`, params);
      } else {
        const keys = reportRows.length ? Object.keys(reportRows[0]) : [];
        downloadCsv(`${key}.csv`, rows, keys.map((column) => ({ key: column, label: column })));
      }
      toast.success('CSV downloaded.');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  useEffect(() => { setPage(1); }, [key, params]);

  return (
    <>
      <PageHeader
        title="Reports & exports"
        subtitle={`${num(reportCatalogue.length)} reports, each a live SQL query over the ERP data.`}
        icon={<PieIcon className="h-5 w-5" />}
        actions={(
          <>
            <button type="button" className="btn-secondary btn-sm" onClick={() => void exportCsv(false)} disabled={!rows.length}>
              <Download className="h-4 w-4" /> CSV (this page)
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={() => void exportCsv(true)} disabled={!rows.length}>
              <FileSpreadsheet className="h-4 w-4" /> CSV (full report)
            </button>
          </>
        )}
      />

      {kpis.error ? <div className="mb-4"><ErrorBox message={kpis.error} onRetry={kpis.reload} /></div> : null}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="Students" value={num(kpis.data?.students)} />
        <Stat label="Faculty" value={num(kpis.data?.faculty)} />
        <Stat label="Avg attendance" value={`${num(kpis.data?.avgAttendance, 1)}%`} />
        <Stat label="Collected" value={money(kpis.data?.collected)} />
        <Stat label="Outstanding" value={money(kpis.data?.outstanding)} />
        <Stat label="Hostel residents" value={num(kpis.data?.residents)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Report catalogue</h2>
          </div>
          <div className="max-h-[32rem] overflow-y-auto">
            {catalogue.error ? (
              <ErrorBox message={catalogue.error} onRetry={catalogue.reload} />
            ) : catalogue.loading ? (
              <Loading label="Loading reports…" />
            ) : reportCatalogue.length ? (
              reportCatalogue.map((report) => (
                <button
                  key={report.key}
                  type="button"
                  onClick={() => { setKey(report.key); setPage(1); }}
                  className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    key === report.key ? 'bg-brand-50 font-medium text-brand-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {report.title || report.key}
                </button>
              ))
            ) : (
              <EmptyState
                title="No reports are available"
                hint="The report catalogue returned no entries."
                action={<button type="button" className="btn-secondary btn-sm" onClick={catalogue.reload}>Retry</button>}
              />
            )}
          </div>
        </Card>

        <div className="lg:col-span-3">
          <Card className="mb-4">
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField
                label="Semester"
                placeholder="All semesters"
                value={semesterId}
                onChange={(event) => { setSemesterId(event.target.value); setPage(1); }}
                options={semesterOptions.map((semester) => ({ value: semester.semester_id, label: semester.name }))}
              />
              <SelectField
                label="Department"
                placeholder="All departments"
                value={departmentId}
                onChange={(event) => { setDepartmentId(event.target.value); setPage(1); }}
                options={departmentOptions.map((department) => ({ value: department.department_id, label: department.name }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Field label="From" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
                <Field label="To" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
              </div>
            </div>
            {semesters.error || depts.error ? (
              <div className="grid gap-1 px-4 pb-3">
                {semesters.error ? <ErrorBox message={`Semester filters: ${semesters.error}`} onRetry={semesters.reload} /> : null}
                {depts.error ? <ErrorBox message={`Department filters: ${depts.error}`} onRetry={depts.reload} /> : null}
              </div>
            ) : null}
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">{selected?.title ?? key}</h2>
                <p className="text-[11px] text-slate-500">
                  {`${num(rows.length)} rows`}
                  {data?.generatedAt ? ` · generated ${String(data.generatedAt).slice(0, 19).replace('T', ' ')}` : ''}
                </p>
              </div>
              <SearchInput value={search} onChange={setSearch} placeholder="Filter rows…" className="w-56" />
            </div>

            {error ? <ErrorBox message={error} onRetry={reload} /> : loading ? <Loading label="Running the report…" /> : !rows.length ? (
              <EmptyState title="This report returned no rows" hint="Try widening the filters — some reports need a semester or a date range." />
            ) : (
              <>
                <DataTable columns={columns} rows={paged} rowKey={(_row, index) => index} />
                <Pagination page={page} totalPages={Math.max(1, Math.ceil(rows.length / PAGE_SIZE))} total={rows.length} onPage={setPage} />
              </>
            )}
          </Card>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Reports use read-only queries over live ERP data. Date filters apply to reports that expose an event date;
          other reports ignore them.
        </span>
      </p>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3 py-2.5">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
