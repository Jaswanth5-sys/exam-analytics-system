import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  History,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const StudentHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/attempts/my-history'),
      api.get('/analytics/student'),
    ])
      .then(([histRes, analRes]) => {
        setHistory(histRes.history || []);
        setMetrics(histRes.metrics || {});
        setAnalytics(analRes || {});
      })
      .catch((err) => console.error('Error fetching student history:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  const trendData = analytics?.trend || [];
  const subjectStats = analytics?.subjectStats || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Examination History & Academic Growth
        </h1>
        <p className="text-sm text-slate-500">
          Track your test score trajectories, subject strengths, and inspect completed assessments.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Examinations Taken"
          value={metrics.totalTaken || 0}
          subtitle="All completed attempts"
          icon={History}
          color="blue"
        />
        <StatCard
          title="Passed Assessments"
          value={metrics.passedCount || 0}
          subtitle={`${metrics.totalTaken - metrics.passedCount || 0} below threshold`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Average Score"
          value={`${metrics.avgScore || 0}%`}
          subtitle="Cohort benchmark"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Overall Success Rate"
          value={`${metrics.passRate || 0}%`}
          subtitle="Cumulative pass %"
          icon={Award}
          color="purple"
        />
      </div>

      {/* Score Trend Chart */}
      {trendData.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Performance Trajectory Over Time</h3>
              <p className="text-xs text-slate-500">Chronological score trends across examinations</p>
            </div>
            <span className="text-xs font-bold text-slate-400">Score %</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Score']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#026bc9"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#026bc9' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Subject Strengths */}
      {subjectStats.length > 0 && (
        <div>
          <h3 className="font-bold text-base text-slate-900 mb-3">Subject Proficiency</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.map((s: any) => (
              <div key={s.code} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="purple" size="sm">{s.code}</Badge>
                  <span className="text-xs font-bold text-brand-600">{s.avgScore}% Avg</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800">{s.subject}</h4>
                <div className="pt-2 flex justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span>{s.attempts} {s.attempts === 1 ? 'Attempt' : 'Attempts'}</span>
                  <span>Highest: <b className="text-slate-800">{s.highestScore}%</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">Completed Assessments Log</h3>
          <p className="text-xs text-slate-500">Review your past scores and answer breakdowns</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Exam Title</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-6">Completed On</th>
                <th className="py-3 px-6 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No completed examination records found yet.
                  </td>
                </tr>
              ) : (
                history.map((h: any) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {h.exam_title}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="purple" size="sm">{h.subject_code}</Badge>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-700">
                      {h.total_score} / {h.total_marks}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-brand-600 text-sm">
                      {h.percentage}%
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={h.passed ? 'success' : 'danger'} size="sm">
                        {h.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {h.submitted_at ? new Date(h.submitted_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/attempts/${h.id}/result`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold transition"
                      >
                        Review Result <ArrowRight className="w-3.5 h-3.5" />
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
