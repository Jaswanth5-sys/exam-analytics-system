import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  HelpCircle,
  PlusCircle,
  History,
  Users,
  BookOpen,
  BarChart3,
  Award,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100 font-bold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        {/* Navigation Groups */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            <NavLink to="/" end className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            {/* Teacher Specific */}
            {(user.role === 'teacher' || user.role === 'admin') && (
              <>
                <NavLink to="/teacher/questions" className={linkClass}>
                  <HelpCircle className="w-4 h-4" />
                  <span>Question Bank</span>
                </NavLink>
                <NavLink to="/teacher/exams/new" className={linkClass}>
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Exam</span>
                </NavLink>
              </>
            )}

            {/* Student Specific */}
            {user.role === 'student' && (
              <NavLink to="/student/history" className={linkClass}>
                <History className="w-4 h-4" />
                <span>My Results & Progress</span>
              </NavLink>
            )}

            {/* Admin Specific */}
            {user.role === 'admin' && (
              <>
                <NavLink to="/admin/users" className={linkClass}>
                  <Users className="w-4 h-4" />
                  <span>User Management</span>
                </NavLink>
                <NavLink to="/admin/subjects" className={linkClass}>
                  <BookOpen className="w-4 h-4" />
                  <span>Subject Catalog</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Database Status Info Box */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-brand-50/40 border border-slate-200/80 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MonetDB Connected</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Direct MAPI TCP connection to local MonetDB 11.55.9. Columnar analytics engine active.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-center">
        <p className="text-[11px] font-medium text-slate-400">ExamAnalytics v1.0</p>
        <p className="text-[10px] text-slate-400">High-Performance Assessment</p>
      </div>
    </aside>
  );
};
