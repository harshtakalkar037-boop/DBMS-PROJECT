# Demo credentials

Every seeded account of a role shares one password. These are **demo** credentials for the viva and for
local development — rotate them before any real deployment. The login screen (`/login`) also displays
these accounts as visible cards: **Use demo account** fills the sign-in form; it still uses the ordinary
authentication endpoint when you press **Sign In**.

| Role | Email | Password | Can reach |
|---|---|---|---|
| ADMIN | `admin@pict.edu` | `Admin@123` | everything, including settings, audit log, announcements |
| FACULTY | `karan.shinde@pict.edu` | `Faculty@123` | own offerings, sessions, marks, own leaves and payslips |
| STUDENT | `2024ETC1001@pict.edu` | `Student@123` | own profile, attendance, fees, results, hall ticket, hostel, mock tests, AI study plan |
| ACCOUNTANT | `accountant@pict.edu` | `Account@123` | fee structures, bills, payments, scholarships, fines, refunds, exports |
| HOSTEL_ADMIN | `hostel.admin@pict.edu` | `Hostel@123` | hostels, rooms, beds, applications, allocations, transfers |
| EXAM_CELL | `examcell@pict.edu` | `Exam@123` | exams, schedules, registrations, eligibility, marks, results |
| HR | `hr@pict.edu` | `Hr@123` | faculty records, leaves, leave balances, payroll |

## More accounts

* **Any faculty member** — `<first>.<last>@pict.edu` / `Faculty@123`, e.g.
  `chetan.zambre@pict.edu`, `soham.gaikwad@pict.edu`. Employee codes run `EMP-1001 … EMP-1024`.
* **Any student** — `<roll>@pict.edu` / `Student@123`, e.g. `2024ETC1001@pict.edu` …
  `2024ETC1141@pict.edu` (emails are stored lower-case; login is case-insensitive).

```sql
-- list a few of each
SELECT u.email, r.role_code FROM users u JOIN roles r ON r.role_id = u.role_id
WHERE r.role_code = 'FACULTY' LIMIT 5;

SELECT s.roll_number, u.email FROM students s JOIN users u ON u.user_id = s.user_id
ORDER BY s.student_id LIMIT 5;
```

## Suggested demo path

1. **Student** — log in as `2024ETC1001@pict.edu`: dashboard → My attendance → My fees → Results →
   Hall ticket → My hostel → AI study plan → Mock tests (start one and submit it).
2. **Exam cell** — `examcell@pict.edu`: open *Exam registrations*, try to register a student from the
   "Blocked by attendance" tab and watch the database refuse with the exact reason.
3. **Faculty** — `karan.shinde@pict.edu`: Attendance → create a session → mark the roster in bulk →
   Marks entry.
4. **Accountant** — `accountant@pict.edu`: Bills → open a bill → record a payment → see the receipt and
   the audit entry.
5. **Hostel admin** — `hostel.admin@pict.edu`: Rooms → allocate a bed from an approved application →
   watch vacancy drop immediately.
6. **HR** — `hr@pict.edu`: Leaves (approve one and see the balance move) → Payroll → run a month →
   advance a payslip to PAID.
7. **Admin** — `admin@pict.edu`: Reports (any report + CSV) → Notifications (broadcast) → Audit log →
   Settings.

## Changing a password

* In the app: **Profile → Change password** (requires the current password).
* From SQL (bcrypt hash — generate it with `node -e "console.log(require('bcryptjs').hashSync('New@123',10))"`):

```sql
UPDATE users SET password_hash = '<hash>', is_first_login = 0 WHERE email = 'admin@pict.edu';
```

* To reseed everything with the demo accounts: `bash scripts/reset-db.sh`.
