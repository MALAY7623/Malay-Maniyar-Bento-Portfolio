import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Send, X } from 'lucide-react';
import { submitProjectInquiry } from '../services/portfolioStore';
import type {
  InquiryFormData,
  InquiryValidationErrors,
  ProfileConfig,
  ProjectInquiryType,
} from '../types/portfolio';
import { validateInquiryForm } from '../utils/portfolioLogic';
import { EDITORIAL_EASE, SMOOTH_SPRING } from '../utils/motionConfig';

interface ProjectInquiryDrawerProps {
  profile: ProfileConfig;
  isOpen: boolean;
  onClose: () => void;
}

const PROJECT_TYPES: ProjectInquiryType[] = ['UGC Video', 'Graphic Design', 'Both'];

const INITIAL_FORM: InquiryFormData = {
  name: '',
  email: '',
  projectType: 'Both',
  message: '',
};

export function ProjectInquiryDrawer({ profile, isOpen, onClose }: ProjectInquiryDrawerProps) {
  const [formData, setFormData] = useState<InquiryFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<InquiryValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBrief, setSubmittedBrief] = useState<InquiryFormData | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleFieldChange = <K extends keyof InquiryFormData>(
    key: K,
    value: InquiryFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateInquiryForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    const trimmed: InquiryFormData = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
      message: formData.message.trim(),
    };

    try {
      await submitProjectInquiry(trimmed);
      setSubmittedBrief(trimmed);
    } catch {
      setSubmitError(
        `Could not deliver right now. Please try again or reach out directly at ${profile.email}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setSubmitError(null);
    setSubmittedBrief(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-drawer-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/68 backdrop-blur-sm flex justify-end"
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={SMOOTH_SPRING}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg h-full text-[var(--ink)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col justify-between overflow-y-auto theme-surface"
            style={{ backgroundColor: 'var(--workspace-bg)' }}
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-[var(--border-subtle)] bg-[var(--surface-card)] flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--periwinkle)' }}>
                  Project Inquiry
                </p>
                <h2
                  id="inquiry-drawer-title"
                  className="text-2xl font-extrabold tracking-[-0.03em] text-[var(--ink)] mt-1"
                >
                  Start a Project
                </h2>
                <p className="text-xs text-[var(--ink-muted)] mt-1">
                  Share your goals with {profile.name} — replies typically within 24 hours.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close project inquiry drawer"
                className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--ink)] hover:text-[var(--workspace-bg)] text-[var(--ink)] border border-[var(--border-subtle)] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Body: Submitted Confirmation OR Inquiry Form */}
            <div className="p-6 sm:p-8 flex-1">
              {submittedBrief ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 sm:p-7 space-y-5"
                >
                  <div
                    className="w-12 h-12 rounded-2xl text-[#111111] flex items-center justify-center"
                    style={{ backgroundColor: 'var(--mint)' }}
                  >
                    <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">
                      Inquiry Received, {submittedBrief.name}!
                    </h3>
                    <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                      Thank you for reaching out. Your brief has been saved directly for{' '}
                      {profile.name} ({profile.email}).
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-4 space-y-2 text-xs text-[var(--ink-secondary)]">
                    <div>
                      <span className="font-semibold text-[var(--ink)]">Reply Email: </span>
                      {submittedBrief.email}
                    </div>
                    <div>
                      <span className="font-semibold text-[var(--ink)]">Project Scope: </span>
                      {submittedBrief.projectType}
                    </div>
                    <div>
                      <span className="font-semibold text-[var(--ink)]">Message: </span>
                      {submittedBrief.message}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-3 rounded-xl bg-[var(--ink)] hover:opacity-90 text-[var(--workspace-bg)] text-xs font-bold transition-opacity cursor-pointer"
                    >
                      Back to Portfolio
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-3 rounded-xl bg-[var(--surface-elevated)] hover:opacity-85 text-[var(--ink)] border border-[var(--border-subtle)] text-xs font-semibold transition-opacity cursor-pointer"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {submitError && (
                    <div
                      role="alert"
                      className="rounded-xl bg-[#FFF2F2] dark:bg-[#2F1518] border border-[#E5484D]/35 p-3 text-xs font-medium text-[#A31B1F] dark:text-[#FF9A9E]"
                    >
                      {submitError}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label
                      htmlFor="inquiry-name"
                      className="block text-xs font-bold text-[var(--ink)] mb-1.5"
                    >
                      Your Name
                    </label>
                    <input
                      id="inquiry-name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="e.g. Riya Sharma"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'inquiry-name-error' : undefined}
                      className={`w-full px-4 py-3 rounded-xl bg-[var(--surface-card)] border text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--periwinkle)] transition-colors ${
                        errors.name ? 'border-[#E5484D]' : 'border-[var(--border-strong)]'
                      }`}
                    />
                    {errors.name && (
                      <p
                        id="inquiry-name-error"
                        role="alert"
                        className="mt-1.5 text-xs font-medium text-[#C52929] dark:text-[#FF8E92]"
                      >
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="inquiry-email"
                      className="block text-xs font-bold text-[var(--ink)] mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="inquiry-email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="you@brand.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'inquiry-email-error' : undefined}
                      className={`w-full px-4 py-3 rounded-xl bg-[var(--surface-card)] border text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--periwinkle)] transition-colors ${
                        errors.email ? 'border-[#E5484D]' : 'border-[var(--border-strong)]'
                      }`}
                    />
                    {errors.email && (
                      <p
                        id="inquiry-email-error"
                        role="alert"
                        className="mt-1.5 text-xs font-medium text-[#C52929] dark:text-[#FF8E92]"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Project Type Selector */}
                  <fieldset>
                    <legend className="block text-xs font-bold text-[var(--ink)] mb-2">
                      Project Type
                    </legend>
                    <div className="grid grid-cols-3 gap-2">
                      {PROJECT_TYPES.map((type) => {
                        const selected = formData.projectType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleFieldChange('projectType', type)}
                            aria-pressed={selected}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                              selected
                                ? 'text-white shadow-sm'
                                : 'bg-[var(--surface-card)] text-[var(--ink-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                            }`}
                            style={
                              selected
                                ? {
                                    backgroundColor: 'var(--periwinkle)',
                                    borderColor: 'var(--periwinkle)',
                                  }
                                : undefined
                            }
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="inquiry-message"
                      className="block text-xs font-bold text-[var(--ink)] mb-1.5"
                    >
                      Project Brief &amp; Timeline
                    </label>
                    <textarea
                      id="inquiry-message"
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => handleFieldChange('message', e.target.value)}
                      placeholder="Tell me about your brand, deliverables (e.g., 3 UGC hook ads, brand identity, poster campaign), and launch timeline..."
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'inquiry-message-error' : undefined}
                      className={`w-full px-4 py-3 rounded-xl bg-[var(--surface-card)] border text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--periwinkle)] resize-none transition-colors ${
                        errors.message ? 'border-[#E5484D]' : 'border-[var(--border-strong)]'
                      }`}
                    />
                    {errors.message && (
                      <p
                        id="inquiry-message-error"
                        role="alert"
                        className="mt-1.5 text-xs font-medium text-[#C52929] dark:text-[#FF8E92]"
                      >
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[var(--ink)] hover:opacity-90 disabled:opacity-60 text-[var(--workspace-bg)] text-sm font-bold transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>{isSubmitting ? 'Sending Inquiry...' : 'Send Project Inquiry'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Footer Note */}
            <div className="px-6 sm:px-8 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-card)] text-xs text-[var(--ink-muted)] flex items-center justify-between">
              <span>Direct WhatsApp: {profile.phoneDisplay}</span>
              <a
                href={profile.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:opacity-80 transition-opacity"
                style={{ color: 'var(--periwinkle)' }}
              >
                Chat Now
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

