'use client';

import {
  CheckCircle2, Clock, Circle, Eye, AlertTriangle,
  TrendingUp, Plus, ArrowRight, Calendar, Layers,
  Target, Zap
} from 'lucide-react';
import appConfig from '@/data/appConfig.json';

const STATUS_CONFIG = appConfig.statuses;
const PRIORITIES = appConfig.priorities;

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function greet(name) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name?.split(' ')[0] || 'there'} 👋`;
}

export default function DashboardView({ user, stats, tasks, onOpenNewTaskModal, onChangeView }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Recent 5 tasks (by created date)
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Overdue tasks
  const overdueTasks = tasks.filter((t) =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  );

  // Tasks due today or tomorrow
  const urgentSoon = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'completed') return false;
    const due = new Date(t.dueDate);
    const diff = (due - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 2;
  });

  // Status breakdown
  const statusBreakdown = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    ...cfg,
    key,
    count: tasks.filter((t) => t.status === key).length,
  }));

  const completionPct = stats?.completionRate || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {greet(user?.name)}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {today}
          </p>
        </div>
        <button
          onClick={() => onOpenNewTaskModal('todo')}
          className="btn-primary text-xs py-1.5 px-3"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Top Stats Row — Compact 2x2 on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          {
            label: 'Total Tasks',
            value: stats?.total || 0,
            icon: Layers,
            color: '#2563eb',
            bg: 'rgba(37,99,235,0.1)',
            sub: `${stats?.completed || 0} done`,
          },
          {
            label: 'In Progress',
            value: stats?.inProgress || 0,
            icon: Clock,
            color: '#06b6d4',
            bg: 'rgba(6,182,212,0.1)',
            sub: 'active tasks',
          },
          {
            label: 'Completion',
            value: `${completionPct}%`,
            icon: Target,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.1)',
            sub: 'overall progress',
          },
          {
            label: 'Urgent',
            value: stats?.urgent || 0,
            icon: Zap,
            color: '#ef4444',
            bg: 'rgba(239,68,68,0.1)',
            sub: `${stats?.overdue || 0} overdue`,
          },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="card-flat p-3 sm:p-4 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5 sm:mb-3">
              <p className="text-[11px] sm:text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </p>
              <div
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: bg }}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
            <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Middle Row: Progress + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Breakdown */}
        <div className="card-flat p-4 rounded-lg lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Status Breakdown
            </h2>
            <button
              onClick={() => onChangeView('kanban')}
              className="btn-ghost text-xs flex items-center gap-1"
              style={{ color: 'var(--accent-blue-light)' }}
            >
              View Board <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {statusBreakdown.map(({ key, label, color, count }) => {
              const pct = stats?.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {count}
                      </span>
                      <span className="text-[10px] w-8 text-right" style={{ color: 'var(--text-muted)' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall progress bar */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Overall Completion
              </span>
              <span className="text-xs font-bold" style={{ color: '#10b981' }}>
                {completionPct}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${completionPct}%`,
                  background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="card-flat p-4 rounded-lg">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Attention Needed
          </h2>

          {overdueTasks.length === 0 && urgentSoon.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: '#10b981' }} />
              <p className="text-xs font-medium" style={{ color: '#10b981' }}>
                All caught up!
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                No overdue or urgent tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueTasks.slice(0, 3).map((t) => (
                <div
                  key={t._id}
                  className="p-2.5 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#f87171' }}>
                        {t.title}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#ef4444' }}>
                        Overdue · {formatDate(t.dueDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {urgentSoon.slice(0, 2).map((t) => (
                <div
                  key={t._id}
                  className="p-2.5 rounded-lg"
                  style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)' }}
                >
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#fb923c' }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#fdba74' }}>
                        {t.title}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#fb923c' }}>
                        Due soon · {formatDate(t.dueDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card-flat rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Tasks
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeView('todolist')}
              className="btn-ghost text-xs flex items-center gap-1"
              style={{ color: 'var(--accent-cyan-light)' }}
            >
              To-Do List <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => onChangeView('kanban')}
              className="btn-ghost text-xs flex items-center gap-1"
              style={{ color: 'var(--accent-blue-light)' }}
            >
              Board <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {recentTasks.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <p className="text-xs">No tasks yet. Create your first task!</p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="block md:hidden divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {recentTasks.map((task) => {
                const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG['todo'];
                const priorityCfg = PRIORITIES[task.priority] || PRIORITIES['medium'];
                return (
                  <div key={task._id} className="p-3 space-y-2 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: priorityCfg.color }}
                        />
                        <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] capitalize font-medium px-1.5 py-0.5 rounded" style={{ background: `${priorityCfg.color}15`, color: priorityCfg.color }}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pl-4">
                      <span
                        className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: statusCfg.bg, color: statusCfg.color }}
                      >
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: statusCfg.dot }} />
                        {statusCfg.label}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{
                          color:
                            task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
                              ? '#ef4444'
                              : 'var(--text-muted)',
                        }}
                      >
                        {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No date'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Task', 'Status', 'Priority', 'Due Date'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task, i) => {
                    const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG['todo'];
                    const priorityCfg = PRIORITIES[task.priority] || PRIORITIES['medium'];
                    return (
                      <tr
                        key={task._id}
                        style={{ borderBottom: i < recentTasks.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: priorityCfg.color }}
                            />
                            <span className="text-xs font-medium truncate max-w-[240px]" style={{ color: 'var(--text-primary)' }}>
                              {task.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full"
                            style={{ background: statusCfg.bg, color: statusCfg.color }}
                          >
                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: statusCfg.dot }} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs capitalize font-medium" style={{ color: priorityCfg.color }}>
                            {task.priority}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-xs"
                          style={{
                            color:
                              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
                                ? '#ef4444'
                                : 'var(--text-secondary)',
                          }}
                        >
                          {task.dueDate ? formatDate(task.dueDate) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
