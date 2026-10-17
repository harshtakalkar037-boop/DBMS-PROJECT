# Database Implementation Log — University Higher Education ERP

This document records the database setup steps and terminal results supplied during implementation of the University Higher Education ERP project.

> **Scope:** This is a structured record of the supplied terminal history, not an independent audit of the hosted database. The commands shown include writes to the Aiven-hosted `university_erp` database. Run setup scripts only against a database you are authorized to modify. Never commit database passwords, private CA files, or other secrets.

## Environment

- **Database service:** Aiven MySQL
- **MySQL server version reported by client:** `8.4.11`
- **Database:** `university_erp`
- **Client account shown in terminal:** `avnadmin`
- **SQL source directory:** `/Users/harsh/Downloads/university_erp/database`
- **Connection:** MySQL CLI over the configured Aiven host and port, using SSL mode `REQUIRED` for the successful connection and subsequent imports.

The original terminal output contained a failed DNS lookup for the hostname using the default resolver. A query to Google Public DNS resolved the hostname, after which a connection using `--ssl-mode=REQUIRED` succeeded. An earlier attempt using `--ssl-mode=VERIFY_CA` did not reach MySQL because the hostname could not be resolved by the default resolver; the output does not establish whether CA verification itself would succeed.

## 1. Connect to the MySQL service

The successful interactive connection used the following command. The password was entered at the hidden prompt and is intentionally not included here.

```bash
mysql -h university-erp-mysql-harshtakalkar037-893d.k.aivencloud.com \
  -P 16778 \
  -u avnadmin \
  -p \
  --ssl-mode=REQUIRED \
  defaultdb
```

The client reported:

```text
Welcome to the MySQL monitor.
Your MySQL connection id is 84
Server version: 8.4.11 Source distribution
```

## 2. Create and select the project database

Commands executed:

```sql
CREATE DATABASE university_erp;
SHOW DATABASES;
USE university_erp;
```

The terminal returned `Query OK, 1 row affected`, listed `university_erp` among the databases, and confirmed `Database changed` after selection.

## 3. Locate and inspect the SQL scripts

The terminal located two copies of the schema entry file:

```text
/Users/harsh/Downloads/university-erp/database/01_schema.sql
/Users/harsh/Downloads/university_erp/database/01_schema.sql
```

The working directory was then changed to:

```text
/Users/harsh/Downloads/university_erp
```

The database directory contained:

```text
01_schema.sql
02_tables.sql
03_constraints.sql
04_seed.sql
05_procedures.sql
06_triggers.sql
07_functions.sql
08_views.sql
09_queries.sql
migrations/
```

A grep check of `database/01_schema.sql` found comments describing database creation and selection. The displayed lines did not show an active `DROP DATABASE`, `DROP TABLE`, `CREATE DATABASE`, or `USE` statement in that file.

## 4. Apply the schema and table definitions

The following imports were executed from the project directory. Passwords were requested interactively and are omitted.

```bash
mysql -h university-erp-mysql-harshtakalkar037-893d.k.aivencloud.com \
  -P 16778 -u avnadmin -p \
  --ssl-mode=REQUIRED \
  university_erp < database/01_schema.sql

mysql -h university-erp-mysql-harshtakalkar037-893d.k.aivencloud.com \
  -P 16778 -u avnadmin -p \
  --ssl-mode=REQUIRED \
  university_erp < database/02_tables.sql
```

The supplied history then queried the database table list:

```bash
mysql -h university-erp-mysql-harshtakalkar037-893d.k.aivencloud.com \
  -P 16778 -u avnadmin -p \
  --ssl-mode=REQUIRED \
  -D university_erp \
  -e "SHOW TABLES;"
```

### Tables returned by `SHOW TABLES`

The terminal output listed 61 tables:

`academic_calendar`, `academic_years`, `addresses`, `admissions`, `ai_conversations`, `attendance`, `audit_logs`, `batches`, `beds`, `categories`, `class_sessions`, `course_offerings`, `departments`, `designations`, `enrollments`, `exam_registrations`, `exam_schedules`, `exams`, `faculty`, `faculty_leaves`, `faculty_subjects`, `fee_structures`, `fines`, `grades`, `guardians`, `hostel_applications`, `hostel_blocks`, `hostel_fees`, `hostels`, `leave_balances`, `marks`, `mcq_questions`, `mock_exam_answers`, `mock_exams`, `notifications`, `payments`, `payroll_components`, `payrolls`, `program_subjects`, `programs`, `refunds`, `results`, `roles`, `room_allocations`, `room_transfers`, `rooms`, `scholarships`, `sections`, `semesters`, `student_documents`, `student_fees`, `student_risk_scores`, `student_scholarships`, `student_status_history`, `students`, `study_plans`, `subjects`, `system_settings`, `timetable`, `transactions`, and `users`.

## 5. Apply constraints, functions, views, seed data, procedures and triggers

The terminal history records these imports in this order:

```bash
mysql -h university-erp-mysql-harshtakalkar037-893d.k.aivencloud.com \
  -P 16778 -u avnadmin -p --ssl-mode=REQUIRED \
  university_erp < database/03_constraints.sql

mysql -h university-erp-mysql-harshtakalkar037-893d.k.aivencloud.com \
  -P 16778 -u avnadmin -p --ssl-mode=REQUIRED \
  university_erp < database/07_functions.sql

mysql -h university-erp-mysql-harshtakalkar037-893d.k.aivencloud.com \
  -P 16778 -u avnadmin -p --ssl-mode=REQUIRED \
  university_erp < database/08_views.sql

mysql -h university-erp-mysql-harshtakalkar037-893d.k.aivencloud.com \
  -P 16778 -u avnadmin -p --ssl-mode=REQUIRED \
  university_erp < database/04_seed.sql

mysql -h university-erp-mysql-harshtakalkar037-893d.k.aivencloud.com \
  -P 16778 -u avnadmin -p --ssl-mode=REQUIRED \
  university_erp < database/05_procedures.sql

mysql -h university-erp-mysql-harshtakalkar037-893d.k.aivencloud.com \
  -P 16778 -u avnadmin -p --ssl-mode=REQUIRED \
  university_erp < database/06_triggers.sql
```

**Note:** The seed import line above is normalized to the hostname used by the other successful commands. The original terminal history shows the same hostname for that command. No password values are recorded in this document.

The terminal returned to the shell prompt after each import and displayed no error text for these commands. Because the commands did not use explicit shell error handling or capture each process exit status, this record treats that as evidence that no error was displayed—not as an independent proof that every SQL statement succeeded.

The file `database/09_queries.sql` was listed but was not executed in the supplied history.

## 6. Verify database object counts

The following read-only query was executed:

```sql
SELECT 'tables' AS object_type, COUNT(*) AS total
FROM information_schema.tables
WHERE table_schema = 'university_erp' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'views', COUNT(*)
FROM information_schema.views
WHERE table_schema = 'university_erp'
UNION ALL
SELECT routine_type, COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'university_erp'
GROUP BY routine_type
UNION ALL
SELECT 'triggers', COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'university_erp';
```

The query returned:

| Database object type | Count reported |
|---|---:|
| Base tables | 61 |
| Views | 20 |
| Functions | 13 |
| Stored procedures | 17 |
| Triggers | 28 |

These counts are taken directly from the terminal output pasted for this implementation log.

## 7. Summary of recorded work

Based on the supplied terminal history:

- Connected to the Aiven MySQL service using the MySQL command-line client.
- Created and selected the `university_erp` database.
- Imported the schema and table definitions.
- Queried and listed the 61 tables returned by MySQL.
- Ran the SQL imports for constraints, functions, views, seed data, stored procedures and triggers.
- Queried `information_schema` and observed 61 base tables, 20 views, 13 functions, 17 procedures and 28 triggers.

The pasted history does **not** show row counts for individual business tables, sample record queries, a database rule-test run, or the execution of `database/09_queries.sql`. Those should be documented only if separately executed and verified.

## Security and repeatability notes

- Do not commit passwords, tokens, private keys, CA certificates, or populated `.env` files.
- Avoid pasting credentials into shell commands; use `-p` to enter the password at the prompt.
- The database creation and SQL import commands modify the target database. Do not rerun them against a shared or live database without checking the scripts and confirming the intended target.
- For a repeatable academic demonstration, save sanitized command transcripts and the corresponding verification outputs, while keeping secrets and personal data out of Git.


## 8. Follow-up verification: seeded role accounts

A later terminal session connected directly to `university_erp` on MySQL server version `8.4.11`. The client reported connection ID `1948`. The following checks were run:

```sql
SELECT DATABASE();
SHOW TABLES LIKE 'users';
```

The output confirmed the selected database was `university_erp` and that the `users` table exists. Both checks were repeated, with the same results.

A read-only join then compared seven expected demo email/role combinations against `users`, `roles`, `students`, and `faculty`. The terminal returned seven rows, with the expected and actual role matching for every row:

| Account role | Matched expected role | Active | First login pending | Related record |
|---|---|---:|---:|---|
| `ADMIN` | Yes | 1 | 0 | No student/faculty row expected |
| `STUDENT` | Yes | 1 | 0 | Student record present; status `ACTIVE` |
| `FACULTY` | Yes | 1 | 0 | Faculty record present; status `ACTIVE` |
| `EXAM_CELL` | Yes | 1 | 0 | No student/faculty row expected |
| `ACCOUNTANT` | Yes | 1 | 0 | No student/faculty row expected |
| `HOSTEL_ADMIN` | Yes | 1 | 0 | No student/faculty row expected |
| `HR` | Yes | 1 | 0 | No student/faculty row expected |

In this output, `is_active = 1` indicates the account is active and `is_first_login = 0` indicates first login is not pending according to the database flags. The student and faculty records were also marked `ACTIVE`.

**What this verifies:** the seven expected demo account rows existed at the time of this query, their stored role codes matched the expected role codes, and their displayed active/first-login flags had the values above.

**What this does not verify:** this SQL query did not test passwords, issue an authentication token, or exercise each role's frontend permissions. Those require separate application-level login and authorization tests.
