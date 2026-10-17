# PICT identity and data provenance

This document is the single place that answers the question **"is this real or is this demo data?"**
Every fact below is either quoted from an official PICT page (with a link) or explicitly marked as
generated demo data.

---

## 1. Institute identity (REAL — official)

| Field | Value |
|---|---|
| Legal name | Society for Computer Technology and Research's Pune Institute of Computer Technology |
| Popular name | PICT |
| Established | 1983 |
| Status | Autonomous institute |
| Affiliation | Savitribai Phule Pune University (SPPU) |
| Address | Survey No. 27, Near Trimurti Chowk, Dhankawadi, Pune-411043, Maharashtra, India |
| Approvals (official footer wording) | AICTE APPROVED \| ISO 9001:2015 \| NAAC A+ Grade \| NBA Accredited [All Eligible UG Programmes] |
| Website | https://www.pict.edu/ |

Sources: [About Us](https://www.pict.edu/about_us/) · [Admissions portal](https://admissions.pict.edu/)

**Deliberately NOT stored:** institute phone numbers and general email addresses. We hold no
authoritative value for them, so the `departments.phone` / `departments.established_year` columns are
seeded `NULL` and the UI hides empty fields instead of showing a guess.

---

## 2. Departments (REAL — the five UG programmes)

PICT offers exactly five undergraduate programmes plus a first-year Basic Sciences unit. The previous
seed carried a generic set (MECH, CIVIL, EEE, "Science & Humanities") that PICT does not have; it has
been migrated.

| Code | Name | Short | Official page |
|---|---|---|---|
| CE | Computer Engineering | CE | https://pict.edu/CE-dept/ |
| ETC | Electronics and Telecommunication Engineering | E&TC | https://pict.edu/ENTC-dept/ |
| IT | Information Technology | IT | https://pict.edu/IT-dept/ |
| AIDS | Artificial Intelligence and Data Science | AI&DS | https://pict.edu/AIDS-dept/ |
| ECE | Electronics and Computer Engineering | E&CE | https://pict.edu/ECE-dept/ |
| BSH | Basic Sciences and Humanities (F.Y. B.Tech) | BS&H | https://pict.edu/fe-dept/ |

> PICT's own About page writes the E&TC abbreviation as **E&TE**. We display **E&TC** (the form used
> in your project brief); the full name is unchanged and there is no "ECE" department — ECE means
> *Electronics and **Computer** Engineering* here.

### Migration mapping applied to the seed

| Before | After |
|---|---|
| `CSE` Computer Science & Engineering | `CE` Computer Engineering |
| `ETC` Electronics & Telecommunication | `ETC` Electronics and Telecommunication Engineering (renamed) |
| `IT` Information Technology | unchanged |
| `MECH` Mechanical Engineering | **removed** |
| `CIVIL` Civil Engineering | **removed** |
| `EEE` Electrical & Electronics | **removed** |
| `SH` Science & Humanities | `BSH` Basic Sciences and Humanities (F.Y. B.Tech) |
| — | `AIDS` Artificial Intelligence and Data Science (added) |
| — | `ECE` Electronics and Computer Engineering (added) |

Programs now follow the real portfolio: `BTECH-CE`, `BTECH-ETC`, `BTECH-IT`, `BTECH-AIDS`, `BTECH-ECE`
(UG, 4 years) and `MTECH-CE`, `MTECH-DS` (Data Science), `MTECH-WCT` (Electronics & Communication —
Wireless Communication Technology) at PG level. Subject banks were rewritten branch-for-branch
(removed thermodynamics / surveying / electrical machines; added AI/ML, deep learning, computer
architecture, IoT, VLSI…).

Nothing else moved: table names, primary keys, foreign keys, procedures, triggers, views and every
API endpoint are untouched, and `npm run db:verify` still passes 10/10.

---

## 3. Brand assets

| Asset | Location | Notes |
|---|---|---|
| Official crest | https://admissions.pict.edu/includes/logo.png | Remote, used as the primary source |
| Vendored copy | `frontend/public/brand/pict-logo-512.png` (and `-256`) | Used when the remote fetch fails |
| Vendored copy on white | `frontend/public/brand/pict-logo-512-white.png` | For light surfaces |
| Original monogram | `frontend/src/components/brand/PictLogo.tsx` | Last-resort fallback, drawn in SVG |

`BrandLogo` walks that chain with an `onError` handler, so the app keeps its identity offline and
inside the sandboxed preview iframe (which has no network access) while still showing the official
crest in a normal browser.

The monogram is an **original** lockup, not a reproduction of the institute's crest — it exists only
so the UI never shows a broken image.

---

## 4. Demo accounts

All seeded logins use the `@pict.edu` domain (e.g. `admin@pict.edu`, `2024ETC1001@pict.edu`,
`karan.shinde@pict.edu`). These are **demo accounts for local development and the viva** — they are
not real PICT mailboxes. See [`DEMO_CREDENTIALS.md`](DEMO_CREDENTIALS.md).

---

## 5. What is generated demo data

Everything below is produced by `scripts/generate_seed.py` (deterministic, RNG seed `20260701`) and is
**not** real information about real people:

* students, guardians, addresses, documents, admissions
* faculty records, qualifications, salaries, leaves, payslips
* attendance, marks, results, exam registrations
* fee structures, bills, payments, scholarships
* hostel applications, allocations, transfers
* timetable, notifications, audit entries

Rules the generator follows so demo rows can never be mistaken for real ones:

* **No invented phone numbers.** `users.phone`, `faculty.phone`, `students.phone` and
  `students.emergency_contact` are `NULL`; columns that are `NOT NULL`
  (`guardians.phone`, `admissions.phone`, `admissions.guardian_phone`) get the deliberately
  non-dialable placeholder `0000000000`.
* **No invented guardian emails** — `guardians.email` is `NULL`.
* **No invented department phone numbers or establishment years** — `NULL`.
* **Admission types** are modelled structurally (FE, DSE lateral entry starting at SE, Institute
  Level) rather than with invented cut-offs or statistics.
* Intake / credit figures on `programs` are demo parameters for the generator, not official PICT intake.

The UI repeats this boundary everywhere seed records appear (see `SEED_DATA_NOTICE` in
`frontend/src/data/pict/institution.ts`, currently rendered in the app footer).

---

## 6. Regenerating

```bash
cd /home/user/university-erp
python3 scripts/generate_seed.py       # rewrites database/04_seed.sql
cd backend && npm run db:reset         # drop + create + schema + seed + procedures + triggers
npm run db:verify                      # 10/10 consistency checks
```
