import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useVelocity,
} from 'motion/react';
import { ArrowUpRight, MoveHorizontal, Play } from 'lucide-react';
import {
  computeVelocityDeformation,
  DEFAULT_CURSOR_INTENT,
  getCursorVisualSpec,
  resolveCursorIntent,
  type CursorIntent,
} from '../utils/cursorPhysics';

interface PhysicsCursorProps {
  /** Disable follower cursor when inside Admin CMS so form workflows remain purely utilitarian */
  disabled?: boolean;
  /** Adapt neutral cursor ring & dot contrast when Dark Mode is active */
  isDarkMode?: boolean;
}

/**
 * High-end, physics-based editorial follower cursor.
 * - Dual-layer spring tracking (instantaneous core dot + damped studio lens ring)
 * - Subtle velocity-driven directional stretch when gliding across the canvas
 * - Context-aware reactions to bento grid cards, showreel media, retouching sliders, and CTAs
 * - Automatically disabled on touch/coarse-pointer devices and when prefers-reduced-motion is active
 */
export function PhysicsCursor({ disabled = false, isDarkMode = false }: PhysicsCursorProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [intent, setIntent] = useState<CursorIntent>(DEFAULT_CURSOR_INTENT);

  const intentRef = useRef<CursorIntent>(DEFAULT_CURSOR_INTENT);
  const isVisibleRef = useRef(false);

  // Raw pointer coordinates
  const pointerX = useMotionValue(-120);
  const pointerY = useMotionValue(-120);

  // Layer 1: Razor-sharp precision core dot
  const dotX = useSpring(pointerX, { stiffness: 1000, damping: 46, mass: 0.2 });
  const dotY = useSpring(pointerY, { stiffness: 1000, damping: 46, mass: 0.2 });

  // Layer 2: Silky damped physics follower lens
  const ringX = useSpring(pointerX, { stiffness: 210, damping: 25, mass: 0.48 });
  const ringY = useSpring(pointerY, { stiffness: 210, damping: 25, mass: 0.48 });

  // Velocity-driven organic deformation (only applied in free-roaming circular states)
  const velX = useVelocity(ringX);
  const velY = useVelocity(ringY);
  const stretchXRaw = useMotionValue(1);
  const stretchYRaw = useMotionValue(1);
  const angleRaw = useMotionValue(0);

  const stretchX = useSpring(stretchXRaw, { stiffness: 320, damping: 26 });
  const stretchY = useSpring(stretchYRaw, { stiffness: 320, damping: 26 });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setIsFinePointer(mq.matches);
    sync();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', sync);
      return () => mq.removeEventListener('change', sync);
    }
    mq.addListener(sync);
    return () => mq.removeListener(sync);
  }, []);

  const isEnabled = !disabled && !prefersReducedMotion && isFinePointer;

  useEffect(() => {
    if (!isEnabled) {
      setIsVisible(false);
      isVisibleRef.current = false;
      return;
    }

    const updateVelocityDeformation = () => {
      const activeVariant = intentRef.current.variant;
      // Keep labelled badges, bento frames, and drag pills crisp & un-skewed
      if (activeVariant !== 'default' && activeVariant !== 'interactive') {
        stretchXRaw.set(1);
        stretchYRaw.set(1);
        return;
      }
      const { scaleX, scaleY, angleDeg } = computeVelocityDeformation(velX.get(), velY.get());
      stretchXRaw.set(scaleX);
      stretchYRaw.set(scaleY);
      if (scaleX > 1.01) {
        angleRaw.set(angleDeg);
      }
    };

    const unsubVelX = velX.on('change', updateVelocityDeformation);
    const unsubVelY = velY.on('change', updateVelocityDeformation);

    const syncIntentFromElement = (target: EventTarget | null) => {
      const element = target instanceof Element ? target : null;
      const nextIntent = resolveCursorIntent(element);
      const prev = intentRef.current;
      if (
        prev.variant !== nextIntent.variant ||
        prev.label !== nextIntent.label ||
        prev.tone !== nextIntent.tone
      ) {
        intentRef.current = nextIntent;
        setIntent(nextIntent);
        if (nextIntent.variant !== 'default' && nextIntent.variant !== 'interactive') {
          stretchXRaw.set(1);
          stretchYRaw.set(1);
          angleRaw.set(0);
        }
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        if (isVisibleRef.current) {
          isVisibleRef.current = false;
          setIsVisible(false);
        }
        return;
      }

      pointerX.set(event.clientX);
      pointerY.set(event.clientY);

      if (!isVisibleRef.current) {
        // Snap springs to entry point so the cursor never flies in from off-screen
        dotX.jump(event.clientX);
        dotY.jump(event.clientY);
        ringX.jump(event.clientX);
        ringY.jump(event.clientY);
        isVisibleRef.current = true;
        setIsVisible(true);
      }

      syncIntentFromElement(event.target);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      setIsPressed(true);
    };

    const handlePointerUp = () => {
      setIsPressed(false);
    };

    const handlePointerLeaveWindow = () => {
      isVisibleRef.current = false;
      setIsVisible(false);
      setIsPressed(false);
    };

    const handleScroll = () => {
      if (!isVisibleRef.current) return;
      const el = document.elementFromPoint(pointerX.get(), pointerY.get());
      syncIntentFromElement(el);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('blur', handlePointerLeaveWindow);
    document.documentElement.addEventListener('mouseleave', handlePointerLeaveWindow);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      unsubVelX();
      unsubVelY();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('blur', handlePointerLeaveWindow);
      document.documentElement.removeEventListener('mouseleave', handlePointerLeaveWindow);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [
    isEnabled,
    pointerX,
    pointerY,
    dotX,
    dotY,
    ringX,
    ringY,
    velX,
    velY,
    stretchXRaw,
    stretchYRaw,
    angleRaw,
  ]);

  if (!isEnabled) return null;

  const spec = getCursorVisualSpec(intent.variant, intent.tone, isPressed, isDarkMode);
  const showOuter = isVisible && intent.variant !== 'hidden';
  const showDot = showOuter && spec.dotScale > 0;
  const isDarkSurfaceTone =
    intent.tone === 'periwinkle' ||
    intent.tone === 'obsidian' ||
    intent.tone === 'charcoal' ||
    (intent.tone === 'neutral' && isDarkMode);

  return (
    <div
      aria-hidden="true"
      data-testid="physics-cursor"
      data-cursor-variant={isVisible ? intent.variant : 'idle'}
      data-cursor-tone={intent.tone}
      data-cursor-label={intent.label}
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none"
    >
      {/* Layer 2: Physics-Driven Follower Studio Lens */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          scaleX: stretchX,
          scaleY: stretchY,
          rotate: angleRaw,
        }}
        className="fixed top-0 left-0 will-change-transform"
      >
        <motion.div
          animate={{
            width: spec.width,
            height: spec.height,
            borderRadius: spec.borderRadius,
            opacity: showOuter ? spec.ringOpacity : 0,
            backgroundColor: spec.surfaceBg,
            borderColor: spec.borderColor,
          }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 30,
            mass: 0.55,
          }}
          className="relative flex items-center justify-center border-[1.25px] backdrop-blur-[8px] shadow-[0_6px_22px_rgba(17,17,17,0.1)]"
        >
          {/* Architectural Editorial Corner Brackets on Bento Card & Tile Hover */}
          <AnimatePresence>
            {spec.showCorners && showOuter && (
              <motion.div
                key="bento-corners"
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.78 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-[5px] pointer-events-none"
                style={{ color: isDarkSurfaceTone ? '#FFFFFF' : '#111111' }}
              >
                <span className="absolute top-0 left-0 w-2 h-2 border-t-[1.5px] border-l-[1.5px] border-current rounded-tl-[2px]" />
                <span className="absolute top-0 right-0 w-2 h-2 border-t-[1.5px] border-r-[1.5px] border-current rounded-tr-[2px]" />
                <span className="absolute bottom-0 left-0 w-2 h-2 border-b-[1.5px] border-l-[1.5px] border-current rounded-bl-[2px]" />
                <span className="absolute bottom-0 right-0 w-2 h-2 border-b-[1.5px] border-r-[1.5px] border-current rounded-br-[2px]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contextual Micro-Label / Glyph inside Expanded Lens */}
          <AnimatePresence mode="wait">
            {showOuter && intent.variant === 'tile' && (
              <motion.span
                key="tile-arrow"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.14 }}
                className="inline-flex items-center justify-center"
                style={{ color: spec.textColor }}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.1]" />
              </motion.span>
            )}

            {showOuter && intent.variant === 'media' && (
              <motion.span
                key={`media-${intent.label}`}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.14 }}
                className="inline-flex items-center gap-1 text-[10.5px] font-bold tracking-[0.015em] whitespace-nowrap"
                style={{ color: spec.textColor }}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{intent.label || 'Play'}</span>
              </motion.span>
            )}

            {showOuter && intent.variant === 'action' && (
              <motion.span
                key={`action-${intent.label}`}
                initial={{ opacity: 0, scale: 0.78 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.78 }}
                transition={{ duration: 0.14 }}
                className="text-[10.5px] font-bold tracking-[0.015em] whitespace-nowrap"
                style={{ color: spec.textColor }}
              >
                {intent.label || 'Open'}
              </motion.span>
            )}

            {showOuter && intent.variant === 'drag' && (
              <motion.span
                key="drag-cue"
                initial={{ opacity: 0, scale: 0.78 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.78 }}
                transition={{ duration: 0.14 }}
                className="inline-flex items-center gap-1 text-[10.5px] font-bold tracking-[0.015em] whitespace-nowrap"
                style={{ color: spec.textColor }}
              >
                <MoveHorizontal className="w-3.5 h-3.5" />
                <span>{intent.label || 'Drag'}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Layer 1: Precision Core Dot */}
      <motion.div
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: showDot ? spec.dotScale : 0,
          opacity: showDot ? 1 : 0,
          backgroundColor: isDarkSurfaceTone ? '#FFFFFF' : '#111111',
        }}
        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 w-[6px] h-[6px] rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.45)] will-change-transform"
      />
    </div>
  );
}
