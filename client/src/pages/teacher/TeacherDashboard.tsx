import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { BookOpen, Users, Award, TrendingUp, PlusCircle, BarChart2, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const TeacherDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/teacher'),
      api.get('/exams'),
    ])
      .then(([analyticsRes, examsRes]) => {
        setData(analyticsRes);
        setExams(examsRes.exams || []);
      })
      .catch((err) => console.error('Error loading teacher dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const subjectBreakdown = data?.subjectBreakdown || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white shadow-xl shadow-brand-700/15">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-200">Faculty Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Examination Control & Analytics</h1>
          <p className="text-sm text-brand-100 mt-1 max-w-xl">
            Monitor real-time student submissions, create questions, and inspect columnar performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/questions"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition flex items-center gap-2"
          >
            Question Bank
          </Link>
          <Link
            to="/teacher/exams/new"
            className="px-4 py-2.5 rounded-xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-brand-600" />
            Create Exam
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Exams"
          value={metrics.totalExams || 0}
          subtitle="Active & published"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Student Attempts"
          value={metrics.totalAttempts || 0}
          subtitle="Across all quizzes"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Average Score"
          value={`${metrics.avgScore || 0}%`}
          subtitle="Mean performance"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Overall Pass Rate"
          value={`${metrics.passRate || 0}%`}
          subtitle={`${metrics.totalPassed || 0} passed attempts`}
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Analytics Chart & Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Subject Performance Comparison</h3>
              <p className="text-xs text-slate-500">Average student score % aggregated by subject area</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              MonetDB Aggregated
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="code" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Avg Score']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="avgScore" fill="#026bc9" radius={[8, 8, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Subject List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Subject Catalog Overview</h3>
            <p className="text-xs text-slate-500 mb-4">Quizzes and participation volume</p>

            <div className="space-y-3">
              {subjectBreakdown.map((sb: any) => (
                <div key={sb.code} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">{sb.code}</span>
                    <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{sb.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-brand-600">{sb.avgScore}%</span>
                    <p className="text-[10px] text-slate-400">{sb.attemptCount} attempts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/teacher/questions"
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition text-center block"
          >
            Manage Question Bank →
          </Link>
        </div>
      </div>

      {/* Examinations Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Managed Quizzes & Examinations</h3>
            <p className="text-xs text-slate-500">Live quizzes with participation counters and direct analytics access</p>
          </div>
          <Link
            to="/teacher/exams/new"
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 self-start"
          >
            <PlusCircle className="w-4 h-4" />
            New Exam
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Exam Title</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Questions</th>
                <th className="py-3.5 px-4">Attempts</th>
                <th className="py-3.5 px-4">Avg Score</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No exams found. Create your first exam using the button above.
                  </td>
                </tr>
              ) : (
                exams.map((exam: any) => (
                  <tr key={exam.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      <div>{exam.title}</div>
                      {exam.description && (
                        <div className="text-xs text-slate-400 truncate max-w-xs">{exam.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-600">
                      <Badge variant="purple" size="sm">
                        {exam.subject_code || 'CS'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-xs font-medium flex items-center gap-1 mt-4">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {exam.duration_minutes}m
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium text-xs">
                      {exam.question_count || 0} Qs ({exam.total_marks} marks)
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-700 text-xs">
                      {exam.attempts_count || 0}
                    </td>
                    <td className="py-4 px-4">
                      {exam.avg_score_pct !== null && exam.avg_score_pct !== undefined ? (
                        <span className="font-extrabold text-brand-600 text-xs">{Math.round(exam.avg_score_pct)}%</span>
                      ) : (
                        <span className="text-slate-400 text-xs">No attempts</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={exam.is_published ? 'success' : 'slate'} size="sm">
                        {exam.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/teacher/exams/${exam.id}/analytics`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold text-xs transition"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Analytics
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
