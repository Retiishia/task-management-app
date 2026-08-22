'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, Square, Plus, Trash2, Edit3, CheckCircle2,
  RefreshCcw, Sparkles, Tag, ShoppingCart, Utensils,
  User, Dumbbell, Home as HomeIcon, Check
} from 'lucide-react';
import { useToast } from '@/components/Toast';

const DEFAULT_CATEGORIES = [
  { name: 'General',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { name: 'Cooking',  color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  { name: 'Shopping', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { name: 'Personal', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  { name: 'Fitness',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { name: 'Home',     color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
];

export default function TodoListView() {
  const toast = useToast();

  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'

  // Input states
  const [text, setText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Fetch todos from /api/todos
  const fetchTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/todos');
      const data = await res.json();
      if (data.success) {
        setTodos(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load to-dos');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Create new to-do
  const handleAddTodo = async (e) => {
    e?.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const tempId = 'temp-' + Date.now();
    const newTodo = {
      _id: tempId,
      text: text.trim(),
      category: selectedCategory,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Optimistic add
    setTodos((prev) => [newTodo, ...prev]);
    setText('');

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTodo.text, category: newTodo.category }),
      });
      const data = await res.json();
      if (data.success) {
        setTodos((prev) => prev.map((t) => (t._id === tempId ? data.data : t)));
        toast.success('To-do added!');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error('Failed to save to-do');
      fetchTodos();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle completed
  const handleToggle = async (todo) => {
    const nextCompleted = !todo.completed;

    // Optimistic toggle
    setTodos((prev) =>
      prev.map((t) =>
        t._id === todo._id ? { ...t, completed: nextCompleted } : t
      )
    );

    try {
      const res = await fetch(`/api/todos/${todo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: nextCompleted }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (nextCompleted) {
        toast.success('Completed! Great job! 🎉');
      }
    } catch (err) {
      toast.error('Failed to update to-do');
      fetchTodos();
    }
  };

  // Delete single to-do
  const handleDelete = async (id) => {
    setTodos((prev) => prev.filter((t) => t._id !== id));
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.info('To-do removed');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error('Failed to delete to-do');
      fetchTodos();
    }
  };

  // Save inline edit
  const handleSaveEdit = async (id) => {
    if (!editingText.trim()) return;
    setTodos((prev) =>
      prev.map((t) => (t._id === id ? { ...t, text: editingText.trim() } : t))
    );
    setEditingId(null);

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editingText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('To-do updated');
      }
    } catch (err) {
      toast.error('Failed to update');
      fetchTodos();
    }
  };

  // Clear completed
  const handleClearCompleted = async () => {
    const completedCount = todos.filter((t) => t.completed).length;
    if (completedCount === 0) return;

    setTodos((prev) => prev.filter((t) => !t.completed));

    try {
      const res = await fetch('/api/todos', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Cleared ${completedCount} completed items`);
      }
    } catch (err) {
      toast.error('Failed to clear completed items');
      fetchTodos();
    }
  };

  // Filter calculations
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTodos =
    filter === 'active'
      ? todos.filter((t) => !t.completed)
      : filter === 'completed'
      ? todos.filter((t) => t.completed)
      : todos;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
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
                Personal To-Do List
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {completedCount} of {totalCount} items completed ({progressPct}%)
              </p>
            </div>
          </div>

          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full font-mono"
            style={{
              background: progressPct === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(37,99,235,0.12)',
              color: progressPct === 100 ? '#34d399' : 'var(--accent-blue-light)',
            }}
          >
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
      <form onSubmit={handleAddTodo} className="card-flat p-3 sm:p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a new to-do (e.g. Buy groceries, cooking dinner, workout)..."
            className="input-field flex-1"
            disabled={isSubmitting}
            autoFocus
          />
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="btn-primary flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add To-Do</span>
          </button>
        </div>

        {/* Category Pills Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Category:</span>
          {DEFAULT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                style={{
                  background: isSelected ? cat.color : 'var(--bg-tertiary)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: isSelected ? `1px solid ${cat.color}` : '1px solid var(--border)',
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </form>

      {/* Filter Tabs & Clear Completed Action */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-tertiary p-1 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'active', label: `Active (${activeCount})` },
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

        {completedCount > 0 && (
          <button
            onClick={handleClearCompleted}
            className="btn-ghost text-xs text-rose-400 hover:text-rose-300"
          >
            Clear Completed ({completedCount})
          </button>
        )}
      </div>

      {/* Todo List Items */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <RefreshCcw className="w-5 h-5 animate-spin mb-2" style={{ color: 'var(--accent-blue)' }} />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading to-dos...</p>
        </div>
      ) : filteredTodos.length === 0 ? (
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
            {filter === 'all' && 'Type above and press Enter to add everyday to-dos like cooking, shopping, or personal tasks!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTodos.map((todo) => {
            const isDone = todo.completed;
            const categoryObj =
              DEFAULT_CATEGORIES.find((c) => c.name === todo.category) ||
              DEFAULT_CATEGORIES[0];

            const isEditing = editingId === todo._id;

            return (
              <div
                key={todo._id}
                className={`card-flat p-3 sm:p-3.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                  isDone ? 'opacity-60' : ''
                }`}
                style={{
                  borderLeft: `4px solid ${isDone ? '#10b981' : categoryObj.color}`,
                }}
              >
                {/* Left: Checkbox & Text */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggle(todo)}
                    className="text-slate-400 hover:text-blue-400 transition-colors flex-shrink-0"
                    title={isDone ? 'Mark as active' : 'Mark as done'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(todo._id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="input-field text-xs py-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(todo._id)}
                          className="btn-primary text-xs py-1 px-2.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p
                        onClick={() => {
                          setEditingId(todo._id);
                          setEditingText(todo.text);
                        }}
                        className={`text-sm font-medium leading-snug break-words cursor-pointer ${
                          isDone ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {todo.text}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Category badge & Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      background: categoryObj.bg,
                      color: categoryObj.color,
                      border: `1px solid ${categoryObj.color}30`,
                    }}
                  >
                    {todo.category || 'General'}
                  </span>

                  <button
                    onClick={() => {
                      setEditingId(todo._id);
                      setEditingText(todo.text);
                    }}
                    className="btn-icon w-7 h-7"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(todo._id)}
                    className="btn-danger-icon w-7 h-7"
                    title="Delete"
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
