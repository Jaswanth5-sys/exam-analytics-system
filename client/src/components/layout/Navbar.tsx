import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { GraduationCap, LogOut, Database, UserCheck, Shield, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = async (role: 'admin' | 'teacher' | 'student') => {
    try {
      await quickLogin(role);
      navigate('/');
    } catch (err) {
      console.error('Quick switch error:', err);
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'teacher':
        return 'primary';
      case 'student':
        return 'success';
      default:
        return 'slate';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">ExamAnalytics</span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                <Database className="w-3 h-3 text-emerald-600" /> MonetDB Native
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Columnar Quiz & Assessment Intelligence Platform</p>
          </div>
        </div>

        {/* Quick Role Switcher for seamless paired testing */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Role:
            </span>
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                user?.role === 'admin'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => handleRoleSwitch('teacher')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                user?.role === 'teacher'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Teacher
            </button>
            <button
              onClick={() => handleRoleSwitch('student')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                user?.role === 'student'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Student
            </button>
          </div>

          {/* User profile & logout */}
          {user && (
            <div className="flex items-center gap-3 pl-3 sm:border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                <div className="mt-0.5">
                  <Badge variant={getRoleVariant(user.role)} size="sm">
                    {user.role.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-slate-100 text-brand-700 font-bold flex items-center justify-center text-sm border border-slate-200 shadow-inner">
                {user.name.charAt(0)}
              </div>

              <button
                onClick={logout}
                title="Log Out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
