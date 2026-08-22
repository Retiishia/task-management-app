'use client';

import {
  CheckCircle2, LayoutDashboard, ListTodo, BarChart2,
  Sun, Moon, LogOut, ShieldCheck, Database,
  Plus, RefreshCw, X
} from 'lucide-react';
import navigationConfig from '@/data/navigation.json';
import landingConfig from '@/data/landing.json';

const NAV_ICON_MAP = {
  LayoutDashboard,
  ListTodo,
  BarChart2,
};

const NAV_ITEMS = navigationConfig.navItems.map((item) => ({
  ...item,
  icon: NAV_ICON_MAP[item.icon] || LayoutDashboard,
}));

export default function Sidebar({
  user,
  theme,
  onToggleTheme,
  onLogout,
  onOpenNewTaskModal,
  onSeedData,
  isSeeding,
  activeView,
  onChangeView,
  // Mobile
  mobileOpen,
  onMobileClose,
}) {
  const isAdmin = user?.role === 'admin';

  const handleNav = (view) => {
    onChangeView(view);
    onMobileClose?.();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={onMobileClose}
          style={{ backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar panel */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {landingConfig.app.name}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                v{landingConfig.app.version}
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <button onClick={onMobileClose} className="btn-icon lg:hidden">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-2 pb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Workspace
          </p>

          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`nav-item w-full text-left ${activeView === id ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-4 pb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Admin
              </p>
              <a
                href="http://localhost:8081"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-item"
                onClick={onMobileClose}
              >
                <Database className="w-4 h-4" />
                Mongo Express
              </a>
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 space-y-0.5 border-t" style={{ borderColor: 'var(--border)' }}>
          {user && (
            <>
              <button
                onClick={() => {
                  onOpenNewTaskModal('todo');
                  onMobileClose?.();
                }}
                className="nav-item w-full text-left"
                style={{ color: 'var(--accent-blue-light)' }}
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
              <button
                onClick={onSeedData}
                disabled={isSeeding}
                className="nav-item w-full text-left"
              >
                <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
                {isSeeding ? 'Seeding...' : 'Seed Sample Data'}
              </button>
            </>
          )}

          <button onClick={onToggleTheme} className="nav-item w-full text-left">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* User Profile */}
          {user && (
            <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
                >
                  <span className="text-xs font-bold text-white">
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.name}
                  </p>
                  <p className="text-[10px] truncate flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    {isAdmin && <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />}
                    {isAdmin ? 'Admin' : 'Member'}
                  </p>
                </div>
                <button onClick={onLogout} title="Sign Out" className="btn-icon flex-shrink-0">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
