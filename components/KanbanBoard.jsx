'use client';

import { useState } from 'react';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import appConfig from '@/data/appConfig.json';

const COLUMNS = appConfig.columns;

export default function KanbanBoard({ tasks, onEdit, onDelete, onStatusChange, onOpenNewTaskModal }) {
  // Drag and drop state
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  // Mobile active column tab filter ('all' or column id)
  const [mobileActiveCol, setMobileActiveCol] = useState('all');

  // ── Drag handlers ───────────────────────────────────────────
  const handleDragStart = (e, taskId) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  // ── Drop handlers ───────────────────────────────────────────
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e) => {
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

    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === targetColumnId) return;

    onStatusChange(taskId, targetColumnId);
  };

  const visibleColumns =
    mobileActiveCol === 'all'
      ? COLUMNS
      : COLUMNS.filter((c) => c.id === mobileActiveCol);

  return (
    <div className="space-y-3">
      {/* Mobile Column Switcher (Tab Bar) */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setMobileActiveCol('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            mobileActiveCol === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'card-flat text-slate-400 hover:text-slate-200'
          }`}
        >
          All Columns ({tasks.length})
        </button>
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => t.status === col.id).length;
          const isActive = mobileActiveCol === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setMobileActiveCol(col.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'card-flat text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
              <span>{col.title}</span>
              <span className="opacity-75 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 items-start">
        {visibleColumns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isDragTarget = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              className="kanban-column"
              style={{
                border: isDragTarget
                  ? `2px dashed ${col.accentColor}`
                  : '1px solid var(--border)',
                background: isDragTarget
                  ? `rgba(${
                      col.id === 'todo'
                        ? '251,146,60'
                        : col.id === 'in-progress'
                        ? '59,130,246'
                        : col.id === 'review'
                        ? '168,85,247'
                        : '16,185,129'
                    }, 0.05)`
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
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {col.title}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  >
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onOpenNewTaskModal(col.id)}
                  title={`Add to ${col.title}`}
                  className="btn-icon"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[calc(100vh-280px)]">
                {colTasks.length === 0 ? (
                  <div
                    className="text-center py-8 px-4 rounded-lg border border-dashed transition-all"
                    style={{
                      borderColor: isDragTarget ? col.accentColor : 'var(--border)',
                      color: isDragTarget ? col.accentColor : 'var(--text-muted)',
                    }}
                  >
                    <p className="text-xs sm:text-sm font-medium">
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

                {/* Drop target hint */}
                {isDragTarget && colTasks.length > 0 && (
                  <div
                    className="text-center py-3 rounded-lg border border-dashed text-xs font-semibold"
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
    </div>
  );
}
