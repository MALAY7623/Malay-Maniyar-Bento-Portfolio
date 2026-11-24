import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ADMIN_ID,
  normalizeAdminId,
  resolveAuthorizedAdminEmail,
  validateAdminLoginInput,
} from './adminAuthLogic';

test('resolveAuthorizedAdminEmail maps configured Admin ID cleanly and rejects unknown IDs', () => {
  const email = 'malaymaniyar2020@gmail.com';
  assert.equal(normalizeAdminId('  malay2020 '), DEFAULT_ADMIN_ID);
  assert.equal(resolveAuthorizedAdminEmail('MALAY2020', 'MALAY2020', email), email);
  assert.equal(resolveAuthorizedAdminEmail('malay2020', 'MALAY2020', email), email);
  assert.equal(resolveAuthorizedAdminEmail(email, 'MALAY2020', email), email);
  assert.equal(resolveAuthorizedAdminEmail('STRANGER', 'MALAY2020', email), null);
  assert.equal(resolveAuthorizedAdminEmail('other@example.com', 'MALAY2020', email), null);
  assert.equal(resolveAuthorizedAdminEmail('   ', 'MALAY2020', email), null);
});

test('validateAdminLoginInput validates required ID and minimum password length', () => {
  assert.equal(validateAdminLoginInput('', 'secret123').isValid, false);
  assert.equal(validateAdminLoginInput('MALAY2020', '').isValid, false);
  assert.equal(validateAdminLoginInput('MALAY2020', '123').isValid, false);
  assert.equal(validateAdminLoginInput('MALAY2020', 'validpass').isValid, true);
});
