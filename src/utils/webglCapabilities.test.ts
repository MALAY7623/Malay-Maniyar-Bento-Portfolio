import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSoftwareRendererString,
  selectWebGL2ContextAttempts,
} from './webglCapabilities';

test('isSoftwareRendererString flags software and legacy Direct3D9 renderers and passes modern GPUs', () => {
  assert.equal(isSoftwareRendererString(''), true);
  assert.equal(isSoftwareRendererString('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))'), true);
  assert.equal(isSoftwareRendererString('llvmpipe (LLVM 15.0.7, 256 bits)'), true);
  assert.equal(
    isSoftwareRendererString(
      'ANGLE (Intel, Intel(R) HD Graphics Direct3D9Ex vs_3_0 ps_3_0, igdumd64.dll)',
    ),
    true,
  );
  assert.equal(isSoftwareRendererString('Microsoft Basic Render Driver'), true);
  assert.equal(isSoftwareRendererString('ANGLE (Apple, Apple M3 Pro, OpenGL 4.1)'), false);
  assert.equal(isSoftwareRendererString('ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11)'), false);
});

test('selectWebGL2ContextAttempts disables antialias on software GL and provides graceful GPU fallbacks', () => {
  const swAttempts = selectWebGL2ContextAttempts(true);
  assert.ok(swAttempts.length >= 2);
  assert.equal(swAttempts[0].antialias, false);
  assert.equal(swAttempts[0].powerPreference, 'default');

  const gpuAttempts = selectWebGL2ContextAttempts(false);
  assert.ok(gpuAttempts.length >= 3);
  assert.equal(gpuAttempts[0].antialias, true);
  assert.equal(gpuAttempts[0].powerPreference, 'high-performance');
  assert.equal(gpuAttempts[gpuAttempts.length - 1].antialias, false);
});
