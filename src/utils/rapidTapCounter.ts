/**
 * Pure state machine for tracking rapid consecutive taps/clicks on an element
 * and triggering an action strictly when the exact target count is reached
 * without a pause exceeding `maxGapMs`.
 */

export const DEFAULT_RAPID_TAP_TARGET = 10;
export const DEFAULT_RAPID_TAP_WINDOW_MS = 1200;

export interface RapidTapState {
  count: number;
  lastTapMs: number | null;
}

export interface RapidTapStepResult extends RapidTapState {
  triggered: boolean;
}

export interface RapidTapOptions {
  targetCount?: number;
  maxGapMs?: number;
}

export const INITIAL_RAPID_TAP_STATE: RapidTapState = {
  count: 0,
  lastTapMs: null,
};

/**
 * Advances the rapid-tap state for a tap occurring at `nowMs`.
 * - Resets to 1 if the gap since the previous tap exceeded `maxGapMs`.
 * - Triggers and resets to 0 when the consecutive count reaches `targetCount` exactly.
 */
export function advanceRapidTapState(
  state: RapidTapState,
  nowMs: number,
  options: RapidTapOptions = {},
): RapidTapStepResult {
  const targetCount = options.targetCount ?? DEFAULT_RAPID_TAP_TARGET;
  const maxGapMs = options.maxGapMs ?? DEFAULT_RAPID_TAP_WINDOW_MS;

  const hasPaused =
    state.lastTapMs !== null && (nowMs < state.lastTapMs || nowMs - state.lastTapMs > maxGapMs);

  const nextCount = hasPaused ? 1 : state.count + 1;

  if (nextCount === targetCount) {
    return {
      count: 0,
      lastTapMs: null,
      triggered: true,
    };
  }

  return {
    count: nextCount,
    lastTapMs: nowMs,
    triggered: false,
  };
}
