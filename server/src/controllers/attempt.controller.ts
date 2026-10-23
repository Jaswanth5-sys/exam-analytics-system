import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, execute, queryOne } from '../db/connection.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Exam, ExamAttempt } from '../types/index.js';

function parseDbDate(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val === 'string') {
    // If format is YYYY-MM-DD HH:MM:SS..., replace space with T
    const normalized = val.includes('T') ? val : val.replace(' ', 'T');
    return new Date(normalized);
  }
  return new Date(val);
}

export async function startAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { exam_id } = req.body;
  const student_id = req.user!.id;

  if (!exam_id) {
    res.status(400).json({ error: 'Exam ID is required.' });
    return;
  }

  try {
    const exam = await queryOne<Exam>('SELECT * FROM exams WHERE id = ?;', [exam_id]);
    if (!exam) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }

    if (!exam.is_published) {
      res.status(400).json({ error: 'This exam is not currently published.' });
      return;
    }

    // Check if student already has an active or submitted attempt
    const existing = await queryOne<ExamAttempt>(`
      SELECT id, status, start_time, end_time, total_score, percentage, passed
      FROM exam_attempts
      WHERE exam_id = ? AND student_id = ?
      ORDER BY start_time DESC
      LIMIT 1;
    `, [exam_id, student_id]);

    const now = new Date();

    if (existing) {
      if (existing.status === 'submitted') {
        res.status(400).json({
          error: 'You have already completed this exam.',
          attemptId: existing.id,
          alreadySubmitted: true,
        });
        return;
      }

      // If existing attempt is in progress, check if time has expired
      const endTime = parseDbDate(existing.end_time);
      const remainingSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

      if (remainingSeconds <= 0) {
        // Mark as time_expired
        await execute(`UPDATE exam_attempts SET status = 'time_expired' WHERE id = ?;`, [existing.id]);
        res.status(400).json({
          error: 'Exam time has expired for your previous attempt.',
          attemptId: existing.id,
          expired: true,
        });
        return;
      }

      // Return active attempt with questions (answers masked)
      const examData = await getExamForAttempt(exam_id, existing.id);
      res.json({
        attempt: {
          ...existing,
          remaining_seconds: remainingSeconds,
        },
        exam: examData,
      });
      return;
    }

    // Create new attempt
    const attemptId = uuidv4();
    const durationMinutes = exam.duration_minutes || 15;
    const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

    await execute(
      `INSERT INTO exam_attempts (id, exam_id, student_id, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, 'in_progress');`,
      [attemptId, exam_id, student_id, now, endTime]
    );

    const remainingSeconds = durationMinutes * 60;
    const examData = await getExamForAttempt(exam_id, attemptId);

    res.status(201).json({
      attempt: {
        id: attemptId,
        exam_id,
        student_id,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        status: 'in_progress',
        remaining_seconds: remainingSeconds,
      },
      exam: examData,
    });
  } catch (err: any) {
    console.error('[startAttempt Error]:', err);
    res.status(500).json({ error: 'Failed to start examination attempt.' });
  }
}

export async function getActiveAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { examId } = req.params;
  const student_id = req.user!.id;

  try {
    const attempt = await queryOne<ExamAttempt>(`
      SELECT id, exam_id, student_id, start_time, end_time, status
      FROM exam_attempts
      WHERE exam_id = ? AND student_id = ? AND status = 'in_progress'
      ORDER BY start_time DESC
      LIMIT 1;
    `, [examId, student_id]);

    if (!attempt) {
      res.status(404).json({ error: 'No active attempt found for this exam.' });
      return;
    }

    const now = new Date();
    const endTime = parseDbDate(attempt.end_time);
    const remainingSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

    if (remainingSeconds <= 0) {
      await execute(`UPDATE exam_attempts SET status = 'time_expired' WHERE id = ?;`, [attempt.id]);
      res.status(400).json({ error: 'Exam time has expired.', expired: true });
      return;
    }

    const examData = await getExamForAttempt(examId, attempt.id);

    // Get any previously saved answers
    const savedAnswers = await query<{ question_id: string; selected_option_id: string }>(`
      SELECT question_id, selected_option_id FROM student_answers WHERE attempt_id = ?;
    `, [attempt.id]);

    res.json({
      attempt: {
        ...attempt,
        remaining_seconds: remainingSeconds,
      },
      exam: examData,
      savedAnswers,
    });
  } catch (err: any) {
    console.error('[getActiveAttempt Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve active attempt.' });
  }
}

export async function saveAnswers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { answers } = req.body; // Array of { question_id, selected_option_id }
  const student_id = req.user!.id;

  try {
    const attempt = await queryOne<ExamAttempt>(`
      SELECT id, status, end_time FROM exam_attempts WHERE id = ? AND student_id = ?;
    `, [id, student_id]);

    if (!attempt || attempt.status !== 'in_progress') {
      res.status(400).json({ error: 'Cannot save answers on this attempt.' });
      return;
    }

    if (answers && Array.isArray(answers)) {
      for (const ans of answers) {
        if (!ans.question_id) continue;

        const existing = await queryOne(`
          SELECT id FROM student_answers WHERE attempt_id = ? AND question_id = ?;
        `, [id, ans.question_id]);

        if (existing) {
          await execute(`
            UPDATE student_answers
            SET selected_option_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE attempt_id = ? AND question_id = ?;
          `, [ans.selected_option_id || null, id, ans.question_id]);
        } else {
          await execute(`
            INSERT INTO student_answers (id, attempt_id, question_id, selected_option_id)
            VALUES (?, ?, ?, ?);
          `, [uuidv4(), id, ans.question_id, ans.selected_option_id || null]);
        }
      }
    }

    res.json({ message: 'Answers autosaved successfully.', savedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('[saveAnswers Error]:', err);
    res.status(500).json({ error: 'Failed to save answers.' });
  }
}

export async function submitAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { answers } = req.body; // Array of { question_id, selected_option_id }
  const student_id = req.user!.id;

  try {
    const attempt = await queryOne<ExamAttempt & { total_marks: number; passing_marks: number }>(`
      SELECT a.*, e.total_marks, e.passing_marks, e.show_immediate_results
      FROM exam_attempts a
      JOIN exams e ON a.exam_id = e.id
      WHERE a.id = ? AND a.student_id = ?;
    `, [id, student_id]);

    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found.' });
      return;
    }

    if (attempt.status === 'submitted') {
      res.status(400).json({ error: 'This exam has already been submitted.' });
      return;
    }

    const now = new Date();
    const endTime = parseDbDate(attempt.end_time);
    // Allow 30 seconds network buffer
    const gracePeriodMs = 30 * 1000;
    const isExpired = now.getTime() > (endTime.getTime() + gracePeriodMs);

    // Save final answers submitted
    if (answers && Array.isArray(answers)) {
      for (const ans of answers) {
        if (!ans.question_id) continue;
        const existing = await queryOne(`
          SELECT id FROM student_answers WHERE attempt_id = ? AND question_id = ?;
        `, [id, ans.question_id]);

        if (existing) {
          await execute(`
            UPDATE student_answers
            SET selected_option_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE attempt_id = ? AND question_id = ?;
          `, [ans.selected_option_id || null, id, ans.question_id]);
        } else {
          await execute(`
            INSERT INTO student_answers (id, attempt_id, question_id, selected_option_id)
            VALUES (?, ?, ?, ?);
          `, [uuidv4(), id, ans.question_id, ans.selected_option_id || null]);
        }
      }
    }

    // SERVER-SIDE EVALUATION & SCORING
    // 1. Fetch exam questions and their correct options
    const examQuestions = await query<{ question_id: string; marks: number }>(`
      SELECT question_id, marks FROM exam_questions WHERE exam_id = ?;
    `, [attempt.exam_id]);

    const qIds = examQuestions.map(q => q.question_id);
    const placeholders = qIds.map(() => '?').join(',');

    const correctOptions = await query<{ question_id: string; id: string }>(`
      SELECT question_id, id FROM question_options WHERE question_id IN (${placeholders}) AND is_correct = TRUE;
    `, qIds);

    const correctOptionMap = new Map<string, string>();
    correctOptions.forEach(co => {
      correctOptionMap.set(co.question_id, co.id);
    });

    // 2. Fetch recorded student answers
    const studentAnsList = await query<{ id: string; question_id: string; selected_option_id: string }>(`
      SELECT id, question_id, selected_option_id FROM student_answers WHERE attempt_id = ?;
    `, [id]);

    let totalScore = 0;

    for (const eq of examQuestions) {
      const sAns = studentAnsList.find(sa => sa.question_id === eq.question_id);
      const correctOptId = correctOptionMap.get(eq.question_id);
      const isCorrect = sAns ? (sAns.selected_option_id === correctOptId) : false;
      const marksAwarded = isCorrect ? (eq.marks || 1.0) : 0.0;
      totalScore += marksAwarded;

      if (sAns) {
        await execute(`
          UPDATE student_answers
          SET is_correct = ?, marks_awarded = ?
          WHERE id = ?;
        `, [isCorrect, marksAwarded, sAns.id]);
      } else {
        await execute(`
          INSERT INTO student_answers (id, attempt_id, question_id, selected_option_id, is_correct, marks_awarded)
          VALUES (?, ?, ?, NULL, FALSE, 0.0);
        `, [uuidv4(), id, eq.question_id]);
      }
    }

    const percentage = attempt.total_marks > 0 ? Math.round((totalScore / attempt.total_marks) * 100) : 0;
    const passed = totalScore >= attempt.passing_marks;
    const finalStatus = isExpired ? 'time_expired' : 'submitted';

    await execute(`
      UPDATE exam_attempts
      SET submitted_at = CURRENT_TIMESTAMP,
          total_score = ?,
          percentage = ?,
          passed = ?,
          status = ?
      WHERE id = ?;
    `, [totalScore, percentage, passed, finalStatus, id]);

    res.json({
      message: isExpired ? 'Exam time expired. Answers submitted and graded.' : 'Exam submitted and graded successfully!',
      result: {
        attemptId: id,
        totalScore,
        totalMarks: attempt.total_marks,
        percentage,
        passed,
        status: finalStatus,
        submittedAt: now.toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[submitAttempt Error]:', err);
    res.status(500).json({ error: 'Failed to evaluate and submit attempt.' });
  }
}

export async function getAttemptResult(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  try {
    const attempt = await queryOne<any>(`
      SELECT a.*, e.title as exam_title, e.description as exam_description,
             e.total_marks, e.passing_marks, e.duration_minutes, e.show_immediate_results,
             s.name as subject_name, s.code as subject_code,
             u.name as student_name, u.email as student_email
      FROM exam_attempts a
      JOIN exams e ON a.exam_id = e.id
      JOIN subjects s ON e.subject_id = s.id
      JOIN app_users u ON a.student_id = u.id
      WHERE a.id = ?;
    `, [id]);

    if (!attempt) {
      res.status(404).json({ error: 'Attempt result not found.' });
      return;
    }

    // Permission check: student can only view own result; teacher or admin can view any
    if (user.role === 'student' && attempt.student_id !== user.id) {
      res.status(403).json({ error: 'You are not authorized to view this result.' });
      return;
    }

    // Question-by-question breakdown
    const breakdown = await query(`
      SELECT q.id as question_id, q.question_text, q.marks, q.difficulty, q.explanation,
             sa.selected_option_id, sa.is_correct, sa.marks_awarded
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      LEFT JOIN student_answers sa ON q.id = sa.question_id AND sa.attempt_id = ?
      WHERE eq.exam_id = ?
      ORDER BY eq.question_order ASC;
    `, [id, attempt.exam_id]);

    // Attach all options with correctness metadata for post-exam review
    const qIds = breakdown.map(b => b.question_id);
    if (qIds.length > 0) {
      const placeholders = qIds.map(() => '?').join(',');
      const options = await query(`
        SELECT id, question_id, option_text, is_correct, sort_order
        FROM question_options
        WHERE question_id IN (${placeholders})
        ORDER BY sort_order ASC;
      `, qIds);

      const optionsMap = new Map<string, any[]>();
      options.forEach(o => {
        if (!optionsMap.has(o.question_id)) optionsMap.set(o.question_id, []);
        optionsMap.get(o.question_id)!.push(o);
      });

      breakdown.forEach(b => {
        b.options = optionsMap.get(b.question_id) || [];
      });
    }

    res.json({
      attempt,
      breakdown,
    });
  } catch (err: any) {
    console.error('[getAttemptResult Error]:', err);
    res.status(500).json({ error: 'Failed to fetch attempt result.' });
  }
}

export async function getStudentHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const student_id = req.user!.id;

  try {
    const history = await query(`
      SELECT a.id, a.exam_id, a.start_time, a.submitted_at, a.total_score,
             a.percentage, a.passed, a.status,
             e.title as exam_title, e.total_marks, e.passing_marks,
             s.name as subject_name, s.code as subject_code
      FROM exam_attempts a
      JOIN exams e ON a.exam_id = e.id
      JOIN subjects s ON e.subject_id = s.id
      WHERE a.student_id = ? AND a.status IN ('submitted', 'time_expired')
      ORDER BY a.submitted_at DESC;
    `, [student_id]);

    // Compute progress metrics
    const totalTaken = history.length;
    const passedCount = history.filter(h => h.passed).length;
    const avgScore = totalTaken > 0 ? Math.round(history.reduce((sum, h) => sum + (h.percentage || 0), 0) / totalTaken) : 0;
    const passRate = totalTaken > 0 ? Math.round((passedCount / totalTaken) * 100) : 0;

    res.json({
      history,
      metrics: {
        totalTaken,
        passedCount,
        avgScore,
        passRate,
      },
    });
  } catch (err: any) {
    console.error('[getStudentHistory Error]:', err);
    res.status(500).json({ error: 'Failed to fetch student attempt history.' });
  }
}

/**
 * Helper to fetch questions and options for an exam while STRICTLY MASKING answers and explanations
 */
async function getExamForAttempt(examId: string, attemptId: string) {
  const exam = await queryOne<any>(`
    SELECT e.id, e.title, e.description, e.duration_minutes, e.total_marks, e.passing_marks,
           s.name as subject_name, s.code as subject_code
    FROM exams e
    JOIN subjects s ON e.subject_id = s.id
    WHERE e.id = ?;
  `, [examId]);

  // Questions without explanation
  const questions = await query<any>(`
    SELECT q.id, q.question_text, eq.marks, q.difficulty, eq.question_order
    FROM exam_questions eq
    JOIN questions q ON eq.question_id = q.id
    WHERE eq.exam_id = ?
    ORDER BY eq.question_order ASC;
  `, [examId]);

  const qIds = questions.map(q => q.id);
  if (qIds.length > 0) {
    const placeholders = qIds.map(() => '?').join(',');
    // Options strictly WITHOUT is_correct
    const options = await query<any>(`
      SELECT id, question_id, option_text, sort_order
      FROM question_options
      WHERE question_id IN (${placeholders})
      ORDER BY sort_order ASC;
    `, qIds);

    const optionsByQ = new Map<string, any[]>();
    options.forEach(o => {
      if (!optionsByQ.has(o.question_id)) optionsByQ.set(o.question_id, []);
      optionsByQ.get(o.question_id)!.push(o);
    });

    questions.forEach(q => {
      q.options = optionsByQ.get(q.id) || [];
    });
  }

  return {
    ...exam,
    questions,
  };
}
