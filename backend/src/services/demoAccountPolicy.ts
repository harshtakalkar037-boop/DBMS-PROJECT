/**
 * Server-side policy for the seven generated demonstration identities.
 * This list is intentionally duplicated nowhere else: auth and read-only
 * middleware share this helper so the same identities receive the same policy.
 */
export const SEEDED_DEMO_EMAILS = new Set([
  'admin@pict.edu',
  '2024etc1001@pict.edu',
  'karan.shinde@pict.edu',
  'examcell@pict.edu',
  'accountant@pict.edu',
  'hostel.admin@pict.edu',
  'hr@pict.edu',
]);

export function isSeededDemoEmail(email: string | null | undefined): boolean {
  return Boolean(email && SEEDED_DEMO_EMAILS.has(email.toLowerCase().trim()));
}
