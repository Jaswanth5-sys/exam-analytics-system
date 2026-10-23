import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Question, Subject } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    subject_id: '',
    question_text: '',
    marks: 1.0,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    explanation: '',
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ],
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedSubject, selectedDifficulty]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let qUrl = '/questions?';
      if (selectedSubject) qUrl += `subject_id=${selectedSubject}&`;
      if (selectedDifficulty) qUrl += `difficulty=${selectedDifficulty}&`;
      if (search) qUrl += `search=${encodeURIComponent(search)}&`;

      const [qRes, sRes] = await Promise.all([
        api.get<{ questions: Question[] }>(qUrl),
        api.get<{ subjects: Subject[] }>('/subjects'),
      ]);
      setQuestions(qRes.questions || []);
      setSubjects(sRes.subjects || []);
      if (!formData.subject_id && sRes.subjects?.length > 0) {
        setFormData(prev => ({ ...prev, subject_id: sRes.subjects[0].id }));
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      subject_id: subjects[0]?.id || '',
      question_text: '',
      marks: 1.0,
      difficulty: 'medium',
      explanation: '',
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
      ],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingId(q.id);
    setFormData({
      subject_id: q.subject_id,
      question_text: q.question_text,
      marks: q.marks,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
      options: q.options && q.options.length > 0
        ? q.options.map(o => ({ option_text: o.option_text, is_correct: !!o.is_correct }))
        : [
            { option_text: '', is_correct: true },
            { option_text: '', is_correct: false },
          ],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...formData.options];
    updated[index].option_text = text;
    setFormData({ ...formData, options: updated });
  };

  const handleCorrectOptionSelect = (index: number) => {
    const updated = formData.options.map((opt, i) => ({
      ...opt,
      is_correct: i === index,
    }));
    setFormData({ ...formData, options: updated });
  };

  const handleAddOption = () => {
    if (formData.options.length < 6) {
      setFormData({
        ...formData,
        options: [...formData.options, { option_text: '', is_correct: false }],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length > 2) {
      const updated = formData.options.filter((_, i) => i !== index);
      // Ensure at least one is correct
      if (!updated.some(o => o.is_correct)) {
        updated[0].is_correct = true;
      }
      setFormData({ ...formData, options: updated });
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.question_text.trim()) {
      setFormError('Question text cannot be empty.');
      return;
    }

    if (formData.options.some(o => !o.option_text.trim())) {
      setFormError('All options must contain text.');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/questions/${editingId}`, formData);
      } else {
        await api.post('/questions', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save question.');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await api.delete(`/questions/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete question.');
      }
    }
  };

  const getDifficultyVariant = (diff: string) => {
    switch (diff) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'danger';
      default:
        return 'slate';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Question Bank</h1>
          <p className="text-sm text-slate-500">
            Curate objective multiple-choice items, configure scoring, and attach learning explanations.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search questions by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.code}: {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No questions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or add new multiple choice questions to the bank.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <Badge variant="purple" size="sm">
                    {q.subject_code || 'CS'}
                  </Badge>
                  <Badge variant={getDifficultyVariant(q.difficulty)} size="sm">
                    {q.difficulty.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-bold text-slate-500">
                    {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm font-bold text-slate-800 leading-relaxed">
                {q.question_text}
              </p>

              {/* Options Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {q.options?.map((opt, optIdx) => (
                  <div
                    key={opt.id || optIdx}
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                      opt.is_correct
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-semibold'
                        : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}
                  >
                    {opt.is_correct ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className="truncate">{opt.option_text}</span>
                  </div>
                ))}
              </div>

              {q.explanation && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-100">
                  <span className="font-bold text-slate-700">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Question' : 'Create New Question'}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code}: {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Marks</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="20"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) || 1.0 })}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-medium text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Question Text</label>
            <textarea
              rows={3}
              required
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Enter the examination question prompt..."
              className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          {/* Options Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                Options (Select the correct option with the radio button)
              </label>
              {formData.options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              )}
            </div>

            <div className="space-y-2">
              {formData.options.map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_option"
                    checked={opt.is_correct}
                    onChange={() => handleCorrectOptionSelect(optIndex)}
                    className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    title="Mark as correct answer"
                  />
                  <input
                    type="text"
                    required
                    placeholder={`Option ${optIndex + 1}`}
                    value={opt.option_text}
                    onChange={(e) => handleOptionTextChange(optIndex, e.target.value)}
                    className={`flex-1 text-xs py-2 px-3 rounded-xl border ${
                      opt.is_correct ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-brand-500`}
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(optIndex)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Learning Explanation (Shown to students upon permitted result review)
            </label>
            <textarea
              rows={2}
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Why is this answer correct? Provide context for the student..."
              className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition"
            >
              {editingId ? 'Save Changes' : 'Create Question'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
