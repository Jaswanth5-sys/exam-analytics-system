import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, execute, queryOne } from '../db/connection.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Question, QuestionOption } from '../types/index.js';

export async function getQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { subject_id, difficulty, search } = req.query;

  try {
    let sql = `
      SELECT q.id, q.subject_id, q.teacher_id, q.question_text, q.marks, q.difficulty, q.explanation, q.created_at,
             s.name as subject_name, s.code as subject_code,
             u.name as teacher_name
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id
      JOIN app_users u ON q.teacher_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subject_id) {
      sql += ` AND q.subject_id = ?`;
      params.push(subject_id);
    }

    if (difficulty) {
      sql += ` AND q.difficulty = ?`;
      params.push(difficulty);
    }

    if (search) {
      sql += ` AND LOWER(q.question_text) LIKE LOWER(?)`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY q.created_at DESC;`;

    const questions = await query<Question>(sql, params);

    // Fetch options for all returned questions
    if (questions.length > 0) {
      const qIds = questions.map(q => q.id);
      // MonetDB IN query
      const placeholders = qIds.map(() => '?').join(',');
      const options = await query<QuestionOption>(`
        SELECT id, question_id, option_text, is_correct, sort_order
        FROM question_options
        WHERE question_id IN (${placeholders})
        ORDER BY sort_order ASC;
      `, qIds);

      const optionsByQuestion = new Map<string, QuestionOption[]>();
      options.forEach(opt => {
        const qId = opt.question_id!;
        if (!optionsByQuestion.has(qId)) {
          optionsByQuestion.set(qId, []);
        }
        optionsByQuestion.get(qId)!.push(opt);
      });

      questions.forEach(q => {
        q.options = optionsByQuestion.get(q.id) || [];
      });
    }

    res.json({ questions });
  } catch (err: any) {
    console.error('[getQuestions Error]:', err);
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
}

export async function createQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { subject_id, question_text, marks, difficulty, explanation, options } = req.body;
  const teacher_id = req.user!.id;

  if (!subject_id || !question_text || !options || !Array.isArray(options) || options.length < 2) {
    res.status(400).json({ error: 'Subject, question text, and at least 2 options are required.' });
    return;
  }

  const hasCorrect = options.some((opt: any) => opt.is_correct === true);
  if (!hasCorrect) {
    res.status(400).json({ error: 'At least one option must be marked as correct.' });
    return;
  }

  try {
    const questionId = uuidv4();
    const parsedMarks = parseFloat(marks) || 1.0;
    const diff = difficulty || 'medium';

    await execute(
      `INSERT INTO questions (id, subject_id, teacher_id, question_text, marks, difficulty, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [questionId, subject_id, teacher_id, question_text.trim(), parsedMarks, diff, explanation || '']
    );

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      await execute(
        `INSERT INTO question_options (id, question_id, option_text, is_correct, sort_order)
         VALUES (?, ?, ?, ?, ?);`,
        [uuidv4(), questionId, opt.option_text.trim(), !!opt.is_correct, i]
      );
    }

    const created = await queryOne('SELECT * FROM questions WHERE id = ?;', [questionId]);
    const createdOpts = await query('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC;', [questionId]);

    res.status(201).json({ question: { ...created, options: createdOpts } });
  } catch (err: any) {
    console.error('[createQuestion Error]:', err);
    res.status(500).json({ error: 'Failed to create question.' });
  }
}

export async function updateQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { subject_id, question_text, marks, difficulty, explanation, options } = req.body;

  try {
    const question = await queryOne('SELECT id, teacher_id FROM questions WHERE id = ?;', [id]);
    if (!question) {
      res.status(404).json({ error: 'Question not found.' });
      return;
    }

    if (req.user!.role !== 'admin' && question.teacher_id !== req.user!.id) {
      res.status(403).json({ error: 'You are not authorized to edit this question.' });
      return;
    }

    await execute(
      `UPDATE questions
       SET subject_id = ?, question_text = ?, marks = ?, difficulty = ?, explanation = ?
       WHERE id = ?;`,
      [subject_id, question_text.trim(), parseFloat(marks) || 1.0, difficulty || 'medium', explanation || '', id]
    );

    if (options && Array.isArray(options)) {
      await execute('DELETE FROM question_options WHERE question_id = ?;', [id]);
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        await execute(
          `INSERT INTO question_options (id, question_id, option_text, is_correct, sort_order)
           VALUES (?, ?, ?, ?, ?);`,
          [uuidv4(), id, opt.option_text.trim(), !!opt.is_correct, i]
        );
      }
    }

    const updated = await queryOne('SELECT * FROM questions WHERE id = ?;', [id]);
    const updatedOpts = await query('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC;', [id]);

    res.json({ question: { ...updated, options: updatedOpts } });
  } catch (err: any) {
    console.error('[updateQuestion Error]:', err);
    res.status(500).json({ error: 'Failed to update question.' });
  }
}

export async function deleteQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const question = await queryOne('SELECT id, teacher_id FROM questions WHERE id = ?;', [id]);
    if (!question) {
      res.status(404).json({ error: 'Question not found.' });
      return;
    }

    if (req.user!.role !== 'admin' && question.teacher_id !== req.user!.id) {
      res.status(403).json({ error: 'You are not authorized to delete this question.' });
      return;
    }

    await execute('DELETE FROM student_answers WHERE question_id = ?;', [id]);
    await execute('DELETE FROM exam_questions WHERE question_id = ?;', [id]);
    await execute('DELETE FROM question_options WHERE question_id = ?;', [id]);
    await execute('DELETE FROM questions WHERE id = ?;', [id]);

    res.json({ message: 'Question deleted successfully.' });
  } catch (err: any) {
    console.error('[deleteQuestion Error]:', err);
    res.status(500).json({ error: 'Failed to delete question.' });
  }
}
