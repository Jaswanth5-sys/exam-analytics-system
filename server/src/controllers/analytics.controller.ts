import { Response } from 'express';
import { query, queryOne } from '../db/connection.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getExamAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { examId } = req.params;

  try {
    const exam = await queryOne<any>(`
      SELECT e.*, s.name as subject_name, s.code as subject_code, u.name as teacher_name
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      JOIN app_users u ON e.teacher_id = u.id
      WHERE e.id = ?;
    `, [examId]);

    if (!exam) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }

    // 1. Overall attempt summary
    const attempts = await query<any>(`
      SELECT a.id, a.student_id, a.total_score, a.percentage, a.passed, a.status, a.submitted_at,
             u.name as student_name, u.email as student_email
      FROM exam_attempts a
      JOIN app_users u ON a.student_id = u.id
      WHERE a.exam_id = ? AND a.status IN ('submitted', 'time_expired')
      ORDER BY a.total_score DESC;
    `, [examId]);

    const totalAttempts = attempts.length;
    const passedCount = attempts.filter(a => a.passed).length;
    const failedCount = totalAttempts - passedCount;
    const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

    const scores = attempts.map(a => a.percentage || 0).sort((a, b) => a - b);
    const avgScore = totalAttempts > 0 ? Math.round(scores.reduce((s, c) => s + c, 0) / totalAttempts) : 0;
    const highestScore = totalAttempts > 0 ? Math.max(...scores) : 0;
    const lowestScore = totalAttempts > 0 ? Math.min(...scores) : 0;
    const medianScore = totalAttempts > 0 ? (
      totalAttempts % 2 !== 0
        ? scores[Math.floor(totalAttempts / 2)]
        : Math.round((scores[totalAttempts / 2 - 1] + scores[totalAttempts / 2]) / 2)
    ) : 0;

    // 2. Score distribution histogram (5 brackets)
    const scoreBuckets = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ];

    scores.forEach(score => {
      if (score <= 20) scoreBuckets[0].count++;
      else if (score <= 40) scoreBuckets[1].count++;
      else if (score <= 60) scoreBuckets[2].count++;
      else if (score <= 80) scoreBuckets[3].count++;
      else scoreBuckets[4].count++;
    });

    // 3. Question-level accuracy & discrimination analysis
    const questionAccuracy = await query<any>(`
      SELECT q.id, q.question_text, eq.marks, q.difficulty, eq.question_order,
             COUNT(sa.id) as total_answers,
             SUM(CASE WHEN sa.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      LEFT JOIN student_answers sa ON q.id = sa.question_id AND sa.attempt_id IN (
        SELECT id FROM exam_attempts WHERE exam_id = ? AND status IN ('submitted', 'time_expired')
      )
      WHERE eq.exam_id = ?
      GROUP BY q.id, q.question_text, eq.marks, q.difficulty, eq.question_order
      ORDER BY eq.question_order ASC;
    `, [examId, examId]);

    const questionStats = questionAccuracy.map(qa => {
      const total = parseInt(qa.total_answers, 10) || 0;
      const correct = parseInt(qa.correct_answers, 10) || 0;
      const accuracyPct = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        id: qa.id,
        order: qa.question_order,
        text: qa.question_text,
        marks: qa.marks,
        difficulty: qa.difficulty,
        totalAnswers: total,
        correctAnswers: correct,
        accuracyPct,
      };
    });

    res.json({
      exam,
      summary: {
        totalAttempts,
        passedCount,
        failedCount,
        passRate,
        avgScore,
        highestScore,
        lowestScore,
        medianScore,
      },
      distribution: scoreBuckets,
      questionAccuracy: questionStats,
      attempts,
    });
  } catch (err: any) {
    console.error('[getExamAnalytics Error]:', err);
    res.status(500).json({ error: 'Failed to generate exam analytics.' });
  }
}

export async function getTeacherOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  const teacherId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  try {
    let examFilter = isAdmin ? '' : 'WHERE e.teacher_id = ?';
    let filterParams = isAdmin ? [] : [teacherId];

    // High level metrics
    const stats = await queryOne<any>(`
      SELECT 
        COUNT(DISTINCT e.id) as total_exams,
        COUNT(DISTINCT a.id) as total_attempts,
        AVG(CASE WHEN a.status = 'submitted' THEN a.percentage ELSE NULL END) as avg_score,
        SUM(CASE WHEN a.passed = TRUE THEN 1 ELSE 0 END) as total_passed
      FROM exams e
      LEFT JOIN exam_attempts a ON e.id = a.exam_id
      ${examFilter};
    `, filterParams);

    // Subject breakdown
    const subjectBreakdown = await query<any>(`
      SELECT s.code, s.name,
             COUNT(DISTINCT e.id) as exam_count,
             COUNT(DISTINCT a.id) as attempt_count,
             AVG(CASE WHEN a.status = 'submitted' THEN a.percentage ELSE NULL END) as avg_score,
             SUM(CASE WHEN a.passed = TRUE THEN 1 ELSE 0 END) as passed_count
      FROM subjects s
      JOIN exams e ON s.id = e.subject_id ${isAdmin ? '' : 'AND e.teacher_id = ?'}
      LEFT JOIN exam_attempts a ON e.id = a.exam_id
      GROUP BY s.id, s.code, s.name
      ORDER BY s.code ASC;
    `, filterParams);

    // Recent attempts across teacher's exams
    const recentActivity = await query<any>(`
      SELECT a.id, a.total_score, a.percentage, a.passed, a.submitted_at,
             e.title as exam_title, u.name as student_name
      FROM exam_attempts a
      JOIN exams e ON a.exam_id = e.id
      JOIN app_users u ON a.student_id = u.id
      ${isAdmin ? '' : 'WHERE e.teacher_id = ?'}
      ORDER BY a.submitted_at DESC
      LIMIT 10;
    `, filterParams);

    res.json({
      metrics: {
        totalExams: stats?.total_exams || 0,
        totalAttempts: stats?.total_attempts || 0,
        avgScore: Math.round(stats?.avg_score || 0),
        totalPassed: stats?.total_passed || 0,
        passRate: stats?.total_attempts > 0 ? Math.round((stats.total_passed / stats.total_attempts) * 100) : 0,
      },
      subjectBreakdown: subjectBreakdown.map(sb => ({
        code: sb.code,
        name: sb.name,
        examCount: sb.exam_count,
        attemptCount: sb.attempt_count,
        avgScore: Math.round(sb.avg_score || 0),
        passRate: sb.attempt_count > 0 ? Math.round((sb.passed_count / sb.attempt_count) * 100) : 0,
      })),
      recentActivity,
    });
  } catch (err: any) {
    console.error('[getTeacherOverview Error]:', err);
    res.status(500).json({ error: 'Failed to fetch teacher analytics overview.' });
  }
}

export async function getStudentAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
  const studentId = req.user!.id;

  try {
    // Chronological attempts trend
    const trend = await query<any>(`
      SELECT a.id, a.percentage, a.total_score, a.passed, a.submitted_at,
             e.title as exam_title, s.code as subject_code
      FROM exam_attempts a
      JOIN exams e ON a.exam_id = e.id
      JOIN subjects s ON e.subject_id = s.id
      WHERE a.student_id = ? AND a.status IN ('submitted', 'time_expired')
      ORDER BY a.submitted_at ASC;
    `, [studentId]);

    // Performance by subject
    const subjectStats = await query<any>(`
      SELECT s.name as subject_name, s.code as subject_code,
             COUNT(a.id) as attempts_count,
             AVG(a.percentage) as avg_score,
             MAX(a.percentage) as highest_score
      FROM exam_attempts a
      JOIN exams e ON a.exam_id = e.id
      JOIN subjects s ON e.subject_id = s.id
      WHERE a.student_id = ? AND a.status IN ('submitted', 'time_expired')
      GROUP BY s.id, s.name, s.code;
    `, [studentId]);

    res.json({
      trend: trend.map(t => ({
        date: t.submitted_at ? new Date(t.submitted_at).toLocaleDateString() : 'Recent',
        score: t.percentage || 0,
        exam: t.exam_title,
        subject: t.subject_code,
      })),
      subjectStats: subjectStats.map(s => ({
        subject: s.subject_name,
        code: s.subject_code,
        attempts: s.attempts_count,
        avgScore: Math.round(s.avg_score || 0),
        highestScore: s.highest_score || 0,
      })),
    });
  } catch (err: any) {
    console.error('[getStudentAnalytics Error]:', err);
    res.status(500).json({ error: 'Failed to fetch student analytics.' });
  }
}

export async function getAdminAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Total users breakdown
    const userStats = await query<any>(`
      SELECT role, COUNT(id) as count
      FROM app_users
      GROUP BY role;
    `);

    const usersByRole = {
      admin: 0,
      teacher: 0,
      student: 0,
    };
    userStats.forEach((u: any) => {
      if (u.role in usersByRole) {
        // @ts-ignore
        usersByRole[u.role] = parseInt(u.count, 10);
      }
    });

    const totalUsers = usersByRole.admin + usersByRole.teacher + usersByRole.student;

    // Exams & Attempts
    const examSummary = await queryOne<any>(`
      SELECT 
        COUNT(DISTINCT e.id) as total_exams,
        SUM(CASE WHEN e.is_published = TRUE THEN 1 ELSE 0 END) as published_exams,
        COUNT(DISTINCT a.id) as total_attempts,
        SUM(CASE WHEN a.passed = TRUE THEN 1 ELSE 0 END) as total_passed,
        AVG(CASE WHEN a.status = 'submitted' THEN a.percentage ELSE NULL END) as platform_avg_score
      FROM exams e
      LEFT JOIN exam_attempts a ON e.id = a.exam_id;
    `);

    // Subject volume
    const subjectVolume = await query<any>(`
      SELECT s.code, s.name,
             COUNT(DISTINCT q.id) as question_count,
             COUNT(DISTINCT e.id) as exam_count,
             COUNT(DISTINCT a.id) as attempt_count
      FROM subjects s
      LEFT JOIN questions q ON s.id = q.subject_id
      LEFT JOIN exams e ON s.id = e.subject_id
      LEFT JOIN exam_attempts a ON e.id = a.exam_id
      GROUP BY s.id, s.code, s.name
      ORDER BY exam_count DESC;
    `);

    res.json({
      users: {
        total: totalUsers,
        ...usersByRole,
      },
      exams: {
        total: examSummary?.total_exams || 0,
        published: examSummary?.published_exams || 0,
        totalAttempts: examSummary?.total_attempts || 0,
        totalPassed: examSummary?.total_passed || 0,
        avgScore: Math.round(examSummary?.platform_avg_score || 0),
        passRate: examSummary?.total_attempts > 0 ? Math.round((examSummary.total_passed / examSummary.total_attempts) * 100) : 0,
      },
      subjectVolume,
    });
  } catch (err: any) {
    console.error('[getAdminAnalytics Error]:', err);
    res.status(500).json({ error: 'Failed to fetch admin system analytics.' });
  }
}
