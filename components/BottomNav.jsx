'use client';

import { LayoutDashboard, CheckSquare, ListTodo, Plus, Menu } from 'lucide-react';

export default function BottomNav({ activeView, onChangeView, onOpenNewTaskModal, onOpenSidebar }) {
  return (
    <nav className="bottom-nav">
      {/* 1. Dashboard */}
      <button
        onClick={() => onChangeView('dashboard')}
        className={`bottom-nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Dashboard</span>
      </button>

      {/* 2. Personal To-Do */}
      <button
        onClick={() => onChangeView('todolist')}
        className={`bottom-nav-item ${activeView === 'todolist' ? 'active' : ''}`}
      >
        <CheckSquare className="w-4 h-4" />
        <span>To-Do</span>
      </button>

      {/* 3. Center Action Button: Quick Add Task */}
      <button
        onClick={() => onOpenNewTaskModal('todo')}
        className="bottom-nav-action"
        title="Create New Task"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* 4. My Tasks (Kanban / Calendar) */}
      <button
        onClick={() => onChangeView('kanban')}
        className={`bottom-nav-item ${activeView === 'kanban' ? 'active' : ''}`}
      >
        <ListTodo className="w-4 h-4" />
        <span>Tasks</span>
      </button>

      {/* 5. More / Sidebar Drawer Toggle */}
      <button
        onClick={onOpenSidebar}
        className="bottom-nav-item"
        title="Open Navigation Menu"
      >
        <Menu className="w-4 h-4" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
