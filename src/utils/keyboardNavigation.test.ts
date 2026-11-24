import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAIN_NAV_ANCHOR_ORDER,
  resolveSectionByArrowKey,
  shouldHandleGlobalArrowNavigation,
} from './keyboardNavigation';

test('resolveSectionByArrowKey steps cleanly through main navigation anchors and clamps at boundaries', () => {
  assert.equal(resolveSectionByArrowKey('ArrowDown', 'about'), 'ugc-reels');
  assert.equal(resolveSectionByArrowKey('ArrowRight', 'ugc-reels'), 'design-work');
  assert.equal(resolveSectionByArrowKey('ArrowDown', 'design-work'), 'clients');
  assert.equal(resolveSectionByArrowKey('ArrowDown', 'clients'), 'contact');
  // Boundary clamp at bottom
  assert.equal(resolveSectionByArrowKey('ArrowDown', 'contact'), null);

  assert.equal(resolveSectionByArrowKey('ArrowUp', 'contact'), 'clients');
  assert.equal(resolveSectionByArrowKey('ArrowLeft', 'clients'), 'design-work');
  // Boundary clamp at top
  assert.equal(resolveSectionByArrowKey('ArrowUp', 'about'), null);

  assert.equal(resolveSectionByArrowKey('End', 'about'), MAIN_NAV_ANCHOR_ORDER.at(-1));
  assert.equal(resolveSectionByArrowKey('Home', 'contact'), MAIN_NAV_ANCHOR_ORDER[0]);
  assert.equal(resolveSectionByArrowKey('Enter', 'about'), null);
});

test('shouldHandleGlobalArrowNavigation blocks inputs, sliders, modifiers, admin view, and overlays', () => {
  assert.equal(
    shouldHandleGlobalArrowNavigation({
      activeView: 'portfolio',
      hasOpenOverlay: false,
      target: { tagName: 'BODY' },
    }),
    true,
  );

  assert.equal(
    shouldHandleGlobalArrowNavigation({
      activeView: 'admin',
      hasOpenOverlay: false,
      target: { tagName: 'BODY' },
    }),
    false,
  );

  assert.equal(
    shouldHandleGlobalArrowNavigation({
      activeView: 'portfolio',
      hasOpenOverlay: true,
      target: { tagName: 'BODY' },
    }),
    false,
  );

  assert.equal(
    shouldHandleGlobalArrowNavigation({
      activeView: 'portfolio',
      hasOpenOverlay: false,
      ctrlKey: true,
      target: { tagName: 'BODY' },
    }),
    false,
  );

  assert.equal(
    shouldHandleGlobalArrowNavigation({
      activeView: 'portfolio',
      hasOpenOverlay: false,
      target: { tagName: 'INPUT' },
    }),
    false,
  );

  assert.equal(
    shouldHandleGlobalArrowNavigation({
      activeView: 'portfolio',
      hasOpenOverlay: false,
      target: { tagName: 'DIV', getAttribute: (name) => (name === 'role' ? 'slider' : null) },
    }),
    false,
  );
});
