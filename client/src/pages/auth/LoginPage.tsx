import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Database, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, BookOpen } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role: 'admin' | 'teacher' | 'student') => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-brand-500/25">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
          ExamAnalytics
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Online Examination & Academic Performance Intelligence
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          Primary DB: MonetDB 11.55.9 Column Store
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-brand-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              1-Click Demo Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuick('teacher')}
                className="p-2.5 rounded-xl border border-brand-200 bg-brand-50/50 hover:bg-brand-100/70 text-brand-800 transition text-center flex flex-col items-center justify-center group"
              >
                <BookOpen className="w-4 h-4 mb-1 text-brand-600 group-hover:scale-110 transition" />
                <span className="text-xs font-bold">Teacher</span>
                <span className="text-[10px] text-brand-600/80">Prof. Turing</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('student')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-800 transition text-center flex flex-col items-center justify-center group"
              >
                <UserCheck className="w-4 h-4 mb-1 text-emerald-600 group-hover:scale-110 transition" />
                <span className="text-xs font-bold">Student</span>
                <span className="text-[10px] text-emerald-600/80">Alex Johnson</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('admin')}
                className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-800 transition text-center flex flex-col items-center justify-center group"
              >
                <ShieldCheck className="w-4 h-4 mb-1 text-rose-600 group-hover:scale-110 transition" />
                <span className="text-xs font-bold">Admin</span>
                <span className="text-[10px] text-rose-600/80">SysAdmin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
