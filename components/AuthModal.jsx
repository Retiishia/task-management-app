'use client';

import { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onRequireVerification }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setMessage('');
    setName('');
    setPassword('');
    setResetCode('');
    setNewPassword('');
    setShowPassword(false);
  };

  const handleLoginOrRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send reset code');

      setMessage(data.message || '6-digit reset code sent to your email.');
      setActiveTab('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to reset password');

      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogin = activeTab === 'login';
  const isRegister = activeTab === 'register';
  const isForgot = activeTab === 'forgot';
  const isReset = activeTab === 'reset';

  return (
    <div className="modal-overlay">
      <div className="modal-box p-0 overflow-hidden" style={{ maxWidth: '420px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {isLogin
                  ? 'Sign in to TaskFlow'
                  : isRegister
                  ? 'Create your account'
                  : isForgot
                  ? 'Reset Password'
                  : 'Enter Reset Code'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {isLogin
                  ? 'Welcome back! Enter your credentials.'
                  : isRegister
                  ? "Get started — it's free."
                  : isForgot
                  ? "We'll send a 6-digit verification code."
                  : 'Enter your 6-digit code & new password.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher for Login / Register */}
        {(isLogin || isRegister) && (
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
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'var(--accent-blue)' }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Form Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Alerts */}
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
              }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                color: '#34d399',
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              {message}
            </div>
          )}

          {/* 1. Login / Register Form */}
          {(isLogin || isRegister) && (
            <form onSubmit={handleLoginOrRegister} className="space-y-4">
              {/* Full Name for register */}
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
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
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                  />
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
                  {isLogin ? (
                    <button
                      type="button"
                      onClick={() => switchTab('forgot')}
                      className="text-[11px] font-medium"
                      style={{ color: 'var(--accent-blue-light)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Forgot password?
                    </button>
                  ) : (
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Min. 6 characters
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                  />
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
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full justify-center py-2.5 mt-2"
                style={{ fontSize: '13px' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          {/* 2. Forgot Password Request Form */}
          {isForgot && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Enter your account email
                </label>
                <div className="relative">
                  <Mail
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                    style={{ paddingLeft: '2.25rem' }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                We'll email you a 6-digit one-time passcode to set up a new password.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full justify-center py-2.5"
                style={{ fontSize: '13px' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>

              <button
                type="button"
                onClick={() => switchTab('login')}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-center py-1 font-medium"
                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </button>
            </form>
          )}

          {/* 3. Reset Password Confirmation Form */}
          {isReset && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  6-Digit Reset Code
                </label>
                <div className="relative">
                  <KeyRound
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="input-field font-mono"
                    style={{ paddingLeft: '2.25rem', letterSpacing: '4px', fontSize: '15px' }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full justify-center py-2.5"
                style={{ fontSize: '13px' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Update Password & Sign In'
                )}
              </button>

              <button
                type="button"
                onClick={() => switchTab('forgot')}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-center py-1 font-medium"
                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <ArrowLeft className="w-3 h-3" /> Resend Code / Change Email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
