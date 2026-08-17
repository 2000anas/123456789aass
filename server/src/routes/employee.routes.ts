import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { employeeSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', employeeController.list);
router.post('/', validate(employeeSchema), employeeController.create);
router.get('/:id', employeeController.getOne);
router.put('/:id', validate(employeeSchema), employeeController.update);
router.patch('/:id/active', employeeController.toggleActive);
router.delete('/:id', employeeController.remove);

export default router;
