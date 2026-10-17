import type { CSSProperties } from 'react';
import { INSTITUTION } from '../../data/pict/institution';
import { BrandLogo } from './BrandLogo';

/**
 * Shared PICT ERP identity lockup.
 *
 * The logo mark delegates to BrandLogo: official PICT asset first, a vendored
 * local image if the remote source is unavailable, then the original inline
 * SVG PictMark. The SVG monogram is only a fallback; it is not presented as
 * the official crest. Inline SVG also keeps the interface branded in the
 * sandboxed preview, where external network requests are blocked.
 */

export function PictMark({
  className = 'h-9 w-9',
  tone = 'brand',
  style,
}: {
  className?: string;
  tone?: 'brand' | 'mono' | 'light';
  style?: CSSProperties;
}) {
  const gradId = `pict-mark-${tone}`;
  const from = tone === 'light' ? '#85bedc' : tone === 'mono' ? '#64748b' : '#2c64a8';
  const to = tone === 'light' ? '#d8e5f6' : tone === 'mono' ? '#334155' : '#0b1b33';

  return (
    <svg viewBox="0 0 48 48" className={className} style={style} role="img" aria-label="PICT monogram" focusable="false">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path
        d="M24 3.5 41 9.6v15.1c0 9.4-6.6 16.6-17 19.8-10.4-3.2-17-10.4-17-19.8V9.6L24 3.5Z"
        fill={`url(#${gradId})`}
      />
      <path d="M24 3.5 41 9.6v15.1c0 9.4-6.6 16.6-17 19.8-10.4-3.2-17-10.4-17-19.8V9.6L24 3.5Z" fill="none" stroke="rgb(255 255 255 / .22)" strokeWidth="1.1" />
      <g fill="#fff">
        <rect x="14.4" y="16.5" width="4.1" height="15.6" rx="1.3" />
        <path d="M19.9 16.5h5.1a5.25 5.25 0 0 1 0 10.5h-5.1V16.5Z" />
        <path d="M24.6 30.6h4.3l4.7 1.5v-3.1c0-4-2.6-6.4-6.3-6.4h-2.7v8Z" opacity=".92" />
      </g>
      <circle cx="24" cy="11.4" r="1.5" fill="#fff" opacity=".85" />
    </svg>
  );
}

export function PictLogo({
  variant = 'full',
  tone = 'brand',
  compact = false,
  official = true,
}: {
  variant?: 'full' | 'mark' | 'wordmark';
  tone?: 'brand' | 'mono' | 'light';
  compact?: boolean;
  /** false = always use the original SVG monogram (no external asset). */
  official?: boolean;
}) {
  const nameColor = tone === 'light' ? 'text-white' : 'text-ink';
  const subColor = tone === 'light' ? 'text-white/70' : 'text-ink-subtle';

  if (variant === 'mark') {
    return official
      ? <BrandLogo size={36} tone={tone === 'light' ? 'light' : 'auto'} />
      : <PictMark className="h-9 w-9" tone={tone} />;
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      {official
        ? <BrandLogo size={compact ? 28 : 36} tone={tone === 'light' ? 'light' : 'auto'} />
        : <PictMark className={compact ? 'h-7 w-7' : 'h-9 w-9'} tone={tone} />}
      <span className="flex min-w-0 flex-col leading-tight">
        <span className={`truncate font-semibold tracking-tight ${compact ? 'text-xs' : 'text-sm'} ${nameColor}`}>
          {variant === 'wordmark' ? INSTITUTION.shortName : 'PICT University ERP'}
        </span>
        {!compact ? (
          <span className={`truncate text-[10.5px] font-medium uppercase tracking-[0.14em] ${subColor}`}>
            {INSTITUTION.shortName} · Pune
          </span>
        ) : null}
      </span>
    </span>
  );
}

/** Long-form institute name block for the landing page and footer. */
export function InstituteIdentity({ className = '', light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={className}>
      <p className={`text-sm font-semibold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        {INSTITUTION.legalName}
      </p>
      <p className={`mt-1 text-xs leading-relaxed ${light ? 'text-white/65' : 'text-ink-subtle'}`}>
        {INSTITUTION.address.line1}, {INSTITUTION.address.line2}, {INSTITUTION.address.city}-{INSTITUTION.address.pincode},{' '}
        {INSTITUTION.address.state}, {INSTITUTION.address.country}
      </p>
      <p className={`mt-1 text-xs ${light ? 'text-white/55' : 'text-ink-subtle'}`}>
        Autonomous · Affiliated to {INSTITUTION.affiliation.replace(' (SPPU), Pune', '')}
      </p>
    </div>
  );
}
