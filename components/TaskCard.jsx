'use client';

import { useRef } from 'react';
import { Calendar, CheckSquare, Edit3, Trash2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import appConfig from '@/data/appConfig.json';

const STATUS_ORDER = appConfig.statusOrder;
const PRIORITIES = appConfig.priorities;

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const didDrag = useRef(false);
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskPct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDateObj && dueDateObj < new Date() && task.status !== 'completed';
  const formattedDue = dueDateObj
    ? dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const prevStatus = currentIdx > 0 ? STATUS_ORDER[currentIdx - 1] : null;
  const nextStatus = currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;

  const priorityConfig = PRIORITIES[task.priority] || PRIORITIES.medium;
  const dotColor = priorityConfig.color;

  return (
    <div
      className="kanban-task-card group"
      onMouseDown={() => { didDrag.current = false; }}
      onMouseMove={() => { didDrag.current = true; }}
      onClick={() => { if (!didDrag.current) onEdit(task); }}
      style={{ userSelect: 'none' }}
    >
      {/* Top row: priority dot + title + actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: dotColor }} />
          <h4 className="text-sm sm:text-base font-semibold leading-snug line-clamp-2"
            style={{ color: 'var(--text-primary)' }}>
            {task.title}
          </h4>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit(task)} className="btn-icon w-7 h-7 sm:w-6 sm:h-6" title="Edit">
            <Edit3 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </button>
          <button onClick={() => onDelete(task._id)} className="btn-danger-icon w-7 h-7 sm:w-6 sm:h-6" title="Delete">
            <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs leading-relaxed line-clamp-2 mb-3 pl-4"
          style={{ color: 'var(--text-secondary)' }}>
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 pl-4">
          {task.tags.map((tag, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{
                background: 'rgba(37,99,235,0.1)',
                color: 'var(--accent-blue-light)',
                border: '1px solid rgba(37,99,235,0.2)'
              }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtask progress */}
      {totalSubtasks > 0 && (
        <div className="pl-4 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <CheckSquare className="w-3 h-3" />
              {completedSubtasks}/{totalSubtasks}
            </span>
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {subtaskPct}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${subtaskPct}%` }} />
          </div>
        </div>
      )}

      {/* Footer: due date + quick move */}
      <div className="flex items-center justify-between pt-2 border-t pl-4"
        style={{ borderColor: 'var(--border-subtle)' }}
        onClick={(e) => e.stopPropagation()}>
        {formattedDue ? (
          <div className={`flex items-center gap-1 text-[11px] ${
            isOverdue ? 'text-red-400' : ''
          }`} style={!isOverdue ? { color: 'var(--text-muted)' } : {}}>
            {isOverdue
              ? <AlertCircle className="w-3 h-3" />
              : <Calendar className="w-3 h-3" />
            }
            {formattedDue}
          </div>
        ) : <span />}

        <div className="flex items-center gap-0.5">
          {prevStatus && (
            <button
              onClick={() => onStatusChange(task._id, prevStatus)}
              title={`Move to ${prevStatus}`}
              className="btn-icon w-6 h-6">
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onStatusChange(task._id, nextStatus)}
              title={`Move to ${nextStatus}`}
              className="btn-icon w-6 h-6">
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
