import { Router } from 'express';
import {
  getExamAnalytics,
  getTeacherOverview,
  getStudentAnalytics,
  getAdminAnalytics,
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/exam/:examId', requireRole(['admin', 'teacher']), getExamAnalytics);
router.get('/teacher', requireRole(['admin', 'teacher']), getTeacherOverview);
router.get('/student', requireRole(['student', 'admin']), getStudentAnalytics);
router.get('/admin', requireRole(['admin']), getAdminAnalytics);

export default router;
