import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp01,
  computeScrollChoreography,
  dampValue,
  smoothstep,
} from './threeScrollChoreography';

test('clamp01 and smoothstep clamp out-of-range and non-finite inputs cleanly', () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(1.8), 1);
  assert.equal(clamp01(Number.NaN), 0);
  assert.equal(smoothstep(0.2, 0.8, 0.2), 0);
  assert.equal(smoothstep(0.2, 0.8, 0.8), 1);
  assert.ok(Math.abs(smoothstep(0.2, 0.8, 0.5) - 0.5) < 1e-12);
});

test('dampValue approaches target smoothly and handles zero or large dt safely', () => {
  assert.equal(dampValue(0, 10, 6, 0), 0);
  const step1 = dampValue(0, 10, 6, 0.016);
  assert.ok(step1 > 0 && step1 < 10);
  const stepHuge = dampValue(0, 10, 6, 5);
  assert.ok(stepHuge > step1 && stepHuge < 10);
});

test('computeScrollChoreography advances chapters, camera glide, and stage preview framing', () => {
  const top = computeScrollChoreography(0, 0, 0, 0, false, true);
  const mid = computeScrollChoreography(0.4, 0, 0, 0, false, true);
  const bottom = computeScrollChoreography(0.95, 0, 0, 0, false, true);
  const previewTop = computeScrollChoreography(0, 0, 0, 0, true, true);

  assert.equal(top.activeChapterIndex, 0);
  assert.equal(mid.activeChapterIndex, 1);
  assert.equal(bottom.activeChapterIndex, 3);

  // Camera descends monotonically as scroll progresses from top to bottom
  assert.ok(top.cameraPosition.y > mid.cameraPosition.y);
  assert.ok(mid.cameraPosition.y > bottom.cameraPosition.y);

  // Stage preview brings sculptures inward and scales them up slightly for inspection
  assert.ok(Math.abs(previewTop.prism.position.x) < Math.abs(top.prism.position.x));
  assert.ok(previewTop.prism.scale > top.prism.scale);
});
