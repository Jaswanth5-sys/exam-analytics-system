import { Router } from 'express';
import {
  startAttempt,
  getActiveAttempt,
  saveAnswers,
  submitAttempt,
  getAttemptResult,
  getStudentHistory,
} from '../controllers/attempt.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/start', startAttempt);
router.get('/active/:examId', getActiveAttempt);
router.post('/:id/save', saveAnswers);
router.post('/:id/submit', submitAttempt);
router.get('/:id/result', getAttemptResult);
router.get('/my-history', getStudentHistory);

export default router;
