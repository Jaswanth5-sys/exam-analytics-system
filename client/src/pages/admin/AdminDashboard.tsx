import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { User, Subject } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  Shield,
  BookOpen,
  Award,
  Plus,
  Trash2,
  Edit,
  Database,
  CheckCircle,
  XCircle,
  Search,
  Activity,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subjects'>('overview');

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'admin' | 'teacher' | 'student',
    status: 'active',
  });
  const [userError, setUserError] = useState<string | null>(null);

  // Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectFormData, setSubjectFormData] = useState({
    code: '',
    name: '',
    description: '',
  });
  const [subjectError, setSubjectError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, subjectsRes] = await Promise.all([
        api.get('/analytics/admin'),
        api.get<{ users: User[] }>('/users'),
        api.get<{ subjects: Subject[] }>('/subjects'),
      ]);
      setStats(statsRes);
      setUsers(usersRes.users || []);
      setSubjects(subjectsRes.subjects || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserModal = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setUserFormData({
        name: u.name,
        email: u.email,
        password: '',
        role: u.role,
        status: u.status || 'active',
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        status: 'active',
      });
    }
    setUserError(null);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, userFormData);
      } else {
        if (!userFormData.password) {
          setUserError('Password is required for new users.');
          return;
        }
        await api.post('/users', userFormData);
      }
      setIsUserModalOpen(false);
      fetchData();
    } catch (err: any) {
      setUserError(err?.message || 'Failed to save user.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user and their associated records?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete user.');
      }
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectError(null);

    try {
      await api.post('/subjects', subjectFormData);
      setIsSubjectModalOpen(false);
      setSubjectFormData({ code: '', name: '', description: '' });
      fetchData();
    } catch (err: any) {
      setSubjectError(err?.message || 'Failed to create subject.');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await api.delete(`/subjects/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete subject.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
              System Administration
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              MonetDB Primary DB
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Platform Operations & User Oversight
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Control user provisioning, subject catalogs, and view system-wide academic performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenUserModal()}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.users?.total || 0}
          subtitle={`${stats?.users?.student || 0} Students • ${stats?.users?.teacher || 0} Teachers`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Quizzes"
          value={stats?.exams?.total || 0}
          subtitle={`${stats?.exams?.published || 0} Published`}
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="Platform Attempts"
          value={stats?.exams?.totalAttempts || 0}
          subtitle={`${stats?.exams?.totalPassed || 0} Passed`}
          icon={Activity}
          color="amber"
        />
        <StatCard
          title="Global Pass Rate"
          value={`${stats?.exams?.passRate || 0}%`}
          subtitle={`Avg Score: ${stats?.exams?.avgScore || 0}%`}
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Subject Volume Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'users'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          User Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'subjects'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Subject Catalog ({subjects.length})
        </button>
      </div>

      {/* Tab 1: Subject Volume Overview */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Subject Assessment Activity</h3>
            <p className="text-xs text-slate-500">Distribution of questions, examinations, and participation volume</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats?.subjectVolume?.map((sv: any) => (
              <div key={sv.code} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="purple" size="md">{sv.code}</Badge>
                  <span className="text-xs font-extrabold text-brand-600">
                    {sv.attempt_count} Student Attempts
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{sv.name}</h4>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60 font-medium">
                  <span>{sv.question_count} Questions in Bank</span>
                  <span>{sv.exam_count} Scheduled Exams</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Platform User Accounts</h3>
              <p className="text-xs text-slate-500">Manage administrator, faculty, and student credentials</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>

              <button
                onClick={() => handleOpenUserModal()}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add User
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={u.role === 'admin' ? 'danger' : u.role === 'teacher' ? 'primary' : 'success'}
                        size="sm"
                      >
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {u.role === 'student' ? `${u.attempts_count || 0} attempts` : `${u.exams_created_count || 0} exams`}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenUserModal(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Subject Catalog */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Curriculum Subject Catalog</h3>
              <p className="text-xs text-slate-500">Academic subject definitions and codes</p>
            </div>
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <div key={sub.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="purple" size="md">{sub.code}</Badge>
                    <button
                      onClick={() => handleDeleteSubject(sub.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">{sub.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{sub.description || 'No description'}</p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 font-medium border-t border-slate-200/60">
                  <span>{sub.question_count || 0} Questions</span>
                  <span>{sub.exam_count || 0} Exams</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? 'Edit User Account' : 'Provision New User'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {userError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {userError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={userFormData.name}
              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              disabled={!!editingUser}
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-medium disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {editingUser ? 'New Password (Leave blank to keep unchanged)' : 'Password'}
            </label>
            <input
              type="password"
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
              placeholder={editingUser ? '••••••••' : 'Enter password'}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as any })}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-medium bg-white"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={userFormData.status}
                onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-medium bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20"
            >
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="Add Academic Subject"
        maxWidth="md"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          {subjectError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {subjectError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code</label>
            <input
              type="text"
              required
              placeholder="e.g. CS401"
              value={subjectFormData.code}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-medium uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Cloud Systems"
              value={subjectFormData.name}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={subjectFormData.description}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, description: e.target.value })}
              placeholder="Brief course summary..."
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubjectModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20"
            >
              Save Subject
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
