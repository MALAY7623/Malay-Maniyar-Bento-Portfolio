import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollChoreographySignal {
  /** Master normalized scroll progress across the portfolio (0..1) */
  progress: number;
  /** Subtle camera dolly-in/out offset driven by section transitions */
  cameraDolly: number;
  /** Gentle camera perspective bank/roll in radians */
  cameraRoll: number;
  /** Dynamic studio atmosphere warmth accent (0..1) */
  lightWarmth: number;
  /** Active chapter index: 0 Hero, 1 UGC Reels, 2 Design Work, 3 Capabilities, 4 Contact */
  chapterIndex: number;
}

function getFallbackScrollProgress(): number {
  if (typeof window === 'undefined') return 0;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return Math.max(0, Math.min(1, window.scrollY / maxScroll));
}

/**
 * Synchronizes the 3D scene timeline cleanly with native browser scrolling
 * via GSAP ScrollTrigger (zero scroll hijacking, scrubbed interpolation,
 * and deterministic cleanup via gsap.context).
 */
export class ScrollAnimationController {
  public readonly signal: ScrollChoreographySignal = {
    progress: getFallbackScrollProgress(),
    cameraDolly: 0,
    cameraRoll: 0,
    lightWarmth: 0.25,
    chapterIndex: 0,
  };

  private ctx: gsap.Context | null = null;
  private masterTrigger: ScrollTrigger | null = null;

  constructor() {
    if (typeof window === 'undefined') return;

    this.ctx = gsap.context(() => {
      // Master scrubbed timeline mapped across the entire document height
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            this.signal.progress = self.progress;
            this.signal.chapterIndex =
              self.progress < 0.2
                ? 0
                : self.progress < 0.45
                  ? 1
                  : self.progress < 0.72
                    ? 2
                    : self.progress < 0.88
                      ? 3
                      : 4;
          },
        },
      });

      this.masterTrigger = timeline.scrollTrigger ?? null;

      // Cinematic camera dolly-in/out, subtle roll, and lighting warmth keyframes
      // aligned to the 5 editorial chapters: Hero -> Reels -> Design -> Capabilities -> Contact
      timeline
        // Chapter 1: Hero -> UGC Reels (dolly subtly inward toward Prism, bank slightly right)
        .to(this.signal, { cameraDolly: -0.65, cameraRoll: -0.028, lightWarmth: 0.55, duration: 0.25 })
        // Chapter 2: UGC Reels -> Design Work (pull back slightly for wide editorial framing)
        .to(this.signal, { cameraDolly: 0.35, cameraRoll: 0.025, lightWarmth: 0.8, duration: 0.28 })
        // Chapter 3: Design Work -> Capabilities (balanced neutral dolly)
        .to(this.signal, { cameraDolly: -0.35, cameraRoll: -0.018, lightWarmth: 0.6, duration: 0.24 })
        // Chapter 4: Capabilities -> Contact Finale (intimate cinematic close-in)
        .to(this.signal, { cameraDolly: -0.75, cameraRoll: 0.01, lightWarmth: 0.95, duration: 0.23 });
    });

    // Defer a refresh once images/layout settle so end bounds stay accurate
    window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 350);
  }

  public getProgress(): number {
    // Keep perfectly synced with native scrollY even if page height changes dynamically
    const raw = getFallbackScrollProgress();
    if (!this.masterTrigger) return raw;
    return Number.isFinite(this.signal.progress) ? this.signal.progress : raw;
  }

  public refresh(): void {
    ScrollTrigger.refresh();
  }

  public dispose(): void {
    this.ctx?.revert();
    this.ctx = null;
    this.masterTrigger = null;
  }
}
