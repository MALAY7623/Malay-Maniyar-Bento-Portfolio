import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  RefreshCw,
  UserCheck,
  X,
} from 'lucide-react';
import {
  checkAdminVerificationStatus,
  FIREBASE_CONSOLE_AUTH_URL,
  resendAdminVerificationEmail,
  sendAdminPasswordReset,
  setupAdminCredentials,
  signInWithAdminCredentials,
  signInWithGoogleAdminFallback,
} from '../lib/firebase';
import { EDITORIAL_EASE, SMOOTH_SPRING } from '../utils/motionConfig';

interface AdminAccessGateProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

type GateMode = 'signin' | 'setup' | 'verify';

export function AdminAccessGate({ isOpen, onClose, onAuthenticated }: AdminAccessGateProps) {
  const [mode, setMode] = useState<GateMode>('signin');
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [providerNotEnabled, setProviderNotEnabled] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setProviderNotEnabled(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setProviderNotEnabled(false);
    setIsLoading(true);

    try {
      const result =
        mode === 'setup'
          ? await setupAdminCredentials(adminId, password)
          : await signInWithAdminCredentials(adminId, password);

      if (result.ok) {
        setPassword('');
        onAuthenticated();
        return;
      }

      if (result.providerNotEnabled) {
        setProviderNotEnabled(true);
      }

      if (result.needsVerification) {
        setMode('verify');
        setStatusMsg(result.reason || 'Verify your admin email address to continue.');
      } else {
        setErrorMsg(result.reason || 'Authentication failed.');
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    setIsLoading(true);
    try {
      const result = await checkAdminVerificationStatus();
      if (result.ok) {
        setPassword('');
        onAuthenticated();
      } else {
        setErrorMsg(result.reason || 'Email verification is still pending.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await resendAdminVerificationEmail();
      if (res.ok) setStatusMsg(res.message);
      else setErrorMsg(res.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    setProviderNotEnabled(false);
    setIsLoading(true);
    try {
      const res = await sendAdminPasswordReset(adminId);
      if (res.ok) {
        setStatusMsg(res.message);
      } else {
        if (res.providerNotEnabled) {
          setProviderNotEnabled(true);
        }
        setErrorMsg(res.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemporaryGoogleFallback = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    setIsLoading(true);
    try {
      const result = await signInWithGoogleAdminFallback();
      if (result.ok) {
        setPassword('');
        setProviderNotEnabled(false);
        onAuthenticated();
      } else {
        setErrorMsg(result.reason || 'Google sign-in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-gate-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
          onClick={onClose}
          className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={SMOOTH_SPRING}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[28px] bg-[var(--workspace-bg)] text-[var(--ink)] shadow-2xl border border-[var(--border-subtle)] overflow-hidden theme-surface"
          >
            {/* Dark Charcoal Header */}
            <div
              className="p-6 sm:p-7 text-white flex items-start justify-between gap-4 border-b border-white/[0.08]"
              style={{ backgroundColor: 'var(--obsidian)' }}
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/75">
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Restricted Studio Access</span>
                </div>
                <h2
                  id="admin-gate-title"
                  className="text-2xl font-extrabold tracking-[-0.03em] leading-tight"
                >
                  {mode === 'setup'
                    ? 'Initialize Admin Password'
                    : mode === 'verify'
                      ? 'Verify Admin Account'
                      : 'Admin Sign-In'}
                </h2>
                <p className="text-xs text-white/70 leading-relaxed">
                  Sign in with your Admin ID and password to manage website content, palette, media,
                  and custom sections.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close admin sign-in"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7 space-y-5">
              {statusMsg && (
                <div
                  role="status"
                  className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-strong)] p-3.5 flex items-start gap-2.5 text-xs text-[var(--ink)]"
                >
                  <CheckCircle2
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: 'var(--periwinkle)' }}
                    aria-hidden="true"
                  />
                  <span className="leading-relaxed">{statusMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  data-testid="admin-auth-alert"
                  className="rounded-2xl bg-[#FFF2F2] dark:bg-[#2F1518] border border-[#E5484D]/35 p-3.5 flex items-start gap-2.5 text-xs text-[#A31B1F] dark:text-[#FF9A9E]"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-2.5 flex-1">
                    <p className="leading-relaxed font-medium">{errorMsg}</p>
                    {providerNotEnabled && (
                      <div
                        data-testid="provider-setup-guide"
                        className="space-y-2.5 pt-2 border-t border-[#E5484D]/20"
                      >
                        <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed opacity-95">
                          <li>Open Firebase Console Authentication &rarr; Sign-in method.</li>
                          <li>Click <strong>Email/Password</strong>, switch <strong>Enable</strong> ON, and save.</li>
                          <li>Return here and click <strong>First-Time Setup</strong> to set your Admin password.</li>
                        </ol>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <a
                            href={FIREBASE_CONSOLE_AUTH_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A31B1F] dark:bg-[#E5484D] text-white text-[11px] font-bold hover:opacity-90 transition-opacity"
                          >
                            <span>Open Firebase Auth Providers</span>
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={handleTemporaryGoogleFallback}
                            data-testid="temporary-google-signin-btn"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-white/10 border border-[#E5484D]/35 text-[#A31B1F] dark:text-[#FFD6D8] text-[11px] font-bold hover:bg-white dark:hover:bg-white/20 disabled:opacity-60 transition-colors cursor-pointer"
                          >
                            <span>Use Google Sign-In for Now</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mode === 'verify' ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleCheckVerification}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[var(--ink)] hover:opacity-90 disabled:opacity-60 text-[var(--workspace-bg)] text-sm font-bold transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" aria-hidden="true" />
                    <span>{isLoading ? 'Checking Verification...' : "I've Verified — Continue"}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleResendVerification}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] text-[var(--ink)] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Resend Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setErrorMsg(null);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] text-[var(--ink)] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Admin ID Field */}
                  <div>
                    <label
                      htmlFor="admin-id-input"
                      className="block text-xs font-bold text-[var(--ink)] mb-1.5"
                    >
                      Admin ID
                    </label>
                    <input
                      id="admin-id-input"
                      data-testid="admin-id-input"
                      name="adminId"
                      type="text"
                      autoComplete="username"
                      required
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="Enter Admin ID"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-strong)] text-sm font-mono tracking-wide text-[var(--ink)] placeholder:text-[var(--ink-muted)] placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-[var(--periwinkle)] transition-colors"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="admin-password-input"
                        className="block text-xs font-bold text-[var(--ink)]"
                      >
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={isLoading}
                          className="text-[11px] font-semibold hover:underline cursor-pointer"
                          style={{ color: 'var(--periwinkle)' }}
                        >
                          Set / Reset Password
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="admin-password-input"
                        data-testid="admin-password-input"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password"
                        className="w-full pl-4 pr-11 py-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-strong)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--periwinkle)] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)] p-1 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <button
                      type="submit"
                      data-testid="admin-login-submit"
                      disabled={isLoading}
                      className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[var(--ink)] hover:opacity-90 disabled:opacity-60 text-[var(--workspace-bg)] text-sm font-bold transition-all active:scale-[0.99] cursor-pointer"
                    >
                      {mode === 'setup' ? (
                        <KeyRound className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <LogIn className="w-4 h-4" aria-hidden="true" />
                      )}
                      <span>
                        {isLoading
                          ? 'Verifying Credentials...'
                          : mode === 'setup'
                            ? 'Create Admin Password'
                            : 'Sign In to Admin Panel'}
                      </span>
                    </button>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMode((prev) => (prev === 'setup' ? 'signin' : 'setup'));
                          setErrorMsg(null);
                          setStatusMsg(null);
                        }}
                        className="text-xs font-semibold hover:underline cursor-pointer"
                        style={{ color: 'var(--periwinkle)' }}
                      >
                        {mode === 'setup' ? 'Already set up? Sign In' : 'First-Time Setup'}
                      </button>

                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Return to Portfolio</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
