import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, execute, queryOne } from '../db/connection.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Exam, Question } from '../types/index.js';

export async function getExams(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;

  try {
    if (user.role === 'student') {
      // Students see only published exams, along with their personal attempt state
      const exams = await query(`
        SELECT e.id, e.title, e.description, e.subject_id, e.teacher_id,
               e.duration_minutes, e.total_marks, e.passing_marks,
               e.shuffle_questions, e.show_immediate_results, e.is_published, e.created_at,
               s.name as subject_name, s.code as subject_code,
               u.name as teacher_name,
               COUNT(DISTINCT eq.question_id) as question_count,
               (
                 SELECT a.status 
                 FROM exam_attempts a 
                 WHERE a.exam_id = e.id AND a.student_id = ? 
                 ORDER BY a.start_time DESC 
                 LIMIT 1
               ) as student_attempt_status,
               (
                 SELECT a.id 
                 FROM exam_attempts a 
                 WHERE a.exam_id = e.id AND a.student_id = ? 
                 ORDER BY a.start_time DESC 
                 LIMIT 1
               ) as student_attempt_id,
               (
                 SELECT a.percentage 
                 FROM exam_attempts a 
                 WHERE a.exam_id = e.id AND a.student_id = ? AND a.status = 'submitted'
                 ORDER BY a.start_time DESC 
                 LIMIT 1
               ) as student_score_pct
        FROM exams e
        JOIN subjects s ON e.subject_id = s.id
        JOIN app_users u ON e.teacher_id = u.id
        LEFT JOIN exam_questions eq ON e.id = eq.exam_id
        WHERE e.is_published = TRUE
        GROUP BY e.id, e.title, e.description, e.subject_id, e.teacher_id,
                 e.duration_minutes, e.total_marks, e.passing_marks,
                 e.shuffle_questions, e.show_immediate_results, e.is_published, e.created_at,
                 s.name, s.code, u.name
        ORDER BY e.created_at DESC;
      `, [user.id, user.id, user.id]);

      res.json({ exams });
      return;
    }

    // Teachers & Admins see full exams list with analytics metadata
    let sql = `
      SELECT e.id, e.title, e.description, e.subject_id, e.teacher_id,
             e.duration_minutes, e.total_marks, e.passing_marks,
             e.shuffle_questions, e.show_immediate_results, e.is_published, e.created_at,
             s.name as subject_name, s.code as subject_code,
             u.name as teacher_name,
             COUNT(DISTINCT eq.question_id) as question_count,
             COUNT(DISTINCT a.id) as attempts_count,
             AVG(CASE WHEN a.status = 'submitted' THEN a.percentage ELSE NULL END) as avg_score_pct,
             SUM(CASE WHEN a.passed = TRUE THEN 1 ELSE 0 END) as passed_count
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      JOIN app_users u ON e.teacher_id = u.id
      LEFT JOIN exam_questions eq ON e.id = eq.exam_id
      LEFT JOIN exam_attempts a ON e.id = a.exam_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (user.role === 'teacher') {
      sql += ` AND (e.teacher_id = ? OR e.is_published = TRUE)`;
      params.push(user.id);
    }

    sql += `
      GROUP BY e.id, e.title, e.description, e.subject_id, e.teacher_id,
               e.duration_minutes, e.total_marks, e.passing_marks,
               e.shuffle_questions, e.show_immediate_results, e.is_published, e.created_at,
               s.name, s.code, u.name
      ORDER BY e.created_at DESC;
    `;

    const exams = await query(sql, params);
    res.json({ exams });
  } catch (err: any) {
    console.error('[getExams Error]:', err);
    res.status(500).json({ error: 'Failed to fetch exams.' });
  }
}

export async function getExamById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  try {
    const exam = await queryOne<Exam>(`
      SELECT e.*, s.name as subject_name, s.code as subject_code, u.name as teacher_name
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      JOIN app_users u ON e.teacher_id = u.id
      WHERE e.id = ?;
    `, [id]);

    if (!exam) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }

    // If teacher or admin, attach question details
    if (user.role === 'teacher' || user.role === 'admin') {
      const questions = await query<Question>(`
        SELECT q.id, q.question_text, eq.marks, q.difficulty, q.explanation, eq.question_order
        FROM exam_questions eq
        JOIN questions q ON eq.question_id = q.id
        WHERE eq.exam_id = ?
        ORDER BY eq.question_order ASC;
      `, [id]);

      if (questions.length > 0) {
        const qIds = questions.map(q => q.id);
        const placeholders = qIds.map(() => '?').join(',');
        const options = await query(`
          SELECT id, question_id, option_text, is_correct, sort_order
          FROM question_options
          WHERE question_id IN (${placeholders})
          ORDER BY sort_order ASC;
        `, qIds);

        const optionsByQuestion = new Map<string, any[]>();
        options.forEach(opt => {
          if (!optionsByQuestion.has(opt.question_id)) optionsByQuestion.set(opt.question_id, []);
          optionsByQuestion.get(opt.question_id)!.push(opt);
        });

        questions.forEach(q => {
          q.options = optionsByQuestion.get(q.id) || [];
        });
      }

      exam.questions = questions;
    }

    res.json({ exam });
  } catch (err: any) {
    console.error('[getExamById Error]:', err);
    res.status(500).json({ error: 'Failed to fetch exam details.' });
  }
}

export async function createExam(req: AuthenticatedRequest, res: Response): Promise<void> {
  const {
    title,
    description,
    subject_id,
    duration_minutes,
    passing_marks,
    shuffle_questions,
    show_immediate_results,
    is_published,
    question_ids,
  } = req.body;
  const teacher_id = req.user!.id;

  if (!title || !subject_id || !duration_minutes) {
    res.status(400).json({ error: 'Title, subject, and duration in minutes are required.' });
    return;
  }

  if (!question_ids || !Array.isArray(question_ids) || question_ids.length === 0) {
    res.status(400).json({ error: 'At least one question must be selected for the exam.' });
    return;
  }

  try {
    const examId = uuidv4();
    const duration = parseInt(duration_minutes, 10);
    const shuffle = shuffle_questions !== undefined ? !!shuffle_questions : true;
    const immediate = show_immediate_results !== undefined ? !!show_immediate_results : true;
    const published = is_published !== undefined ? !!is_published : false;

    // Calculate total marks from selected questions
    const placeholders = question_ids.map(() => '?').join(',');
    const selectedQuestions = await query<{ id: string; marks: number }>(`
      SELECT id, marks FROM questions WHERE id IN (${placeholders});
    `, question_ids);

    const totalMarks = selectedQuestions.reduce((sum, q) => sum + (q.marks || 1.0), 0);
    const passMarks = passing_marks !== undefined ? parseFloat(passing_marks) : (totalMarks * 0.5);

    await execute(
      `INSERT INTO exams (
        id, title, description, subject_id, teacher_id,
        duration_minutes, total_marks, passing_marks,
        shuffle_questions, show_immediate_results, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [examId, title.trim(), description || '', subject_id, teacher_id, duration, totalMarks, passMarks, shuffle, immediate, published]
    );

    // Link exam questions
    for (let i = 0; i < question_ids.length; i++) {
      const qId = question_ids[i];
      const q = selectedQuestions.find(sq => sq.id === qId);
      const marks = q ? q.marks : 1.0;
      await execute(
        `INSERT INTO exam_questions (id, exam_id, question_id, question_order, marks)
         VALUES (?, ?, ?, ?, ?);`,
        [uuidv4(), examId, qId, i + 1, marks]
      );
    }

    const created = await queryOne('SELECT * FROM exams WHERE id = ?;', [examId]);
    res.status(201).json({ exam: created });
  } catch (err: any) {
    console.error('[createExam Error]:', err);
    res.status(500).json({ error: 'Failed to create exam.' });
  }
}

export async function updateExam(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const {
    title,
    description,
    subject_id,
    duration_minutes,
    passing_marks,
    shuffle_questions,
    show_immediate_results,
    is_published,
    question_ids,
  } = req.body;

  try {
    const exam = await queryOne('SELECT id, teacher_id FROM exams WHERE id = ?;', [id]);
    if (!exam) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }

    if (req.user!.role !== 'admin' && exam.teacher_id !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to modify this exam.' });
      return;
    }

    let totalMarks = exam.total_marks;
    if (question_ids && Array.isArray(question_ids) && question_ids.length > 0) {
      const placeholders = question_ids.map(() => '?').join(',');
      const selectedQuestions = await query<{ id: string; marks: number }>(`
        SELECT id, marks FROM questions WHERE id IN (${placeholders});
      `, question_ids);

      totalMarks = selectedQuestions.reduce((sum, q) => sum + (q.marks || 1.0), 0);

      await execute('DELETE FROM exam_questions WHERE exam_id = ?;', [id]);
      for (let i = 0; i < question_ids.length; i++) {
        const qId = question_ids[i];
        const q = selectedQuestions.find(sq => sq.id === qId);
        const marks = q ? q.marks : 1.0;
        await execute(
          `INSERT INTO exam_questions (id, exam_id, question_id, question_order, marks)
           VALUES (?, ?, ?, ?, ?);`,
          [uuidv4(), id, qId, i + 1, marks]
        );
      }
    }

    const duration = parseInt(duration_minutes, 10);
    const passMarks = passing_marks !== undefined ? parseFloat(passing_marks) : (totalMarks * 0.5);

    await execute(
      `UPDATE exams
       SET title = ?, description = ?, subject_id = ?, duration_minutes = ?,
           total_marks = ?, passing_marks = ?, shuffle_questions = ?,
           show_immediate_results = ?, is_published = ?
       WHERE id = ?;`,
      [title.trim(), description || '', subject_id, duration, totalMarks, passMarks, !!shuffle_questions, !!show_immediate_results, !!is_published, id]
    );

    const updated = await queryOne('SELECT * FROM exams WHERE id = ?;', [id]);
    res.json({ exam: updated });
  } catch (err: any) {
    console.error('[updateExam Error]:', err);
    res.status(500).json({ error: 'Failed to update exam.' });
  }
}

export async function deleteExam(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const exam = await queryOne('SELECT id, teacher_id FROM exams WHERE id = ?;', [id]);
    if (!exam) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }

    if (req.user!.role !== 'admin' && exam.teacher_id !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to delete this exam.' });
      return;
    }

    await execute('DELETE FROM student_answers WHERE attempt_id IN (SELECT id FROM exam_attempts WHERE exam_id = ?);', [id]);
    await execute('DELETE FROM exam_attempts WHERE exam_id = ?;', [id]);
    await execute('DELETE FROM exam_questions WHERE exam_id = ?;', [id]);
    await execute('DELETE FROM exams WHERE id = ?;', [id]);

    res.json({ message: 'Exam deleted successfully.' });
  } catch (err: any) {
    console.error('[deleteExam Error]:', err);
    res.status(500).json({ error: 'Failed to delete exam.' });
  }
}
