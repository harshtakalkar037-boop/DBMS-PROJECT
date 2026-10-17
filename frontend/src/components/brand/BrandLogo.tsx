import { useState } from 'react';
import { PictMark } from './PictLogo';

/**
 * Official PICT logo with a graceful fallback chain.
 *
 *  1. the official asset on the PICT admissions site (remote URL, as requested)
 *  2. the same file vendored into /public/brand (works offline and inside the
 *     sandboxed preview, which has no network access)
 *  3. the original PICT monogram drawn in SVG (never fails)
 *
 * Whichever source loads, the rendered size and the accessible name stay the
 * same, so swapping the official file in or out needs no other code change.
 */

export const OFFICIAL_LOGO_URL = 'https://admissions.pict.edu/includes/logo.png';
const VENDORED_LOGO = '/brand/pict-logo-512.png';

interface BrandLogoProps {
  /** Side length in pixels; the element is always square. */
  size?: number;
  className?: string;
  /**
   * `light` = the logo sits on a dark surface (sidebar, dark hero); a subtle
   * plate is drawn behind it so the crest keeps its contrast.
   */
  tone?: 'auto' | 'light';
  /** Skip the remote URL and use only local assets (offline/preview). */
  offlineOnly?: boolean;
  title?: string;
}

export function BrandLogo({ size = 36, className = '', tone = 'auto', offlineOnly = false, title }: BrandLogoProps) {
  const chain = offlineOnly ? [VENDORED_LOGO] : [OFFICIAL_LOGO_URL, VENDORED_LOGO];
  const [step, setStep] = useState(0);

  const plate = tone === 'light' ? 'rounded-lg bg-white/95 p-1 ring-1 ring-white/20' : '';

  if (step >= chain.length) {
    return <PictMark className={`shrink-0 ${className}`} style={{ width: size, height: size }} tone={tone === 'light' ? 'light' : 'brand'} />;
  }

  return (
    <img
      src={chain[step]}
      alt={title ?? 'PICT — Pune Institute of Computer Technology'}
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      onError={() => setStep((s) => s + 1)}
      className={`shrink-0 object-contain ${plate} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
