export type UserRole = 'admin' | 'teacher' | 'student';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface QuestionOption {
  id: string;
  question_id?: string;
  option_text: string;
  is_correct?: boolean; // Masked for student
  sort_order: number;
}

export interface Question {
  id: string;
  subject_id: string;
  subject_name?: string;
  teacher_id: string;
  teacher_name?: string;
  question_text: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string; // Masked for student while exam is active
  created_at?: string;
  options?: QuestionOption[];
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subject_id: string;
  subject_name?: string;
  teacher_id: string;
  teacher_name?: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  start_time?: string;
  end_time?: string;
  shuffle_questions: boolean;
  show_immediate_results: boolean;
  is_published: boolean;
  question_count?: number;
  created_at?: string;
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

export interface StudentAnswer {
  id?: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_correct?: boolean;
  marks_awarded?: number;
}
