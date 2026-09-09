'use client';

import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Plus, CheckSquare, Clock, AlertTriangle
} from 'lucide-react';
import appConfig from '@/data/appConfig.json';

const STATUS_CONFIG = appConfig.statuses;
const PRIORITIES = appConfig.priorities;

export default function CalendarView({ tasks, onEdit, onOpenNewTaskModal }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month & number of days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Group tasks by date string YYYY-MM-DD
  const tasksByDate = {};
  const unscheduledTasks = [];

  tasks.forEach((task) => {
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!tasksByDate[key]) tasksByDate[key] = [];
      tasksByDate[key].push(task);
    } else {
      unscheduledTasks.push(task);
    }
  });

  // Build 35 or 42 grid cells
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthNum = month === 0 ? 12 : month;
    const prevYearNum = month === 0 ? year - 1 : year;
    const dateKey = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      day,
      dateKey,
      isCurrentMonth: false,
      isToday: false,
      tasks: tasksByDate[dateKey] || [],
    });
  }

  // Current month days
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      day,
      dateKey,
      isCurrentMonth: true,
      isToday: dateKey === todayKey,
      tasks: tasksByDate[dateKey] || [],
    });
  }

  // Next month leading days to complete grid
  const remaining = 42 - calendarCells.length;
  for (let day = 1; day <= (remaining >= 7 ? remaining - 7 : remaining); day++) {
    const nextMonthNum = month === 11 ? 1 : month + 2;
    const nextYearNum = month === 11 ? year + 1 : year;
    const dateKey = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      day,
      dateKey,
      isCurrentMonth: false,
      isToday: false,
      tasks: tasksByDate[dateKey] || [],
    });
  }

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Calendar Header / Navigation Controls */}
      <div className="card-flat p-3 sm:p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}
          >
            <CalendarIcon className="w-4 h-4" style={{ color: 'var(--accent-blue-light)' }} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {monthName}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {tasks.filter((t) => t.dueDate).length} scheduled tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={goToToday} className="btn-secondary text-xs py-1.5 px-3">
            Today
          </button>
          <button onClick={prevMonth} className="btn-icon w-8 h-8" title="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="btn-icon w-8 h-8" title="Next month">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="card-flat rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        {/* Weekday Header */}
        <div className="grid grid-cols-7 border-b text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}>
          {WEEKDAYS.map((w, idx) => (
            <div
              key={w}
              className={`py-2 text-[11px] font-semibold uppercase tracking-wider ${
                idx === 0 || idx === 6 ? 'text-amber-500/80' : ''
              }`}
              style={idx !== 0 && idx !== 6 ? { color: 'var(--text-muted)' } : {}}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {calendarCells.map((cell, idx) => (
            <div
              key={idx}
              className={`min-h-[56px] sm:min-h-[85px] md:min-h-[110px] p-1 sm:p-1.5 flex flex-col justify-between transition-colors relative group ${
                cell.isCurrentMonth ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-primary)] opacity-40'
              } ${cell.isToday ? 'ring-1 ring-inset ring-blue-500' : ''}`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={`text-[10px] sm:text-xs font-semibold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full ${
                    cell.isToday
                      ? 'bg-blue-600 text-white shadow-sm'
                      : cell.isCurrentMonth
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {cell.day}
                </span>

                {/* Quick Add Button on Day Hover */}
                {cell.isCurrentMonth && (
                  <button
                    onClick={() => onOpenNewTaskModal('todo')}
                    className="opacity-0 group-hover:opacity-100 btn-icon w-4 h-4 sm:w-5 sm:h-5 transition-opacity hidden sm:flex"
                    title={`Add task for ${cell.dateKey}`}
                  >
                    <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                )}
              </div>

              {/* Day Tasks List */}
              <div className="space-y-0.5 sm:space-y-1 overflow-y-auto max-h-[50px] sm:max-h-[70px] pr-0.5 no-scrollbar flex-1">
                {cell.tasks.map((task) => {
                  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                  const priorityCfg = PRIORITIES[task.priority] || PRIORITIES.medium;
                  return (
                    <div
                      key={task._id}
                      onClick={() => onEdit(task)}
                      className="p-0.5 sm:p-1 rounded text-[9px] sm:text-[11px] font-medium truncate cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-1 shadow-sm"
                      style={{
                        background: 'var(--bg-card)',
                        border: `1px solid ${priorityCfg.color}40`,
                        borderLeft: `2.5px solid ${priorityCfg.color}`,
                        color: 'var(--text-primary)',
                      }}
                      title={`${task.title} (${statusCfg.label})`}
                    >
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unscheduled Tasks Section */}
      {unscheduledTasks.length > 0 && (
        <div className="card-flat p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              📌 Unscheduled Tasks ({unscheduledTasks.length})
            </h3>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Click any task to set a due date
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {unscheduledTasks.map((task) => {
              const priorityCfg = PRIORITIES[task.priority] || PRIORITIES.medium;
              const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

              return (
                <div
                  key={task._id}
                  onClick={() => onEdit(task)}
                  className="p-2.5 rounded-lg border cursor-pointer hover:border-blue-500 transition-all flex items-center justify-between gap-2"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: priorityCfg.color }} />
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {task.title}
                    </span>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: statusCfg.bg, color: statusCfg.color }}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
