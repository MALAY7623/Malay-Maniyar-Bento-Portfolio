import { ArrowUpRight, Check, Copy, Mail, MessageCircle, Send } from 'lucide-react';
import type { ProfileConfig, SectionCopyConfig } from '../types/portfolio';
import { CornerBracket } from './BentoPrimitives';

interface AboutContactFooterProps {
  profile: ProfileConfig;
  sectionCopy: SectionCopyConfig;
  copiedEmail: boolean;
  onCopyEmail: () => void;
  onOpenInquiry: () => void;
}

export function AboutContactFooter({
  profile,
  sectionCopy,
  copiedEmail,
  onCopyEmail,
  onOpenInquiry,
}: AboutContactFooterProps) {
  const socials = [
    { label: 'Instagram', href: profile.instagramUrl },
    { label: 'Behance', href: profile.behanceUrl },
    { label: 'Gumroad', href: profile.gumroadUrl },
  ].filter((s) => Boolean(s.href && s.href.trim()));

  return (
    <footer
      id="contact"
      tabIndex={-1}
      aria-labelledby="contact-heading"
      className="pt-10 pb-6 sm:pt-14 sm:pb-8 outline-none theme-surface"
    >
      {/* Split Bento Footer Card: Primary Accent + Obsidian Surface */}
      <div data-gsap="spatial-group" className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-stretch">
        {/* Left Primary Accent Card: Bio & Philosophy */}
        <div
          data-gsap="spatial-card"
          data-cursor="bento"
          data-cursor-tone="periwinkle"
          className="lg:col-span-6 rounded-[28px] text-white p-7 sm:p-9 flex flex-col justify-between gap-8"
          style={{ backgroundColor: 'var(--periwinkle)' }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/85">
                {sectionCopy.footerAboutEyebrow}
              </span>
              <CornerBracket className="text-white/90" size={18} />
            </div>

            <h2
              id="contact-heading"
              data-gsap="section-heading"
              className="text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] leading-[1.08] [text-wrap:balance]"
            >
              {sectionCopy.footerAboutHeading}
            </h2>

            <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed max-w-lg whitespace-pre-line">
              {sectionCopy.footerAboutBio}
            </p>
          </div>

          <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs text-white/85">
            <span>{profile.location}</span>
            <span>{profile.availability}</span>
          </div>
        </div>

        {/* Right Obsidian Card: Direct Contact Actions, Social Links & Start a Project */}
        <div
          data-gsap="spatial-card"
          data-cursor="bento"
          data-cursor-tone="obsidian"
          className="lg:col-span-6 rounded-[28px] text-white p-7 sm:p-9 flex flex-col justify-between gap-8 border border-transparent dark:border-white/[0.1] theme-surface"
          style={{ backgroundColor: 'var(--obsidian)' }}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/70">
                {sectionCopy.footerContactEyebrow}
              </span>
              <span style={{ color: 'var(--apricot)' }}>
                <CornerBracket size={18} />
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] leading-tight">
              {sectionCopy.footerContactHeading}
            </h3>

            {/* Direct Interactive Contact Controls */}
            <div className="space-y-3 pt-1">
              {/* Email Row: Copy + Mailto */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onCopyEmail}
                  data-cursor="action"
                  data-cursor-label={copiedEmail ? 'Copied' : 'Copy'}
                  data-cursor-tone="obsidian"
                  className="inline-flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/16 text-white text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--apricot)]"
                  aria-label={`Copy ${profile.email}`}
                >
                  {copiedEmail ? (
                    <Check
                      className="w-4 h-4"
                      style={{ color: 'var(--mint)' }}
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy
                      className="w-4 h-4"
                      style={{ color: 'var(--mint)' }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="break-all sm:break-normal">{profile.email}</span>
                  <span className="text-xs text-white/65">{copiedEmail ? 'Copied!' : 'Copy'}</span>
                </button>

                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/18 text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--apricot)]"
                  aria-label={`Send email to ${profile.email}`}
                  title="Open in Mail app"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>

              {/* WhatsApp / Direct Call Row */}
              <div>
                <a
                  href={profile.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/16 text-white text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--apricot)]"
                >
                  <MessageCircle
                    className="w-4 h-4"
                    style={{ color: 'var(--apricot)' }}
                    aria-hidden="true"
                  />
                  <span className="font-mono tabular-nums">{profile.phoneDisplay}</span>
                  <span className="text-xs text-white/65">WhatsApp / Call</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/60" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Row: Primary Start a Project Button + Social Links */}
          <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              type="button"
              onClick={onOpenInquiry}
              data-cursor="action"
              data-cursor-label="Start"
              data-cursor-tone="apricot"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl hover:opacity-95 text-[#111111] text-sm font-extrabold tracking-tight transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ backgroundColor: 'var(--apricot)' }}
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>Start a Project</span>
            </button>

            <nav aria-label="Social links" className="flex flex-wrap items-center gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full border border-white/15 hover:border-white/40 hover:bg-white/10 text-xs font-semibold text-white/90 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{social.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/60" aria-hidden="true" />
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Quiet Editorial Copyright Strip */}
      <div
        className="mt-6 px-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
        style={{ color: 'var(--ink-muted)' }}
      >
        <span>{sectionCopy.copyrightText}</span>
        <span>{sectionCopy.footerTagline}</span>
      </div>
    </footer>
  );
}

