'use client';

import { useState } from 'react';
import TaskCard from './TaskCard';
import { Circle, Clock, Eye, CheckCircle2, Plus } from 'lucide-react';

const COLUMNS = [
  {
    id: 'todo',
    title: 'To Do',
    dotColor: 'bg-orange-400',
    accentColor: '#fb923c',
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    dotColor: 'bg-blue-400',
    accentColor: '#3b82f6',
  },
  {
    id: 'review',
    title: 'Under Review',
    dotColor: 'bg-purple-400',
    accentColor: '#a855f7',
  },
  {
    id: 'completed',
    title: 'Completed',
    dotColor: 'bg-emerald-400',
    accentColor: '#10b981',
  },
];

export default function KanbanBoard({ tasks, onEdit, onDelete, onStatusChange, onOpenNewTaskModal }) {
  // Which column is currently being dragged over
  const [dragOverColumn, setDragOverColumn] = useState(null);
  // The task being dragged
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  // ── Drag handlers (attached to TaskCard wrapper) ──────────────
  const handleDragStart = (e, taskId) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  // ── Drop handlers (attached to column) ───────────────────────
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the column entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    setDragOverColumn(null);
    setDraggingTaskId(null);

    if (!taskId) return;

    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === targetColumnId) return; // No change needed

    onStatusChange(taskId, targetColumnId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const isDragTarget = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            className="kanban-column"
            style={{
              maxHeight: 'calc(100vh - 260px)',
              border: isDragTarget
                ? `2px dashed ${col.accentColor}`
                : '1px solid var(--border)',
              background: isDragTarget
                ? `rgba(${col.id === 'todo' ? '251,146,60' : col.id === 'in-progress' ? '59,130,246' : col.id === 'review' ? '168,85,247' : '16,185,129'}, 0.04)`
                : 'var(--bg-secondary)',
              transition: 'border 0.15s, background 0.15s',
              borderRadius: '10px',
            }}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="kanban-column-header">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {col.title}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onOpenNewTaskModal(col.id)}
                title={`Add to ${col.title}`}
                className="btn-icon"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto space-y-2.5">
              {colTasks.length === 0 ? (
                <div
                  className="text-center py-10 px-4 rounded-lg border border-dashed transition-all"
                  style={{
                    borderColor: isDragTarget ? col.accentColor : 'var(--border)',
                    color: isDragTarget ? col.accentColor : 'var(--text-muted)',
                  }}
                >
                  <p className="text-xs font-medium">
                    {isDragTarget ? '⬇ Drop here' : 'No tasks here'}
                  </p>
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      opacity: draggingTaskId === task._id ? 0.4 : 1,
                      cursor: 'grab',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <TaskCard
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                    />
                  </div>
                ))
              )}

              {/* Drop zone hint at bottom when dragging over a non-empty column */}
              {isDragTarget && colTasks.length > 0 && (
                <div
                  className="text-center py-3 rounded-lg border border-dashed text-xs font-medium"
                  style={{ borderColor: col.accentColor, color: col.accentColor }}
                >
                  ⬇ Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
