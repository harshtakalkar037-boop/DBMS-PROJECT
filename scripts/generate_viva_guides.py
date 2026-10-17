#!/usr/bin/env python3
"""Generate eight repository-grounded DOCX viva/study guides.

Run from any directory with: python3 scripts/generate_viva_guides.py
Requires python-docx. Table PK/FK rows are extracted from docs/DATA_DICTIONARY.md.
"""
from __future__ import annotations

import re
import zipfile
from pathlib import Path
from typing import Any

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "viva_guides"
LOGO = ROOT / "frontend" / "public" / "brand" / "pict-logo-256.png"
NAVY = "17365D"
BLUE = "1F4E79"
TEAL = "1F7A8C"
PALE_BLUE = "EAF1F8"
PALE_TEAL = "E7F4F3"
PALE_AMBER = "FFF4D6"
PALE_RED = "FCE8E6"
INK = "263238"
MUTED = "5B6573"
WHITE = "FFFFFF"
PREPARED = "17 October 2026"

MODULES: list[dict[str, Any]] = [
    {
        "number": 1,
        "title": "Student & Admission",
        "slug": "Student_Admission",
        "pages": [
            "frontend/src/pages/students/AdmissionApplyPage.tsx",
            "frontend/src/pages/students/AdmissionsPage.tsx",
            "frontend/src/pages/students/StudentsPage.tsx",
            "frontend/src/pages/students/StudentDetailPage.tsx",
            "frontend/src/pages/students/EnrollmentsPage.tsx",
        ],
        "backend": [
            "backend/src/routes/student.routes.ts",
            "backend/src/controllers/student.controller.ts",
            "backend/src/services/student.service.ts",
            "backend/src/repositories/student.repository.ts",
            "backend/src/services/auth.service.ts",
            "backend/src/repositories/auth.repository.ts",
        ],
        "tables": [
            "roles", "users", "departments", "categories", "academic_years", "programs", "batches",
            "admissions", "students", "addresses", "guardians", "student_documents", "student_status_history",
        ],
        "api": [
            "Public application: POST /api/v1/students/admissions/apply",
            "Admin review: GET /api/v1/students/admissions and POST /api/v1/students/admissions/:id/review",
            "Student master: GET/POST /api/v1/students, GET /api/v1/students/:id, PATCH /api/v1/students/:id/status",
            "Related records: student addresses, guardians, documents, and status-history endpoints are mounted under the student API.",
        ],
        "purpose": "Own the candidate-to-student lifecycle and the student master record that attendance, exams, fees, hostel and reports all reuse. Applicants live in admissions; an approved student is represented by a students row linked to one authentication user.",
        "flow": [
            "Applicant submits the public form; the API validates input and writes an admissions row with an application number and a review status.",
            "An authorised Admin reviews the application. Rejection changes its status and is audited; approval calls sp_approve_admission.",
            "The approval procedure locks the application row, verifies it is still reviewable, resolves the program, current-year batch and STUDENT role, then creates the user, student and guardian, links the application, writes audit/notification rows and commits as one transaction.",
            "The latest backend creates a random temporary credential, stores only its bcrypt hash, marks the account for first-login password change, and returns the one-time credential only to the authorised admin response. Confirm the live UI/API before promising the presentation behavior.",
            "Other modules reference the same student_id; they do not create their own copy of the student.",
        ],
        "relationships": [
            "users.user_id is unique in students.user_id: one login maps to at most one student profile; users.role_id references roles.role_id.",
            "students reference categories, departments, programs and batches by foreign key. Program and batch choices come from academic master data.",
            "admissions can link to students after approval; admissions also references its program, category, academic year and reviewing user.",
            "addresses and guardians are dependent student records; student_documents and student_status_history preserve supporting evidence and changes.",
            "After approval, the student_id is the join point for enrolments, attendance, exam registrations, fee bills, hostel applications and results.",
        ],
        "objects": [
            "Procedure: sp_approve_admission — review/approval, user + student creation and application linking in a transaction.",
            "Triggers: trg_admissions_bi_validate; trg_students_bi_validate; trg_students_bu_validate; trg_students_au_status_history.",
            "View: v_student_full_profile — read model for a joined profile (not a replacement base table).",
            "Constraints: unique login email, student email, roll_number, registration_number, application_no; foreign keys to users, categories, department, program, batch and academic year; lifecycle checks/status values.",
            "Migrations for an existing database: database/migrations/2026-10-10_approve_admission_credentials.sql and database/migrations/2026-10-10_unique_admission_email.sql. The base schema contains the current definition; preflight duplicate application emails before adding the unique key to older data.",
        ],
        "demo": [
            "Use a fresh, unique email ending in example.com; do not enter a real applicant’s personal data.",
            "Open /admissions/apply and submit a complete application; note the generated application number and status.",
            "Sign in as the seeded ADMIN demo account, open Admissions, inspect the row, then approve it. Show the server-confirmed response, created roll number, linked student and audit entry.",
            "Open the student detail page and show how addresses, guardian, documents/status history and cross-module summaries attach to one student.",
            "If time allows, use a second clearly synthetic application to demonstrate rejection and its status/audit trail.",
        ],
        "tests": [
            "tests/api/workflow.py: creates a synthetic student through the API, reads it back, soft-deletes it, submits a public application and approves the application through the workflow.",
            "tests/api/smoke.sh: documented route/status and role-authorization coverage; run against the same seeded database and API build you present.",
            "tests/db/test_rules.sql: database-side rule checks; inspect the admission/student assertions before selecting a claim to demonstrate.",
            "Builds: npm run build in backend and frontend. Database-backed tests need MariaDB/MySQL and the API; they cannot be inferred from a frontend-only preview.",
        ],
        "qas": [
            ("Why keep admissions separate from students?", "An application is a candidate workflow with a review lifecycle; a student is an active institutional master used by downstream modules. Keeping separate rows prevents unapproved candidates from becoming enrolled student records."),
            ("What does the approval transaction protect?", "It makes account creation, student creation, guardian insertion, application linkage, audit and notification an all-or-nothing unit. If an insert or constraint fails, the procedure rolls back instead of leaving a half-approved record."),
            ("How does the system prevent a student from having duplicate identity values?", "Unique constraints protect roll_number, registration_number, email and user linkage at the database level; request validation provides clearer early messages but is not the final integrity boundary."),
            ("Why do students and faculty have separate profile tables from users?", "users is the shared authentication identity. The student/faculty tables hold role-specific domain attributes and each has a unique FK to users, so login and domain data remain separated without duplicate credentials."),
            ("Why are addresses and guardians separate tables?", "A person may have different address types and more than one guardian. Separate dependent rows avoid repeating groups and make the relationships explicit."),
            ("What is the temporary-password design?", "The service generates a random one-time password and hashes it with bcrypt before storage. The database receives a hash, not plaintext; the account is marked for first-login change. The one-time plaintext is not meant to be recoverable later."),
            ("How is Admin-only approval enforced?", "The frontend can hide controls, but the backend route applies JWT authentication and role checks. The procedure enforces lifecycle/data integrity; it does not replace API authorization."),
            ("Are the seeded student records real PICT students?", "No. Student, faculty, attendance, marks, fees and hostel rows are generated demo data. The real institute identity/logo is separate from those synthetic records."),
            ("Why does the approval routine need a current-year batch?", "The student row has a batch FK. The procedure selects an active batch for the chosen program and academic year; if that master data is absent, approval is refused rather than inserting an orphan or mismatched student."),
            ("What if duplicate applications race at the same time?", "The API can give an early friendly check, while the unique admissions email key is the concurrency-safe final guard. The database constraint wins even if two requests pass the same pre-check."),
        ],
        "rehearsal": [
            "Be able to trace one application number to admissions.admission_id, students.student_id and users.user_id.",
            "Name the exact approval procedure and explain the transaction in under 30 seconds.",
            "Show where email/roll/registration uniqueness is enforced and what error the API returns.",
            "Use only a disposable database and synthetic email; capture the successful approval response before the session.",
        ],
        "sources": ["docs/MODULE_INTEGRATION.md §3 Module 1", "docs/DATA_DICTIONARY.md §§0–1", "docs/ER_DIAGRAMS.md and docs/er/er_module1_student_admission.svg", "database/05_procedures.sql: sp_approve_admission", "database/06_triggers.sql: admission/student guards", "database/migrations/", "tests/api/workflow.py"],
    },
    {
        "number": 2,
        "title": "Academic & Course",
        "slug": "Academic_Course",
        "pages": [
            "frontend/src/pages/academics/AcademicsMastersPage.tsx",
            "frontend/src/pages/academics/SubjectsPage.tsx",
            "frontend/src/pages/academics/OfferingsPage.tsx",
            "frontend/src/pages/academics/TimetablePage.tsx",
            "frontend/src/pages/academics/CalendarPage.tsx",
            "frontend/src/pages/students/EnrollmentsPage.tsx",
        ],
        "backend": [
            "backend/src/routes/academic.routes.ts",
            "backend/src/controllers/academic.controller.ts",
            "backend/src/services/academic.service.ts",
            "backend/src/repositories/academic.repository.ts",
        ],
        "tables": [
            "users", "departments", "academic_years", "semesters", "programs", "batches", "sections", "subjects",
            "program_subjects", "course_offerings", "enrollments", "faculty", "faculty_subjects", "timetable", "academic_calendar", "students",
        ],
        "api": [
            "Master data: /api/v1/academics/departments, /programs, /batches, /years, /semesters, /sections, /categories.",
            "Curriculum and delivery: /api/v1/academics/subjects, /offerings, /enrollments and POST /api/v1/academics/enrollments/bulk.",
            "Scheduling: /api/v1/academics/timetable, GET /api/v1/academics/timetable/conflicts and /api/v1/academics/calendar.",
        ],
        "purpose": "Maintain shared academic master data and turn a curriculum into semester-specific course offerings, student enrolments and a timetable. Other modules use these same keys rather than duplicating programs, subjects or terms.",
        "flow": [
            "Departments own programs; programs have batches and a curriculum map. Subjects are reusable catalogue rows, not a new subject per semester run.",
            "program_subjects associates programs and subjects for a semester number; it resolves the many-to-many curriculum relationship.",
            "course_offerings instantiate a subject for a specific program, semester, academic year and optional section/faculty, with a capacity and lifecycle status.",
            "enrollments associate students with offerings. Bulk enrollment calls sp_bulk_enroll_students; the unique student/offering key makes repeats idempotent, and a guard checks duplicate/capacity rules.",
            "timetable rows bind an offering, section, faculty, room and time slot. The database trigger rejects clashes; the API conflict endpoint helps users preview them.",
        ],
        "relationships": [
            "departments 1-to-many programs and subjects; a program references its department.",
            "programs 1-to-many batches and many-to-many subjects through program_subjects (program_id + subject_id + semester_no unique).",
            "course_offerings reference subject, program, academic year and semester, and can reference section and faculty.",
            "students and offerings are many-to-many through enrollments; unique (student_id, offering_id) prevents duplicate enrolment.",
            "faculty can teach multiple subjects/offerings; faculty_subjects is a dated assignment table.",
            "timetable references offering, section and faculty; composite unique slot indexes plus trg_timetable_bi_conflict enforce conflict rules.",
        ],
        "objects": [
            "Procedure: sp_bulk_enroll_students — bulk adds the eligible cohort for offerings in one semester and returns counts/messages.",
            "Triggers: trg_enrollments_bi_guard; trg_enrollments_ai_count; trg_enrollments_ad_count; trg_timetable_bi_conflict.",
            "Derived field: course_offerings.enrolled_count is intentionally denormalized and maintained by enrollment triggers; capacity is still enforced against the live enrollment state.",
            "Constraints: unique subject code; unique program-subject-semester mapping; unique offering identity; unique student/offering enrolment; foreign keys to students, subjects, programs, terms, sections and faculty.",
            "Views and reports reuse the same normalized masters; check docs/DATA_DICTIONARY.md and database/08_views.sql for each named read model.",
        ],
        "demo": [
            "Start with an existing department/program/batch and current academic year/semester so no master data must be altered during the viva.",
            "Open Subjects, then Offerings; explain the difference between a subject catalogue entry and a time-bound offering.",
            "Use the bulk-enrollment screen/API for a known program, section and semester; show created/skipped counts.",
            "Repeat the exact bulk operation and show idempotency (no duplicate rows). Then try a conflicting timetable slot on test data and show the DB rejection/error.",
            "Finish by showing that attendance sessions and exam registrations later refer to the offering_id created here.",
        ],
        "tests": [
            "tests/api/workflow.py checks bulk enrollment idempotency and attempts to insert a duplicate timetable slot, expecting a conflict response.",
            "tests/db/test_rules.sql includes database rule assertions; inspect the current file for timetable/enrollment guard cases before quoting a count.",
            "tests/api/smoke.sh covers route/status and authorization behavior as documented in README.md.",
            "Run the build and API workflow only against a seeded disposable database; the workflow is stateful and can create or update records.",
        ],
        "qas": [
            ("What is the difference between a subject and a course offering?", "A subject is a reusable catalogue entity with code, name, credits and type. An offering is that subject scheduled for a program/semester/year/section and often a particular faculty member, with capacity and status."),
            ("How is the program-to-subject many-to-many relationship represented?", "program_subjects is the associative relation. Its FKs point to programs and subjects, with semester_no carrying the curriculum placement and a unique key preventing duplicate mappings."),
            ("How do you represent a student taking multiple offerings?", "The many-to-many relationship is stored in enrollments, which has its own PK plus student_id and offering_id FKs. A unique composite key prevents the same student from enrolling twice in one offering."),
            ("Why keep enrolled_count if the enrollment rows already exist?", "It is a documented performance/capacity counter. Triggers update it on enrollment inserts/deletes and the schema has a reconciliation process; the source of truth remains the enrollment rows."),
            ("How does bulk enrollment remain safe if run twice?", "The procedure uses the selected program/semester/section, checks existing enrollments, and the unique student/offering constraint is the final guard. A rerun reports no additional duplicate enrollments."),
            ("How are timetable clashes detected?", "An API conflict-check endpoint helps preview a clash, while trg_timetable_bi_conflict and unique slot constraints reject conflicting writes at the database boundary."),
            ("Why not store course name directly in every enrollment?", "That would repeat subject and offering attributes across rows and create update anomalies. The FK to course_offerings lets the system join back to the normalized master."),
            ("Why does the academic model have both academic_years and semesters?", "Academic year is the annual calendar/master; semesters are term records within an academic year. Course offerings and exams reference the appropriate term/year identifiers."),
            ("Which modules depend on course_offerings?", "Enrollment, attendance sessions, exam registrations, timetables and faculty workload use offering_id; that shared pivot is how cross-module reporting stays consistent."),
            ("What should you show if a clash is rejected?", "Show the user-facing error and the attempted slot, then identify the trigger/unique key in SQL. Do not claim the frontend alone prevents clashes."),
        ],
        "rehearsal": [
            "Draw department → program → curriculum mapping → offering → enrollment in one minute.",
            "Memorize PK/FK pairs for program_subjects, course_offerings, enrollments and timetable.",
            "Demonstrate the same bulk-enrollment call twice and describe the result without altering official masters.",
            "Open the corresponding SVG ER diagram and be ready to explain a many-to-many bridge table.",
        ],
        "sources": ["docs/MODULE_INTEGRATION.md §3 Module 2 and §5", "docs/DATA_DICTIONARY.md §2 Academic & Course", "docs/ER_DIAGRAMS.md and docs/er/er_module2_academic_course.svg", "database/05_procedures.sql: sp_bulk_enroll_students", "database/06_triggers.sql: enrollment/timetable triggers", "tests/api/workflow.py: academic operations"],
    },
    {
        "number": 3,
        "title": "Attendance",
        "slug": "Attendance",
        "pages": [
            "frontend/src/pages/attendance/AttendanceSessionsPage.tsx",
            "frontend/src/pages/attendance/AttendanceMarkPage.tsx",
            "frontend/src/pages/attendance/AttendanceReportsPage.tsx",
            "frontend/src/pages/attendance/MyAttendancePage.tsx",
        ],
        "backend": [
            "backend/src/routes/attendance.routes.ts",
            "backend/src/controllers/attendance.controller.ts",
            "backend/src/services/attendance.service.ts",
            "backend/src/repositories/attendance.repository.ts",
            "backend/src/repositories/settings.repository.ts",
        ],
        "tables": [
            "users", "students", "faculty", "semesters", "course_offerings", "class_sessions", "attendance", "system_settings", "notifications",
        ],
        "api": [
            "Create/list sessions: /api/v1/attendance/sessions; roster: /api/v1/attendance/sessions/:id/roster.",
            "Mark one or bulk: POST /api/v1/attendance/sessions/:id/mark and /mark-bulk.",
            "Reports: /api/v1/attendance/report/*, /api/v1/attendance/me* and /api/v1/attendance/student/:id/*.",
            "Low-attendance list and warning job: GET /api/v1/attendance/report/low and POST /api/v1/attendance/warn-low.",
        ],
        "purpose": "Record attendance per lecture session and student, report subject/semester percentages, alert students who are under the policy threshold, and provide the attendance value consumed by examination eligibility.",
        "flow": [
            "A faculty member creates a class_sessions row tied to an offering, faculty, semester and date.",
            "The roster comes from the offering’s enrolled students. Mark one student or submit a bulk status list.",
            "attendance stores the student, session, offering, semester, status and marking user; unique(session_id, student_id) means one attendance row per student per session.",
            "fn_calculate_attendance_percentage counts PRESENT and LATE as attended, excludes EXCUSED rows from the denominator, and returns 100.00 when no non-excused sessions exist.",
            "The low-attendance warning service reads the configured threshold, creates at most one warning of this type per user per day, and records an audit entry.",
            "The examination module recomputes attendance at registration time; it does not trust a percentage sent by the browser.",
        ],
        "relationships": [
            "course_offerings 1-to-many class_sessions; each session references a faculty member and semester.",
            "class_sessions 1-to-many attendance rows; attendance also references the student, offering, semester and marking user.",
            "students and class_sessions are many-to-many through attendance; the attendance row carries the status and audit actor.",
            "system_settings stores MIN_ATTENDANCE_PERCENTAGE for reporting/warning and the exam-insert trigger policy; each exam also has min_attendance_required used by the procedure.",
            "notifications.user_id links a low-attendance warning to the same user account that belongs to the student.",
        ],
        "objects": [
            "Procedure: sp_mark_attendance_bulk — one transaction for selected students; validates statuses and uses an upsert for repeated marking.",
            "Functions: fn_calculate_attendance_percentage and fn_calculate_semester_attendance.",
            "Trigger: trg_attendance_bi_guard — database-side validation for an attendance write.",
            "Views: v_student_attendance_summary, v_student_attendance_overall and v_monthly_attendance.",
            "Constraint: uq_attendance_session_student; status values are limited to PRESENT, ABSENT, LATE and EXCUSED.",
        ],
        "demo": [
            "Use the FACULTY demo account and choose an existing offering with an enrolled roster.",
            "Create one clearly labelled demo session, open the roster, mark one row and then demonstrate the bulk action.",
            "Show the database rows or API result and compare subject/overall summaries in the student view.",
            "If the seeded database has a student below threshold, show the warning/report and the exam module’s refusal. Exactly 75% is eligible because the comparison is less-than, not less-than-or-equal.",
            "Explain that zero counted sessions yields 100% by the current SQL function; disclose this rule rather than implying the function returns zero.",
        ],
        "tests": [
            "tests/api/workflow.py creates a session, fetches roster, marks a student, calls the bulk-mark procedure and runs low-attendance warnings.",
            "tests/db/test_rules.sql checks attendance calculation and the exam eligibility boundary, including a below-75% refusal and an exactly-75% case.",
            "The workflow needs a seeded database with offerings, enrollments and a low-attendance student. Use a disposable copy because it writes attendance and notifications.",
            "Build the backend and frontend, then run API tests with the API/database available; the current workspace preview alone does not verify them.",
        ],
        "qas": [
            ("Why are class_sessions and attendance separate?", "A session represents one scheduled lecture. Attendance represents one student’s status for that session. Separating them supports a roster per session and a many-to-many student/session relationship."),
            ("What is the exact attendance formula?", "For an offering, count PRESENT and LATE as attended; divide by all non-EXCUSED attendance rows and multiply by 100, rounded to two decimals. With no counted rows, the function returns 100.00."),
            ("Does EXCUSED mean present?", "No. EXCUSED is excluded from the denominator by fn_calculate_attendance_percentage; it does not add to the attended numerator."),
            ("What prevents duplicate attendance for the same lecture?", "The unique composite key (session_id, student_id), supported by the upsert in the mark service/procedure."),
            ("Why use a stored procedure for bulk marking?", "It avoids one network round trip per student, applies one database transaction, validates the status and gives one consistent result for the whole class operation."),
            ("Can a browser set its own attendance percentage for exam registration?", "No. The database recalculates it from attendance rows; the exam-registration trigger also replaces a missing/stale snapshot before checking eligibility."),
            ("What happens at exactly 75%?", "The current rule refuses values below the threshold, so exactly 75.00% passes the attendance comparison. The boundary is covered in the SQL rule test."),
            ("What does a low-attendance warning do?", "It scans active students against the configured threshold, persists in-app notifications, skips a duplicate warning on the same day and logs the run."),
            ("Where do attendance reports get their data?", "The module uses SQL views for reusable per-student, overall and monthly read models; the API exposes those through report and student endpoints."),
            ("Why does the threshold appear in two places?", "The procedure reads an exam’s min_attendance_required; the insert trigger and settings/report path use MIN_ATTENDANCE_PERCENTAGE. Keep them aligned and explain the configuration; divergence is a consistency issue to test."),
        ],
        "rehearsal": [
            "Memorize the four attendance statuses, numerator, denominator and no-session behavior.",
            "Show one FK path from attendance.session_id to class_sessions and attendance.student_id to students.",
            "Demonstrate one update and one report, then show the database—not a frontend calculation—decides the exam boundary.",
            "Do not reuse real student data or claim excused absences increase the percentage.",
        ],
        "sources": ["docs/MODULE_INTEGRATION.md §3 Module 3 and §6", "docs/DATA_DICTIONARY.md §3 Attendance", "docs/ER_DIAGRAMS.md and docs/er/er_module3_attendance.svg", "backend/src/services/attendance.service.ts", "database/05_procedures.sql: sp_mark_attendance_bulk", "database/07_functions.sql: attendance functions", "database/06_triggers.sql: trg_attendance_bi_guard", "tests/db/test_rules.sql"],
    },
    {
        "number": 4,
        "title": "Examination & Results",
        "slug": "Examination_Results",
        "pages": [
            "frontend/src/pages/exams/ExamsPage.tsx",
            "frontend/src/pages/exams/ExamRegistrationsPage.tsx",
            "frontend/src/pages/exams/MarksPage.tsx",
            "frontend/src/pages/exams/ResultsPage.tsx",
            "frontend/src/pages/exams/HallTicketPage.tsx",
        ],
        "backend": [
            "backend/src/routes/exam.routes.ts",
            "backend/src/controllers/exam.controller.ts",
            "backend/src/services/exam.service.ts",
            "backend/src/repositories/exam.repository.ts",
        ],
        "tables": [
            "users", "students", "academic_years", "semesters", "programs", "subjects", "course_offerings", "enrollments",
            "student_fees", "grades", "exams", "exam_schedules", "exam_registrations", "marks", "results",
        ],
        "api": [
            "Exams/schedules: /api/v1/exams and /api/v1/exams/:id/schedules.",
            "Eligibility/registration: GET /api/v1/exams/registrations/eligibility and POST /api/v1/exams/registrations.",
            "Marks/results: POST /api/v1/exams/marks, POST /api/v1/exams/results/process and POST /api/v1/exams/results/publish/:id.",
            "Student-facing: /api/v1/exams/hall-ticket/me, results and rankings; policy threshold endpoints are also under /exams/policy.",
        ],
        "purpose": "Schedule examinations, enforce eligibility at registration, issue hall-ticket numbers, record marks, derive grades/points, process semester performance and publish results to students.",
        "flow": [
            "An exam belongs to an academic year and semester. exam_schedules map the exam to a subject/program/date/time/room and maximum/minimum marks.",
            "A registration ties a student and course offering to an exam; a unique key blocks duplicate exam/student/offering registration.",
            "sp_register_student_for_exam recomputes offering attendance and compares it with exams.min_attendance_required. The exam-insert trigger independently verifies the student is enrolled and compares recomputed attendance with MIN_ATTENDANCE_PERCENTAGE.",
            "sp_enter_marks validates the maximum marks and derives percentage, grade and grade points; marks triggers validate/derive again on insert/update and audit edits.",
            "sp_process_semester_results computes SGPA/credits/backlogs/status, updates enrolment outcomes and writes results. sp_publish_exam_results flips publication flags, logs and notifies affected students.",
            "Hall-ticket numbers are stored against exam_registrations and exposed through the student endpoint/view after registration.",
        ],
        "relationships": [
            "exams reference academic_years and semesters; exam_schedules reference exams, subjects, programs and optional faculty invigilators.",
            "exam_registrations reference exams, students, course_offerings, optional schedule and registering user.",
            "marks reference exam_registrations (normally one marks row per registration, protected by a unique key) and the user who entered them.",
            "results reference student, semester, exam and publishing user; grade master/function maps percentage to grade code/points.",
            "Course offerings and enrollments connect the academic module to the student’s exam eligibility.",
            "fn_student_outstanding_dues reads student_fees, but the current visible registration routine does not actually branch on the computed value; do not claim a working dues gate without resolving the source discrepancy described below.",
        ],
        "objects": [
            "Procedures: sp_register_student_for_exam; sp_enter_marks; sp_process_semester_results; sp_publish_exam_results.",
            "Functions: fn_grade_code, fn_grade_points, fn_calculate_sgpa, fn_calculate_student_cgpa.",
            "Triggers: trg_exam_reg_bi_eligibility; trg_exam_reg_ai_audit; trg_marks_bi_derive; trg_marks_bu_derive; trg_marks_au_audit.",
            "Views: v_exam_eligibility, v_exam_hall_ticket, v_student_rankings and v_subject_failure_rate.",
            "Attendance boundary: routine reads exams.min_attendance_required; insert trigger reads system_settings.MIN_ATTENDANCE_PERCENTAGE. Both should be aligned. Current comparison blocks values below the threshold, so the exact threshold is accepted.",
        ],
        "demo": [
            "Sign in as Exam Cell and open the registration/eligibility screen. Use a prepared low-attendance demo student to show the server’s refusal message.",
            "Explain the key path: student + offering + exam → exam_registrations; show the attendance snapshot and hall-ticket number for an eligible registration.",
            "Open a scheduled paper, enter a valid demo mark, then show the derived percentage/grade/points. If using a negative test, try a value above max_marks only on disposable data.",
            "Process a semester result, show SGPA/backlog/status and publish it; switch to a student view for the published result/hall ticket.",
            "State the fee-gate discrepancy honestly: current visible SQL computes dues but has no conditional refusal on v_dues. Do not present this as a verified feature until corrected and retested.",
        ],
        "tests": [
            "tests/db/test_rules.sql covers a below-75% direct insert refusal and the exactly-75% boundary, plus marks range/grade derivation assertions.",
            "tests/api/workflow.py reads eligibility and threshold, and conditionally attempts a registration refusal for a low-attendance student when open exam data exists.",
            "The current workflow.py does not perform its own marks-entry write despite an old comment at the top; use test_rules.sql for the marks checks unless the workflow script is updated.",
            "No inspected test proves that outstanding fees block registration. fn_student_outstanding_dues is tested as a calculation, not as a registration gate.",
        ],
        "qas": [
            ("What is the main exam-registration rule?", "The database recomputes attendance for the student and offering, checks enrollment and compares attendance to the configured threshold. The visible code enforces the attendance gate in both the stored procedure and the BEFORE INSERT trigger."),
            ("Does exactly 75% pass?", "Yes, the visible comparison is less-than-threshold; exactly 75.00% is not below 75. The SQL rules file has a boundary assertion."),
            ("Why have both a procedure and a trigger?", "The procedure provides the transactional business operation and human-readable result; the trigger protects the table if a write bypasses the API/procedure. They are defense-in-depth, but their threshold sources must remain aligned."),
            ("What is the verified status of the fee/dues eligibility gate?", "The documentation claims it blocks registration, and the routine computes v_dues using fn_student_outstanding_dues, but the current visible routine never tests v_dues and the trigger checks enrollment/attendance only. Therefore I would not claim the gate is enforced until the procedure/trigger and a fee-block test are corrected."),
            ("How do marks become a grade?", "The database validates marks against max_marks, derives a percentage and maps that percentage through grade rules/functions to a grade code and points. Insert/update triggers protect the derived values and an audit trigger records changes."),
            ("How is SGPA different from CGPA?", "SGPA summarizes a semester using subject credits and grade points; CGPA is the credit-weighted average across a student’s published semester results. The project defines standalone SGPA/CGPA functions; the inspected results procedure also contains its own aggregation SQL, so describe each implementation path accurately."),
            ("Why is exam_registrations an associative entity?", "It connects a student with an exam and offering and also stores registration-specific attributes such as attendance snapshot, eligibility reason, hall-ticket number and status."),
            ("How are duplicate registrations prevented?", "A composite unique key covers exam_id, student_id and offering_id; the procedure also checks for an existing registration and returns a clear error."),
            ("What happens when results are published?", "The publish procedure updates exam/semester publication flags, writes audit information and creates notifications; student-facing results are then exposed through the API/view."),
            ("What would you inspect if exam results show an incorrect grade?", "Inspect the marks row, its registration and schedule max_marks, the grade master/function boundaries, the derivation triggers, and the transaction/audit history before changing code."),
        ],
        "rehearsal": [
            "Trace exam → schedule → registration → marks → result with exact PK/FK columns.",
            "Be ready to explain both the attendance threshold sources and the fee-gate discrepancy.",
            "Run the attendance boundary and marks tests on the current branch before quoting results.",
            "Use a test student/exam and do not publish or overwrite a real institution result; all seed records are generated demo data.",
        ],
        "sources": ["docs/MODULE_INTEGRATION.md §3 Module 4 and §6", "docs/DATA_DICTIONARY.md §4 Examination & Results", "docs/ER_DIAGRAMS.md and docs/er/er_module4_examination_results.svg", "database/05_procedures.sql: registration, marks, result routines", "database/06_triggers.sql: exam/marks guards", "database/07_functions.sql: attendance, grade, SGPA/CGPA and dues functions", "tests/db/test_rules.sql", "tests/api/workflow.py"],
        "warning": "Verified source discrepancy — fee gate: MODULE_INTEGRATION.md and README say pending fees block exam registration. In the current visible SQL, sp_register_student_for_exam calculates v_dues but never tests it; trg_exam_reg_bi_eligibility checks enrollment and attendance, not fees. The SQL test file verifies the dues function’s sum, but no inspected assertion proves that an indebted student is blocked. Present only the attendance gate as verified until this is fixed and retested.",
    },
    {
        "number": 5,
        "title": "Fees & Finance",
        "slug": "Fees_Finance",
        "pages": [
            "frontend/src/pages/fees/FeeStructuresPage.tsx",
            "frontend/src/pages/fees/BillsPage.tsx",
            "frontend/src/pages/fees/PaymentsPage.tsx",
            "frontend/src/pages/fees/DefaultersPage.tsx",
            "frontend/src/pages/fees/ScholarshipsPage.tsx",
            "frontend/src/pages/fees/MyFeesPage.tsx",
        ],
        "backend": [
            "backend/src/routes/finance.routes.ts",
            "backend/src/controllers/finance.controller.ts",
            "backend/src/services/finance.service.ts",
            "backend/src/repositories/finance.repository.ts",
        ],
        "tables": [
            "users", "students", "categories", "programs", "academic_years", "semesters", "fee_structures", "student_fees", "payments",
            "scholarships", "student_scholarships", "fines", "refunds", "transactions", "hostel_fees",
        ],
        "api": [
            "Structures and bills: /api/v1/fees/structures, /api/v1/fees/bills, /bills/me, /bills/defaulters and ledger/report endpoints.",
            "Generate/apply charges: POST /api/v1/fees/generate and POST /api/v1/fees/apply-late-fees.",
            "Money operations: POST /api/v1/fees/payments, POST /api/v1/fees/payments/refund; scholarships, fines and GET /api/v1/fees/export/:kind.",
        ],
        "purpose": "Define fee structures, generate student bills, record payments and refunds, maintain a transaction ledger, apply scholarships/late charges, and provide fee status and collection reports.",
        "flow": [
            "fee_structures store program/category/year/semester pricing components and grace days; sp_generate_semester_fees creates one student_fees row for each eligible active student not already billed for that semester.",
            "A student_fees bill tracks total_amount, scholarship/discount, paid_amount, due_amount, due_date and status using DECIMAL money columns.",
            "sp_process_fee_payment validates a positive amount, an existing bill, amount not greater than current due and a nonduplicate transaction reference; it inserts a payment, generates a receipt, posts audit/notification data and commits.",
            "Payment triggers update the corresponding bill’s paid/due/status values and insert transaction-ledger rows; the generated receipt is tied to the payment PK.",
            "Late-fee processing uses fn_calculate_late_fee; scholarships are awarded in student_scholarships and can be credited when bills are generated.",
            "Refunds reference an original payment and student, preserving traceability rather than deleting the payment.",
        ],
        "relationships": [
            "fee_structures reference programs, academic years and optionally categories; a fee structure is reused to generate bills.",
            "student_fees reference students, fee_structures, semesters and academic years; one student can have many bills across terms.",
            "payments reference student_fees and students, plus the user who received the payment; refunds reference the payment and student.",
            "transactions link student_fees, optional payments and students; they are a bill/payment ledger, not a full general-ledger double-entry accounting system.",
            "student_scholarships link student + scholarship + academic year. fines can optionally reference the fee bill.",
            "hostel_fees reference room_allocations separately; hostel rent is not the same record as an academic fee bill.",
        ],
        "objects": [
            "Procedures: sp_generate_semester_fees, sp_process_fee_payment and sp_apply_late_fees.",
            "Functions: fn_calculate_late_fee and fn_student_outstanding_dues.",
            "Triggers: trg_student_fees_ai_audit; trg_student_fees_bu_audit; trg_payment_ai; trg_payment_au.",
            "Views: v_student_fee_status, v_daily_fee_collection and v_fee_collection_summary.",
            "Integrity: DECIMAL rather than floating-point for money; unique receipt/transaction references; FKs from payment/refund/ledger records; nonnegative/check constraints and transaction handling.",
        ],
        "demo": [
            "Sign in as the ACCOUNTANT demo role and open a known pending bill for generated demo student data.",
            "Record a small partial payment with a clearly fake reference (for example a VIVA-DEMO string). Show the receipt number and payment row.",
            "Refresh the bill and ledger: paid_amount should rise, due_amount fall, the status reflect PARTIAL or PAID, and a transaction/audit row appear.",
            "Show one collection or defaulter report. If demonstrating late fees, use a disposable seeded database and show the grace-date policy.",
            "Do not enter real card/bank credentials: this prototype records a payment event; it is not a payment-gateway integration.",
        ],
        "tests": [
            "tests/api/workflow.py posts a payment against a pending bill, fetches the receipt/ledger and runs the late-fee endpoint; it also checks a fee-structure edit audit when prerequisites exist.",
            "tests/db/test_rules.sql covers database business-rule assertions; inspect current payment/ledger assertions before quoting exact totals.",
            "Build and API smoke tests should run against the same database schema and seed as the demo. Payment workflow mutates balances and is not a read-only test.",
            "Fee calculation and receipt generation need a running SQL database; a frontend-only preview cannot verify them.",
        ],
        "qas": [
            ("Why separate fee_structures, student_fees and payments?", "A structure is a reusable price template; student_fees is the student’s actual bill/snapshot for a term; payments are individual receipts/events against that bill. This preserves history if the template later changes."),
            ("Why use DECIMAL for money?", "DECIMAL stores exact base-10 values at the declared precision. Floating-point can introduce rounding artifacts in currency calculations."),
            ("What makes a payment atomic?", "The payment procedure validates the amount and bill, inserts the payment/receipt and relies on triggers to update bill and ledger state, with transaction boundaries and rollback on SQL exceptions."),
            ("What is stored in transactions?", "Bill/payment ledger entries that show debit/credit direction, amount and running balance for a student fee record. It is an auditable operational ledger, not a full chart-of-accounts double-entry general ledger."),
            ("How are duplicate receipts prevented?", "Unique keys on receipt/transaction identifiers provide the database-level guarantee; the procedure also checks a supplied transaction reference before insertion."),
            ("What happens with a partial payment?", "The payment row records the amount and receipt; triggers update paid_amount and due_amount, and the bill remains partial/pending according to the resulting due/status rule."),
            ("How is a scholarship applied?", "A scholarship scheme is a master row; a student award links student, scholarship and academic year. Fee generation can credit the approved amount against generated bills."),
            ("Is the fee system connected to a bank or UPI gateway?", "No. The prototype records payment mode and reference and generates an ERP receipt; external settlement/gateway processing is outside this project’s scope."),
            ("Do unpaid fees definitely block exam registration in the current source?", "The docs claim that they do, but the visible exam procedure only computes the dues function result and does not branch on it; the exam trigger also does not check dues. I would not claim the gate is enforced until fixed and covered by an API/SQL test."),
            ("Can a refund erase the original payment?", "No. A refund is a dependent record referencing the original payment, so the original transaction and its audit history remain traceable."),
        ],
        "rehearsal": [
            "Write the bill arithmetic in words: total minus scholarship/discount minus paid, plus applicable late fee under the current rule.",
            "Know the PK/FK path from student_fees to payments to transactions/refunds.",
            "Demonstrate the receipt and updated balance only after the API confirms success.",
            "Disclose the exam-dues gate discrepancy; a dues function existing is not proof that registration enforces it.",
        ],
        "sources": ["docs/MODULE_INTEGRATION.md §3 Module 5, §6 and §7", "docs/DATA_DICTIONARY.md §5 Fees & Finance", "docs/ER_DIAGRAMS.md and docs/er/er_module5_fees_finance.svg", "database/05_procedures.sql: fee procedures", "database/06_triggers.sql: fee/payment triggers", "database/07_functions.sql: late fee and outstanding dues", "tests/api/workflow.py: fee section"],
        "warning": "Cross-module claim to verify: the finance function fn_student_outstanding_dues correctly sums student_fees.due_amount for PENDING/PARTIAL/OVERDUE bills, but the visible exam-registration procedure calculates this value without acting on it. Treat ‘fees block exam registration’ as a documented intent, not a currently verified rule, until a direct registration test proves it.",
    },
    {
        "number": 6,
        "title": "Hostel",
        "slug": "Hostel",
        "pages": [
            "frontend/src/pages/hostel/HostelDashboardPage.tsx",
            "frontend/src/pages/hostel/HostelRoomsPage.tsx",
            "frontend/src/pages/hostel/HostelApplicationsPage.tsx",
            "frontend/src/pages/hostel/HostelAllocationsPage.tsx",
            "frontend/src/pages/hostel/MyHostelPage.tsx",
        ],
        "backend": [
            "backend/src/routes/hostel.routes.ts",
            "backend/src/controllers/hostel.controller.ts",
            "backend/src/services/hostel.service.ts",
            "backend/src/repositories/hostel.repository.ts",
        ],
        "tables": [
            "users", "students", "faculty", "academic_years", "hostels", "hostel_blocks", "rooms", "beds",
            "hostel_applications", "room_allocations", "room_transfers", "hostel_fees",
        ],
        "api": [
            "Inventory: /api/v1/hostel/hostels, /hostel/rooms, /hostel/beds and /hostel/rooms/vacancy.",
            "Resident workflow: /api/v1/hostel/applications and POST /api/v1/hostel/allocations.",
            "Lifecycle actions: /api/v1/hostel/allocations/:id/transfer, /vacate, /hostel/transfers, /hostel/occupancy and /hostel/stats.",
        ],
        "purpose": "Manage hostel inventory from hostel to block to room to bed, collect applications, allocate/transfer/vacate beds, and maintain occupancy and hostel-rent status without trusting stale frontend counters.",
        "flow": [
            "Hostels contain blocks; blocks belong to hostels; rooms reference hostel and block; beds reference a room and have an availability status.",
            "A student submits a hostel_application for an academic year and preference; a user/reviewer records the decision.",
            "sp_allocate_hostel_bed validates an active application state, available bed and no active allocation for the student, then writes room_allocations and a hostel_fees row as a transaction.",
            "Allocation triggers update the bed status and room/hostel occupancy counters. The active_bed_year unique key and other guards protect against double occupancy.",
            "sp_transfer_room updates the allocation and writes a room_transfers history row; sp_vacate_hostel_bed marks the allocation vacated, after which the triggers free the bed/counters.",
            "v_room_vacancy and v_hostel_occupancy provide reusable read models for dashboards and reports.",
        ],
        "relationships": [
            "hostels 1-to-many hostel_blocks and rooms; a hostel_block belongs to one hostel; rooms belong to both hostel and block; beds belong to one room.",
            "hostel_applications reference students, hostels, academic years and optional reviewing users.",
            "room_allocations link student, bed, room, hostel, academic year and allocating user; this history row records status and dates.",
            "room_transfers reference the student, from/to beds and approving user; hostel_fees reference an allocation, student and year.",
            "hostels.warden_faculty_id references faculty, so the warden is the same faculty record used by HR/workload.",
        ],
        "objects": [
            "Procedures: sp_allocate_hostel_bed, sp_transfer_room and sp_vacate_hostel_bed.",
            "Function: fn_hostel_available_beds.",
            "Triggers: trg_allocation_bi_duplicate; trg_allocation_ai; trg_allocation_au; trg_allocation_ad; trg_beds_bu_guard; trg_rooms_bu_capacity.",
            "Views: v_room_vacancy and v_hostel_occupancy.",
            "Derived fields: beds.status, rooms.occupied_count and hostels.occupied_beds are trigger-maintained; room capacity and one-active-bed-per-student/year are guarded in SQL.",
        ],
        "demo": [
            "Sign in as HOSTEL_ADMIN and open occupancy; point out total beds, occupied beds and available beds as different measures.",
            "Choose an unallocated synthetic student and an AVAILABLE bed in the same demo environment; submit/review an application using the existing flow.",
            "Allocate the bed and refresh occupancy. Show the allocation row, bed status/counters and automatically created hostel fee row.",
            "Vacate a demo allocation and show the counters/bed status return. If time permits, attempt a duplicate allocation on disposable data and show SQL refuses it.",
            "Keep the data distinction clear: a hostel application/allocation is demo data, not a PICT housing record.",
        ],
        "tests": [
            "tests/api/workflow.py finds an unallocated student and available bed, creates an application, allocates through sp_allocate_hostel_bed, checks occupancy triggers and vacates as cleanup.",
            "tests/db/test_rules.sql checks availability, allocation-created rent, occupancy counters, duplicate allocation and room capacity guard behavior.",
            "Run tests against a disposable seeded database; they create and clean up test rows and are not read-only.",
            "Show SQL state plus dashboard after the action; a changed frontend number alone is not evidence of trigger behavior.",
        ],
        "qas": [
            ("Why model beds separately from rooms?", "A room can hold more than one resident. beds gives each physical slot an independent status and key, making allocation and vacancy precise."),
            ("How is over-allocation prevented?", "The procedure checks bed availability and existing active allocation, unique constraints/active_bed_year protect allocation identity, and triggers keep the bed/room/hostel counters synchronized."),
            ("What does the allocation transaction write?", "It creates a room_allocations row, the linked hostel_fees row, updates the application decision, writes audit and notification entries, then commits. Errors roll back the multi-row change."),
            ("Why maintain occupied_count if occupancy can be counted?", "It makes common vacancy/occupancy reads inexpensive. It is a deliberate denormalized value maintained by triggers and can be reconciled against beds/allocations."),
            ("What happens on a room transfer?", "The active allocation is moved to a target available bed and a room_transfers history row records old bed, new bed, reason, date and approver; triggers update occupancy."),
            ("What is the difference between an application and allocation?", "An application expresses a student’s request and review status. An allocation is the actual time-bound assignment to a specific bed."),
            ("How does a hostel warden link to faculty?", "hostels.warden_faculty_id is a foreign key to faculty.faculty_id, so the same faculty entity appears in the hostel and HR modules."),
            ("Where is hostel rent stored?", "hostel_fees is linked to a room allocation and student/year. It is distinct from academic student_fees, even though both relate to one student."),
            ("Do triggers replace the procedure?", "No. The procedure coordinates the business operation and transaction; triggers enforce side effects/invariants for writes even if another code path touches the base table."),
            ("How would you verify counters are correct?", "Compare allocation/beds source rows with rooms.occupied_count and hostels.occupied_beds, then inspect the allocation triggers and reconciliation SQL."),
        ],
        "rehearsal": [
            "Draw hostels → blocks → rooms → beds, then applications → allocations → hostel fees.",
            "Know allocation_id, bed_id and the active_bed_year uniqueness rationale.",
            "Show before/after occupancy and an audit record; test both allocate and vacate.",
            "Use an unallocated demo student and an available bed; keep a reset path ready.",
        ],
        "sources": ["docs/MODULE_INTEGRATION.md §3 Module 6 and §7", "docs/DATA_DICTIONARY.md §6 Hostel", "docs/ER_DIAGRAMS.md and docs/er/er_module6_hostel.svg", "database/05_procedures.sql: hostel procedures", "database/06_triggers.sql: allocation/bed/room guards", "database/08_views.sql: vacancy/occupancy views", "tests/api/workflow.py: hostel section", "tests/db/test_rules.sql"],
    },
    {
        "number": 7,
        "title": "Faculty, Leave & Payroll",
        "slug": "Faculty_Leave_Payroll",
        "pages": [
            "frontend/src/pages/faculty/FacultyPage.tsx",
            "frontend/src/pages/faculty/FacultyDetailPage.tsx",
            "frontend/src/pages/faculty/LeavesPage.tsx",
            "frontend/src/pages/faculty/LeaveBalancesPage.tsx",
            "frontend/src/pages/faculty/PayrollPage.tsx",
        ],
        "backend": [
            "backend/src/routes/faculty.routes.ts",
            "backend/src/controllers/faculty.controller.ts",
            "backend/src/services/faculty.service.ts",
            "backend/src/repositories/faculty.repository.ts",
        ],
        "tables": [
            "users", "departments", "academic_years", "semesters", "subjects", "course_offerings", "designations", "faculty",
            "faculty_subjects", "faculty_leaves", "leave_balances", "payrolls", "payroll_components",
        ],
        "api": [
            "Faculty profile/list/workload: /api/v1/faculty, /faculty/:id, /faculty/workload, /faculty/:id/subjects and /faculty/:id/leave-balances.",
            "Leave flow: /api/v1/faculty/leaves, POST /faculty/leaves and POST /faculty/leaves/:id/review.",
            "Payroll: /api/v1/faculty/payroll, /payroll/summary, /payroll/months, POST /payroll/generate and PATCH /payroll/:id/status.",
        ],
        "purpose": "Maintain the faculty master and teaching assignments, process faculty leave requests/balances, generate monthly payslips, and preserve pay-component and approval history.",
        "flow": [
            "faculty references a login user, department and designation, with employee code/email and status uniqueness rules.",
            "faculty_subjects and course_offerings connect a faculty record to taught subjects and term-specific workload.",
            "A faculty member applies for leave. HR/Admin reviews; sp_approve_leave updates the leave status and, only on approval, records usage in leave_balances and adds audit/notification rows.",
            "Leave triggers reject invalid date ranges and insufficient remaining balance for quota-based leave types. Unpaid approved leave feeds loss-of-pay days in payroll.",
            "sp_generate_monthly_payroll loops over active/on-leave faculty, computes components, upserts one faculty/month/year payroll row and writes component, audit and summary data.",
            "Payroll status progresses through DRAFT/GENERATED/APPROVED/PAID; a trigger prevents a paid payslip from being silently moved back to a draft-like state.",
        ],
        "relationships": [
            "faculty.user_id uniquely references users.user_id; faculty.department_id and designation_id reference shared masters.",
            "faculty_subjects is an assignment relation between faculty, subjects, semester and academic year; course_offerings also reference faculty.",
            "faculty_leaves reference faculty and optional approving user; leave_balances link faculty + academic year + leave type and are unique per combination.",
            "payrolls reference faculty and are unique by faculty/month/year; payroll_components are dependent rows per payslip.",
            "Hostel warden and exam invigilator columns can reference the same faculty master; there is no second faculty identity per module.",
        ],
        "objects": [
            "Procedures: sp_approve_leave and sp_generate_monthly_payroll.",
            "Functions: fn_calculate_faculty_leave_balance and fn_calculate_net_salary.",
            "Triggers: trg_faculty_bi_validate; trg_faculty_leaves_bi_guard; trg_faculty_leaves_bu_guard; trg_payrolls_bu_guard.",
            "Views: v_faculty_workload and v_faculty_payroll_summary.",
            "Important source detail: the current sp_generate_monthly_payroll calculates its salary formula inline; fn_calculate_net_salary exists but is not called in the inspected procedure body. Verify before claiming the procedure delegates to that function.",
        ],
        "demo": [
            "Sign in as a faculty demo account and open profile/workload; show how offering/subject assignments feed the workload view.",
            "Submit a two-day synthetic leave request. Sign in as HR, approve it, then show the status, approving user and leave_balances.used change.",
            "Choose a test payroll month not already used, generate payroll as HR and inspect earnings/deductions/net plus component rows.",
            "Explain the database’s example formula, then state that tax/professional-tax rates are demo assumptions and not legal payroll advice.",
            "Show a PAID payslip guard only on a disposable row; never edit or mark real payroll as paid.",
        ],
        "tests": [
            "tests/api/workflow.py applies for leave, approves it as HR, checks leave_balances.used and generates payroll for a free month.",
            "tests/db/test_rules.sql exercises payroll generation/idempotency, faculty leave balance and database status guards; inspect the current assertions before quoting totals.",
            "Payroll runs update monthly rows, so use the provided workflow or a disposable DB and avoid choosing a period that the demo relies on.",
            "Backend/frontend build and API tests require the corresponding Node dependencies, a running API and MariaDB/MySQL.",
        ],
        "qas": [
            ("How does faculty connect to the rest of the ERP?", "The faculty row references one users login and a department/designation; course offerings, timetable, attendance, exam invigilation and hostel warden references all point back to that same faculty_id."),
            ("What happens to a leave balance when a request is rejected?", "A rejected request changes status and is audited/notified, but does not consume the leave balance. Approval is the operation that increases used days."),
            ("How does the database prevent approving more leave than remains?", "A leave-update trigger computes the remaining balance for quota-based leave types before the status becomes approved and signals an error if the requested days exceed it."),
            ("How is unpaid leave reflected in payroll?", "The monthly payroll procedure sums approved UNPAID leave days for the month and computes a loss-of-pay deduction from gross pay."),
            ("Explain the payroll formula. Is it a statutory calculator?", "The demo procedure sums basic, HRA, DA, TA and special allowance; applies configured/default professional tax, PF and a simplified income-tax formula; subtracts loss of pay; and floors net salary at zero. It is a project demonstration, not a production/statutory tax engine."),
            ("What is the unique payroll key?", "One row per faculty_id, pay_month and pay_year; the unique key makes reruns update rather than create duplicate payslips."),
            ("What prevents a paid payroll from being reopened?", "trg_payrolls_bu_guard restricts changing a PAID payslip back to an earlier state and rejects a negative net amount."),
            ("Is fn_calculate_net_salary called by the monthly procedure?", "The UDF exists in database/07_functions.sql, but the current inspected sp_generate_monthly_payroll body computes the formula inline. I would describe the implementation accurately rather than claiming a call that is not present."),
            ("Why store payroll_components separately?", "Components preserve the earning/deduction breakdown for payslips and reporting while payrolls stores the period-level totals and status."),
            ("Who can approve leave and generate payroll?", "HR and Admin are the intended privileged roles; route-level requireRole checks are backed by backend authorization, not only by hiding UI buttons."),
        ],
        "rehearsal": [
            "Know the faculty, leave, balance, payroll and payroll-component PK/FK chain.",
            "Show a leave request before and after approval and point to the exact balance row.",
            "Explain the demo pay formula and its limitations; do not call it statutory payroll compliance.",
            "Verify the function/procedure implementation and current test output before presenting.",
        ],
        "sources": ["docs/MODULE_INTEGRATION.md §3 Module 7 and §7", "docs/DATA_DICTIONARY.md §7 Faculty, Leave & Payroll", "docs/ER_DIAGRAMS.md and docs/er/er_module7_faculty_leave_payroll.svg", "database/05_procedures.sql: leave/payroll procedures", "database/06_triggers.sql: leave/payroll guards", "database/07_functions.sql: leave balance/net salary functions", "tests/api/workflow.py: faculty/leave/payroll", "tests/db/test_rules.sql"],
        "warning": "Accuracy note: the current stored procedure sp_generate_monthly_payroll computes gross, PF, professional tax, simplified income tax, loss-of-pay and net salary inline. Although fn_calculate_net_salary exists, the inspected procedure does not call it. The formula is a demo rule set, not tax/accounting advice.",
    },
]

PROJECT_QA = [
    ("Give a 30-second project introduction.", "This is one database-centric university ERP for seven integrated workflows: student/admission, academics, attendance, exams/results, fees, hostel, and faculty/leave/payroll. A React/TypeScript client calls a Node/Express API; MariaDB/MySQL stores the source-of-truth data and enforces key rules with constraints, procedures, functions, triggers and views."),
    ("Why is this a DBMS project and not just a CRUD website?", "The schema is documented and relational, with PK/FK/unique/check constraints, transaction boundaries, indexes, 20 views, 17 procedures, 13 functions, 28 triggers and 45 annotated analytical queries. Important rules remain enforced if a request bypasses the UI."),
    ("Describe the request path.", "React calls a relative /api/v1 URL through the Vite proxy; Express middleware authenticates JWT, checks role, validates input with Zod, then routes through controller/service/repository. Repositories use parameterized mysql2 SQL or call stored routines; the response returns a consistent success/error envelope."),
    ("What is the technology stack?", "Frontend: React 18, TypeScript, Tailwind CSS, Vite, React Router and Axios. Backend: Node 20, Express, TypeScript, mysql2, Zod, bcryptjs and JWT with security middleware. Database: MySQL 8 or MariaDB 10.6+. MongoDB is optional/off by default and is not the transactional source of truth."),
    ("What database size/artifacts should you know?", "The repository data dictionary reports 61 base tables, 677 columns, 20 views, 17 stored procedures, 13 functions, 28 triggers and 138 foreign keys. database/09_queries.sql contains 45 commented analytical queries."),
    ("What is a primary key?", "A primary key uniquely identifies each row and cannot be null. Most tables use an auto-increment singular_id, for example students.student_id or payments.payment_id."),
    ("What is a foreign key?", "A foreign key references a candidate/primary key in another table and makes invalid references unrepresentable. Example: attendance.student_id references students.student_id."),
    ("Give a many-to-many relationship in the schema.", "Students and course offerings are many-to-many through enrollments; each enrollment has its own PK and FKs to student and offering, plus a unique student/offering key."),
    ("Why is users separate from students/faculty?", "users holds credentials, role and account state. Student/faculty rows store domain attributes and reference a unique user_id, giving one shared login model without mixing identity and profile data."),
    ("What normalization level does the report describe?", "PROJECT_REPORT.md describes the relational schema as 3NF and transactional tables as designed toward BCNF. It also explicitly documents a few performance counters that are deliberately denormalized and trigger-maintained."),
    ("Why use a transaction?", "To make multiple related writes atomic and consistent. For example, an approval should not create a user but fail to create the student; a payment should not insert a receipt without updating the bill/ledger."),
    ("What is the difference between a procedure and a function?", "A stored procedure performs an operation and can return OUT values or write rows; a function returns a value that can be used in expressions. In this project, bulk operations use procedures and calculations such as attendance/grade/dues use functions."),
    ("What is the difference between a trigger and a procedure?", "A procedure is explicitly called for a business operation; a trigger runs automatically when a table event occurs. Procedures coordinate a workflow; triggers protect invariants/derived effects for direct table writes too."),
    ("What is a view?", "A named SELECT/read model that hides a repeated join or aggregate. Examples include v_student_attendance_overall, v_student_fee_status and v_room_vacancy. A normal view is not a separately stored copy of its rows."),
    ("Why use indexes and unique indexes?", "Indexes speed common filters/joins; unique indexes both support lookups and enforce identity/business rules. Composite unique indexes prevent duplicates such as one student enrolled twice in one offering."),
    ("Which values use DECIMAL and why?", "Money uses DECIMAL (for example DECIMAL(12,2)) and percentages use DECIMAL(5,2); exact decimal arithmetic avoids binary floating-point currency errors."),
    ("How is role authorization enforced?", "Protected routes authenticate the JWT and call requireRole; services also apply row-level scoping (for example a student is forced to their own student_id). Frontend role gates improve navigation but are not the security boundary."),
    ("How are passwords stored?", "bcrypt hashes, not plaintext. JWTs carry authenticated identity/role claims; refresh/logout behavior is handled by the auth service. Demo accounts are intentionally simple and must not be used in production."),
    ("How is SQL injection mitigated?", "Repository values are sent through ? placeholders/prepared mysql2 statements. Dynamic sort keys are allow-listed; user-supplied values are not concatenated into SQL predicates."),
    ("What does the audit trail record?", "Application services capture the authenticated actor, action, entity and useful before/after context; database triggers also log sensitive table changes. That provides a history even for writes outside the normal UI path."),
    ("How are module integrations demonstrated?", "One student_id flows from admission into academic enrollment, attendance, exam registration/results, fees and hostel. A faculty_id links workload/attendance/invigilation/warden duties and payroll. The shared masters are the integration contract."),
    ("Is all seeded data real PICT data?", "No. Institute name/identity/logo and documented canonical department names are institution facts; all seeded students, faculty, marks, attendance, fee and hostel records are generated demo data. The UI/README identifies that distinction."),
    ("What is the attendance rule?", "The function counts PRESENT/LATE in the numerator, excludes EXCUSED from the denominator and returns 100% when no counted sessions exist. The exam procedure compares recomputed attendance with the exam threshold; the direct-insert trigger also checks a configured threshold."),
    ("Can you claim pending fees block exam registration?", "Not from the current inspected SQL. Documentation says yes, and the procedure computes v_dues with fn_student_outstanding_dues, but does not branch on it; the insert trigger checks enrollment and attendance only. State this as a known discrepancy until a code/test fix is verified."),
    ("How does the fee/payment flow work?", "A fee structure generates a student_fees bill. sp_process_fee_payment validates and inserts a payment/receipt; triggers update paid/due/status and write ledger entries; the response returns the receipt only after server success."),
    ("How does hostel occupancy stay consistent?", "Allocation procedures create or update room_allocations; triggers update beds.status and room/hostel counters. Unique keys/guards prevent duplicate active occupancy; views provide current vacancy."),
    ("How is result processing performed?", "Marks are validated and grades/points derived in SQL. The semester results procedure aggregates credits, grade points, SGPA, backlogs and status; standalone SGPA/CGPA functions also exist, but the inspected procedure contains its own aggregation SQL. A publish procedure changes publication flags and notifies students."),
    ("What are the payroll limitations?", "The payroll procedure uses project/demo formulas for allowances, PF, professional tax, simplified income tax and unpaid leave. It is not a statutory tax engine; the current procedure computes inline even though a net-salary UDF exists."),
    ("How do you test the project?", "Build backend and frontend; run the DB rule suite, API smoke suite and stateful workflow suite against a seeded MariaDB/MySQL database. The workflow covers attendance, fees, hostel, leave/payroll, academics, admissions, reports and audit. Report fresh command output from the exact build being defended."),
    ("What are the main known limits?", "Single-institution scope; synthetic/demo seed data; in-app notifications rather than sent email/SMS; local AI rules by default; optional Mongo event store disabled; no payment gateway; payroll math is demonstrative; and the fee-to-exam gate is not verified in current SQL."),
    ("Why no ORM?", "The project intentionally exposes relational design, parameterized SQL, constraints, views, routines and triggers for DBMS study. A thin repository layer keeps SQL visible and reviewable."),
    ("What should you do if docs and source disagree?", "Prefer the current executable schema/source plus a passing test as evidence. State the disagreement, identify the responsible file/rule, and avoid claiming unverified behavior. Documentation should then be updated after the implementation/test is reconciled."),
]


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_cell_margins(cell, top=65, start=85, bottom=65, end=85) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, v in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(v))
        node.set(qn("w:type"), "dxa")


def set_cell_text(cell, text: str, *, bold=False, color=INK, size=8.3, font="Calibri") -> None:
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    r = p.add_run(str(text))
    r.bold = bold
    r.font.name = font
    r.font.size = Pt(size)
    r.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_margins(cell)


def add_table(doc: Document, headers: list[str], rows: list[list[str]], widths: list[float] | None = None, font_size=8.2) -> None:
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.autofit = False
    set_repeat_table_header(t.rows[0])
    for i, h in enumerate(headers):
        set_cell_text(t.rows[0].cells[i], h, bold=True, color=WHITE, size=8.4)
        set_cell_shading(t.rows[0].cells[i], NAVY)
    for index, row in enumerate(rows):
        cells = t.add_row().cells
        for i, val in enumerate(row):
            set_cell_text(cells[i], val, size=font_size)
            if index % 2 == 1:
                set_cell_shading(cells[i], "F5F7FA")
    if widths:
        usable_width = 6.78
        scale = min(1.0, usable_width / sum(widths))
        for row in t.rows:
            for i, width in enumerate(widths):
                row.cells[i].width = Inches(width * scale)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)


def add_callout(doc: Document, title: str, text: str, fill=PALE_BLUE) -> None:
    t = doc.add_table(rows=1, cols=1)
    t.autofit = True
    c = t.cell(0, 0)
    set_cell_shading(c, fill)
    set_cell_margins(c, top=120, start=150, bottom=120, end=150)
    c.text = ""
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run(title)
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor.from_string(NAVY if fill != PALE_RED else "A61B1B")
    p2 = c.add_paragraph(text)
    p2.paragraph_format.space_after = Pt(0)
    for run in p2.runs:
        run.font.name = "Calibri"
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor.from_string(INK)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)


def add_bullets(doc: Document, items: list[str], numbered=False) -> None:
    style = "List Number" if numbered else "List Bullet"
    for text in items:
        p = doc.add_paragraph(style=style)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.left_indent = Inches(0.28 if not numbered else 0.32)
        p.paragraph_format.first_line_indent = Inches(-0.16)
        p.add_run(text)


def add_body(doc: Document, text: str, after=5) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = 1.05
    p.add_run(text)


def add_heading(doc: Document, text: str, level=1) -> None:
    p = doc.add_heading(text, level=level)
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(10 if level == 1 else 7)
    p.paragraph_format.space_after = Pt(4)


def add_code_list(doc: Document, items: list[str]) -> None:
    for item in items:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.16)
        p.paragraph_format.space_after = Pt(1.5)
        p.paragraph_format.keep_together = True
        r = p.add_run(item)
        r.font.name = "Consolas"
        r.font.size = Pt(8)
        r.font.color.rgb = RGBColor.from_string(BLUE)


def add_qa(doc: Document, pairs: list[tuple[str, str]]) -> None:
    for i, (question, answer) in enumerate(pairs, 1):
        p = doc.add_paragraph()
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.space_before = Pt(5)
        p.paragraph_format.space_after = Pt(1)
        r = p.add_run(f"Q{i}. {question}")
        r.bold = True
        r.font.color.rgb = RGBColor.from_string(NAVY)
        a = doc.add_paragraph()
        a.paragraph_format.left_indent = Inches(0.18)
        a.paragraph_format.space_after = Pt(4)
        a.paragraph_format.line_spacing = 1.03
        lead = a.add_run("Answer: ")
        lead.bold = True
        lead.font.color.rgb = RGBColor.from_string(TEAL)
        a.add_run(answer)


def add_page_number(paragraph) -> None:
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("Page ")
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor.from_string(MUTED)
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    paragraph._p.append(fld)


def setup_doc(doc: Document, running_title: str) -> None:
    doc.core_properties.title = running_title
    doc.core_properties.subject = "Repository-grounded DBMS module and viva preparation"
    doc.core_properties.author = "University ERP M7 Study Guide"
    doc.core_properties.keywords = "PICT ERP, DBMS, viva, study guide, MariaDB, MySQL"
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.67)
    section.bottom_margin = Inches(0.65)
    section.left_margin = Inches(0.72)
    section.right_margin = Inches(0.72)
    section.header_distance = Inches(0.3)
    section.footer_distance = Inches(0.3)

    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(9.6)
    normal.font.color.rgb = RGBColor.from_string(INK)
    normal.paragraph_format.space_after = Pt(5)
    for name, size, color in (("Title", 25, NAVY), ("Heading 1", 15, NAVY), ("Heading 2", 11.5, BLUE), ("Heading 3", 10, TEAL)):
        style = doc.styles[name]
        style.font.name = "Calibri"
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)

    header = section.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    rr = header.add_run(f"PICT ERP  |  {running_title}")
    rr.font.name = "Calibri"
    rr.font.size = Pt(8)
    rr.font.color.rgb = RGBColor.from_string(MUTED)
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.LEFT
    fr = footer.add_run("DBMS M7 • Study and viva preparation • Generated demo data only")
    fr.font.name = "Calibri"
    fr.font.size = Pt(8)
    fr.font.color.rgb = RGBColor.from_string(MUTED)
    add_page_number(section.footer.add_paragraph())


def cover(doc: Document, title: str, subtitle: str, group: str) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(8)
    if LOGO.exists():
        p.add_run().add_picture(str(LOGO), width=Inches(1.0))
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run("PICT • UNIVERSITY HIGHER EDUCATION ERP")
    r.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor.from_string(TEAL)
    p = doc.add_paragraph(style="Title")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(7)
    p.add_run(title)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run(subtitle)
    r.font.size = Pt(14)
    r.font.color.rgb = RGBColor.from_string(BLUE)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(18)
    r = p.add_run(group)
    r.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor.from_string(NAVY)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(6)
    p.add_run(f"Repository-grounded edition • {PREPARED}")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(4)
    p.add_run("Prepared from the checked-in project docs, SQL schema, source paths and test scripts.")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(16)
    r = p.add_run("Presenters: ______________________________________________")
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor.from_string(MUTED)
    add_callout(doc, "Defense rule", "Explain what the current source and a reproducible test prove. Distinguish documented intent from verified behavior, and label seeded people/transactions as generated demo data.", PALE_TEAL)
    doc.add_page_break()


def parse_dictionary() -> dict[str, dict[str, Any]]:
    path = ROOT / "docs" / "DATA_DICTIONARY.md"
    text = path.read_text(encoding="utf-8")
    parts = re.split(r"(?m)^### `([^`]+)`\s*$", text)
    result: dict[str, dict[str, Any]] = {}
    for i in range(1, len(parts), 2):
        name, body = parts[i], parts[i + 1]
        pk_match = re.search(r"(?m)^\| `([^`]+)` \|[^\n]*\*\*PK\*\*", body)
        outgoing = ""
        match = re.search(r"Outgoing foreign keys:\s*([^\n]*)", body)
        if match:
            outgoing = match.group(1).strip()
        result[name] = {"pk": pk_match.group(1) if pk_match else "See dictionary", "fks": outgoing or "—"}
    return result


def add_table_keys(doc: Document, module: dict[str, Any], dictionary: dict[str, dict[str, Any]]) -> None:
    rows: list[list[str]] = []
    for name in module["tables"]:
        meta = dictionary.get(name)
        if not meta:
            rows.append([name, "Check DATA_DICTIONARY.md", "Table section not parsed"])
        else:
            rows.append([name, meta["pk"], meta["fks"]])
    add_table(doc, ["Table", "Primary key", "Outgoing foreign keys (column → referenced table.column)"], rows, widths=[1.34, 1.22, 4.65], font_size=7.6)


def add_shared_architecture(doc: Document) -> None:
    add_heading(doc, "Stack and request architecture", 1)
    add_table(doc, ["Layer", "What this project uses", "Viva point"], [
        ["Frontend", "React 18 + TypeScript + Tailwind + Vite + React Router + Axios", "Role-aware SPA; modules are lazy-loaded and share one dashboard shell."],
        ["API", "Node 20 + Express + TypeScript + Zod + mysql2", "Routes → auth/role/validation middleware → controller → service → repository."],
        ["Database", "MySQL 8 / MariaDB 10.6+", "One relational source of truth; SQL constraints and business objects enforce integrity."],
        ["Optional", "MongoDB event sink; disabled/off by default", "Not used for the transactional ERP records or business-rule source of truth."],
    ], widths=[1.0, 2.55, 3.65], font_size=8.0)
    add_body(doc, "Browser requests use relative /api/v1 URLs through the Vite /api proxy. Repository SQL uses parameterized values. Frontend role gates are for navigation; backend JWT/RBAC and row-level service scoping are the security boundary.")


def make_module_doc(module: dict[str, Any], dictionary: dict[str, dict[str, Any]]) -> Path:
    doc = Document()
    group = f"GROUP {module['number']}  •  MODULE {module['number']}"
    setup_doc(doc, f"Group {module['number']} · {module['title']}")
    cover(doc, f"Module {module['number']} Study Guide", module["title"], group)

    add_heading(doc, "1. What the group owns", 1)
    add_body(doc, module["purpose"])
    add_callout(doc, "One-sentence answer", f"The {module['title']} module owns its domain workflow and tables, but integrates with the shared users, students/faculty, academic masters and audit/notification services rather than becoming a separate application.", PALE_BLUE)

    add_heading(doc, "2. Files to study and present", 1)
    add_body(doc, "Read the UI and API paths first; then trace one write down to its stored procedure/constraint and one read back from the database.")
    add_heading(doc, "Frontend pages", 2)
    add_code_list(doc, module["pages"])
    add_heading(doc, "Backend route-to-data path", 2)
    add_code_list(doc, module["backend"])
    add_code_list(doc, ["frontend/src/App.tsx", "frontend/src/components/AppShell.tsx", "frontend/src/lib/api.ts", "backend/src/routes/index.ts", "backend/src/middleware/auth.ts", "backend/src/middleware/validate.ts", "backend/src/config/database.ts"])
    add_shared_architecture(doc)

    add_heading(doc, "3. API surface and role", 1)
    add_bullets(doc, module["api"])
    add_body(doc, "API module prefix: /api/v1. The matching router is mounted from backend/src/routes/index.ts. Before the viva, inspect each route’s requireRole(...) list; never infer authorization from a hidden navigation link.")

    add_heading(doc, "4. Tables, primary keys and foreign keys", 1)
    add_body(doc, "The following key map is generated from docs/DATA_DICTIONARY.md for this guide. It lists each table’s PK and the table’s declared outgoing FKs; composite unique constraints are described in the relationship/rule notes below.")
    add_table_keys(doc, module, dictionary)

    add_heading(doc, "5. Workflow and relationships", 1)
    add_heading(doc, "Business flow", 2)
    add_bullets(doc, module["flow"], numbered=True)
    add_heading(doc, "How the rows connect", 2)
    add_bullets(doc, module["relationships"])

    add_heading(doc, "6. DBMS objects and rules to defend", 1)
    add_bullets(doc, module["objects"])
    add_body(doc, "Use the ER diagram for cardinality, the data dictionary for exact column types/keys, and the SQL definition for actual enforcement. A view is a read model; it is not a base table. A UI validation message is not a database constraint.")

    if module.get("warning"):
        add_callout(doc, "Source/code discrepancy — answer carefully", module["warning"], PALE_RED)

    add_heading(doc, "7. Live demonstration sequence", 1)
    add_bullets(doc, module["demo"], numbered=True)
    add_callout(doc, "Success-message rule", "Only treat an operation as successful after the API confirms it. If the API/database is unavailable, switch to a recorded screenshot or explain the source path; do not imply that a frontend-only preview proves database behavior.", PALE_TEAL)

    add_heading(doc, "8. Test and verification plan", 1)
    add_bullets(doc, module["tests"])
    add_heading(doc, "Commands to run from the repository root", 2)
    add_code_list(doc, [
        "(cd backend && npm run build)",
        "(cd frontend && npm run build)",
        "bash tests/api/smoke.sh",
        "python3 tests/api/workflow.py",
        "(cd backend && npm run test:db)",
    ])
    add_body(doc, "The API/database commands require the matching service and a seeded disposable database. Use the exact current output in your presentation; do not copy an old pass count from a report without reproducing it.")

    add_heading(doc, "9. Likely viva questions with model answers", 1)
    add_qa(doc, module["qas"])

    add_heading(doc, "10. Group rehearsal checklist", 1)
    add_bullets(doc, module["rehearsal"])
    add_heading(doc, "Repository references", 1)
    add_bullets(doc, module["sources"])
    add_body(doc, f"Prepared from {ROOT.name}; all generated people, attendance, marks, fee and hostel records are demo data unless a source explicitly identifies institution-level facts. Prepared {PREPARED}.")

    filename = f"PICT_ERP_Group_{module['number']:02d}_{module['slug']}_Study_Guide.docx"
    target = OUT / filename
    doc.save(target)
    return target


def make_project_doc() -> Path:
    doc = Document()
    dictionary = parse_dictionary()
    setup_doc(doc, "Complete project viva")
    cover(doc, "Complete Project Viva Guide", "Architecture • DBMS • Integration • Demonstration", "ALL MODULE GROUPS  •  COMPLETE PROJECT")

    add_heading(doc, "1. Project at a glance", 1)
    add_body(doc, "The University Higher Education ERP is one integrated, database-centric project for the seven module groups. Its modules share master entities and a single relational database; they are not seven independent apps or seven copies of student/faculty records.")
    add_table(doc, ["Item", "Repository-grounded fact"], [
        ["Project", "University Higher Education ERP System • DBMS M7 collaborative project • E&TC (canonical department name)."],
        ["Frontend", "React 18, TypeScript, Tailwind CSS, Vite, React Router and Axios; one public landing/login and one shared role-aware workspace."],
        ["Backend", "Node 20, Express, TypeScript, JWT authentication, bcryptjs, Zod validation, mysql2 prepared SQL and role/scoping middleware."],
        ["DBMS", "MySQL 8 / MariaDB 10.6+; database name university_erp."],
        ["Schema artifacts", "61 base tables, 677 documented columns, 138 foreign keys, 20 views, 17 stored procedures, 13 functions and 28 triggers."],
        ["SQL learning evidence", "45 annotated analytical queries in database/09_queries.sql, including joins, grouping, subqueries, CTEs and window-function work."],
        ["Seed data", "README documents generated demo data such as 141 students and 24 faculty. It is synthetic and not a real PICT student/faculty dataset."],
    ], widths=[1.45, 5.6], font_size=8.3)
    add_callout(doc, "Opening statement", "One shared ERP, one relational source of truth, seven integrated workflows. The database—not the browser—must remain the final authority for integrity-sensitive rules.", PALE_TEAL)

    add_heading(doc, "2. Architecture you should be able to draw", 1)
    add_table(doc, ["Layer", "Responsibility", "Key paths"], [
        ["React SPA", "Public landing/login, role-aware navigation, forms, tables and reports; lazy-loaded pages.", "frontend/src/App.tsx; frontend/src/pages/; frontend/src/components/AppShell.tsx; frontend/src/lib/api.ts"],
        ["Vite proxy", "Browser calls relative /api/v1; dev proxy forwards /api to Express.", "frontend/vite.config.ts"],
        ["Express API", "Authentication, role authorization, Zod validation, row-level scoping, business orchestration, API response envelope.", "backend/src/index.ts; backend/src/routes/; backend/src/controllers/; backend/src/services/; backend/src/middleware/"],
        ["Repositories", "Parameterised mysql2 queries and stored-procedure calls; no ORM layer hides the SQL.", "backend/src/repositories/; backend/src/config/database.ts"],
        ["MySQL/MariaDB", "Persistent records, constraints, transactions, views, stored routines and triggers.", "database/01_schema.sql–09_queries.sql; database/migrations/"],
        ["Optional event store", "MongoDB connector exists but is disabled/optional; not the transactional ERP source of truth.", "backend/src/config/mongo.ts; docker-compose.yml optional profile"],
    ], widths=[1.15, 3.0, 2.9], font_size=7.9)
    add_callout(doc, "Request lifecycle example", "POST /api/v1/exams/registrations → Express security middleware → authenticate JWT → requireRole → Zod validation → controller → service → repository/procedure → database checks → success/error envelope. The browser never talks directly to SQL.", PALE_BLUE)

    add_heading(doc, "3. The seven groups: what to present", 1)
    add_table(doc, ["Group / module", "Main data model", "Demo anchor"], [
        ["1 • Student & Admission", "admissions, students, addresses, guardians, documents, status history", "Public application → Admin review → transactional user/student creation"],
        ["2 • Academic & Course", "departments/programs/batches/subjects, curriculum map, offerings, enrollments, timetable", "Bulk enrollment idempotency; timetable conflict rejected by database"],
        ["3 • Attendance", "class_sessions and attendance with student/offering/semester FKs", "Faculty session → roster marking → percentage/report/warning"],
        ["4 • Examination & Results", "exams, schedules, registrations, marks, grades, results", "Eligibility → mark/grade → SGPA/result → publish"],
        ["5 • Fees & Finance", "fee structures, bills, payments, scholarships, refunds, ledger", "Partial payment → receipt → updated bill/ledger/audit"],
        ["6 • Hostel", "hostels, blocks, rooms, beds, applications, allocations, transfers, hostel fees", "Allocate/vacate a bed → trigger-maintained occupancy"],
        ["7 • Faculty, Leave & Payroll", "faculty/designations, subject assignments, leave/balances, payroll/components", "Leave approval changes balance; generate a demo monthly payslip"],
    ], widths=[1.7, 3.15, 2.2], font_size=7.8)

    add_heading(doc, "4. Shared entities and cross-module relationships", 1)
    add_bullets(doc, [
        "roles → users: one authentication account has one role; backend routes use this role for RBAC.",
        "users ↔ students/faculty: students.user_id and faculty.user_id are unique FKs, so domain modules share the same login identity.",
        "departments → programs/subjects/faculty/students: the academic master is reused rather than copied into each module.",
        "programs + subjects → program_subjects: associative table resolves the curriculum many-to-many relationship.",
        "students + course_offerings → enrollments: one student's academic participation, reused by attendance, exam and reporting flows.",
        "course_offerings → timetable/class_sessions/exam_registrations: the shared offering_id connects scheduled teaching, attendance and examinations.",
        "students → fees/hostel/notifications/audit-linked transactions: one student_id is referenced by the dependent business records.",
        "faculty → offerings/subjects/leave/payroll/warden/invigilator: faculty_id is the shared cross-module identity.",
    ])
    add_heading(doc, "Four relationship examples to draw", 2)
    add_table(doc, ["Relationship", "Resolved by", "Integrity key"], [
        ["Student ↔ offering", "enrollments", "FK student_id + offering_id; unique pair"],
        ["Student ↔ session", "attendance", "FK student_id + session_id; unique pair"],
        ["Student ↔ exam/offering", "exam_registrations", "FK student_id, exam_id, offering_id; composite unique key"],
        ["Student ↔ bed/year", "room_allocations", "FK student/bed/room/hostel/year; active-bed uniqueness and guards"],
        ["Faculty ↔ month", "payrolls", "FK faculty_id; unique faculty_id + month + year"],
    ], widths=[1.65, 1.55, 3.9], font_size=8.0)

    add_heading(doc, "Compact PK/FK map for the main tables", 2)
    add_body(doc, "This summary is extracted from docs/DATA_DICTIONARY.md. It shows the principal PK and outgoing foreign keys for the shared core and each module; see the seven module guides for the fuller table set and workflow detail.")
    key_groups = [
        ("Shared core", ["roles", "users", "departments", "academic_years", "semesters"]),
        ("Group 1 • Student & Admission", ["admissions", "students", "addresses", "guardians", "student_documents", "student_status_history"]),
        ("Group 2 • Academic & Course", ["programs", "batches", "sections", "subjects", "program_subjects", "course_offerings", "enrollments", "faculty_subjects", "timetable", "academic_calendar"]),
        ("Group 3 • Attendance", ["class_sessions", "attendance"]),
        ("Group 4 • Examination & Results", ["exams", "exam_schedules", "exam_registrations", "marks", "grades", "results"]),
        ("Group 5 • Fees & Finance", ["fee_structures", "student_fees", "payments", "scholarships", "student_scholarships", "fines", "refunds", "transactions"]),
        ("Group 6 • Hostel", ["hostels", "hostel_blocks", "rooms", "beds", "hostel_applications", "room_allocations", "room_transfers", "hostel_fees"]),
        ("Group 7 • Faculty/Leave/Payroll", ["designations", "faculty", "faculty_subjects", "faculty_leaves", "leave_balances", "payrolls", "payroll_components"]),
    ]
    key_rows: list[list[str]] = []
    for group_name, table_names in key_groups:
        for table_name in table_names:
            meta = dictionary.get(table_name, {"pk": "See dictionary", "fks": "—"})
            key_rows.append([group_name, table_name, meta["pk"], meta["fks"]])
    add_table(doc, ["Module", "Table", "Primary key", "Declared outgoing foreign keys"], key_rows, widths=[1.45, 1.38, 1.05, 2.9], font_size=7.0)

    add_heading(doc, "5. Database design and DBMS concepts", 1)
    add_heading(doc, "Keys, constraints and normalization", 2)
    add_bullets(doc, [
        "Most base tables use a surrogate AUTO_INCREMENT PK named <singular>_id. FKs state cross-table references and match type/signedness to the parent key.",
        "Unique keys protect candidate/business identity: users.email; students.email, roll_number and registration_number; admissions.application_no and email; enrollment/attendance/registration composites; payment receipt references; payroll faculty/month/year; and hostel active-bed/year rules.",
        "CHECK/enum/status validation, NOT NULL/defaults, FK referential actions and application Zod validation work together; a form alone cannot guarantee integrity.",
        "PROJECT_REPORT.md describes the relational design as 3NF and transactional tables toward BCNF. It explicitly documents denormalized counters—offering enrollment count, hostel occupancy/bed status, and bill paid/due totals—maintained by triggers/reconciliation.",
        "Money is DECIMAL, percentages DECIMAL(5,2); state/status columns use constrained lifecycle values. Indexes support common joins, filters and unique business rules.",
    ])
    add_heading(doc, "Know these object differences", 2)
    add_table(doc, ["DBMS object", "What it does here", "Examples"], [
        ["Constraint", "Declarative integrity; PK/FK/unique/check/not-null.", "uq_enrollments_student_offering; FK attendance.student_id → students.student_id"],
        ["Stored procedure", "Explicit workflow, multi-row action, OUT response, transaction.", "sp_approve_admission; sp_process_fee_payment; sp_allocate_hostel_bed"],
        ["Function", "Returns a computed value inside SQL expressions.", "fn_calculate_attendance_percentage; fn_grade_points; fn_student_outstanding_dues"],
        ["Trigger", "Runs automatically for INSERT/UPDATE/DELETE and protects/updates table state.", "trg_exam_reg_bi_eligibility; trg_payment_ai; trg_allocation_ai"],
        ["View", "Reusable SELECT/read model, not an independent base-table copy.", "v_student_attendance_overall; v_student_fee_status; v_room_vacancy"],
        ["Transaction", "Atomic boundary around related changes; error handler rolls back.", "admission approval; payment/receipt; hostel allocation; leave decision"],
    ], widths=[1.15, 3.0, 2.95], font_size=7.9)
    add_heading(doc, "ACID in a project example", 2)
    add_bullets(doc, [
        "Atomicity: admission is all-or-nothing across user/student/application; payment should not leave a receipt without its bill/ledger updates.",
        "Consistency: constraints, routines and triggers preserve valid relationships and state before/after the transaction.",
        "Isolation: transactions and appropriate InnoDB locking protect concurrent writes; unique keys are still required for race-safe uniqueness.",
        "Durability: a committed database transaction persists according to the configured database/storage policy.",
    ])

    add_heading(doc, "6. Core cross-module DBMS rules", 1)
    add_table(doc, ["Rule", "Current enforcement/source", "Proof to show"], [
        ["Admission creates a linked account/student", "sp_approve_admission transaction + FKs/unique keys", "Application status, user_id, student_id, audit row"],
        ["Bulk enrollment capacity/duplicate protection", "sp_bulk_enroll_students; trg_enrollments_bi_guard; count triggers; unique key", "Call twice; show first/second counts and enrollments"],
        ["Attendance eligibility", "fn_calculate_attendance_percentage + sp_register_student_for_exam + trg_exam_reg_bi_eligibility", "Below threshold refused; exactly 75% boundary passes"],
        ["Exam fee/dues gate", "Documented intent, but current inspected routine only calculates v_dues; no visible refusal branch", "Do not claim as verified; see source discrepancy below"],
        ["Marks and grade integrity", "sp_enter_marks and trg_marks_bi/bu_derive; audit trigger", "Out-of-range mark rejected; grade/points re-derived"],
        ["Payment and ledger", "sp_process_fee_payment + trg_payment_ai/au", "Receipt, paid/due balance, transaction ledger and audit"],
        ["Hostel capacity", "sp_allocate/vacate + allocation/bed/room triggers and active-bed guard", "Bed state and occupancy counters change and return"],
        ["Leave and payslip state", "sp_approve_leave; leave guards; sp_generate_monthly_payroll; payroll status trigger", "Approved leave consumes balance; paid slip cannot be reopened silently"],
    ], widths=[1.52, 3.1, 2.4], font_size=7.6)
    add_callout(doc, "Critical source discrepancy — exam dues", "README.md and docs/MODULE_INTEGRATION.md say outstanding fees block exam registration. Current database/05_procedures.sql sets v_dues = fn_student_outstanding_dues(...), but no later condition reads v_dues; current trg_exam_reg_bi_eligibility checks enrollment and attendance, not fees. The inspected SQL tests validate the dues calculation but do not prove registration is blocked. State the intended rule as unverified until the SQL and a direct API/database test agree.", PALE_RED)

    add_heading(doc, "7. Security, identity and data truth", 1)
    add_table(doc, ["Role", "Primary domain"], [
        ["ADMIN", "Cross-module administration, settings, audit and announcements"],
        ["STUDENT", "Own profile, attendance, fees, results, hostel and student tools"],
        ["FACULTY", "Assigned workload, sessions/marks and own leave/profile"],
        ["ACCOUNTANT", "Fee structures, bills, payments, scholarships, fines, refunds and exports"],
        ["HOSTEL_ADMIN", "Hostel inventory, applications, allocation, transfer and occupancy"],
        ["EXAM_CELL", "Exams, registration, eligibility, marks and result publication"],
        ["HR", "Faculty, leave, balances and payroll"],
    ], widths=[1.55, 5.45], font_size=8.3)
    add_bullets(doc, [
        "Route middleware authenticates JWT and checks requireRole; services additionally force row-level scope for student/faculty data.",
        "bcrypt stores password hashes only; demo credentials are for local viva only and must be rotated/disabled for production.",
        "Parameterized ? SQL values, Zod input validation, Helmet/CORS/rate limits, error handling and audit logging are part of the backend security story.",
        "Official institution identity/logo and seed entities must be kept distinct. README explicitly labels students, faculty and operational records as generated demo data; never introduce them as genuine records.",
        "MongoDB is an optional event/telemetry connection, not the source of truth for payments, marks, identity or other relational transactions. AI defaults to a local labelled engine unless configured otherwise.",
    ])

    add_heading(doc, "8. Suggested end-to-end viva demo", 1)
    add_bullets(doc, [
        "Landing → login: point out public apply, the demo-account panel and the same shared dashboard shell after authentication.",
        "Student/admission: submit a unique synthetic application, review/approve as Admin, inspect the linked student/user and audit event.",
        "Academics: select an existing offering, show its enrollment list and timetable; rerun bulk enrollment only on disposable data.",
        "Attendance: as faculty create a session and mark the roster; show percentage and a configured low-attendance warning.",
        "Examination: as Exam Cell show eligibility and the database’s attendance refusal; state the dues-gate discrepancy accurately.",
        "Marks/results: enter a valid test mark, process and publish a result; show a student-facing view only if the test data are prepared.",
        "Fees: as accountant record a small synthetic payment; show receipt, paid/due change, ledger and audit. No real gateway credentials.",
        "Hostel: allocate then vacate a demo bed; show occupancy and the associated hostel-fee row.",
        "Faculty: apply/approve demo leave; generate a free payroll period and explain the demo formula limitations.",
        "Close with reports/CSV and audit log; identify generated rows and point to SQL/ERD/test sources.",
    ], numbered=True)
    add_callout(doc, "Demo safety", "Use a cloned/disposable seeded database. The API workflow test mutates rows; payments, admissions, hostel allocation and payroll are not read-only. Avoid personal records, irreversible changes and fake success claims.", PALE_AMBER)

    add_heading(doc, "9. Testing: what is present and what is verified", 1)
    add_table(doc, ["Suite/build", "Command", "What it is for"], [
        ["Frontend build", "cd frontend && npm run build", "TypeScript and Vite production bundle."],
        ["Backend build", "cd backend && npm run build", "TypeScript compile."],
        ["API smoke", "bash tests/api/smoke.sh", "Documented endpoint/role status and authorization checks."],
        ["End-to-end workflow", "python3 tests/api/workflow.py", "Stateful multi-module writes and business-flow assertions."],
        ["DB rules", "cd backend && npm run test:db", "Executes tests/db/test_rules.sql and prints pass/fail rule output."],
    ], widths=[1.35, 2.3, 3.35], font_size=7.8)
    add_callout(doc, "Test-count discrepancy to resolve", "Repository files disagree: README’s current summary says 10/10 database consistency checks and 158 API smoke checks, with three SQL-runner statements under investigation; README’s detailed Testing section and PROJECT_REPORT.md also retain an older 68 DB / 158 API / 40 workflow pass claim. The current sandbox had no MariaDB/MySQL on port 3306 and no API service, so those database/API suites were not freshly rerun here. Before the viva, run the commands on the exact branch/database you will present and quote only that output.", PALE_AMBER)

    add_heading(doc, "10. Known limitations and source accuracy notes", 1)
    add_bullets(doc, [
        "Exam dues gate: documentation claims it, but the inspected routine calculates v_dues without a branch; current trigger checks enrollment and attendance only. This requires implementation + direct test before claiming it works.",
        "Exam attendance threshold is read from exam.min_attendance_required in the procedure and from system_settings.MIN_ATTENDANCE_PERCENTAGE in the insert trigger; keep settings aligned and test the boundary.",
        "Payroll procedure computes salary figures inline. fn_calculate_net_salary exists but is not called by the inspected procedure. Payroll tax values/formulas are project/demo assumptions, not legal advice.",
        "README test summaries conflict; use reproducible current command output, not an averaged or combined pass count.",
        "Generated seed data, no real payment gateway, in-app notifications rather than outbound email/SMS, optional MongoDB disabled by default, and single-institution scope are documented limitations.",
        "Existing-database upgrades are listed in database/migrations. A fresh schema already carries current table/procedure definitions; apply the matching migration to an old DB where its procedure/key is stale. Do not add a unique email key until the migration preflight confirms duplicates are resolved.",
    ])

    add_heading(doc, "11. Likely complete-project viva questions", 1)
    add_qa(doc, PROJECT_QA)

    add_heading(doc, "12. Reading order and quick reference", 1)
    add_bullets(doc, [
        "Start: README.md → architecture, features, setup, role demo accounts and known data provenance.",
        "System design: PROJECT_REPORT.md §§7–19 (technology, architecture, ER, normalization, constraints, SQL objects, transactions and security).",
        "Integration: docs/MODULE_INTEGRATION.md (module API/table ownership, six cross-module flows, rules and transaction boundaries).",
        "Keys: docs/DATA_DICTIONARY.md; visual model: docs/ER_DIAGRAMS.md and docs/er/*.svg / *.mmd.",
        "SQL: database/02_tables.sql, 03_constraints.sql, 04_seed.sql, 05_procedures.sql, 06_triggers.sql, 07_functions.sql, 08_views.sql and 09_queries.sql.",
        "Test sources: tests/db/test_rules.sql, tests/api/smoke.sh, tests/api/workflow.py; service scripts under backend/src/scripts/.",
        "Demo credentials: docs/DEMO_CREDENTIALS.md. Use only local demo accounts; do not deploy them.",
    ])
    add_heading(doc, "Quick start (only on a disposable local/demo database)", 2)
    add_body(doc, "Reset once from the repository root. Then start the backend and frontend in separate terminals; each dev server is long-running. Open the frontend URL and use the visible local demo account panel.")
    add_code_list(doc, [
        "bash scripts/reset-db.sh",
        "Terminal 1: cd backend && npm install && npm run dev",
        "Terminal 2: cd frontend && npm install && npm run dev",
        "Open http://localhost:5173",
    ])
    add_body(doc, "scripts/reset-db.sh drops and recreates the configured database; it is destructive. It applies a deliberate dependency order and reseeds generated data. Read it before running. Use the repository’s Docker flow if it better matches the presentation machine.")
    add_heading(doc, "Source references", 1)
    add_bullets(doc, ["README.md", "PROJECT_REPORT.md", "docs/MODULE_INTEGRATION.md", "docs/DATA_DICTIONARY.md", "docs/ER_DIAGRAMS.md", "docs/DEMO_CREDENTIALS.md", "database/", "backend/src/", "frontend/src/", "tests/", "database/migrations/"])
    add_body(doc, f"Prepared from the checked-out repository on {PREPARED}. The document follows current checked-in SQL/source where it conflicts with older prose and labels unresolved disagreements instead of silently repeating an unverified claim.")

    target = OUT / "PICT_ERP_Complete_Project_Viva_Preparation_Guide.docx"
    doc.save(target)
    return target


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    dictionary = parse_dictionary()
    outputs = [make_module_doc(m, dictionary) for m in MODULES]
    outputs.append(make_project_doc())

    index = OUT / "00_README.txt"
    index.write_text(
        "PICT ERP viva preparation documents\n"
        f"Generated {PREPARED} from the checked-out source repository.\n\n"
        + "\n".join(f"{p.name}" for p in outputs)
        + "\n\nAll student/faculty/transaction seed records are generated demo data.\n"
        "The complete-project guide calls out source/documentation discrepancies that should be resolved before claiming the affected behavior.\n",
        encoding="utf-8",
    )

    archive = OUT / "PICT_ERP_8_Study_Guides.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=8) as zf:
        zf.write(index, arcname=index.name)
        for path in outputs:
            zf.write(path, arcname=path.name)

    print(f"Created {len(outputs)} DOCX files and {archive}")
    for path in outputs:
        print(f"{path.name}\t{path.stat().st_size:,} bytes")
    print(f"{archive.name}\t{archive.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
