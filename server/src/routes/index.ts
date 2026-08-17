import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { settingsSchema } from '../validators/schemas.js';

const router = Router();

router.get('/dashboard', authenticate, authorize('admin'), reportController.dashboard);
router.get(
  '/salaries/:employeeId/:year/:month',
  authenticate,
  authorize('admin'),
  reportController.salaryReport
);
router.get('/reports/financial', authenticate, authorize('admin'), reportController.financialReport);
router.get('/reports/expenses', authenticate, authorize('admin'), reportController.expenseReport);
router.get(
  '/reports/transactions',
  authenticate,
  authorize('admin'),
  reportController.transactionReport
);
router.get('/settings', authenticate, authorize('admin'), reportController.getSettings);
router.put(
  '/settings',
  authenticate,
  authorize('admin'),
  validate(settingsSchema),
  reportController.updateSettings
);

export default router;
