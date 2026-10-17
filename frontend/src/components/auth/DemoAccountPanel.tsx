import type { DemoAccount } from '../../config/demoAccounts';
import { DEMO_ACCOUNTS } from '../../config/demoAccounts';

/**
 * Local-development demo picker. Each action only fills the real login form;
 * the user must still submit to the existing authentication API.
 */
export function DemoAccountPanel({ onPick, disabled }: { onPick: (account: DemoAccount) => void; disabled?: boolean }) {
  return (
    <section id="demo" aria-labelledby="demo-accounts-heading" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-3">
        <h2 id="demo-accounts-heading" className="text-sm font-semibold text-slate-900">Demo accounts</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Local development only. Choose a role to fill the email, enter the password yourself, then press Login.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.role}
            type="button"
            disabled={disabled}
            onClick={() => onPick(account)}
            className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-blue-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`Use ${account.label} demo account: ${account.email}`}
          >
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-slate-900">{account.label}</span>
              <span className="block truncate text-[11px] text-slate-500">{account.email}</span>
            </span>
            <span className="shrink-0 text-[11px] font-medium text-blue-900">Use Demo Account</span>
          </button>
        ))}
      </div>
    </section>
  );
}
