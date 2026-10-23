import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, execute, queryOne } from '../db/connection.js';
import { Subject } from '../types/index.js';

export async function getSubjects(req: Request, res: Response): Promise<void> {
  try {
    const subjects = await query<Subject>(`
      SELECT s.id, s.code, s.name, s.description, s.created_at,
             COUNT(DISTINCT q.id) as question_count,
             COUNT(DISTINCT e.id) as exam_count
      FROM subjects s
      LEFT JOIN questions q ON s.id = q.subject_id
      LEFT JOIN exams e ON s.id = e.subject_id
      GROUP BY s.id, s.code, s.name, s.description, s.created_at
      ORDER BY s.code ASC;
    `);
    res.json({ subjects });
  } catch (err: any) {
    console.error('[getSubjects Error]:', err);
    res.status(500).json({ error: 'Failed to fetch subjects.' });
  }
}

export async function createSubject(req: Request, res: Response): Promise<void> {
  const { code, name, description } = req.body;

  if (!code || !name) {
    res.status(400).json({ error: 'Subject code and name are required.' });
    return;
  }

  try {
    const existing = await queryOne('SELECT id FROM subjects WHERE UPPER(code) = UPPER(?);', [code.trim()]);
    if (existing) {
      res.status(409).json({ error: 'A subject with this code already exists.' });
      return;
    }

    const id = uuidv4();
    await execute(
      `INSERT INTO subjects (id, code, name, description) VALUES (?, ?, ?, ?);`,
      [id, code.trim().toUpperCase(), name.trim(), description || '']
    );

    const created = await queryOne<Subject>('SELECT * FROM subjects WHERE id = ?;', [id]);
    res.status(201).json({ subject: created });
  } catch (err: any) {
    console.error('[createSubject Error]:', err);
    res.status(500).json({ error: 'Failed to create subject.' });
  }
}

export async function deleteSubject(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    // Check if subject is referenced in questions or exams
    const hasQuestions = await queryOne('SELECT id FROM questions WHERE subject_id = ? LIMIT 1;', [id]);
    if (hasQuestions) {
      res.status(400).json({ error: 'Cannot delete subject that contains questions. Please delete or reassign questions first.' });
      return;
    }

    await execute('DELETE FROM subjects WHERE id = ?;', [id]);
    res.json({ message: 'Subject deleted successfully.' });
  } catch (err: any) {
    console.error('[deleteSubject Error]:', err);
    res.status(500).json({ error: 'Failed to delete subject.' });
  }
}
