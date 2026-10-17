import { Router } from 'express';
import { z } from 'zod';
import * as raw from '../controllers/faculty.controller';
import { wrapAll } from '../utils/wrap';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const c = wrapAll(raw);
const router = Router();
const HR = ['ADMIN', 'HR'] as const;
const dateOnly = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Enter a valid calendar date');
const optionalText = (max = 150) => z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().trim().max(max).optional(),
);
const status = z.enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'RETIRED']);
const idParams = validate(z.object({ id: z.coerce.number().int().positive() }), 'params');

const createSchema = z.object({
  employeeCode: z.string().trim().min(1).max(20),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(150).toLowerCase(),
  phone: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().trim().min(6).max(20).optional()),
  dateOfBirth: dateOnly,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  designationId: z.coerce.number().int().positive(),
  departmentId: z.coerce.number().int().positive(),
  joiningDate: dateOnly,
  employmentType: z.enum(['REGULAR', 'CONTRACT', 'VISITING', 'ADJUNCT']).optional(),
  qualification: optionalText(),
  specialization: optionalText(),
  experienceYears: z.coerce.number().int().min(0).max(80).optional(),
  basicSalary: z.coerce.number().min(0).optional(),
  hra: z.coerce.number().min(0).optional(),
  da: z.coerce.number().min(0).optional(),
  ta: z.coerce.number().min(0).optional(),
  specialAllowance: z.coerce.number().min(0).optional(),
  pfPercent: z.coerce.number().min(0).max(25).optional(),
  bankAccount: optionalText(30),
  password: z.string().min(10).max(72).optional(),
});

const patchSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(150).toLowerCase().optional(),
  phone: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().trim().min(6).max(20).optional()),
  designationId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  employmentType: z.enum(['REGULAR', 'CONTRACT', 'VISITING', 'ADJUNCT']).optional(),
  qualification: optionalText(),
  specialization: optionalText(),
  experienceYears: z.coerce.number().int().min(0).max(80).optional(),
  basicSalary: z.coerce.number().min(0).optional(),
  hra: z.coerce.number().min(0).optional(),
  da: z.coerce.number().min(0).optional(),
  ta: z.coerce.number().min(0).optional(),
  specialAllowance: z.coerce.number().min(0).optional(),
  pfPercent: z.coerce.number().min(0).max(25).optional(),
  bankAccount: optionalText(30),
  status: status.optional(),
}).refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update');

router.get('/', authenticate, requireRole(...HR, 'FACULTY'), c.list);
router.get('/stats', authenticate, requireRole(...HR), c.stats);
router.get('/options', authenticate, requireRole(...HR), c.options);
router.get('/me', authenticate, requireRole('FACULTY'), c.me);
router.get('/workload', authenticate, requireRole(...HR), c.workload);
router.get('/me/subjects', authenticate, requireRole('FACULTY'), c.teachingLoad);
router.get('/me/leave-balances', authenticate, requireRole('FACULTY'), c.balances);

/* ------------------------------------------------------------------- leaves */
router.get('/leaves', authenticate, requireRole(...HR, 'FACULTY'), c.leaves);
router.get('/leaves/types', authenticate, requireRole(...HR, 'FACULTY'), c.leaveTypes);
router.get('/leaves/:id', authenticate, requireRole(...HR, 'FACULTY'), c.leave);
router.post('/leaves', authenticate, requireRole('FACULTY', 'ADMIN'), validate(z.object({
  facultyId: z.number().int().positive().optional(),
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID', 'ON_DUTY']),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  days: z.number().int().positive(),
  reason: z.string().min(5),
})), c.applyLeave);
router.post('/leaves/:id/review', authenticate, requireRole(...HR), validate(z.object({
  approve: z.boolean(),
  remarks: z.string().optional(),
})), c.reviewLeave);

/* ------------------------------------------------------------------ payroll */
router.get('/payroll', authenticate, requireRole(...HR, 'FACULTY'), c.payrolls);
router.get('/payroll/summary', authenticate, requireRole(...HR), c.payrollSummary);
router.get('/payroll/months', authenticate, requireRole(...HR), c.payrollMonths);
router.get('/payroll/:id', authenticate, requireRole(...HR, 'FACULTY'), c.payslip);
router.post('/payroll/generate', authenticate, requireRole(...HR), validate(z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
})), c.generatePayroll);
router.patch('/payroll/:id/status', authenticate, requireRole(...HR), validate(z.object({
  status: z.enum(['DRAFT', 'GENERATED', 'APPROVED', 'PAID']),
})), c.setPayrollStatus);

/* -------------------------------------------- faculty master management */
router.post('/', authenticate, requireRole(...HR), validate(createSchema), c.create);
router.get('/:id', authenticate, requireRole(...HR), idParams, c.detail);
router.put('/:id', authenticate, requireRole(...HR), idParams, validate(patchSchema), c.update);
router.patch('/:id/account-status', authenticate, requireRole(...HR), idParams, validate(z.object({ active: z.boolean() })), c.setAccountStatus);
router.get('/:id/subjects', authenticate, requireRole(...HR, 'FACULTY'), c.teachingLoad);
router.get('/:id/leave-balances', authenticate, requireRole(...HR), c.balances);

export default router;
