'use client';

import { useState } from 'react';
import TaskCard from './TaskCard';
import { Plus, Compass, Circle, Clock, Eye, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import appConfig from '@/data/appConfig.json';

const COLUMNS = appConfig.columns;

const ICON_MAP = {
  Compass,
  Circle,
  Clock,
  Eye,
  CheckCircle2,
};

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
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  // ── Drop handlers ───────────────────────────────────────────
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDragOverColumn(null);
    setDraggingTaskId(null);

    if (!taskId) return;

    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === targetColumnId) return;

    onStatusChange(taskId, targetColumnId);
  };

  const isMobileFilterActive = mobileActiveCol !== 'all';
  const visibleColumns = isMobileFilterActive
    ? COLUMNS.filter((c) => c.id === mobileActiveCol)
    : COLUMNS;

  return (
    <div className="space-y-3.5">
      {/* Mobile Column Quick Switcher (Pill Tabs) */}
      <div className="flex xl:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        <button
          onClick={() => setMobileActiveCol('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            mobileActiveCol === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'card-flat text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>All Columns ({tasks.length})</span>
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

      {/* Columns Container — Horizontal swipe on mobile/tablet, 5-col grid on desktop */}
      <div className={`${isMobileFilterActive ? 'grid grid-cols-1 gap-4' : 'kanban-board-container'}`}>
        {visibleColumns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isDragTarget = dragOverColumn === col.id;
          const Icon = ICON_MAP[col.icon] || Circle;

          return (
            <div
              key={col.id}
              className={`kanban-column ${!isMobileFilterActive ? 'kanban-column-responsive' : ''}`}
              style={{
                border: isDragTarget
                  ? `2px dashed ${col.accentColor}`
                  : '1px solid var(--border)',
                background: isDragTarget
                  ? `${col.accentColor}10`
                  : 'var(--bg-secondary)',
                transition: 'border-color 0.15s, background-color 0.15s',
                borderRadius: '10px',
                minHeight: '260px',
              }}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="kanban-column-header">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col.dotColor}`} />
                  <span className="text-xs sm:text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {col.title}
                  </span>
                  <span
                    className="text-[11px] px-1.5 py-0.2 rounded-full font-mono font-semibold"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  >
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onOpenNewTaskModal(col.id)}
                  title={`Add task to ${col.title}`}
                  className="btn-icon w-6 h-6 flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[calc(100vh-270px)] pr-0.5">
                {colTasks.length === 0 ? (
                  <div
                    className="text-center py-10 px-3 rounded-lg border border-dashed transition-all"
                    style={{
                      borderColor: isDragTarget ? col.accentColor : 'var(--border-subtle)',
                      color: isDragTarget ? col.accentColor : 'var(--text-muted)',
                      backgroundColor: isDragTarget ? `${col.accentColor}08` : 'transparent',
                    }}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs font-medium">
                      {isDragTarget ? '⬇ Drop here' : 'No tasks'}
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
                        opacity: draggingTaskId === task._id ? 0.35 : 1,
                        cursor: 'grab',
                        transition: 'opacity 0.15s, transform 0.15s',
                        transform: draggingTaskId === task._id ? 'scale(0.98)' : 'scale(1)',
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

                {/* Drop target hint when non-empty */}
                {isDragTarget && colTasks.length > 0 && (
                  <div
                    className="text-center py-2.5 rounded-lg border border-dashed text-xs font-semibold"
                    style={{ borderColor: col.accentColor, color: col.accentColor, background: `${col.accentColor}12` }}
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
