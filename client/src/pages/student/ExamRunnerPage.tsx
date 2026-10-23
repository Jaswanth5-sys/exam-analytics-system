import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Exam, Question } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

export const ExamRunnerPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attemptId, setAttemptId] = useState<string>('');
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers State: map of questionId -> selectedOptionId
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  // Flagged questions for review: Set of questionIds
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  // Countdown Timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isAutoSubmittedDueToTime, setIsAutoSubmittedDueToTime] = useState(false);

  const timerRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!examId) return;

    // Start or resume exam attempt
    api.post<{ attempt: any; exam: any }>('/attempts/start', { exam_id: examId })
      .then((res) => {
        setAttemptId(res.attempt.id);
        setRemainingSeconds(res.attempt.remaining_seconds || (res.exam.duration_minutes * 60));
        setExam(res.exam);
        setQuestions(res.exam.questions || []);

        // Also check if any saved answers exist from active attempt
        api.get<any>(`/attempts/active/${examId}`)
          .then((activeRes) => {
            if (activeRes.savedAnswers && Array.isArray(activeRes.savedAnswers)) {
              const answersMap: Record<string, string> = {};
              activeRes.savedAnswers.forEach((ans: any) => {
                if (ans.selected_option_id) {
                  answersMap[ans.question_id] = ans.selected_option_id;
                }
              });
              setSelectedAnswers(answersMap);
            }
          })
          .catch(() => {});
      })
      .catch((err: any) => {
        if (err?.data?.alreadySubmitted && err?.data?.attemptId) {
          navigate(`/attempts/${err.data.attemptId}/result`);
        } else {
          setError(err?.message || 'Failed to start exam.');
        }
      })
      .finally(() => setLoading(false));
  }, [examId, navigate]);

  // Timer Tick
  useEffect(() => {
    if (remainingSeconds <= 0 && !loading && questions.length > 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleForceAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, questions.length]);

  const handleForceAutoSubmit = () => {
    setIsAutoSubmittedDueToTime(true);
    triggerSubmit(true);
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    const updated = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(updated);
    debounceAutoSave(updated);
  };

  const handleClearOption = (questionId: string) => {
    const updated = { ...selectedAnswers };
    delete updated[questionId];
    setSelectedAnswers(updated);
    debounceAutoSave(updated);
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const debounceAutoSave = (answers: Record<string, string>) => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const answersArray = Object.entries(answers).map(([qId, optId]) => ({
          question_id: qId,
          selected_option_id: optId,
        }));
        await api.post(`/attempts/${attemptId}/save`, { answers: answersArray });
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.warn('Autosave warning:', err);
      }
    }, 800);
  };

  const triggerSubmit = async (isTimeExpired = false) => {
    setIsSubmitting(true);
    try {
      const answersArray = questions.map((q) => ({
        question_id: q.id,
        selected_option_id: selectedAnswers[q.id] || null,
      }));

      const res = await api.post(`/attempts/${attemptId}/submit`, { answers: answersArray });
      navigate(`/attempts/${attemptId}/result`);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit exam.');
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-4 border-brand-600 border-t-transparent animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800">Setting up secure examination environment...</h2>
        <p className="text-xs text-slate-500 mt-1">Connecting to MonetDB server & initializing clock</p>
      </div>
    );
  }

  if (error || !exam || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-lg">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Examination Error</h3>
          <p className="text-xs text-slate-500 mt-2 mb-6">{error || 'Exam content unavailable.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isCurrentFlagged = flaggedQuestions.has(currentQuestion.id);
  const selectedOptionForCurrent = selectedAnswers[currentQuestion.id];

  // Format timer
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = remainingSeconds < 120; // less than 2 minutes

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = questions.length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Exam Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 line-clamp-1">{exam.title}</span>
              <Badge variant="purple" size="sm">{exam.subject_code || 'CS'}</Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>{answeredCount} of {totalCount} Answered</span>
              <span>•</span>
              <span>Autosaved: {lastSavedTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Countdown Clock */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl font-mono font-bold text-sm sm:text-base border transition ${
                isUrgent
                  ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse shadow-sm shadow-rose-500/20'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-600' : 'text-slate-500'}`} />
              <span>{timerDisplay}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Exam</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Exam Area & Palette */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Question Content Column */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 min-h-[460px] flex flex-col justify-between">
            <div>
              {/* Question Top bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Question {currentIndex + 1} of {totalCount}
                  </span>
                  <Badge variant="slate" size="sm">
                    {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                  </Badge>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {currentQuestion.difficulty}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQuestion.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                    isCurrentFlagged
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-current' : ''}`} />
                  <span>{isCurrentFlagged ? 'Flagged for Review' : 'Mark for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-4 leading-relaxed">
                {currentQuestion.question_text}
              </h2>

              {/* Options Cards */}
              <div className="mt-6 space-y-3">
                {currentQuestion.options?.map((opt, optIndex) => {
                  const isSelected = selectedOptionForCurrent === opt.id;
                  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      className={`p-4 rounded-2xl border text-sm font-medium cursor-pointer transition flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-brand-50/80 border-brand-500 text-brand-950 shadow-sm ring-1 ring-brand-500'
                          : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-300'
                        }`}
                      >
                        {optionLetters[optIndex] || optIndex + 1}
                      </div>
                      <span className="flex-1 leading-snug">{opt.option_text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  type="button"
                  disabled={currentIndex === totalCount - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {selectedOptionForCurrent && (
                <button
                  type="button"
                  onClick={() => handleClearOption(currentQuestion.id)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Palette Column */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Question Palette</h3>
            <p className="text-[11px] text-slate-400">Jump directly to any item</p>
          </div>

          {/* Palette Grid */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!selectedAnswers[q.id];
              const isFlagged = flaggedQuestions.has(q.id);
              const isCurrent = idx === currentIndex;

              let style = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
              if (isAnswered) {
                style = 'bg-emerald-500 text-white shadow-sm';
              } else if (isFlagged) {
                style = 'bg-amber-400 text-white shadow-sm';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-xl font-bold text-xs transition relative flex items-center justify-center ${style} ${
                    isCurrent ? 'ring-2 ring-brand-600 ring-offset-2' : ''
                  }`}
                >
                  <span>{idx + 1}</span>
                  {isFlagged && isAnswered && (
                    <span className="w-2 h-2 rounded-full bg-amber-300 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-amber-400" />
              <span>Marked for Review ({flaggedQuestions.size})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-slate-200" />
              <span>Unanswered ({totalCount - answeredCount})</span>
            </div>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full mt-4 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Examination Submission"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Questions:</span>
              <span className="font-bold text-slate-800">{totalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Answered:</span>
              <span className="font-bold text-emerald-600">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Unanswered:</span>
              <span className="font-bold text-rose-600">{totalCount - answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Time Remaining:</span>
              <span className="font-bold text-slate-800">{timerDisplay}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Once submitted, your answers will be evaluated server-side against MonetDB answer keys. You will not be able to modify your choices.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Resume Test
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => triggerSubmit(false)}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting & Grading...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Time Expiration Notice Modal */}
      <Modal
        isOpen={isAutoSubmittedDueToTime}
        onClose={() => {}}
        title="Exam Time Expired"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">Time has Expired!</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your allotted time has finished. Your recorded answers have been automatically submitted for server evaluation.
          </p>
          <div className="pt-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mx-auto" />
            <span className="text-[11px] text-slate-400 mt-2 block">Calculating your results...</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
