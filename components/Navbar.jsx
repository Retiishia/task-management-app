'use client';

import { Plus, Database, RefreshCw, CheckCircle2, Sun, Moon, LogIn, LogOut, User, ShieldCheck } from 'lucide-react';

export default function Navbar({
  user,
  onOpenAuthModal,
  onLogout,
  onOpenNewTaskModal,
  onSeedData,
  isSeeding,
  theme,
  onToggleTheme,
}) {
  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 lg:px-8 py-3 mb-6 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/30">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              TaskFlow Pro
            </h1>
            <p className="text-xs text-indigo-400 font-medium">
              Next.js • MongoDB • Docker Stack
            </p>
          </div>
        </div>

        {/* Links & Quick Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Theme Switcher Toggle */}
          <button
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2 rounded-xl bg-slate-800/60 dark:bg-slate-800/80 border border-white/10 text-amber-400 hover:scale-105 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Mongo Express Link - ADMIN ONLY */}
          {isAdmin && (
            <a
              href="http://localhost:8081"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Mongo Express Database GUI (Admin Only)"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Mongo Express</span>
            </a>
          )}

          {/* User Auth Section */}
          {user ? (
            <>
              {/* Seed Data Button */}
              <button
                onClick={onSeedData}
                disabled={isSeeding}
                title="Populate MongoDB with sample tasks for your account"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>{isSeeding ? 'Seeding...' : 'Seed Sample Data'}</span>
              </button>

              {/* New Task Button */}
              <button
                onClick={onOpenNewTaskModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-purple-500 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>

              {/* Profile Badge & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold">{user.name}</span>
                  {isAdmin && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 ml-1">
                      <ShieldCheck className="w-3 h-3 text-purple-400" />
                      <span>Admin</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
