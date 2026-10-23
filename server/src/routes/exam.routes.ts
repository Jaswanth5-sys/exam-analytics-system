import { Router } from 'express';
import { getExams, getExamById, createExam, updateExam, deleteExam } from '../controllers/exam.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getExams);
router.get('/:id', getExamById);
router.post('/', requireRole(['admin', 'teacher']), createExam);
router.put('/:id', requireRole(['admin', 'teacher']), updateExam);
router.delete('/:id', requireRole(['admin', 'teacher']), deleteExam);

export default router;
