import { callProc, Row, queryOne, transaction } from '../config/database';
import { AppError, parsePaging } from '../utils/api';
import { facultyRepo, leavesRepo, payrollRepo } from '../repositories/faculty.repository';
import { notificationsRepo } from '../repositories/notification.repository';
import { generateTemporaryPassword, hashPassword } from './auth.service';
import { createUser } from '../repositories/auth.repository';
import { audit } from '../utils/audit';
import { AuthUser } from '../middleware/auth';

export const faculty = {
  list: (q: Record<string, any>) => facultyRepo.list(q, parsePaging(q)),
  byId: async (id: number) => {
    const f = await facultyRepo.byId(id);
    if (!f) throw AppError.notFound('Faculty member');
    return f;
  },
  byUserId: facultyRepo.byUserId,
  workload: facultyRepo.workload,
  teachingLoad: facultyRepo.teachingLoad,
  stats: facultyRepo.stats,

  options: facultyRepo.options,

  /** Creates the Faculty login and master record atomically. */
  async create(b: Record<string, any>, actor: AuthUser) {
    const department = await queryOne<Row>(
      `SELECT department_id FROM departments WHERE department_id = ? AND status = 'ACTIVE'`, [b.departmentId]);
    if (!department) throw AppError.validation('Select an active department.');
    const designation = await queryOne<Row>(
      'SELECT designation_id FROM designations WHERE designation_id = ?', [b.designationId]);
    if (!designation) throw AppError.validation('Select a valid designation.');

    const temporaryPassword = b.password ? null : generateTemporaryPassword();
    const hash = await hashPassword(b.password ?? temporaryPassword!);
    const { userId, facultyId } = await transaction(async (connection) => {
      const createdUserId = await createUser('FACULTY', b.email, hash, b.phone ?? null, connection);
      const createdFacultyId = await facultyRepo.create(b, createdUserId, connection);
      return { userId: createdUserId, facultyId: createdFacultyId };
    });

    await audit({
      userId: actor.userId, action: 'CREATE', entity: 'faculty', entityId: facultyId,
      description: `Faculty ${b.employeeCode} created`, newValue: { ...b, password: undefined },
    });
    await notificationsRepo.create({
      userId, title: 'Welcome to the ERP',
      message: `Your faculty account is ready. Your employee code is ${b.employeeCode}.`,
      type: 'GENERAL', severity: 'SUCCESS', entity: 'faculty', entityId: facultyId, link: '/profile',
    }).catch(() => undefined);
    return {
      facultyId,
      userId,
      ...(temporaryPassword ? { temporaryPassword } : {}),
    };
  },

  async update(id: number, b: Record<string, any>, actor: AuthUser) {
    const before = await facultyRepo.byId(id);
    if (!before) throw AppError.notFound('Faculty member');
    if (b.departmentId !== undefined) {
      const department = await queryOne<Row>(
        `SELECT department_id FROM departments WHERE department_id = ? AND status = 'ACTIVE'`, [b.departmentId]);
      if (!department) throw AppError.validation('Select an active department.');
    }
    if (b.designationId !== undefined) {
      const designation = await queryOne<Row>(
        'SELECT designation_id FROM designations WHERE designation_id = ?', [b.designationId]);
      if (!designation) throw AppError.validation('Select a valid designation.');
    }
    await facultyRepo.update(id, b);
    if (['SUSPENDED', 'RESIGNED', 'RETIRED'].includes(String(b.status))) {
      await facultyRepo.setAccountActive(id, false);
    }
    await audit({
      userId: actor.userId, action: 'UPDATE', entity: 'faculty', entityId: id,
      description: `Faculty ${before.employee_code} updated`, oldValue: before, newValue: b,
    });
    return { facultyId: id };
  },

  async setAccountStatus(id: number, active: boolean, actor: AuthUser) {
    const before = await facultyRepo.byId(id);
    if (!before) throw AppError.notFound('Faculty member');
    if (active && ['SUSPENDED', 'RESIGNED', 'RETIRED'].includes(String(before.status))) {
      throw AppError.validation('Set the faculty status to Active or On leave before reactivating the login.');
    }
    await facultyRepo.setAccountActive(id, active);
    await audit({
      userId: actor.userId, action: 'UPDATE', entity: 'users', entityId: Number(before.user_id),
      description: `Faculty account ${before.email} ${active ? 'activated' : 'deactivated'}`,
      oldValue: { isActive: before.loginActive }, newValue: { isActive: active },
    });
    return { facultyId: id, active };
  },
};

export const leaves = {
  list: (q: Record<string, any>) => leavesRepo.list(q, parsePaging(q)),
  byId: async (id: number) => {
    const l = await leavesRepo.byId(id);
    if (!l) throw AppError.notFound('Leave application');
    return l;
  },
  balances: leavesRepo.balances,
  types: leavesRepo.types,

  async apply(facultyId: number, b: Record<string, any>, actor: AuthUser) {
    if (Number(b.days) <= 0) throw AppError.validation('Leave duration must be at least one day');
    const id = await leavesRepo.create(facultyId, b);
    await audit({
      userId: actor.userId, action: 'CREATE', entity: 'faculty_leaves', entityId: id,
      description: `${b.leaveType} leave applied for ${b.days} day(s)`, newValue: b,
    });
    return { leaveId: id };
  },

  /**
   * Approve / reject. `sp_approve_leave` consumes the leave balance (only on
   * approval) and notifies the applicant.
   */
  async review(leaveId: number, approve: boolean, remarks: string, actor: AuthUser) {
    const before = await leavesRepo.byId(leaveId);
    if (!before) throw AppError.notFound('Leave application');
    const { out } = await callProc(
      'sp_approve_leave', [leaveId, approve ? 1 : 0, actor.userId, remarks ?? null], ['p_message'],
    );
    await audit({
      userId: actor.userId,
      action: approve ? 'LEAVE_ACTION' : 'REJECT',
      entity: 'faculty_leaves', entityId: leaveId,
      description: `Leave ${leaveId} ${approve ? 'approved' : 'rejected'}: ${out.p_message}`,
      oldValue: { status: before.status }, newValue: { status: approve ? 'APPROVED' : 'REJECTED', remarks },
    });
    const row = await (await import('../config/database')).queryOne<Row>(
      'SELECT user_id AS userId FROM faculty WHERE faculty_id = ?', [before.faculty_id]);
    if (row?.userId) {
      await notificationsRepo.create({
        userId: Number(row.userId),
        title: `Leave ${approve ? 'approved' : 'rejected'}`,
        message: `Your ${before.leave_type} leave (${before.days} days) was ${approve ? 'approved' : 'rejected'}. ${remarks ?? ''}`.trim(),
        type: 'LEAVE_APPROVAL', severity: approve ? 'SUCCESS' : 'WARNING',
        entity: 'faculty_leaves', entityId: leaveId, link: '/leaves',
      });
    }
    return { leaveId, approved: approve, message: out.p_message };
  },
};

export const payroll = {
  list: (q: Record<string, any>) => payrollRepo.list(q, parsePaging(q)),
  byId: async (id: number) => {
    const p = await payrollRepo.byId(id);
    if (!p) throw AppError.notFound('Payslip');
    return p;
  },
  components: payrollRepo.components,
  summary: payrollRepo.summary,
  months: payrollRepo.months,

  /**
   * Generate every payslip for a month. `sp_generate_monthly_payroll` computes
   * gross, PF, professional tax, income tax, LOP and net salary per faculty.
   */
  async generate(month: number, year: number, actor: AuthUser) {
    if (month < 1 || month > 12) throw AppError.validation('Month must be between 1 and 12');
    const { out } = await callProc(
      'sp_generate_monthly_payroll', [month, year, actor.userId],
      ['p_generated', 'p_total_net', 'p_message'],
    );
    await audit({
      userId: actor.userId, action: 'PAYROLL_RUN', entity: 'payrolls',
      description: `Payroll ${month}/${year}: ${out.p_message}`,
      newValue: { month, year, generated: out.p_generated, totalNet: out.p_total_net },
    });
    return {
      generated: Number(out.p_generated ?? 0),
      totalNet: Number(out.p_total_net ?? 0),
      message: out.p_message,
    };
  },

  async setStatus(id: number, status: 'DRAFT' | 'GENERATED' | 'APPROVED' | 'PAID', actor: AuthUser) {
    await payrollRepo.updateStatus(id, status);
    await audit({
      userId: actor.userId, action: 'UPDATE', entity: 'payrolls', entityId: id,
      description: `Payslip ${id} marked ${status}`, newValue: { status },
    });
    return { payrollId: id, status };
  },

  /** Full printable payslip: header + earnings/deduction lines. */
  async slip(id: number) {
    const [p, components] = await Promise.all([payrollRepo.byId(id), payrollRepo.components(id)]);
    if (!p) throw AppError.notFound('Payslip');
    return {
      payslip: p,
      earnings: components.filter((c: Row) => c.component_type === 'EARNING'),
      deductions: components.filter((c: Row) => c.component_type === 'DEDUCTION'),
      institute: 'Integrated University ERP',
    };
  },
};
