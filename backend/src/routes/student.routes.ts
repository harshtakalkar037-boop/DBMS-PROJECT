import { Router } from 'express';
import { z } from 'zod';
import * as raw from '../controllers/student.controller';
import { wrapAll } from '../utils/wrap';
import { authenticate, requireRole, requireSelfOrRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const c = wrapAll(raw);
const router = Router();

const dateOnly = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Enter a valid calendar date');
const optionalText = (max = 160) => z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().trim().max(max).optional(),
);
const studentStatus = z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED', 'ALUMNI']);
const studentParams = validate(z.object({ id: z.coerce.number().int().positive() }), 'params');

const admissionApplySchema = z.object({
  programId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(150).toLowerCase(),
  phone: z.string().trim().min(6).max(20),
  dateOfBirth: dateOnly,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  guardianName: z.string().trim().min(1).max(120),
  guardianPhone: z.string().trim().min(6).max(20),
  previousSchool: optionalText(160),
  qualification: optionalText(80),
  marks10: z.coerce.number().min(0).max(100),
  marks12: z.coerce.number().min(35, '12th marks must be at least 35%').max(100),
  entranceScore: z.coerce.number().min(0).max(200).optional(),
  addressLine1: optionalText(160),
  city: optionalText(80),
  state: optionalText(80),
  pincode: optionalText(10),
});

const studentCreateSchema = z.object({
  programId: z.coerce.number().int().positive(),
  departmentId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  batchId: z.preprocess((value) => value === null || value === '' ? undefined : value,
    z.coerce.number().int().positive().optional()),
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  middleName: optionalText(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('Enter a valid email address').max(150).toLowerCase(),
  phone: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().trim().min(6).max(20).optional()),
  dateOfBirth: dateOnly,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  admissionYear: z.coerce.number().int().min(1990).max(2100),
  admissionDate: dateOnly.optional(),
  currentSemesterNo: z.coerce.number().int().min(1).max(12).optional(),
  emergencyContact: optionalText(20),
  rollNumber: optionalText(20),
  registrationNumber: optionalText(30),
  status: studentStatus.optional(),
  password: z.string().min(10).max(72).optional(),
  address: z.object({
    addressType: z.enum(['PERMANENT', 'CORRESPONDENCE', 'HOSTEL']).optional(),
    line1: z.string().trim().min(1).max(160),
    city: z.string().trim().min(1).max(80),
    state: z.string().trim().min(1).max(80),
    pincode: z.string().trim().min(4).max(10),
    line2: optionalText(160),
    country: optionalText(60),
  }).optional(),
  guardian: z.object({
    name: z.string().trim().min(1).max(120),
    relation: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'SPOUSE', 'SIBLING']).optional(),
    phone: z.string().trim().min(6).max(20),
    email: z.string().trim().email().max(150).optional(),
    occupation: optionalText(80),
    annualIncome: z.coerce.number().min(0).optional(),
  }).optional(),
});

const studentPatchSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  middleName: optionalText(80),
  lastName: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(150).toLowerCase().optional(),
  phone: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().trim().min(6).max(20).nullable().optional()),
  dateOfBirth: dateOnly.optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  programId: z.coerce.number().int().positive().optional(),
  batchId: z.coerce.number().int().positive().optional(),
  admissionYear: z.coerce.number().int().min(1990).max(2100).optional(),
  admissionDate: dateOnly.nullable().optional(),
  currentSemesterNo: z.coerce.number().int().min(1).max(12).optional(),
  rollNumber: z.string().trim().min(1).max(20).optional(),
  registrationNumber: z.string().trim().min(1).max(30).optional(),
  status: studentStatus.optional(),
  emergencyContact: optionalText(20),
}).refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update');

/* -------------------------------------------------------------- students */

router.get('/', authenticate, requireRole('ADMIN', 'FACULTY', 'EXAM_CELL', 'ACCOUNTANT', 'HOSTEL_ADMIN', 'HR'), c.list);
router.get('/stats', authenticate, requireRole('ADMIN', 'FACULTY', 'EXAM_CELL'), c.stats);
router.get('/my/documents', authenticate, requireRole('STUDENT'), c.documents);
router.get('/my/addresses', authenticate, requireRole('STUDENT'), c.addresses);

/* --------------------------------------------------------------- admissions */

// The public form gets only active programs with a current-year batch and categories.
router.get('/admissions/options', c.admissionOptions);
router.post('/admissions/apply', validate(admissionApplySchema), c.apply);
router.get('/admissions/stats', authenticate, requireRole('ADMIN'), c.admissionStats);
router.get('/admissions', authenticate, requireRole('ADMIN'), c.admissions);
router.get('/admissions/:id', authenticate, requireRole('ADMIN'), studentParams, c.admission);
router.post('/admissions/:id/review', authenticate, requireRole('ADMIN'), studentParams, validate(z.object({
  approve: z.boolean(),
  remarks: z.string().trim().max(500).optional(),
})), c.reviewAdmission);

/* ------------------------------------------------------- student management */

router.get('/:id', authenticate, studentParams, requireSelfOrRole('ADMIN', (r) => Number(r.params.id)), c.detail);
router.post('/', authenticate, requireRole('ADMIN'), validate(studentCreateSchema), c.create);
router.put('/:id', authenticate, requireRole('ADMIN'), studentParams, validate(studentPatchSchema), c.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), studentParams, c.remove);
router.patch('/:id/status', authenticate, requireRole('ADMIN'), studentParams, validate(z.object({
  status: studentStatus,
  reason: z.string().trim().min(1, 'Give a reason for the status change').max(500),
})), c.changeStatus);
router.patch('/:id/account-status', authenticate, requireRole('ADMIN'), studentParams, validate(z.object({
  active: z.boolean(),
})), c.setAccountStatus);

router.get('/:id/addresses', authenticate, studentParams, requireSelfOrRole('ADMIN', (r) => Number(r.params.id)), c.addresses);
router.put('/:id/addresses', authenticate, requireRole('ADMIN'), studentParams, c.saveAddress);
router.get('/:id/guardians', authenticate, studentParams, requireSelfOrRole('ADMIN', (r) => Number(r.params.id)), c.guardians);
router.put('/:id/guardians', authenticate, requireRole('ADMIN'), studentParams, c.saveGuardian);
router.get('/:id/documents', authenticate, studentParams, requireSelfOrRole('ADMIN', (r) => Number(r.params.id)), c.documents);
router.post('/:id/documents', authenticate, requireRole('ADMIN'), studentParams, c.addDocument);

export default router;
