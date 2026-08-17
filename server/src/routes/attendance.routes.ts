import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { attendanceUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.post('/check-in', authenticate, authorize('employee'), attendanceController.checkIn);
router.post('/check-out', authenticate, authorize('employee'), attendanceController.checkOut);
router.get('/today/me', authenticate, authorize('employee'), attendanceController.todayMine);
router.get('/history/me', authenticate, authorize('employee'), attendanceController.myHistory);

router.get('/', authenticate, authorize('admin'), attendanceController.list);
router.get('/today', authenticate, authorize('admin'), attendanceController.todayOverview);
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(attendanceUpdateSchema),
  attendanceController.update
);

export default router;
