import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP + ScrollTrigger editorial typography and section choreography hook.
 * Animates elements annotated with lightweight `[data-gsap="..."]` markers using
 * `gsap.context()` for clean React StrictMode & unmount teardown without
 * conflicting with existing Framer Motion hover/layout transitions.
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

    const ctx = gsap.context(() => {
      // 1. Hero clipped mask reveal for display typography (immediate entrance, crisp readability)
      const heroClips = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-clip"]');
      if (heroClips.length > 0) {
        gsap.fromTo(
          heroClips,
          {
            clipPath: 'inset(0% 0% 100% 0%)',
            y: 26,
            opacity: 0,
          },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power3.out',
            clearProps: 'clipPath,transform',
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

    return () => {
      ctx.revert();
    };
  }, [scopeRef, enabled]);
}
