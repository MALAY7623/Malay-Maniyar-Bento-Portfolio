import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Pause, Play } from 'lucide-react';
import type { ThemePalette } from '../types/portfolio';
import type { ThemeMode } from '../utils/themeMode';
import {
  mountEditorialSceneManager,
  type MountedSceneHandle,
  type SceneManagerLiveState,
} from '../three/SceneManager';

interface ThreeScrollStageProps {
  themeMode: ThemeMode;
  siteTheme: ThemePalette;
  disabled?: boolean;
  stagePreview: boolean;
  onToggleStagePreview: () => void;
}

export function ThreeScrollStage({
  themeMode,
  siteTheme,
  disabled = false,
  stagePreview,
  onToggleStagePreview,
}: ThreeScrollStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneHandleRef = useRef<MountedSceneHandle | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(true);
  const [stageReady, setStageReady] = useState(false);

  // Mutable live refs so React state updates never tear down the WebGL context
  const liveStateRef = useRef<SceneManagerLiveState>({
    themeMode,
    siteTheme,
    stagePreview,
    isPaused,
    disabled,
    pointerX: 0,
    pointerY: 0,
    reducedMotion: false,
  });

  liveStateRef.current.themeMode = themeMode;
  liveStateRef.current.siteTheme = siteTheme;
  liveStateRef.current.stagePreview = stagePreview;
  liveStateRef.current.isPaused = isPaused;
  liveStateRef.current.disabled = disabled;

  // Synchronize materials & scene lighting smoothly on theme or CMS palette updates
  useEffect(() => {
    sceneHandleRef.current?.updatePalette({
      primaryAccent: siteTheme.primaryAccent,
      secondaryAccent: siteTheme.secondaryAccent,
      highlightAccent: siteTheme.highlightAccent,
      isDarkMode: themeMode === 'dark',
    });
  }, [themeMode, siteTheme]);

  // Mount Three.js + GSAP ScrollTrigger SceneManager ONCE inside an isolated empty container
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const handle = mountEditorialSceneManager(container, liveStateRef, () => {
      setStageReady(true);
    });
    sceneHandleRef.current = handle;

    return () => {
      sceneHandleRef.current = null;
      handle.dispose();
    };
  }, []);

  if (disabled) return null;

  const isDark = themeMode === 'dark';
  const dockBg = isDark ? 'rgba(20, 20, 26, 0.94)' : 'rgba(255, 255, 255, 0.94)';
  const dockBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(17, 17, 17, 0.12)';
  const dockText = isDark ? '#F5F5F7' : '#111111';
  const dockMuted = isDark ? '#A1A1AA' : '#55555B';

  return (
    <>
      {/* Isolated Full-Bleed WebGL / Fallback Canvas Container (Zero React children inside) */}
      <div
        ref={mountRef}
        aria-hidden="true"
        className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden"
      />

      {/* Compact Collapsible Bottom-Right 3D Stage Dock (No backdrop-filter over WebGL) */}
      {stageReady && (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-1.5">
          <button
            type="button"
            data-testid="three-dock-toggle"
            onClick={() => setDockCollapsed((prev) => !prev)}
            aria-expanded={!dockCollapsed}
            aria-label={
              dockCollapsed ? 'Expand 3D scroll stage controls' : 'Collapse 3D scroll stage controls'
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border shadow-md transition-transform duration-200 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: dockBg,
              borderColor: dockBorder,
              color: dockText,
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--periwinkle)' }}
              aria-hidden="true"
            />
            <span>3D Stage</span>
            {dockCollapsed ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          {!dockCollapsed && (
            <div
              role="region"
              aria-label="Three.js 3D scroll stage controls"
              className="flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-lg"
              style={{
                backgroundColor: dockBg,
                borderColor: dockBorder,
                color: dockText,
              }}
            >
              <button
                type="button"
                data-testid="three-stage-preview-btn"
                onClick={onToggleStagePreview}
                aria-pressed={stagePreview}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                style={
                  stagePreview
                    ? { backgroundColor: 'var(--periwinkle)', color: '#FFFFFF' }
                    : { color: dockText }
                }
              >
                {stagePreview ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Show Portfolio</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Inspect 3D</span>
                  </>
                )}
              </button>

              <span
                aria-hidden="true"
                className="w-px h-4"
                style={{ backgroundColor: dockBorder }}
              />

              <button
                type="button"
                data-testid="three-motion-toggle-btn"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-pressed={isPaused}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                style={{ color: isPaused ? 'var(--periwinkle)' : dockMuted }}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pause</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
