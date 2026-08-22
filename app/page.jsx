'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/DashboardView';
import MetricsOverview from '@/components/MetricsOverview';
import KanbanBoard from '@/components/KanbanBoard';
import TaskModal from '@/components/TaskModal';
import AuthModal from '@/components/AuthModal';
import VerificationModal from '@/components/VerificationModal';
import { ToastProvider, useToast } from '@/components/Toast';
import navigationConfig from '@/data/navigation.json';
import landingConfig from '@/data/landing.json';
import {
  Search, Filter, LayoutGrid, List, RefreshCcw,
  Layers, Edit3, Trash2, ShieldCheck, LogIn, Sparkles, Plus, Menu
} from 'lucide-react';

const LANDING_ICON_MAP = {
  ShieldCheck,
  Layers,
  Sparkles,
};

function TaskManagementApp() {
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [viewMode, setViewMode] = useState('kanban');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [defaultModalStatus, setDefaultModalStatus] = useState('todo');

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.documentElement.className = saved;
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.className = next;
    toast.info(`Switched to ${next} mode`);
  };

  // Auth
  const checkAuthUser = useCallback(async () => {
    try {
      setIsAuthLoading(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.success && data.user ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => { checkAuthUser(); }, [checkAuthUser]);

  // Tasks
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingTasks(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user, searchQuery, statusFilter, priorityFilter, toast]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    if (user) { fetchTasks(); fetchStats(); }
    else { setTasks([]); setStats(null); }
  }, [user, fetchTasks, fetchStats]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setTasks([]);
    setStats(null);
    toast.info('Signed out successfully');
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Sample tasks generated!');
        await fetchTasks();
        await fetchStats();
      } else {
        toast.error(data.error || 'Failed to seed data');
      }
    } catch (err) {
      toast.error('Failed to seed sample data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenCreateModal = (status = 'todo') => {
    setTaskToEdit(null);
    setDefaultModalStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData, id) => {
    const res = await fetch(id ? `/api/tasks/${id}` : '/api/tasks', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to save task');
    toast.success(id ? 'Task updated!' : 'Task created successfully!');
    await fetchTasks();
    await fetchStats();
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      toast.success('Task deleted');
      await fetchTasks();
      await fetchStats();
    } else {
      toast.error(result.error || 'Failed to delete task');
    }
  };

  // Optimistic status update for drag-and-drop & arrows
  const handleStatusChange = async (id, newStatus) => {
    // 1. Optimistically update local UI immediately
    setTasks((prev) =>
      prev.map((t) => (t._id === id ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error('Failed to move task');
        await fetchTasks(); // Revert on failure
      } else {
        const readableStatus = newStatus.replace('-', ' ');
        toast.success(`Moved to ${readableStatus}`);
        fetchStats();
      }
    } catch (err) {
      toast.error('Error updating task status');
      await fetchTasks();
    }
  };

  // ─── Page Title by View ───────────────────────────────────
  const PAGE_TITLE = navigationConfig.pageTitles;

  return (
    <div className="app-layout">
      {/* Sidebar — only shown when logged in */}
      {user && (
        <Sidebar
          user={user}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onLogout={handleLogout}
          onOpenNewTaskModal={handleOpenCreateModal}
          onSeedData={handleSeedData}
          isSeeding={isSeeding}
          activeView={activeView}
          onChangeView={setActiveView}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={user ? 'main-content' : 'flex-1'}>
        {/* Top Bar */}
        {user && (
          <div className="top-bar">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="btn-icon lg:hidden mr-1"
              title="Open Navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex-1">
              <h1 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {PAGE_TITLE[activeView] || 'Dashboard'}
              </h1>
            </div>

            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="search-input"
                style={{ width: '200px' }}
              />
            </div>

            {/* Filters */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-field hidden md:block"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Under Review</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="select-field hidden md:block"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* View Switcher (for My Tasks view) */}
            {activeView === 'kanban' && (
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Board</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            )}

            {/* New Task Button */}
            <button
              onClick={() => handleOpenCreateModal('todo')}
              className="btn-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        )}

        {/* Page Body */}
        <div className="page-content">
          {isAuthLoading ? (
            /* Loading */
            <div className="flex flex-col items-center justify-center py-32">
              <RefreshCcw className="w-6 h-6 animate-spin mb-3" style={{ color: 'var(--accent-blue)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            </div>

          ) : !user ? (
            /* Landing / Auth Screen */
            <div className="min-h-screen flex items-center justify-center px-4">
              <div className="w-full max-w-sm text-center">
                {/* Logo */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
                  <Sparkles className="w-8 h-8 text-white" />
                </div>

                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {landingConfig.app.name}
                </h1>
                <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                  {landingConfig.app.tagline}
                </p>

                {/* Feature List */}
                <div className="space-y-3 mb-8 text-left">
                  {landingConfig.features.map(({ icon: iconName, label, color }) => {
                    const Icon = LANDING_ICON_MAP[iconName] || ShieldCheck;
                    return (
                      <div key={label} className="flex items-center gap-3 p-3 rounded-lg"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="btn-primary w-full justify-center py-3"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In / Create Account
                </button>

                {/* Theme toggle on landing */}
                <button onClick={handleToggleTheme} className="btn-ghost mt-4 mx-auto">
                  {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
              </div>
            </div>

          ) : (
            /* Authenticated Views */
            <>
              {activeView === 'dashboard' ? (
                /* Dashboard Overview */
                <DashboardView
                  user={user}
                  stats={stats}
                  tasks={tasks}
                  onOpenNewTaskModal={handleOpenCreateModal}
                  onChangeView={setActiveView}
                />
              ) : activeView === 'analytics' ? (
                /* Analytics — shows metrics overview */
                <>
                  <MetricsOverview stats={stats} />
                  <div className="card-flat rounded-lg p-8 text-center mt-4">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      More detailed analytics coming soon! Check the Dashboard for real-time progress.
                    </p>
                  </div>
                </>
              ) : (
                /* My Tasks — Kanban / List View */
                <>
                  {isLoadingTasks ? (
                    <div className="flex items-center justify-center py-20">
                      <RefreshCcw className="w-5 h-5 animate-spin mr-2" style={{ color: 'var(--accent-blue)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Loading tasks...
                      </span>
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="empty-state">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: 'rgba(37,99,235,0.1)' }}>
                        <Layers className="w-6 h-6" style={{ color: 'var(--accent-blue-light)' }} />
                      </div>
                      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        No tasks yet
                      </h3>
                      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                          ? 'No tasks match your filters.'
                          : 'Create your first task or seed some sample data to get started.'}
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button onClick={handleSeedData} disabled={isSeeding} className="btn-secondary">
                          {isSeeding ? 'Seeding...' : 'Seed Sample Data'}
                        </button>
                        <button onClick={() => handleOpenCreateModal('todo')} className="btn-primary">
                          <Plus className="w-3.5 h-3.5" />
                          Create Task
                        </button>
                      </div>
                    </div>
                  ) : viewMode === 'kanban' ? (
                    <KanbanBoard
                      tasks={tasks}
                      onEdit={handleOpenEditModal}
                      onDelete={handleDeleteTask}
                      onStatusChange={handleStatusChange}
                      onOpenNewTaskModal={handleOpenCreateModal}
                    />
                  ) : (
                    /* List View */
                    <div className="card-flat overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                              {['Title', 'Status', 'Priority', 'Due Date', 'Tags', ''].map((h) => (
                                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                  style={{ color: 'var(--text-muted)' }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tasks.map((task) => (
                              <tr
                                key={task._id}
                                className="border-t cursor-pointer"
                                style={{ borderColor: 'var(--border-subtle)' }}
                                onClick={() => handleOpenEditModal(task)}
                              >
                                <td className="px-4 py-3 font-medium max-w-xs truncate"
                                  style={{ color: 'var(--text-primary)' }}>
                                  {task.title}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`status-badge status-${task.status}`}>
                                    {task.status.replace('-', ' ')}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`badge badge-${task.priority}`}>
                                    {task.priority}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {task.tags?.map((t, i) => (
                                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                                        style={{
                                          background: 'rgba(37,99,235,0.1)',
                                          color: 'var(--accent-blue-light)',
                                        }}>
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleOpenEditModal(task)} className="btn-icon">
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteTask(task._id)} className="btn-danger-icon">
                                      <Trash2 className="w-3.5 h-3.5" />
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
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        initialStatus={defaultModalStatus}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authUser) => {
          setUser(authUser);
          toast.success(`Welcome back, ${authUser.name || 'user'}!`);
          fetchTasks();
          fetchStats();
        }}
        onRequireVerification={(email) => {
          setVerificationEmail(email);
          setIsVerificationModalOpen(true);
        }}
      />

      <VerificationModal
        isOpen={isVerificationModalOpen}
        email={verificationEmail}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerificationSuccess={(authUser) => {
          setUser(authUser);
          toast.success('Account verified successfully!');
          fetchTasks();
          fetchStats();
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <TaskManagementApp />
    </ToastProvider>
  );
}
