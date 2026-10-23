import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Exam } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import {
  GraduationCap,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [historyStats, setHistoryStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ exams: Exam[] }>('/exams'),
      api.get<{ metrics: any }>('/attempts/my-history'),
    ])
      .then(([examsRes, histRes]) => {
        setExams(examsRes.exams || []);
        setHistoryStats(histRes.metrics || {});
      })
      .catch((err) => console.error('Error loading student dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  const completedExams = exams.filter(e => e.student_attempt_status === 'submitted');
  const availableExams = exams.filter(e => e.student_attempt_status !== 'submitted');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 text-white shadow-xl shadow-brand-700/15 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-widest text-brand-200">
              Student Assessment Portal
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
              Active Session
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-brand-100 mt-1 max-w-xl">
            You have {availableExams.length} examinations ready to take. Take your time, read each question carefully, and perform your best!
          </p>
        </div>

        <Link
          to="/student/history"
          className="px-5 py-3 rounded-2xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs shadow-lg transition flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Award className="w-4 h-4 text-brand-600" />
          <span>View Past Results</span>
        </Link>
      </div>

      {/* Progress KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Tests Completed"
          value={historyStats?.totalTaken || 0}
          subtitle="Submitted examinations"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Average Score"
          value={`${historyStats?.avgScore || 0}%`}
          subtitle="Across completed tests"
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Success Rate"
          value={`${historyStats?.passRate || 0}%`}
          subtitle={`${historyStats?.passedCount || 0} passed assessments`}
          icon={Award}
          color="amber"
        />
      </div>

      {/* Available Exams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Available Quizzes & Examinations</h2>
            <p className="text-xs text-slate-500">Timed assessments configured with automated evaluation</p>
          </div>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
            {availableExams.length} Open
          </span>
        </div>

        {availableExams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1">
              You have completed all published exams. Check back later or review your past attempts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableExams.map((exam) => {
              const isInProgress = exam.student_attempt_status === 'in_progress';
              return (
                <div
                  key={exam.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="purple" size="sm">
                        {exam.subject_code || 'CS'}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {exam.duration_minutes} Mins
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{exam.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {exam.description || 'Comprehensive evaluation of concepts and problem solving skills.'}
                    </p>

                    <div className="pt-2 flex items-center gap-3 text-xs text-slate-600 font-medium border-t border-slate-100">
                      <span>{exam.question_count || 0} Questions</span>
                      <span>•</span>
                      <span>{exam.total_marks} Total Marks</span>
                      <span>•</span>
                      <span>Pass: {exam.passing_marks}</span>
                    </div>
                  </div>

                  <Link
                    to={`/exam/${exam.id}`}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 ${
                      isInProgress
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                        : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isInProgress ? 'Resume Active Attempt' : 'Start Examination'}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Exams Quick Section */}
      {completedExams.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recently Completed Exams</h2>
            <Link to="/student/history" className="text-xs font-bold text-brand-600 hover:underline">
              View All History →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedExams.map((exam) => (
              <div
                key={exam.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between"
              >
                <div>
                  <Badge variant="purple" size="sm">{exam.subject_code || 'CS'}</Badge>
                  <h4 className="font-bold text-sm text-slate-800 mt-1 line-clamp-1">{exam.title}</h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-extrabold text-brand-600">
                      Score: {exam.student_score_pct || 0}%
                    </span>
                    <Badge variant={exam.student_score_pct && exam.student_score_pct >= 50 ? 'success' : 'danger'} size="sm">
                      {exam.student_score_pct && exam.student_score_pct >= 50 ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                </div>

                {exam.student_attempt_id && (
                  <Link
                    to={`/attempts/${exam.student_attempt_id}/result`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition"
                    title="Review Result"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
