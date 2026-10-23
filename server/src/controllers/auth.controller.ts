import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../db/connection.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AuthUser, UserRole } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_exam_jwt_key_2026_monetdb';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const user = await queryOne<{
      id: string;
      email: string;
      password_hash: string;
      name: string;
      role: UserRole;
      status: string;
    }>('SELECT id, email, password_hash, name, role, status FROM app_users WHERE LOWER(email) = LOWER(?);', [email.trim()]);

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials. User not found.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'Account is deactivated. Please contact an administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
      return;
    }

    const tokenPayload: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });

    res.json({
      token,
      user: tokenPayload,
    });
  } catch (err: any) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }

  const assignedRole: UserRole = role === 'teacher' ? 'teacher' : 'student';

  try {
    const existing = await queryOne('SELECT id FROM app_users WHERE LOWER(email) = LOWER(?);', [email.trim()]);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    await execute(
      `INSERT INTO app_users (id, email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?, 'active');`,
      [userId, email.trim(), password_hash, name.trim(), assignedRole]
    );

    const tokenPayload: AuthUser = {
      id: userId,
      email: email.trim(),
      name: name.trim(),
      role: assignedRole,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });

    res.status(201).json({
      token,
      user: tokenPayload,
    });
  } catch (err: any) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  try {
    const user = await queryOne<{
      id: string;
      email: string;
      name: string;
      role: UserRole;
      status: string;
      created_at: string;
    }>('SELECT id, email, name, role, status, created_at FROM app_users WHERE id = ?;', [req.user.id]);

    if (!user) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    res.json({ user });
  } catch (err: any) {
    console.error('[Auth getMe Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}
