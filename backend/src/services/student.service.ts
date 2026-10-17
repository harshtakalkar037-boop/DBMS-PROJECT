import { callProc, Row } from '../config/database';
import { AppError, Paging, parsePaging, buildOrderBy } from '../utils/api';
import * as repo from '../repositories/student.repository';
import { audit } from '../utils/audit';
import { AuthUser } from '../middleware/auth';
import { notificationsRepo } from '../repositories/notification.repository';

const SORTABLE = [
  'student_id', 'roll_number', 'first_name', 'last_name', 'email',
  'current_semester_no', 'admission_year', 'status', 'created_at',
];

/* ------------------------------------------------------------------ listing */

export async function list(query: Record<string, any>, actor: AuthUser) {
  const paging = parsePaging(query);
  const orderBy = buildOrderBy(query, SORTABLE, 'p.roll_number ASC');
  // A student can only ever see themselves; faculty see their own department.
  const scoped = { ...query };
  if (actor.role === 'STUDENT') scoped.studentId = actor.studentId;
  if (actor.role === 'FACULTY') {
    const faculty = await import('../config/database').then((db) =>
      db.queryOne<Row>('SELECT department_id FROM faculty WHERE user_id = ?', [actor.userId]));
    if (!faculty) throw AppError.forbidden('This faculty account is not linked to a department.');
    scoped.departmentId = Number(faculty.department_id);
  }
  const result = await repo.listStudents(scoped, paging, orderBy);
  if (!['ADMIN', 'ACCOUNTANT'].includes(actor.role)) {
    result.rows = result.rows.map(({ outstanding_dues: _dues, ...row }) => row as Row);
  }
  if (actor.role === 'FACULTY') {
    result.rows = result.rows.map(({
      user_id: _userId, email: _email, phone: _phone, date_of_birth: _dob,
      blood_group: _blood, login_active: _login, last_login_at: _lastLogin,
      ...departmentStudent
    }) => departmentStudent as Row);
  }
  return result;
}

export async function detail(id: number) {
  const student = await repo.findStudent(id);
  if (!student) throw AppError.notFound('Student');
  const [addresses, guardians, documents, history, fees, attendance, academics] = await Promise.all([
    repo.addresses(id), repo.guardians(id), repo.documents(id), repo.statusHistory(id),
    import('../repositories/finance.repository').then((m) => m.studentFeesRepo.forStudent(id)),
    import('../repositories/attendance.repository').then((m) => m.attendanceRepo.studentSummary(id)),
    import('../repositories/exam.repository').then((m) => m.resultsRepo.forStudent(id)),
  ]);
  return { student, addresses, guardians, documents, history, fees, attendance, academics };
}

export async function stats(actor?: AuthUser) {
  if (actor?.role === 'FACULTY') {
    const faculty = await import('../config/database').then((db) =>
      db.queryOne<Row>('SELECT department_id FROM faculty WHERE user_id = ?', [actor.userId]));
    if (!faculty) throw AppError.forbidden('This faculty account is not linked to a department.');
    return repo.studentStats(Number(faculty.department_id));
  }
  return repo.studentStats();
}

/* ------------------------------------------------------------------ writing */

export async function create(body: Record<string, any>, actor: AuthUser) {
  const { hashPassword, generateTemporaryPassword } = await import('./auth.service');
  const { createUser } = await import('../repositories/auth.repository');
  const db = await import('../config/database');
  const email = String(body.email).toLowerCase().trim();
  const admissionYear = Number(body.admissionYear);
  const program = await db.queryOne<Row>(
    `SELECT program_id, department_id, program_code FROM programs
     WHERE program_id = ? AND status = 'ACTIVE'`, [body.programId]);
  if (!program) throw AppError.validation('Select an active academic program.');
  if (Number(program.department_id) !== Number(body.departmentId)) {
    throw AppError.validation('The selected department does not match the selected program.');
  }

  const batchId = body.batchId
    ? Number(body.batchId)
    : await repo.batchForProgram(Number(body.programId), admissionYear);
  if (!batchId) throw AppError.validation('No active batch exists for this program and admission year.');
  const batch = await db.queryOne<Row>(
    `SELECT batch_id FROM batches
     WHERE batch_id = ? AND program_id = ? AND start_year = ? AND status = 'ACTIVE'`,
    [batchId, body.programId, admissionYear]);
  if (!batch) throw AppError.validation('The selected batch does not match this program and admission year.');

  const generatedPassword = body.password ? null : generateTemporaryPassword();
  const passwordHash = await hashPassword(body.password ?? generatedPassword);
  const programTag = String(program.program_code).replace(/^BTECH-/, '').replace(/^MTECH-/, 'M');
  const status = body.status ?? 'ACTIVE';
  const { userId, studentId, rollNumber } = await db.transaction(async (connection) => {
    const userId = await createUser('STUDENT', email, passwordHash, body.phone ?? null, connection);
    const rollNumber = body.rollNumber ?? await repo.nextRollNumber(programTag, admissionYear, connection);
    const registrationNumber = body.registrationNumber
      ?? `PICT/${admissionYear}/${programTag}/${rollNumber.slice(-4)}`;
    const studentId = await repo.insertStudent({
      userId,
      rollNumber,
      registrationNumber,
      firstName: body.firstName,
      middleName: body.middleName ?? null,
      lastName: body.lastName,
      email,
      phone: body.phone ?? null,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      categoryId: body.categoryId,
      departmentId: body.departmentId,
      programId: body.programId,
      batchId,
      admissionYear,
      currentSemesterNo: body.currentSemesterNo ?? 1,
      status,
      ...(body.bloodGroup ? { bloodGroup: body.bloodGroup } : {}),
      ...(body.emergencyContact ? { emergencyContact: body.emergencyContact } : {}),
      ...(body.admissionDate ? { admissionDate: body.admissionDate } : {}),
    }, connection);

    if (body.address) await repo.upsertAddress(studentId, body.address, connection);
    if (body.guardian) await repo.upsertGuardian(studentId, body.guardian, connection);
    if (status === 'INACTIVE' || status === 'SUSPENDED') {
      await connection.execute('UPDATE users SET is_active = 0 WHERE user_id = ?', [userId]);
    }
    return { userId, studentId, rollNumber };
  });

  await audit({
    userId: actor.userId, action: 'CREATE', entity: 'students', entityId: studentId,
    description: `Student ${rollNumber} created`, newValue: { rollNumber, email },
  });
  await notificationsRepo.create({
    userId, title: 'Welcome to the ERP',
    message: `Your student account is ready. Your roll number is ${rollNumber}.`,
    type: 'ADMISSION', severity: 'SUCCESS', entity: 'students', entityId: studentId, link: '/profile',
  }).catch(() => undefined);
  return {
    studentId, rollNumber, userId,
    ...(generatedPassword ? { temporaryPassword: generatedPassword } : {}),
  };
}

export async function update(id: number, body: Record<string, any>, actor: AuthUser) {
  const before = await repo.findStudent(id);
  if (!before) throw AppError.notFound('Student');
  const db = await import('../config/database');
  const programId = Number(body.programId ?? before.program_id);
  const departmentId = Number(body.departmentId ?? before.department_id);
  if (body.programId !== undefined || body.departmentId !== undefined) {
    const program = await db.queryOne<Row>('SELECT department_id FROM programs WHERE program_id = ?', [programId]);
    if (!program || Number(program.department_id) !== departmentId) {
      throw AppError.validation('The selected department does not match the selected program.');
    }
  }
  const batchId = Number(body.batchId ?? before.batch_id);
  if (body.batchId !== undefined || body.programId !== undefined || body.admissionYear !== undefined) {
    const batch = await db.queryOne<Row>(
      `SELECT batch_id FROM batches WHERE batch_id = ? AND program_id = ? AND start_year = ?`,
      [batchId, programId, Number(body.admissionYear ?? before.admission_year)]);
    if (!batch) throw AppError.validation('The selected batch does not match this program and admission year.');
  }
  await repo.updateStudent(id, body);
  if (body.status === 'INACTIVE' || body.status === 'SUSPENDED') await repo.setStudentAccountActive(id, false);
  await audit({
    userId: actor.userId, action: 'UPDATE', entity: 'students', entityId: id,
    description: `Student ${before.roll_number} updated`, oldValue: before, newValue: body,
  });
  return repo.findStudent(id);
}

export async function remove(id: number, actor: AuthUser) {
  const before = await repo.findStudent(id);
  if (!before) throw AppError.notFound('Student');
  await repo.deleteStudent(id);
  await audit({
    userId: actor.userId, action: 'DELETE', entity: 'students', entityId: id,
    description: `Student ${before.roll_number} deactivated`, oldValue: before,
  });
  return { deleted: true, accountActive: false };
}

export async function changeStatus(id: number, status: string, reason: string, actor: AuthUser) {
  const before = await repo.findStudent(id);
  if (!before) throw AppError.notFound('Student');
  await import('../config/database').then((d) =>
    d.execute('UPDATE students SET status = ? WHERE student_id = ?', [status, id]));
  if (status === 'INACTIVE' || status === 'SUSPENDED') await repo.setStudentAccountActive(id, false);
  await audit({
    userId: actor.userId, action: 'UPDATE', entity: 'students', entityId: id,
    description: `Status ${before.status} -> ${status} (${reason})`, oldValue: { status: before.status }, newValue: { status, reason },
  });
  return { studentId: id, status };
}

export async function setAccountStatus(id: number, active: boolean, actor: AuthUser) {
  const before = await repo.findStudent(id);
  if (!before) throw AppError.notFound('Student');
  if (active && ['INACTIVE', 'SUSPENDED'].includes(String(before.status))) {
    throw AppError.validation('Set the student record status to ACTIVE before reactivating the account.');
  }
  await repo.setStudentAccountActive(id, active);
  await audit({
    userId: actor.userId, action: 'UPDATE', entity: 'users', entityId: Number(before.user_id),
    description: `Student account ${before.email} ${active ? 'activated' : 'deactivated'}`,
    oldValue: { isActive: before.login_active }, newValue: { isActive: active },
  });
  return { studentId: id, active };
}

/* ---------------------------------------------------------------- addresses */

export const addresses = repo.addresses;
export async function saveAddress(id: number, body: Record<string, any>) {
  await repo.upsertAddress(id, body);
  return repo.addresses(id);
}
export const guardians = repo.guardians;
export async function saveGuardian(id: number, body: Record<string, any>) {
  await repo.upsertGuardian(id, body);
  return repo.guardians(id);
}
export const documents = repo.documents;
export async function addDocument(id: number, body: Record<string, any>, actor: AuthUser) {
  const docId = await repo.addDocument(id, body);
  await audit({ userId: actor.userId, action: 'CREATE', entity: 'student_documents', entityId: docId, description: `Document ${body.docType} uploaded for student ${id}` });
  return { documentId: docId };
}

/* --------------------------------------------------------------- admissions */

export async function listAdmissions(query: Record<string, any>) {
  const paging = parsePaging(query);
  const orderBy = buildOrderBy(query, ['admission_id', 'application_no', 'first_name', 'application_date', 'status'], 'a.application_date DESC, a.admission_id DESC');
  return repo.listAdmissions(query, paging, orderBy);
}

export const admissionStats = repo.admissionStats;
export const findAdmission = repo.findAdmission;
export const admissionOptions = repo.admissionOptions;

/** Public application form - no login required. */
export async function apply(body: Record<string, any>) {
  const { queryOne } = await import('../config/database');
  const academicYear = await queryOne<Row>(
    'SELECT academic_year_id FROM academic_years WHERE is_current = 1 AND status = \'ACTIVE\' LIMIT 1');
  if (!academicYear) throw AppError.validation('No current academic year is configured.');
  const program = await queryOne<Row>(
    `SELECT p.program_id FROM programs p
     JOIN batches b ON b.program_id = p.program_id AND b.academic_year_id = ? AND b.status = 'ACTIVE'
     WHERE p.program_id = ? AND p.status = 'ACTIVE' LIMIT 1`,
    [academicYear.academic_year_id, body.programId]);
  if (!program) throw AppError.validation('The selected program is not accepting applications for the current academic year.');
  const category = await queryOne<Row>('SELECT category_id FROM categories WHERE category_id = ?', [body.categoryId]);
  if (!category) throw AppError.validation('Select a valid admission category.');
  const duplicate = await queryOne<Row>(
    `SELECT email FROM users WHERE LOWER(email) = ?
     UNION ALL
     SELECT email FROM admissions WHERE LOWER(email) = ?
     LIMIT 1`,
    [String(body.email).toLowerCase().trim(), String(body.email).toLowerCase().trim()]);
  if (duplicate) throw AppError.conflict('An account or admission application with this email already exists.');
  const result = await repo.insertAdmission({
    academicYearId: Number(academicYear.academic_year_id),
    programId: body.programId,
    categoryId: body.categoryId,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    dateOfBirth: body.dateOfBirth,
    gender: body.gender,
    guardianName: body.guardianName,
    guardianPhone: body.guardianPhone,
    previousSchool: body.previousSchool ?? null,
    qualification: body.qualification ?? 'HSC',
    marks10: body.marks10 ?? 0,
    marks12: body.marks12 ?? 0,
    entranceScore: body.entranceScore ?? null,
    addressLine1: body.addressLine1 ?? null,
    city: body.city ?? null,
    state: body.state ?? null,
    pincode: body.pincode ?? null,
  });
  await audit({
    action: 'CREATE', entity: 'admissions', entityId: result.id,
    description: `New application ${result.applicationNo} from ${body.firstName} ${body.lastName}`,
    newValue: { email: body.email, programId: body.programId },
  });
  return result;
}

/**
 * Approve / reject an application.
 * The heavy lifting is done by `sp_approve_admission`, which creates the user,
 * the student row, the roll number and the first fee bill inside one transaction.
 */
export async function reviewAdmission(id: number, approve: boolean, remarks: string, actor: AuthUser) {
  const before = await repo.findAdmission(id);
  if (!before) throw AppError.notFound('Admission application');
  const { generateTemporaryPassword, hashPassword } = await import('./auth.service');
  const temporaryPassword = approve ? generateTemporaryPassword() : null;
  const passwordHash = temporaryPassword ? await hashPassword(temporaryPassword) : null;
  const { out } = await callProc(
    'sp_approve_admission', [id, actor.userId, approve ? 1 : 0, remarks || null, passwordHash],
    ['p_student_id', 'p_message'],
  );
  return {
    applicationId: id,
    approved: approve,
    studentId: out.p_student_id ?? null,
    message: out.p_message,
    ...(temporaryPassword ? { temporaryPassword } : {}),
  };
}
