import { useEffect, type RefObject } from 'react';

/**
 * GSAP + ScrollTrigger editorial typography and section choreography hook.
 * Dynamically imports GSAP after initial paint so GSAP stays out of the critical
 * entry JS chunk while preserving smooth scroll-triggered reveals and clean
 * `gsap.context()` teardown.
 */
export function useGsapSectionMotion(
  scopeRef: RefObject<HTMLElement | null>,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const scope = scopeRef.current;
    if (!scope) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let cancelled = false;
    let revertFn: (() => void) | null = null;

    const initGsap = async () => {
      try {
        const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
          import('gsap'),
          import('gsap/ScrollTrigger'),
        ]);
        if (cancelled || !scopeRef.current) return;

        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
          // 1. Subtle hero display typography glide (kept visible on frame 0 for instant LCP)
          const heroClips = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-clip"]');
          if (heroClips.length > 0) {
            gsap.fromTo(
              heroClips,
              { y: 12 },
              {
                y: 0,
                duration: 0.65,
                stagger: 0.08,
                ease: 'power3.out',
                clearProps: 'transform',
              },
            );
          }

          // 2. Scroll-triggered editorial section heading mask reveals
          const sectionHeadings = gsap.utils.toArray<HTMLElement>('[data-gsap="section-heading"]');
          sectionHeadings.forEach((heading) => {
            gsap.fromTo(
              heading,
              {
                clipPath: 'inset(0% 0% 100% 0%)',
                y: 22,
                opacity: 0,
              },
              {
                clipPath: 'inset(0% 0% 0% 0%)',
                y: 0,
                opacity: 1,
                duration: 0.85,
                ease: 'power3.out',
                clearProps: 'clipPath,transform',
                scrollTrigger: {
                  trigger: heading,
                  start: 'top 88%',
                  once: true,
                },
              },
            );
          });

          // 3. Staggered 3D-perspective spatial card reveals (Capabilities & Contact Finale)
          const cardGroups = gsap.utils.toArray<HTMLElement>('[data-gsap="spatial-group"]');
          cardGroups.forEach((group) => {
            const cards = group.querySelectorAll<HTMLElement>('[data-gsap="spatial-card"]');
            if (cards.length === 0) return;
            gsap.fromTo(
              cards,
              {
                opacity: 0,
                y: 34,
                rotateX: 8,
                transformPerspective: 900,
              },
              {
                opacity: 1,
                y: 0,
                rotateX: 0,
                duration: 0.85,
                stagger: 0.11,
                ease: 'power3.out',
                clearProps: 'transform',
                scrollTrigger: {
                  trigger: group,
                  start: 'top 86%',
                  once: true,
                },
              },
            );
          });
        }, scope);

        revertFn = () => ctx.revert();
      } catch {
        // Leave native readable typography intact if chunk fails to load
      }
    };

    const rafId = window.requestAnimationFrame(() => {
      void initGsap();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      revertFn?.();
    };
  }, [scopeRef, enabled]);
}
