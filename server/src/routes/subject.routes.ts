import { Router } from 'express';
import { getSubjects, createSubject, deleteSubject } from '../controllers/subject.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getSubjects);
router.post('/', requireRole(['admin', 'teacher']), createSubject);
router.delete('/:id', requireRole(['admin']), deleteSubject);

export default router;
