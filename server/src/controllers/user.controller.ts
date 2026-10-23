import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, execute, queryOne } from '../db/connection.js';

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await query(`
      SELECT u.id, u.email, u.name, u.role, u.status, u.created_at,
             COUNT(DISTINCT a.id) as attempts_count,
             COUNT(DISTINCT e.id) as exams_created_count
      FROM app_users u
      LEFT JOIN exam_attempts a ON u.id = a.student_id
      LEFT JOIN exams e ON u.id = e.teacher_id
      GROUP BY u.id, u.email, u.name, u.role, u.status, u.created_at
      ORDER BY u.created_at DESC;
    `);
    res.json({ users });
  } catch (err: any) {
    console.error('[getUsers Error]:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const { email, password, name, role, status } = req.body;

  if (!email || !password || !name || !role) {
    res.status(400).json({ error: 'Email, password, name, and role are required.' });
    return;
  }

  try {
    const existing = await queryOne('SELECT id FROM app_users WHERE LOWER(email) = LOWER(?);', [email.trim()]);
    if (existing) {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const id = uuidv4();

    await execute(
      `INSERT INTO app_users (id, email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?, ?);`,
      [id, email.trim(), password_hash, name.trim(), role, status || 'active']
    );

    const created = await queryOne('SELECT id, email, name, role, status, created_at FROM app_users WHERE id = ?;', [id]);
    res.status(201).json({ user: created });
  } catch (err: any) {
    console.error('[createUser Error]:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, role, status, password } = req.body;

  try {
    const user = await queryOne('SELECT id FROM app_users WHERE id = ?;', [id]);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await execute('UPDATE app_users SET password_hash = ? WHERE id = ?;', [password_hash, id]);
    }

    await execute(
      `UPDATE app_users SET name = ?, role = ?, status = ? WHERE id = ?;`,
      [name, role, status, id]
    );

    const updated = await queryOne('SELECT id, email, name, role, status, created_at FROM app_users WHERE id = ?;', [id]);
    res.json({ user: updated });
  } catch (err: any) {
    console.error('[updateUser Error]:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    // Delete student answers and attempts if student
    await execute('DELETE FROM student_answers WHERE attempt_id IN (SELECT id FROM exam_attempts WHERE student_id = ?);', [id]);
    await execute('DELETE FROM exam_attempts WHERE student_id = ?;', [id]);
    await execute('DELETE FROM app_users WHERE id = ?;', [id]);

    res.json({ message: 'User deleted successfully.' });
  } catch (err: any) {
    console.error('[deleteUser Error]:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
}
