import { Router } from 'express';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../controllers/question.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin', 'teacher']));

router.get('/', getQuestions);
router.post('/', createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;
