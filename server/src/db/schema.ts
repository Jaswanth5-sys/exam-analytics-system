import { execute } from './connection.js';

export async function initializeSchema(): Promise<void> {
  console.log('[Schema] Checking and creating normalized MonetDB tables...');

  // 1. app_users table (using app_users to avoid collision with MonetDB built-in sys.users)
  await execute(`
    CREATE TABLE IF NOT EXISTS app_users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(150) NOT NULL,
      role VARCHAR(20) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. subjects table
  await execute(`
    CREATE TABLE IF NOT EXISTS subjects (
      id VARCHAR(36) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL,
      description VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. questions table
  await execute(`
    CREATE TABLE IF NOT EXISTS questions (
      id VARCHAR(36) PRIMARY KEY,
      subject_id VARCHAR(36) NOT NULL REFERENCES subjects(id),
      teacher_id VARCHAR(36) NOT NULL REFERENCES app_users(id),
      question_text VARCHAR(2000) NOT NULL,
      marks DOUBLE NOT NULL DEFAULT 1.0,
      difficulty VARCHAR(20) DEFAULT 'medium',
      explanation VARCHAR(2000),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. question_options table
  await execute(`
    CREATE TABLE IF NOT EXISTS question_options (
      id VARCHAR(36) PRIMARY KEY,
      question_id VARCHAR(36) NOT NULL REFERENCES questions(id),
      option_text VARCHAR(1000) NOT NULL,
      is_correct BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INT NOT NULL DEFAULT 0
    );
  `);

  // 5. exams table
  await execute(`
    CREATE TABLE IF NOT EXISTS exams (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description VARCHAR(1000),
      subject_id VARCHAR(36) NOT NULL REFERENCES subjects(id),
      teacher_id VARCHAR(36) NOT NULL REFERENCES app_users(id),
      duration_minutes INT NOT NULL,
      total_marks DOUBLE NOT NULL DEFAULT 0.0,
      passing_marks DOUBLE NOT NULL DEFAULT 0.0,
      start_time TIMESTAMP,
      end_time TIMESTAMP,
      shuffle_questions BOOLEAN DEFAULT TRUE,
      show_immediate_results BOOLEAN DEFAULT TRUE,
      is_published BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. exam_questions table
  await execute(`
    CREATE TABLE IF NOT EXISTS exam_questions (
      id VARCHAR(36) PRIMARY KEY,
      exam_id VARCHAR(36) NOT NULL REFERENCES exams(id),
      question_id VARCHAR(36) NOT NULL REFERENCES questions(id),
      question_order INT NOT NULL,
      marks DOUBLE NOT NULL
    );
  `);

  // 7. exam_attempts table
  await execute(`
    CREATE TABLE IF NOT EXISTS exam_attempts (
      id VARCHAR(36) PRIMARY KEY,
      exam_id VARCHAR(36) NOT NULL REFERENCES exams(id),
      student_id VARCHAR(36) NOT NULL REFERENCES app_users(id),
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      submitted_at TIMESTAMP,
      total_score DOUBLE DEFAULT 0.0,
      percentage DOUBLE DEFAULT 0.0,
      passed BOOLEAN DEFAULT FALSE,
      status VARCHAR(20) DEFAULT 'in_progress'
    );
  `);

  // 8. student_answers table
  await execute(`
    CREATE TABLE IF NOT EXISTS student_answers (
      id VARCHAR(36) PRIMARY KEY,
      attempt_id VARCHAR(36) NOT NULL REFERENCES exam_attempts(id),
      question_id VARCHAR(36) NOT NULL REFERENCES questions(id),
      selected_option_id VARCHAR(36),
      is_correct BOOLEAN DEFAULT FALSE,
      marks_awarded DOUBLE DEFAULT 0.0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('[Schema] All 8 normalized MonetDB tables successfully verified.');
}
