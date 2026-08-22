'use client';

import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Toast Context ─────────────────────────────────────────────
const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

// ── Individual Toast ──────────────────────────────────────────
const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    iconColor: '#34d399',
    bg: 'var(--bg-secondary)',
    accent: '#10b981',
    border: 'rgba(16,185,129,0.25)',
  },
  error: {
    icon: XCircle,
    iconColor: '#f87171',
    bg: 'var(--bg-secondary)',
    accent: '#ef4444',
    border: 'rgba(239,68,68,0.25)',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#fb923c',
    bg: 'var(--bg-secondary)',
    accent: '#f97316',
    border: 'rgba(249,115,22,0.25)',
  },
  info: {
    icon: Info,
    iconColor: '#60a5fa',
    bg: 'var(--bg-secondary)',
    accent: '#3b82f6',
    border: 'rgba(59,130,246,0.25)',
  },
};

function Toast({ id, type = 'success', message, onRemove }) {
  const style = TOAST_STYLES[type] || TOAST_STYLES.success;
  const Icon = style.icon;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onRemove(id), 250);
  };

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '8px',
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        minWidth: '260px',
        maxWidth: '360px',
        cursor: 'pointer',
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={dismiss}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '3px', background: style.accent, borderRadius: '8px 0 0 8px',
      }} />

      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: style.iconColor, marginLeft: '6px' }} />

      <p style={{
        flex: 1,
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--text-primary)',
        lineHeight: 1.4,
      }}>
        {message}
      </p>

      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: '2px', borderRadius: '4px',
          display: 'flex', alignItems: 'center',
        }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Toast Provider ────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Convenience helpers
  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info:    (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container — bottom-right */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast
              id={t.id}
              type={t.type}
              message={t.message}
              onRemove={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
