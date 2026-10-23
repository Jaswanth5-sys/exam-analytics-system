import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ExamAnalytics } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  Award,
  TrendingUp,
  BarChart2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const ExamAnalyticsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [data, setData] = useState<ExamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');

  useEffect(() => {
    if (!examId) return;
    api.get<ExamAnalytics>(`/analytics/exam/${examId}`)
      .then(setData)
      .catch((err) => console.error('Error fetching analytics:', err))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Analytics not found for this examination.</p>
        <Link to="/" className="mt-3 text-brand-600 font-bold text-xs inline-block">
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  const { exam, summary, distribution, questionAccuracy, attempts } = data;

  const pieData = [
    { name: 'Passed', value: summary.passedCount, color: '#10b981' },
    { name: 'Failed', value: summary.failedCount, color: '#f43f5e' },
  ];

  // Filter student attempts table
  const filteredAttempts = attempts.filter((att) => {
    const matchesSearch =
      att.student_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      att.student_email.toLowerCase().includes(studentSearch.toLowerCase());
    if (statusFilter === 'passed') return matchesSearch && att.passed;
    if (statusFilter === 'failed') return matchesSearch && !att.passed;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Top Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{exam.title}</h1>
              <Badge variant="purple" size="sm">{exam.subject_code || 'CS'}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Duration: {exam.duration_minutes}m • Total Marks: {exam.total_marks} • Passing Marks: {exam.passing_marks}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            MonetDB Columnar Metrics
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Attempts"
          value={summary.totalAttempts}
          subtitle={`${summary.passedCount} Passed / ${summary.failedCount} Failed`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Pass Rate"
          value={`${summary.passRate}%`}
          subtitle="Passing Threshold: 50%"
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Average Score"
          value={`${summary.avgScore}%`}
          subtitle={`Median: ${summary.medianScore}%`}
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Score Range"
          value={`${summary.lowestScore}% - ${summary.highestScore}%`}
          subtitle="Min to Max Score"
          icon={BarChart2}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Score Distribution Histogram</h3>
              <p className="text-xs text-slate-500">Number of student attempts grouped into performance brackets</p>
            </div>
            <span className="text-xs font-bold text-slate-400">5 Brackets</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} Students`, 'Count']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#026bc9" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pass vs Fail Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Pass vs Fail Ratio</h3>
            <p className="text-xs text-slate-500 mb-2">Overall cohort mastery</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {summary.totalAttempts === 0 ? (
              <p className="text-xs text-slate-400">No submission records yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} Students`, name]}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Passed</span>
              <span className="font-extrabold text-emerald-600 text-base">{summary.passedCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Failed</span>
              <span className="font-extrabold text-rose-600 text-base">{summary.failedCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pass %</span>
              <span className="font-extrabold text-brand-600 text-base">{summary.passRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Accuracy & Item Difficulty Analysis */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Question-by-Question Accuracy & Item Analysis</h3>
          <p className="text-xs text-slate-500">
            Columnar aggregation showing percentage of students answering each question correctly. Identifies tough questions.
          </p>
        </div>

        <div className="space-y-3">
          {questionAccuracy.map((qa, i) => (
            <div key={qa.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                    Q{qa.order}
                  </span>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{qa.text}</span>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-slate-500">{qa.marks} marks</span>
                  <span className="font-extrabold text-slate-800">
                    {qa.accuracyPct}% Accuracy ({qa.correctAnswers}/{qa.totalAnswers})
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    qa.accuracyPct >= 70
                      ? 'bg-emerald-500'
                      : qa.accuracyPct >= 40
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${qa.accuracyPct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Attempt Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Student Submissions & Score Leaderboard</h3>
            <p className="text-xs text-slate-500">Individual student attempt log</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('passed')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'passed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                Passed
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'failed' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                Failed
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Rank</th>
                <th className="py-3 px-6">Student Name</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6">Submitted At</th>
                <th className="py-3 px-6 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching student attempt records found.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((att, index) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-6 font-bold text-slate-400">
                      #{index + 1}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-800">{att.student_name}</div>
                      <div className="text-[10px] text-slate-400">{att.student_email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {att.total_score} / {exam.total_marks}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-brand-600 text-sm">
                        {att.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={att.passed ? 'success' : 'danger'} size="sm">
                        {att.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {att.submitted_at ? new Date(att.submitted_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/attempts/${att.id}/result`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition inline-block"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
