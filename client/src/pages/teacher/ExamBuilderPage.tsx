import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Subject, Question } from '../../types';
import { Badge } from '../../components/common/Badge';
import {
  PlusCircle,
  Clock,
  Award,
  Shuffle,
  Eye,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  CheckSquare,
  Square,
} from 'lucide-react';

export const ExamBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showImmediateResults, setShowImmediateResults] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<{ subjects: Subject[] }>('/subjects'),
      api.get<{ questions: Question[] }>('/questions'),
    ])
      .then(([sRes, qRes]) => {
        setSubjects(sRes.subjects || []);
        if (sRes.subjects?.length > 0) {
          setSubjectId(sRes.subjects[0].id);
        }
        setQuestions(qRes.questions || []);
      })
      .catch((err) => console.error('Error loading builder data:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filter questions for the selected subject
  const subjectQuestions = questions.filter(q => !subjectId || q.subject_id === subjectId);

  const toggleSelectQuestion = (qId: string) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const handleSelectAllSubjectQuestions = () => {
    const ids = subjectQuestions.map(q => q.id);
    const allSelected = ids.every(id => selectedQuestionIds.includes(id));
    if (allSelected) {
      setSelectedQuestionIds(selectedQuestionIds.filter(id => !ids.includes(id)));
    } else {
      setSelectedQuestionIds(Array.from(new Set([...selectedQuestionIds, ...ids])));
    }
  };

  // Compute live total marks
  const totalMarks = questions
    .filter(q => selectedQuestionIds.includes(q.id))
    .reduce((sum, q) => sum + (q.marks || 1.0), 0);
  const passingMarks = totalMarks * 0.5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide an examination title.');
      return;
    }

    if (selectedQuestionIds.length === 0) {
      setError('Please select at least one question from the list below.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/exams', {
        title,
        description,
        subject_id: subjectId,
        duration_minutes: durationMinutes,
        passing_marks: passingMarks,
        shuffle_questions: shuffleQuestions,
        show_immediate_results: showImmediateResults,
        is_published: isPublished,
        question_ids: selectedQuestionIds,
      });

      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to create exam.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create New Examination</h1>
          <p className="text-sm text-slate-500">
            Define timing rules, select questions from the question bank, and publish for students.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam Settings Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            1. Examination Details & Rules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Exam Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CS101: Midterm Fundamentals Exam"
                className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject Area</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code}: {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide instructions or syllabus topics covered..."
              className="w-full text-xs py-2 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 15)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-slate-400" /> Passing Threshold
              </label>
              <div className="w-full text-xs py-2 px-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-slate-700">
                {passingMarks} Marks (50% of total)
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <label className="text-xs font-bold text-slate-700 mb-2">Publish Status</label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
                Publish immediately to students
              </label>
            </div>
          </div>

          {/* Additional Options */}
          <div className="flex flex-wrap gap-6 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
              />
              <Shuffle className="w-3.5 h-3.5 text-slate-400" />
              Shuffle question order for students
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={showImmediateResults}
                onChange={(e) => setShowImmediateResults(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
              />
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              Show immediate scores & question feedback
            </label>
          </div>
        </div>

        {/* Question Selector Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. Select Questions ({selectedQuestionIds.length} Selected)
              </h2>
              <p className="text-xs text-slate-500">
                Total Marks: <span className="font-extrabold text-brand-600">{totalMarks} Marks</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleSelectAllSubjectQuestions}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 self-start sm:self-auto"
            >
              Toggle Select All Subject Questions
            </button>
          </div>

          {subjectQuestions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No questions found for this subject. Please add questions in the Question Bank first.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {subjectQuestions.map((q) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleSelectQuestion(q.id)}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition flex items-start gap-3 ${
                      isSelected
                        ? 'bg-brand-50/50 border-brand-300 text-brand-900 shadow-sm'
                        : 'bg-slate-50/60 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-brand-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="purple" size="sm">
                          {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                        </Badge>
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="font-semibold">{q.question_text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition disabled:opacity-50 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{submitting ? 'Creating Exam...' : 'Create & Schedule Exam'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
