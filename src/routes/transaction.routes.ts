import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { categorySchema, categoryUpdateSchema, transactionSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/balances', transactionController.balances);
router.get('/', transactionController.list);
router.post('/', validate(transactionSchema), transactionController.create);
router.put('/:id', validate(transactionSchema), transactionController.update);
router.delete('/:id', transactionController.remove);

router.get('/meta/categories', transactionController.listCategories);
router.post('/meta/categories', validate(categorySchema), transactionController.createCategory);
router.put('/meta/categories/:id', validate(categoryUpdateSchema), transactionController.updateCategory);
router.delete('/meta/categories/:id', transactionController.removeCategory);

export default router;
