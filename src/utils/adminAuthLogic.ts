/**
 * Pure Admin ID resolution & credential input validation helpers.
 * Maps the configured public Admin ID alias (e.g. MALAY2020) to the primary
 * Firebase Auth email without ever storing or checking passwords in client code.
 */

export const DEFAULT_ADMIN_ID = 'MALAY2020';

export function normalizeAdminId(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * Resolves a user-entered Admin ID (e.g. "MALAY2020") or the authorized primary
 * admin email directly into the canonical Firebase Auth email address.
 * Returns null if the entered ID is not the configured admin account.
 */
export function resolveAuthorizedAdminEmail(
  rawIdOrEmail: string,
  configuredAdminId: string,
  primaryAdminEmail: string,
): string | null {
  const trimmed = rawIdOrEmail.trim();
  if (!trimmed) return null;

  const expectedId = normalizeAdminId(configuredAdminId || DEFAULT_ADMIN_ID);
  const expectedEmail = primaryAdminEmail.trim().toLowerCase();

  if (trimmed.toUpperCase() === expectedId) {
    return expectedEmail;
  }

  if (trimmed.toLowerCase() === expectedEmail) {
    return expectedEmail;
  }

  return null;
}

export interface AdminLoginValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateAdminLoginInput(
  rawId: string,
  password: string,
): AdminLoginValidationResult {
  if (!rawId.trim()) {
    return { isValid: false, error: 'Please enter your Admin ID.' };
  }
  if (!password) {
    return { isValid: false, error: 'Please enter your password.' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters.' };
  }
  return { isValid: true };
}
