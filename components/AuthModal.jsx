'use client';

import { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onRequireVerification }) {
  const [activeTab, setActiveTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = activeTab === 'login' ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.requiresVerification && data.email) {
          onRequireVerification(data.email);
          onClose();
          return;
        }
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.requiresVerification && data.email) {
        onRequireVerification(data.email);
        onClose();
        return;
      }

      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogin = activeTab === 'login';

  return (
    <div className="modal-overlay">
      <div className="modal-box p-0 overflow-hidden" style={{ maxWidth: '420px' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {isLogin ? 'Sign in to TaskFlow' : 'Create your account'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {isLogin ? 'Welcome back! Enter your credentials.' : 'Get started — it\'s free.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          {[
            { id: 'login', label: 'Sign In' },
            { id: 'register', label: 'Register' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              className="flex-1 py-3 text-xs font-semibold transition-all relative"
              style={{
                color: activeTab === tab.id ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'var(--accent-blue)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171',
                }}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Name — register only */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="input-field"
                    style={{ paddingLeft: '2.25rem' }}
                    required
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                  style={{ paddingLeft: '2.25rem' }}
                  required
                  autoFocus={isLogin}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                {!isLogin && (
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Min. 6 characters
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-icon absolute right-0 top-0 h-full w-9"
                >
                  {showPassword
                    ? <EyeOff className="w-3.5 h-3.5" />
                    : <Eye className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>

            {/* Register helper text */}
            {!isLogin && (
              <p className="text-[11px] px-1" style={{ color: 'var(--text-muted)' }}>
                After registration, a 6-digit verification code will be sent to your email address.
              </p>
            )}
          </div>

          {/* Footer / Submit */}
          <div className="px-6 pb-5 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center py-2.5"
              style={{ fontSize: '13px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>

            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => switchTab(isLogin ? 'register' : 'login')}
                className="font-semibold"
                style={{ color: 'var(--accent-blue-light)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {isLogin ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
