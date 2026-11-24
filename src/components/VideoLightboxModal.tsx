import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pause, Play, RotateCcw, Send, Volume2, VolumeX, X } from 'lucide-react';
import type { UgcReel } from '../types/portfolio';
import { formatDuration } from '../utils/portfolioLogic';
import { EDITORIAL_EASE, SMOOTH_SPRING } from '../utils/motionConfig';
import { ResilientImage } from './BentoPrimitives';

interface VideoLightboxModalProps {
  reel: UgcReel | null;
  onClose: () => void;
  onStartProject: () => void;
}

export function VideoLightboxModal({ reel, onClose, onStartProject }: VideoLightboxModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset player state when opening a new reel
  useEffect(() => {
    if (!reel) return;
    setIsPlaying(true);
    setCurrentTime(0);
    setIsMuted(false);
  }, [reel]);

  // Escape key dismissal & body scroll lock
  useEffect(() => {
    if (!reel) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === ' ' && document.activeElement?.tagName !== 'BUTTON') {
        event.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reel, onClose]);

  // Simulated timeline playback when no external .mp4 is supplied yet
  useEffect(() => {
    if (!reel || reel.videoUrl || !isPlaying) return;
    const interval = window.setInterval(() => {
      setCurrentTime((prev) => {
        if (prev + 0.25 >= reel.durationSeconds) {
          return 0;
        }
        return Number((prev + 0.25).toFixed(2));
      });
    }, 250);
    return () => window.clearInterval(interval);
  }, [reel, isPlaying]);

  // Sync native <video> element if user dropped in a real .mp4 URL
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !reel?.videoUrl) return;
    vid.muted = isMuted;
    if (isPlaying) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isPlaying, isMuted, reel]);

  const handleScrub = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextSeconds = Number(event.target.value);
    setCurrentTime(nextSeconds);
    if (videoRef.current) {
      videoRef.current.currentTime = nextSeconds;
    }
  };

  const handleReplay = () => {
    setCurrentTime(0);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const progressPercent = reel ? Math.min(100, (currentTime / Math.max(1, reel.durationSeconds)) * 100) : 0;
  const activeBeatIndex = reel
    ? Math.min(
        reel.editingBreakdown.length - 1,
        Math.floor((currentTime / Math.max(1, reel.durationSeconds)) * reel.editingBreakdown.length),
      )
    : 0;

  return (
    <AnimatePresence>
      {reel && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-theater-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/82 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={SMOOTH_SPRING}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl rounded-[28px] bg-[#141417] border border-white/12 text-white overflow-hidden shadow-2xl my-auto"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-4 border-b border-white/10">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-white/65">
                  <span>{reel.platform}</span>
                  <span aria-hidden="true">·</span>
                  <span>{reel.client}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{formatDuration(reel.durationSeconds)}</span>
                </div>
                <h2
                  id="video-theater-title"
                  className="text-base sm:text-lg font-bold tracking-tight text-white truncate mt-0.5"
                >
                  {reel.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close video lightbox"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFC966]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Body Split: Video Player + Editorial Strategy Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Media Stage */}
              <div className="lg:col-span-6 bg-[#0B0B0D] p-5 sm:p-7 flex flex-col items-center justify-center">
                <div
                  className={`relative w-full overflow-hidden rounded-[22px] bg-[#121214] shadow-2xl ${
                    reel.aspectRatio === '9:16'
                      ? 'max-w-[300px] aspect-[9/16]'
                      : 'aspect-video'
                  }`}
                >
                  {reel.videoUrl ? (
                    <video
                      ref={videoRef}
                      src={reel.videoUrl}
                      poster={reel.thumbnailUrl}
                      playsInline
                      loop
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${isPlaying ? 'animate-ugc-preview' : ''}`}>
                      <ResilientImage
                        src={reel.thumbnailUrl}
                        alt={reel.title}
                        className="w-full h-full object-cover"
                        fallbackTitle={reel.title}
                        fallbackAccent={reel.accentColor}
                      />
                    </div>
                  )}

                  {/* Scrim + Active Storyboard Caption */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none"
                  />

                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between text-[11px] font-mono tabular-nums text-white/85">
                    <span>{isPlaying ? 'Playing Preview' : 'Paused'}</span>
                    <span>
                      {formatDuration(currentTime)} / {formatDuration(reel.durationSeconds)}
                    </span>
                  </div>

                  {/* Live Beat Callout synced to playhead */}
                  <div className="absolute bottom-16 left-4 right-4">
                    <p className="text-xs font-medium text-white/95 bg-black/55 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 leading-snug">
                      {reel.editingBreakdown[activeBeatIndex]}
                    </p>
                  </div>

                  {/* Interactive Player Controls */}
                  <div className="absolute bottom-0 inset-x-0 px-4 pb-3.5 pt-2 flex flex-col gap-2">
                    <input
                      type="range"
                      min={0}
                      max={reel.durationSeconds}
                      step={0.25}
                      value={currentTime}
                      onChange={handleScrub}
                      aria-label="Seek video timeline"
                      className="w-full accent-[#8A85E8] h-1.5 cursor-pointer"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsPlaying((prev) => !prev)}
                          aria-label={isPlaying ? 'Pause video' : 'Play video'}
                          className="w-8 h-8 rounded-full bg-white text-[#111111] hover:bg-white/90 flex items-center justify-center cursor-pointer"
                        >
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleReplay}
                          aria-label="Replay from start"
                          className="w-8 h-8 rounded-full bg-white/12 hover:bg-white/22 text-white flex items-center justify-center cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] tabular-nums text-white/75">
                          {Math.round(progressPercent)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsMuted((prev) => !prev)}
                          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                          className="w-8 h-8 rounded-full bg-white/12 hover:bg-white/22 text-white flex items-center justify-center cursor-pointer"
                        >
                          {isMuted ? (
                            <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Brief, Hook Strategy & Edit Breakdown */}
              <div className="lg:col-span-6 flex flex-col justify-between max-h-[78vh]">
                <div className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1">
                  <div>
                    <h3 className="text-xs font-semibold text-[#B8DCE0] mb-1.5">Campaign Brief</h3>
                    <p className="text-sm text-white/85 leading-relaxed">{reel.campaignBrief}</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-[#FFC966] mb-1.5">Hook Strategy</h3>
                    <p className="text-sm text-white/85 leading-relaxed">{reel.hookStrategy}</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-[#8A85E8] mb-2">Editing Breakdown</h3>
                    <ol className="space-y-2">
                      {reel.editingBreakdown.map((step, idx) => (
                        <li
                          key={step}
                          className={`text-xs sm:text-[13px] leading-relaxed px-3.5 py-2 rounded-xl border transition-colors ${
                            idx === activeBeatIndex
                              ? 'bg-white/10 border-[#8A85E8]/70 text-white'
                              : 'bg-white/[0.03] border-white/[0.07] text-white/75'
                          }`}
                        >
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="pt-3 border-t border-white/10 text-xs text-white/65">
                    <span className="font-semibold text-white/90">Deliverables: </span>
                    {reel.deliverables}
                  </div>
                </div>

                <div className="px-6 sm:px-7 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#141417] shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartProject();
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFC966] hover:bg-[#f6be53] text-[#111111] text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Commission a Similar Reel</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/16 text-white text-xs font-semibold cursor-pointer"
                  >
                    Back to Portfolio
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
