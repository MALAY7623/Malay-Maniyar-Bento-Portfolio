import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceRapidTapState,
  DEFAULT_RAPID_TAP_TARGET,
  DEFAULT_RAPID_TAP_WINDOW_MS,
  INITIAL_RAPID_TAP_STATE,
} from './rapidTapCounter';

test('advanceRapidTapState triggers strictly on the 10th rapid consecutive tap', () => {
  let state = INITIAL_RAPID_TAP_STATE;
  let now = 1000;

  for (let i = 1; i < DEFAULT_RAPID_TAP_TARGET; i += 1) {
    const step = advanceRapidTapState(state, now);
    assert.equal(step.triggered, false, `Should not trigger at tap ${i}`);
    assert.equal(step.count, i);
    state = { count: step.count, lastTapMs: step.lastTapMs };
    now += 180;
  }

  const tenth = advanceRapidTapState(state, now);
  assert.equal(tenth.triggered, true);
  assert.equal(tenth.count, 0);
  assert.equal(tenth.lastTapMs, null);
});

test('advanceRapidTapState resets count when a pause exceeds maxGapMs', () => {
  let state = INITIAL_RAPID_TAP_STATE;
  let now = 1000;

  // 6 rapid taps
  for (let i = 0; i < 6; i += 1) {
    const step = advanceRapidTapState(state, now);
    state = { count: step.count, lastTapMs: step.lastTapMs };
    now += 150;
  }
  assert.equal(state.count, 6);

  // Pause longer than the rapid-tap window
  now += DEFAULT_RAPID_TAP_WINDOW_MS + 250;

  // Next 4 taps must NOT trigger (restarted from 1 -> 4)
  for (let i = 1; i <= 4; i += 1) {
    const step = advanceRapidTapState(state, now);
    assert.equal(step.triggered, false);
    assert.equal(step.count, i);
    state = { count: step.count, lastTapMs: step.lastTapMs };
    now += 150;
  }

  // Remaining 6 rapid taps complete the fresh sequence of 10 and trigger
  for (let i = 5; i <= 9; i += 1) {
    const step = advanceRapidTapState(state, now);
    assert.equal(step.triggered, false);
    assert.equal(step.count, i);
    state = { count: step.count, lastTapMs: step.lastTapMs };
    now += 150;
  }

  const finalStep = advanceRapidTapState(state, now);
  assert.equal(finalStep.triggered, true);
  assert.equal(finalStep.count, 0);
});
