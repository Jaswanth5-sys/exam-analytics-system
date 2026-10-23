import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export const ExamResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) return;
    api.get(`/attempts/${attemptId}/result`)
      .then(setData)
      .catch((err) => console.error('Error fetching result:', err))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!data || !data.attempt) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Attempt result not found.</p>
        <Link to="/" className="mt-3 text-brand-600 font-bold text-xs inline-block">
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  const { attempt, breakdown } = data;
  const isPassed = attempt.passed;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-slate-800">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800">Examination Results</span>
      </div>

      {/* Main Score Report Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 ${
          isPassed
            ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-emerald-700/15 border-emerald-500'
            : 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 text-white shadow-rose-700/15 border-rose-500'
        }`}
      >
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>{isPassed ? 'Examination Passed' : 'Needs Improvement'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {attempt.exam_title}
          </h1>

          <p className="text-xs sm:text-sm text-white/80 max-w-lg">
            {isPassed
              ? 'Congratulations! You have satisfied the knowledge benchmark for this assessment.'
              : 'You did not reach the passing threshold this time. Review the detailed feedback below to master the concepts.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-white/90">
            <span>Subject: {attempt.subject_code}</span>
            <span>•</span>
            <span>Total Score: {attempt.total_score} / {attempt.total_marks} Marks</span>
            <span>•</span>
            <span>Passing Mark: {attempt.passing_marks}</span>
          </div>
        </div>

        {/* Big Circular Score Badge */}
        <div className="w-32 h-32 rounded-full bg-white/10 border-4 border-white/30 backdrop-blur-md flex flex-col items-center justify-center shadow-inner shrink-0">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">{attempt.percentage}%</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/80">Percentage</span>
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Detailed Question Breakdown</h2>
            <p className="text-xs text-slate-500">
              Inspect your answers alongside verified MonetDB solutions and explanations
            </p>
          </div>
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal</span>
          </Link>
        </div>

        <div className="space-y-4">
          {breakdown.map((item: any, idx: number) => {
            const isCorrect = item.is_correct;
            return (
              <div
                key={item.question_id}
                className={`p-6 rounded-3xl bg-white border shadow-sm space-y-4 ${
                  isCorrect ? 'border-emerald-200/80' : 'border-rose-200/80'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center">
                      Q{idx + 1}
                    </span>
                    <Badge variant={isCorrect ? 'success' : 'danger'} size="sm">
                      {isCorrect ? 'CORRECT (+ ' + item.marks_awarded + ' Marks)' : 'INCORRECT (0 Marks)'}
                    </Badge>
                    <span className="text-xs font-bold text-slate-400">
                      Total: {item.marks} {item.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    {item.difficulty}
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  {item.question_text}
                </p>

                {/* Options List */}
                <div className="space-y-2">
                  {item.options?.map((opt: any, optIdx: number) => {
                    const isStudentPick = item.selected_option_id === opt.id;
                    const isRightAnswer = opt.is_correct;

                    let optStyle = 'bg-slate-50/70 border-slate-100 text-slate-600';
                    if (isRightAnswer) {
                      optStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                    } else if (isStudentPick && !isRightAnswer) {
                      optStyle = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold line-through';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${optStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isRightAnswer ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : isStudentPick ? (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span>{opt.option_text}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase">
                          {isRightAnswer && (
                            <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                              Correct Answer
                            </span>
                          )}
                          {isStudentPick && (
                            <span className="text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                              Your Choice
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {item.explanation && (
                  <div className="p-3.5 rounded-2xl bg-brand-50/50 border border-brand-100 text-xs text-brand-950 flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-brand-800">Concept Explanation: </span>
                      <span>{item.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
