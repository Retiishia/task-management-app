'use client';

import { useState } from 'react';
import {
  CheckSquare, Square, Plus, Trash2, Edit3, Calendar,
  AlertCircle, CheckCircle2, Filter, Sparkles, Clock, Layers
} from 'lucide-react';
import appConfig from '@/data/appConfig.json';

const PRIORITIES = appConfig.priorities;

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TodoListView({
  tasks,
  onSaveTask,
  onDeleteTask,
  onStatusChange,
  onEditTask,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Filter tasks
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const activeTasks = tasks.filter((t) => t.status !== 'completed');

  const filteredTasks =
    filter === 'active'
      ? activeTasks
      : filter === 'completed'
      ? completedTasks
      : tasks;

  const totalCount = tasks.length;
  const completedCount = completedTasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Quick inline add
  const handleQuickAdd = async (e) => {
    e?.preventDefault();
    if (!newTitle.trim() || isAdding) return;

    setIsAdding(true);
    try {
      await onSaveTask({
        title: newTitle.trim(),
        description: '',
        status: 'todo',
        priority: newPriority,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
        tags: [],
        subtasks: [],
      });
      setNewTitle('');
      setNewDueDate('');
      setNewPriority('medium');
    } finally {
      setIsAdding(false);
    }
  };

  // Toggle complete
  const handleToggle = (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    onStatusChange(task._id, nextStatus);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header & Progress Card */}
      <div className="card-flat p-4 sm:p-5 rounded-xl">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}
            >
              <CheckSquare className="w-4 h-4" style={{ color: 'var(--accent-blue-light)' }} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                To-Do Checklist
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {completedCount} of {totalCount} items completed ({progressPct}%)
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full font-mono"
            style={{
              background: progressPct === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(37,99,235,0.12)',
              color: progressPct === 100 ? '#34d399' : 'var(--accent-blue-light)',
            }}>
            {progressPct}% Done
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: progressPct === 100 ? '#10b981' : 'linear-gradient(90deg, #2563eb, #06b6d4)',
            }}
          />
        </div>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleQuickAdd} className="card-flat p-3 sm:p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a new to-do and press Enter..."
            className="input-field flex-1"
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || isAdding}
            className="btn-primary flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add To-Do</span>
          </button>
        </div>

        {/* Quick Options (Priority + Due Date) */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--text-muted)' }}>Priority:</span>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="select-field text-xs py-1"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--text-muted)' }}>Due:</span>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="select-field text-xs py-1 cursor-pointer"
            />
          </div>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-tertiary p-1 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'active', label: `Active (${activeTasks.length})` },
            { id: 'completed', label: `Completed (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Checklist */}
      {filteredTasks.length === 0 ? (
        <div className="card-flat p-10 text-center rounded-xl">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" style={{ color: 'var(--accent-blue-light)' }} />
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {filter === 'completed'
              ? 'No completed to-dos yet'
              : filter === 'active'
              ? 'All caught up! No active to-dos.'
              : 'No to-dos yet'}
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {filter === 'all' && 'Add your first to-do item above to start checking things off!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'completed';
            const priorityCfg = PRIORITIES[task.priority] || PRIORITIES.medium;
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

            return (
              <div
                key={task._id}
                className={`card-flat p-3 sm:p-4 rounded-xl flex items-center justify-between gap-3 transition-all ${
                  isDone ? 'opacity-65' : ''
                }`}
                style={{
                  borderLeft: `4px solid ${isDone ? '#10b981' : priorityCfg.color}`,
                }}
              >
                {/* Left: Checkbox & Details */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggle(task)}
                    className="mt-0.5 text-slate-400 hover:text-blue-400 transition-colors flex-shrink-0"
                    title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium leading-snug break-words ${
                        isDone ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </p>

                    {task.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata tags: Priority, Due Date, Subtasks */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px]">
                      <span
                        className="px-2 py-0.5 rounded font-semibold uppercase tracking-wider"
                        style={{
                          background: priorityCfg.bg,
                          color: priorityCfg.color,
                          border: `1px solid ${priorityCfg.border}`,
                        }}
                      >
                        {task.priority}
                      </span>

                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                            isOverdue
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                              : 'text-slate-400'
                          }`}
                        >
                          {isOverdue ? (
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                          ) : (
                            <Calendar className="w-3 h-3" />
                          )}
                          <span>{formatDate(task.dueDate)}</span>
                        </span>
                      )}

                      {task.subtasks?.length > 0 && (
                        <span className="text-slate-400">
                          {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onEditTask(task)}
                    className="btn-icon w-8 h-8"
                    title="Edit To-Do"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task._id)}
                    className="btn-danger-icon w-8 h-8"
                    title="Delete To-Do"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
