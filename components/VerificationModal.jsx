'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, KeyRound, RefreshCw, AlertCircle, CheckCircle2, Mail, Loader2 } from 'lucide-react';

export default function VerificationModal({ isOpen, email, onClose, onVerificationSuccess }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError('');
      setMessage('');
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    }
  }, [isOpen, email]);

  const verify = useCallback(async (code) => {
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Verification failed');
      onVerificationSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
      // Shake animation: clear & refocus first box
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 60);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, onClose, onVerificationSuccess]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    const code = digits.join('');
    if (code.length === 6 && !isSubmitting) {
      verify(code);
    }
  }, [digits, isSubmitting, verify]);

  const handleChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    // Move focus forward
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleResendCode = async () => {
    setError('');
    setMessage('');
    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to resend code');
      setMessage('A new code has been sent to your email.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  const filledCount = digits.filter(Boolean).length;

  return (
    <div className="modal-overlay">
      <div className="modal-box p-0 overflow-hidden" style={{ maxWidth: '400px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
              <KeyRound className="w-4 h-4" style={{ color: 'var(--accent-blue-light)' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Check your email
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                6-digit code expires in 10 minutes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Email tag */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent-blue-light)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Code sent to </span>
            <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{email}</span>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
          {message && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              {message}
            </div>
          )}

          {/* 6 OTP digit boxes */}
          <div>
            <p className="text-xs font-medium mb-3 text-center" style={{ color: 'var(--text-secondary)' }}>
              Enter your verification code
            </p>
            <div className="flex items-center justify-center gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={isSubmitting}
                  style={{
                    width: '46px',
                    height: '52px',
                    textAlign: 'center',
                    fontSize: '22px',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                    borderRadius: '8px',
                    border: digit
                      ? `2px solid var(--accent-blue)`
                      : `1px solid var(--border)`,
                    background: digit ? 'rgba(37,99,235,0.08)' : 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.15s, background 0.15s',
                    opacity: isSubmitting ? 0.5 : 1,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-blue)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
                  }}
                  onBlur={(e) => {
                    if (!digit) {
                      e.target.style.borderColor = 'var(--border)';
                    }
                    e.target.style.boxShadow = 'none';
                  }}
                />
              ))}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mt-3">
              {digits.map((d, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                  style={{ background: d ? 'var(--accent-blue)' : 'var(--border)' }} />
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--accent-blue-light)' }} />
                <span style={{ color: 'var(--accent-blue-light)' }}>Verifying your code...</span>
              </>
            ) : filledCount < 6 ? (
              <span>{filledCount}/6 digits entered — auto-submits on completion</span>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Didn't receive it?
          </span>
          <button
            onClick={handleResendCode}
            disabled={isResending}
            className="btn-ghost text-xs font-semibold"
            style={{ color: 'var(--accent-blue-light)' }}
          >
            <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
