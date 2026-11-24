import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useVelocity,
} from 'motion/react';
import { Image as ImageIcon } from 'lucide-react';

interface CornerBracketProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Geometric top-right corner bracket micro-detail (`⌝`) used across bento cards.
 */
export function CornerBracket({
  className = 'text-current',
  size = 18,
  strokeWidth = 2.2,
}: CornerBracketProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${className}`}
    >
      <path
        d="M3 3.5H16.5V17"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

interface TiltBentoCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

/**
 * Tactile 3D hover tilt container using compositor-only transforms.
 */
export function TiltBentoCard({ children, className = '', maxTilt = 4.5 }: TiltBentoCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);

  const rotateX = useSpring(rotateXRaw, { stiffness: 190, damping: 24, mass: 0.55 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 190, damping: 24, mass: 0.55 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateXRaw.set(-py * maxTilt * 2);
    rotateYRaw.set(px * maxTilt * 2);
  };

  const handleMouseLeave = () => {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        prefersReducedMotion
          ? undefined
          : {
              rotateX,
              rotateY,
              transformPerspective: 900,
              transformStyle: 'preserve-3d',
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  fallbackAccent?: string;
  style?: React.CSSProperties;
  /** Enables a CSS backdrop-filter frosted blur placeholder while the image loads */
  blurPlaceholder?: boolean;
  /** Optional accent hex color for the ambient placeholder underlay */
  placeholderColor?: string;
  /** Marks above-the-fold hero imagery as high-priority eager LCP assets */
  priority?: boolean;
}

/**
 * Zero-Broken-Image resilient image wrapper with fallback surface and optional
 * CSS backdrop-filter blurred loading placeholder that fades out smoothly on load.
 */
export function ResilientImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
  fallbackAccent = '#8A85E8',
  style,
  blurPlaceholder = false,
  placeholderColor,
  priority = false,
}: ResilientImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(!blurPlaceholder);
  const [showPlaceholder, setShowPlaceholder] = useState(blurPlaceholder);

  useEffect(() => {
    setHasError(false);
    if (!blurPlaceholder) {
      setIsLoaded(true);
      setShowPlaceholder(false);
      return;
    }

    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
      setShowPlaceholder(false);
      return;
    }

    setIsLoaded(false);
    setShowPlaceholder(true);
  }, [src, blurPlaceholder]);

  useEffect(() => {
    if (!blurPlaceholder || !isLoaded || !showPlaceholder) return;
    const timer = window.setTimeout(() => {
      setShowPlaceholder(false);
    }, 520);
    return () => window.clearTimeout(timer);
  }, [blurPlaceholder, isLoaded, showPlaceholder]);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none"
        style={{
          background: `linear-gradient(135deg, ${fallbackAccent}28 0%, #121214 100%)`,
        }}
      >
        <ImageIcon className="w-7 h-7 text-white/70 mb-2" aria-hidden="true" />
        <span className="text-xs font-medium text-white/85 max-w-[180px] leading-snug">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  if (!blurPlaceholder) {
    return (
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={className}
        style={style}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    );
  }

  const swatchHex = placeholderColor || fallbackAccent;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Soft ambient color underlay visible beneath the frosted backdrop-filter veil while loading */}
      {showPlaceholder && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            background: `radial-gradient(circle at 24% 28%, ${swatchHex}66 0%, transparent 62%), radial-gradient(circle at 78% 74%, color-mix(in srgb, var(--periwinkle) 36%, transparent) 0%, var(--surface-elevated) 78%)`,
          }}
        />
      )}

      <img
        ref={imgRef}
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
          setShowPlaceholder(false);
        }}
        className={`${className} transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isLoaded ? 'opacity-100' : 'opacity-0 scale-[1.04]'
        }`}
        style={style}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />

      {/* CSS backdrop-filter blurred loading placeholder veil — fades out and unmounts cleanly once loaded */}
      {showPlaceholder && (
        <div
          aria-hidden="true"
          data-testid="thumbnail-blur-placeholder"
          data-loading={String(!isLoaded)}
          onTransitionEnd={() => {
            if (isLoaded) setShowPlaceholder(false);
          }}
          className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            backgroundColor: 'color-mix(in srgb, var(--surface-card) 38%, transparent)',
            backdropFilter: 'blur(22px) saturate(1.25)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.25)',
          }}
        />
      )}
    </div>
  );
}

/**
 * Animated sculptural iridescent 3D-shaded sphere for the obsidian half of the AI & Editorial split card.
 */
export function IridescentSphere() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#121214] p-4 select-none">
      {/* Soft ambient periwinkle & apricot optical aura */}
      <div
        aria-hidden="true"
        className="absolute w-32 h-32 rounded-full blur-2xl opacity-45 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, #8A85E8 0%, #B8DCE0 45%, #FFC966 85%, transparent 100%)',
        }}
      />
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 animate-sphere-float">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_14px_24px_rgba(0,0,0,0.65)]" aria-hidden="true">
          <defs>
            <radialGradient id="obsidianCore" cx="34%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#F5EEFF" />
              <stop offset="18%" stopColor="#A9A2F8" />
              <stop offset="46%" stopColor="#3B3A52" />
              <stop offset="76%" stopColor="#17171C" />
              <stop offset="100%" stopColor="#09090B" />
            </radialGradient>
            <linearGradient id="iridescentRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B8DCE0" stopOpacity="0.95" />
              <stop offset="48%" stopColor="#8A85E8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FFC966" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="warmSweep" x1="85%" y1="90%" x2="15%" y2="15%">
              <stop offset="0%" stopColor="#FFC966" stopOpacity="0.82" />
              <stop offset="45%" stopColor="#E8B5F5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8A85E8" stopOpacity="0" />
            </linearGradient>
            <clipPath id="sphereClip">
              <circle cx="100" cy="100" r="76" />
            </clipPath>
          </defs>

          {/* Base sculptural sphere */}
          <circle cx="100" cy="100" r="76" fill="url(#obsidianCore)" />

          {/* Ribbed metallic contour grooves */}
          <g clipPath="url(#sphereClip)" opacity="0.58">
            <ellipse cx="100" cy="48" rx="84" ry="26" fill="none" stroke="url(#iridescentRim)" strokeWidth="2.5" transform="rotate(-24 100 100)" />
            <ellipse cx="100" cy="68" rx="88" ry="30" fill="none" stroke="url(#iridescentRim)" strokeWidth="3" transform="rotate(-24 100 100)" />
            <ellipse cx="100" cy="88" rx="90" ry="32" fill="none" stroke="url(#iridescentRim)" strokeWidth="3.5" transform="rotate(-24 100 100)" />
            <ellipse cx="100" cy="108" rx="90" ry="32" fill="none" stroke="url(#iridescentRim)" strokeWidth="3.5" transform="rotate(-24 100 100)" />
            <ellipse cx="100" cy="128" rx="86" ry="28" fill="none" stroke="url(#iridescentRim)" strokeWidth="3" transform="rotate(-24 100 100)" />
            <ellipse cx="100" cy="148" rx="76" ry="22" fill="none" stroke="url(#iridescentRim)" strokeWidth="2.2" transform="rotate(-24 100 100)" />
          </g>

          {/* Warm apricot bottom-right rim light */}
          <circle cx="100" cy="100" r="76" fill="url(#warmSweep)" />
          {/* Crisp top-left specular crescent */}
          <ellipse cx="72" cy="64" rx="22" ry="12" fill="#FFFFFF" opacity="0.28" transform="rotate(-32 72 64)" />
          <circle cx="100" cy="100" r="75.2" fill="none" stroke="url(#iridescentRim)" strokeWidth="1.2" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Continuously rotating circular portfolio stamp badge that subtly accelerates on scroll.
 */
export function RotatingStampBadge() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 40, stiffness: 260 });
  const rotation = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    if (prefersReducedMotion) return;
    const baseSpeed = 16; // degrees per second
    const velocityBoost = Math.min(180, Math.abs(smoothVelocity.get()) * 0.08);
    const next = (rotation.get() + ((baseSpeed + velocityBoost) * delta) / 1000) % 360;
    rotation.set(next);
  });

  return (
    <div
      className="relative w-16 h-16 sm:w-[88px] sm:h-[88px] shrink-0 flex items-center justify-center select-none"
      aria-label="Creative Portfolio Graphic and UGC"
    >
      <motion.svg
        viewBox="0 0 120 120"
        className="w-full h-full"
        style={prefersReducedMotion ? undefined : { rotate: rotation }}
      >
        <defs>
          <path
            id="stampCirclePath"
            d="M 60, 60 m -42, 0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0"
          />
        </defs>
        <circle cx="60" cy="60" r="54" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.32)" strokeWidth="1" />
        <text
          fill="#FFFFFF"
          fontSize="9.1"
          fontWeight="700"
          letterSpacing="2.35"
          className="font-sans"
        >
          <textPath href="#stampCirclePath" startOffset="0%">
            CREATIVE PORTFOLIO • GRAPHIC &amp; UGC •
          </textPath>
        </text>
      </motion.svg>
      {/* Crisp center four-point star */}
      <svg
        viewBox="0 0 24 24"
        className="absolute w-5 h-5 text-white pointer-events-none"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
      </svg>
    </div>
  );
}
