export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: string;
  created_at?: string;
  attempts_count?: number;
  exams_created_count?: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_at?: string;
  question_count?: number;
  exam_count?: number;
}

export interface QuestionOption {
  id: string;
  question_id?: string;
  option_text: string;
  is_correct?: boolean; // Masked for students during active exams
  sort_order: number;
}

export interface Question {
  id: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  teacher_id: string;
  teacher_name?: string;
  question_text: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  created_at?: string;
  options?: QuestionOption[];
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  teacher_id: string;
  teacher_name?: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  shuffle_questions: boolean;
  show_immediate_results: boolean;
  is_published: boolean;
  created_at?: string;
  question_count?: number;
  attempts_count?: number;
  avg_score_pct?: number;
  passed_count?: number;
  student_attempt_status?: 'in_progress' | 'submitted' | 'time_expired' | null;
  student_attempt_id?: string | null;
  student_score_pct?: number | null;
  questions?: Question[];
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  exam_title?: string;
  student_id: string;
  student_name?: string;
  start_time: string;
  end_time: string;
  submitted_at?: string;
  total_score: number;
  percentage: number;
  passed: boolean;
  status: 'in_progress' | 'submitted' | 'time_expired';
  remaining_seconds?: number;
}

export interface ResultBreakdownItem {
  question_id: string;
  question_text: string;
  marks: number;
  difficulty: string;
  explanation: string;
  selected_option_id: string | null;
  is_correct: boolean;
  marks_awarded: number;
  options: QuestionOption[];
}

export interface ExamAnalytics {
  exam: Exam;
  summary: {
    totalAttempts: number;
    passedCount: number;
    failedCount: number;
    passRate: number;
    avgScore: number;
    highestScore: number;
    lowestScore: number;
    medianScore: number;
  };
  distribution: Array<{ range: string; count: number }>;
  questionAccuracy: Array<{
    id: string;
    order: number;
    text: string;
    marks: number;
    difficulty: string;
    totalAnswers: number;
    correctAnswers: number;
    accuracyPct: number;
  }>;
  attempts: Array<{
    id: string;
    student_id: string;
    student_name: string;
    student_email: string;
    total_score: number;
    percentage: number;
    passed: boolean;
    status: string;
    submitted_at: string;
  }>;
}
