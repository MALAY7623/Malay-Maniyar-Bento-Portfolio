import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeVelocityDeformation,
  getCursorVisualSpec,
  resolveCursorIntent,
  type CursorInspectableNode,
} from './cursorPhysics';

function makeNode(
  tagName: string,
  attrs: Record<string, string> = {},
  parentElement: CursorInspectableNode | null = null,
): CursorInspectableNode {
  return {
    tagName,
    getAttribute: (name: string) => attrs[name] ?? null,
    parentElement,
  };
}

test('computeVelocityDeformation returns neutral identity at rest and clamps high speeds', () => {
  assert.deepEqual(computeVelocityDeformation(0, 0), { scaleX: 1, scaleY: 1, angleDeg: 0 });
  assert.deepEqual(computeVelocityDeformation(20, 15), { scaleX: 1, scaleY: 1, angleDeg: 0 });
  assert.deepEqual(computeVelocityDeformation(Number.NaN, 100), {
    scaleX: 1,
    scaleY: 1,
    angleDeg: 0,
  });

  const fastRight = computeVelocityDeformation(2500, 0);
  assert.equal(fastRight.scaleX, 1.18);
  assert.ok(fastRight.scaleY < 1 && fastRight.scaleY >= 0.85);
  assert.equal(fastRight.angleDeg, 0);

  const diagonal = computeVelocityDeformation(600, 600);
  assert.ok(diagonal.scaleX > 1 && diagonal.scaleX < 1.18);
  assert.equal(diagonal.angleDeg, 45);
});

test('resolveCursorIntent resolves bento annotations, inherits tones, and hides on text inputs', () => {
  const heroCard = makeNode('DIV', {
    'data-cursor': 'bento',
    'data-cursor-tone': 'periwinkle',
  });
  const nestedHeading = makeNode('H1', {}, heroCard);
  assert.deepEqual(resolveCursorIntent(nestedHeading), {
    variant: 'bento',
    label: '',
    tone: 'periwinkle',
  });

  const mintTile = makeNode('BUTTON', {
    'data-cursor': 'action',
    'data-cursor-label': 'Explore',
    'data-cursor-tone': 'mint',
  });
  const tileSpan = makeNode('SPAN', {}, mintTile);
  assert.deepEqual(resolveCursorIntent(tileSpan), {
    variant: 'action',
    label: 'Explore',
    tone: 'mint',
  });

  const inputInsideCard = makeNode('INPUT', {}, heroCard);
  assert.equal(resolveCursorIntent(inputInsideCard).variant, 'hidden');

  const slider = makeNode('DIV', { role: 'slider' });
  assert.deepEqual(resolveCursorIntent(slider), {
    variant: 'drag',
    label: 'Drag',
    tone: 'apricot',
  });

  const plainLink = makeNode('A', { href: '#contact' });
  assert.equal(resolveCursorIntent(plainLink).variant, 'interactive');

  assert.equal(resolveCursorIntent(null).variant, 'default');
});

test('getCursorVisualSpec returns distinct bento, tile, media, drag, and pressed geometries', () => {
  const idle = getCursorVisualSpec('default', 'neutral', false);
  const bento = getCursorVisualSpec('bento', 'periwinkle', false);
  const tile = getCursorVisualSpec('tile', 'mint', false);
  const media = getCursorVisualSpec('media', 'obsidian', false);
  const drag = getCursorVisualSpec('drag', 'apricot', false);
  const pressedBento = getCursorVisualSpec('bento', 'periwinkle', true);

  assert.equal(idle.showCorners, false);
  assert.equal(bento.showCorners, true);
  assert.equal(bento.borderRadius, 15);
  assert.equal(tile.showCorners, true);
  assert.equal(tile.dotScale, 0);
  assert.ok(media.width > bento.width);
  assert.equal(media.dotScale, 0);
  assert.ok(drag.width > drag.height);
  assert.ok(pressedBento.width < bento.width);
});

test('getCursorVisualSpec adapts neutral palette for high contrast in Dark Mode', () => {
  const lightNeutral = getCursorVisualSpec('bento', 'neutral', false, false);
  const darkNeutral = getCursorVisualSpec('bento', 'neutral', false, true);

  assert.notEqual(darkNeutral.borderColor, lightNeutral.borderColor);
  assert.notEqual(darkNeutral.surfaceBg, lightNeutral.surfaceBg);
  assert.equal(darkNeutral.textColor, '#F5F5F7');
  assert.match(darkNeutral.borderColor, /245|255/);
});

