import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, ArrowLeft, Lock, LogIn, ShieldCheck, X } from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL, signInAsAdmin } from '../lib/firebase';
import { EDITORIAL_EASE, SMOOTH_SPRING } from '../utils/motionConfig';

interface AdminAccessGateProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export function AdminAccessGate({ isOpen, onClose, onAuthenticated }: AdminAccessGateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
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

  const handleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const result = await signInAsAdmin();
      if (result.ok) {
        onAuthenticated();
      } else {
        setErrorMsg(result.reason || 'Authentication failed.');
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Unable to sign in.');
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
                  Admin Sign-In
                </h2>
                <p className="text-xs text-white/70 leading-relaxed">
                  Private control panel for managing website content, color palette, media, and new
                  structured sections.
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
              <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 flex items-start gap-3">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: 'var(--periwinkle)' }}
                >
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                  <p className="font-bold text-[var(--ink)]">Verified Primary Admin Only</p>
                  <p className="mt-0.5">
                    Sign in using Google Authentication with{' '}
                    <span className="font-mono font-semibold text-[var(--ink)]">
                      {PRIMARY_ADMIN_EMAIL}
                    </span>
                    . Any other account is automatically denied.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-2xl bg-[#FFF2F2] dark:bg-[#2F1518] border border-[#E5484D]/35 p-3.5 flex items-start gap-2.5 text-xs text-[#A31B1F] dark:text-[#FF9A9E]"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSignIn}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[var(--ink)] hover:opacity-90 disabled:opacity-60 text-[var(--workspace-bg)] text-sm font-bold transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span>{isLoading ? 'Verifying Admin Account...' : 'Sign In with Google'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] text-[var(--ink)] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Return to Portfolio</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
