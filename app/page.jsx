'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/DashboardView';
import TodoListView from '@/components/TodoListView';
import KanbanBoard from '@/components/KanbanBoard';
import CalendarView from '@/components/CalendarView';
import TaskModal from '@/components/TaskModal';
import AuthModal from '@/components/AuthModal';
import VerificationModal from '@/components/VerificationModal';
import { ToastProvider, useToast } from '@/components/Toast';
import { exportTasksToCSV, exportTasksToJSON } from '@/lib/exportUtils';
import navigationConfig from '@/data/navigation.json';
import landingConfig from '@/data/landing.json';
import {
  Search, Filter, LayoutGrid, List, RefreshCcw,
  Layers, Edit3, Trash2, ShieldCheck, LogIn, Sparkles, Plus, Menu,
  Sun, Moon, Calendar as CalendarIcon, Download, FileSpreadsheet, FileCode,
  X as CloseIcon, SlidersHorizontal
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
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list' | 'calendar'

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef(null);

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

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Shortcuts: 'N' -> New Task, '/' -> Search, 'Esc' -> Close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (e.key === 'Escape') {
        setIsTaskModalOpen(false);
        setIsAuthModalOpen(false);
        setIsVerificationModalOpen(false);
        setIsExportOpen(false);
        setShowMobileSearch(false);
        return;
      }
      if (isInput) return;

      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleOpenCreateModal('todo');
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowMobileSearch(true);
        setTimeout(() => {
          const searchEl = document.querySelector('.search-input');
          searchEl?.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // ─── Export handlers ──────────────────────────────────────
  const handleExportCSV = () => {
    exportTasksToCSV(tasks);
    setIsExportOpen(false);
    toast.success('Tasks exported as CSV file');
  };

  const handleExportJSON = () => {
    exportTasksToJSON(tasks);
    setIsExportOpen(false);
    toast.success('Tasks exported as JSON file');
  };

  // ─── Page Title by View ───────────────────────────────────
  const PAGE_TITLE = navigationConfig.pageTitles;

  return (
    <div className="app-layout">
      {/* Sidebar — only shown when logged in */}
      {user && (
        <Sidebar
          user={user}
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
          <>
            <div className="top-bar flex items-center justify-between gap-1.5 sm:gap-3">
              {/* Left: Mobile Hamburger & Page Title */}
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  onClick={() => setMobileOpen(true)}
                  className="btn-icon lg:hidden flex-shrink-0"
                  title="Open Navigation Drawer"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <h1 className="text-sm sm:text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {PAGE_TITLE[activeView] || 'Dashboard'}
                </h1>
              </div>

              {/* Center: Desktop Search & Filters */}
              <div className="hidden lg:flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks... (/)"
                    className="search-input"
                    style={{ width: '180px' }}
                  />
                </div>

                {/* Filters */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select-field"
                >
                  <option value="all">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Under Review</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="select-field"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Right Action Icons & View Switcher */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Mobile Search Toggle Button */}
                {activeView === 'kanban' && (
                  <button
                    onClick={() => setShowMobileSearch(!showMobileSearch)}
                    className={`btn-icon lg:hidden ${showMobileSearch ? 'bg-[var(--bg-hover)] text-blue-400' : ''}`}
                    title="Search & Filters"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* View Switcher (for My Tasks view) */}
                {activeView === 'kanban' && (
                  <div className="view-toggle">
                    <button
                      onClick={() => setViewMode('kanban')}
                      className={`view-toggle-btn px-2 py-1 sm:px-2.5 sm:py-1 ${viewMode === 'kanban' ? 'active' : ''}`}
                      title="Kanban Board"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Board</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`view-toggle-btn px-2 py-1 sm:px-2.5 sm:py-1 ${viewMode === 'list' ? 'active' : ''}`}
                      title="List View"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">List</span>
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`view-toggle-btn px-2 py-1 sm:px-2.5 sm:py-1 ${viewMode === 'calendar' ? 'active' : ''}`}
                      title="Calendar View"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Calendar</span>
                    </button>
                  </div>
                )}

                {/* Export Dropdown */}
                <div className="relative" ref={exportRef}>
                  <button
                    onClick={() => setIsExportOpen(!isExportOpen)}
                    title="Export Tasks"
                    className="btn-icon"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  {isExportOpen && (
                    <div
                      className="absolute right-0 mt-2 w-44 rounded-lg shadow-xl py-1 z-50 border"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                    >
                      <button
                        onClick={handleExportCSV}
                        className="w-full px-3 py-2 text-xs flex items-center gap-2 hover:bg-[var(--bg-hover)] text-left"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Export as CSV</span>
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="w-full px-3 py-2 text-xs flex items-center gap-2 hover:bg-[var(--bg-hover)] text-left"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Export as JSON</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={handleToggleTheme}
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                  className="btn-icon"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>

                {/* New Task Button */}
                <button
                  onClick={() => handleOpenCreateModal('todo')}
                  className="btn-primary py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs"
                  title="Create New Task (Press N)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Task</span>
                </button>
              </div>
            </div>

            {/* Mobile / Tablet Collapsible Search & Filter Row */}
            {(showMobileSearch || searchQuery || statusFilter !== 'all' || priorityFilter !== 'all') && activeView === 'kanban' && (
              <div
                className="lg:hidden px-3 py-2.5 border-b flex flex-wrap items-center gap-2"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
              >
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="input-field text-xs py-1.5"
                    style={{ paddingLeft: '2rem' }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                    >
                      <CloseIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select-field text-xs py-1.5 flex-1 min-w-[100px]"
                >
                  <option value="all">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Under Review</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="select-field text-xs py-1.5 flex-1 min-w-[100px]"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            )}
          </>
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
            <div className="min-h-screen flex items-center justify-center px-4 py-8">
              <div className="w-full max-w-sm text-center">
                {/* Logo */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {landingConfig.app.name}
                </h1>
                <p className="text-xs sm:text-sm mb-6 sm:mb-8" style={{ color: 'var(--text-secondary)' }}>
                  {landingConfig.app.tagline}
                </p>

                {/* Feature List */}
                <div className="space-y-2.5 mb-6 sm:mb-8 text-left">
                  {landingConfig.features.map(({ icon: iconName, label, color }) => {
                    const Icon = LANDING_ICON_MAP[iconName] || ShieldCheck;
                    return (
                      <div key={label} className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                        <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="btn-primary w-full justify-center py-2.5 sm:py-3"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In / Create Account
                </button>

                {/* Theme toggle on landing */}
                <button onClick={handleToggleTheme} className="btn-ghost mt-4 mx-auto text-xs">
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
              ) : activeView === 'todolist' ? (
                /* Dedicated Personal To-Do Checklist View */
                <TodoListView />
              ) : (
                /* My Tasks — Kanban / List / Calendar View */
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
                  ) : viewMode === 'calendar' ? (
                    <CalendarView
                      tasks={tasks}
                      onEdit={handleOpenEditModal}
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
                                <th key={h} className="px-3 sm:px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
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
                                className="border-t cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                                style={{ borderColor: 'var(--border-subtle)' }}
                                onClick={() => handleOpenEditModal(task)}
                              >
                                <td className="px-3 sm:px-4 py-3 font-medium max-w-xs truncate"
                                  style={{ color: 'var(--text-primary)' }}>
                                  {task.title}
                                </td>
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                                  <span className={`status-badge status-${task.status}`}>
                                    {task.status.replace('-', ' ')}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                                  <span className={`badge badge-${task.priority}`}>
                                    {task.priority}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-3 sm:px-4 py-3">
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
                                <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
