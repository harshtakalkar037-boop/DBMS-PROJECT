/**
 * Institutional (REAL, OFFICIAL) data for SCTR's Pune Institute of Computer
 * Technology.
 *
 * PROVENANCE RULE
 * ---------------
 * Everything in this file is factual institute-level information (name,
 * address, affiliation, autonomy status, department names) — nothing here is
 * invented. Fields we do NOT have an authoritative source for are left as
 * `null` and are simply not rendered, rather than being filled with a guess.
 *
 * `SEED_DATA_NOTICE` must be shown anywhere demo/seed records (students, marks,
 * fees…) appear, so nobody mistakes generated rows for real ones.
 */

export interface SourceMeta {
  source: string;
  source_url?: string | null;
  retrieved_at: string | null;
  verified: boolean;
}

export const INSTITUTION = {
  legalName: "SCTR's Pune Institute of Computer Technology",
  shortName: 'PICT',
  colloquialName: 'PICT Pune',
  tagline: 'Autonomous Institute · Affiliated to Savitribai Phule Pune University',
  established: 1983,
  autonomous: true,
  affiliation: 'Savitribai Phule Pune University (SPPU), Pune',
  approvals: 'AICTE · Government of Maharashtra',
  type: 'Private (Un-aided), Autonomous',
  address: {
    line1: 'Survey No. 27, Near Trimurti Chowk',
    line2: 'Dhankawadi',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411043',
    country: 'India',
  },
  // No phone numbers or email addresses are included: we have no authoritative
  // value for them, so they are intentionally omitted rather than invented.
  contact: {
    phone: null as string | null,
    email: null as string | null,
    website: 'pict.edu',
  },
} as const;

export const INSTITUTION_SOURCE: SourceMeta = {
  source: 'Official PICT website / institute records (institute-level facts only)',
  source_url: null,
  retrieved_at: null,
  verified: true,
};

/**
 * The five undergraduate departments offered at PICT.
 *
 * NOTE: PICT does NOT have Mechanical, Civil or Electrical departments — those
 * will be removed from the seed data during the institution-alignment pass and
 * must not reappear here.
 */
export interface PictDepartment {
  code: string;
  shortName: string;
  name: string;
  /** UG intake per year when known; null when we have no authoritative value. */
  intake: number | null;
  establishedYear: number | null;
  blurb: string;
}

export const PICT_DEPARTMENTS: PictDepartment[] = [
  {
    code: 'CE',
    shortName: 'CE',
    name: 'Computer Engineering',
    intake: null,
    establishedYear: null,
    blurb: 'Algorithms, systems, compilers, networks and software engineering.',
  },
  {
    code: 'ETCX',
    shortName: 'E&TC',
    name: 'Electronics and Telecommunication Engineering',
    intake: null,
    establishedYear: null,
    blurb: 'Signal processing, communication systems, VLSI and embedded design.',
  },
  {
    code: 'IT',
    shortName: 'IT',
    name: 'Information Technology',
    intake: null,
    establishedYear: null,
    blurb: 'Software systems, databases, cloud, security and enterprise platforms.',
  },
  {
    code: 'AIDS',
    shortName: 'AI&DS',
    name: 'Artificial Intelligence and Data Science',
    intake: null,
    establishedYear: null,
    blurb: 'Machine learning, deep learning, data engineering and analytics.',
  },
  {
    code: 'ECE',
    shortName: 'E&CE',
    name: 'Electronics and Computer Engineering',
    intake: null,
    establishedYear: null,
    blurb: 'A blend of electronics hardware and modern computing foundations.',
  },
];

export const DEPARTMENTS_SOURCE: SourceMeta = {
  source: 'Official PICT department list',
  source_url: null,
  retrieved_at: null,
  verified: true,
};

/**
 * Admission routes the ERP supports. These are structural (how the workflow
 * behaves), not statistical, so they are safe to model:
 *  - FE          : First Year (regular entry)
 *  - DSE         : Direct Second Year (lateral entry; student starts at SE)
 *  - INSTITUTE   : Institute-level / against-CAP vacancies
 */
export const ADMISSION_TYPES = [
  { code: 'FE', label: 'First Year (FE)', entryYear: 1, entrySemester: 1, lateral: false },
  { code: 'DSE', label: 'Direct Second Year (DSE)', entryYear: 2, entrySemester: 3, lateral: true },
  { code: 'INSTITUTE', label: 'Institute Level', entryYear: 1, entrySemester: 1, lateral: false },
] as const;

export type AdmissionTypeCode = (typeof ADMISSION_TYPES)[number]['code'];

/**
 * Shown next to any generated record so a viva/demo audience can never
 * mistake demo rows for real student data.
 */
export const SEED_DATA_NOTICE =
  'Student records, marks, attendance, fees and faculty assignments in this deployment are generated demo data. ' +
  'Student identifiers such as PRN F24ET001 and roll number 32354 are demo formats and do not belong to real students.';

/**
 * Official logo assets.
 *
 * `remote` is the institute's own asset on the PICT admissions site; the
 * vendored copy under /public/brand is used when the remote one cannot load
 * (offline machines, or the sandboxed preview iframe, which has no network).
 * If both fail the UI falls back to the original SVG monogram.
 */
export const BRAND_ASSETS = {
  remote: 'https://admissions.pict.edu/includes/logo.png',
  vendored: '/brand/pict-logo-512.png',
  vendoredSmall: '/brand/pict-logo-256.png',
  vendoredOnWhite: '/brand/pict-logo-512-white.png',
  provided: true,
} as const;

/** Official department pages — used by the department explorer as "read more". */
export const DEPARTMENT_LINKS: Record<string, string> = {
  CE: 'https://pict.edu/CE-dept/',
  ETC: 'https://pict.edu/ENTC-dept/',
  IT: 'https://pict.edu/IT-dept/',
  AIDS: 'https://pict.edu/AIDS-dept/',
  ECE: 'https://pict.edu/ECE-dept/',
  BSH: 'https://pict.edu/fe-dept/',
};

/** Official institute links used in the footer / about page. */
export const OFFICIAL_LINKS = {
  website: 'https://www.pict.edu/',
  about: 'https://www.pict.edu/about_us/',
  admissions: 'https://admissions.pict.edu/',
} as const;
