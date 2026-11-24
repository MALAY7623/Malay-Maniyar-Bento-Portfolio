import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import {
  DEFAULT_ADMIN_ID,
  resolveAuthorizedAdminEmail,
  validateAdminLoginInput,
} from '../utils/adminAuthLogic';

const env = import.meta.env;

const firebaseConfig = {
  ...firebaseConfigJson,
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  firestoreDatabaseId:
    env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId,
};

export const PRIMARY_ADMIN_ID = env.VITE_ADMIN_ID || DEFAULT_ADMIN_ID;
export const PRIMARY_ADMIN_EMAIL =
  env.VITE_ADMIN_EMAIL || 'malaymaniyar2020@gmail.com';
export const FIREBASE_CONSOLE_AUTH_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

/**
 * Supported Firebase Auth provider IDs explicitly wired in the client SDK.
 * Note: Enabling the Email/Password sign-in provider toggle itself is controlled
 * in Firebase Console; the client SDK uses EmailAuthProvider / signInWithEmailAndPassword.
 */
export const ENABLED_AUTH_PROVIDERS = [
  EmailAuthProvider.PROVIDER_ID,
  GoogleAuthProvider.PROVIDER_ID,
] as const;

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Explicitly configure persistent local browser auth session for Email/Password & Google
void setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('[Auth] Failed to configure browserLocalPersistence:', getFirebaseErrorCode(error));
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface AdminAuthResult {
  ok: boolean;
  reason?: string;
  errorCode?: string;
  user?: User;
  needsVerification?: boolean;
  providerNotEnabled?: boolean;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isAuthorizedAdminUser(user: User | null): boolean {
  if (!user) return false;
  return Boolean(
    user.emailVerified && user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase(),
  );
}

export function getFirebaseErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code);
  }
  return '';
}

function logAuthEvent(
  level: 'info' | 'warn' | 'error',
  stage: string,
  details: Record<string, unknown>,
) {
  const payload = {
    stage,
    projectId: firebaseConfig.projectId,
    providersConfigured: ENABLED_AUTH_PROVIDERS,
    ...details,
  };
  if (level === 'error') {
    console.error('[Auth]', payload);
  } else if (level === 'warn') {
    console.warn('[Auth]', payload);
  } else {
    console.info('[Auth]', payload);
  }
}

/**
 * Ensures the active Firebase Auth JWT ID token reflects the latest `email_verified`
 * claim before Firestore security rules evaluate `request.auth.token.email_verified`.
 *
 * Without forcing `getIdToken(true)` after `user.reload()` (for example right after
 * clicking the email verification link), Firebase caches the pre-verification JWT for
 * up to 60 minutes, causing Firestore writes to fail with "Missing or insufficient permissions."
 */
export async function ensureFreshAdminToken(forceRefresh = false): Promise<boolean> {
  const current = auth.currentUser;
  if (!current) {
    logAuthEvent('warn', 'token-check:no-user', {});
    return false;
  }

  try {
    let tokenResult = await current.getIdTokenResult(forceRefresh);
    const tokenEmailVerified = tokenResult.claims?.email_verified === true;

    if (!tokenEmailVerified) {
      // Refresh both the Auth user profile and the signed JWT sent to Firestore
      await current.reload();
      if (current.emailVerified) {
        logAuthEvent('info', 'token-refresh:stale-email-verified-claim', {
          uid: current.uid,
          email: current.email,
          previousClaimVerified: tokenEmailVerified,
        });
        await current.getIdToken(true);
        tokenResult = await current.getIdTokenResult(false);
      }
    } else if (forceRefresh) {
      logAuthEvent('info', 'token-refresh:forced', {
        uid: current.uid,
        email: current.email,
        claimEmailVerified: tokenResult.claims?.email_verified === true,
      });
    }

    return Boolean(
      tokenResult.claims?.email_verified === true &&
        String(tokenResult.claims?.email || '').toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase(),
    );
  } catch (error) {
    logAuthEvent('error', 'token-refresh:failed', {
      code: getFirebaseErrorCode(error),
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Authenticates the studio admin using Admin ID + Password via Firebase Auth
 * Email/Password provider. Passwords are never stored or verified in client code.
 */
export async function signInWithAdminCredentials(
  adminId: string,
  password: string,
): Promise<AdminAuthResult> {
  const validation = validateAdminLoginInput(adminId, password);
  if (!validation.isValid) {
    logAuthEvent('warn', 'signin:validation-failed', { reason: validation.error });
    return { ok: false, reason: validation.error };
  }

  const resolvedEmail = resolveAuthorizedAdminEmail(
    adminId,
    PRIMARY_ADMIN_ID,
    PRIMARY_ADMIN_EMAIL,
  );
  if (!resolvedEmail) {
    logAuthEvent('warn', 'signin:unknown-admin-id', { enteredLength: adminId.trim().length });
    return {
      ok: false,
      reason: 'Invalid Admin ID or password.',
    };
  }

  logAuthEvent('info', 'signin:attempt', {
    provider: EmailAuthProvider.PROVIDER_ID,
    resolvedEmail,
  });

  try {
    const credential = await signInWithEmailAndPassword(auth, resolvedEmail, password);
    const user = credential.user;

    logAuthEvent('info', 'signin:sdk-resolved', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      providers: user.providerData.map((p) => p.providerId),
    });

    if (!user.emailVerified) {
      try {
        await sendEmailVerification(user);
      } catch (verifyErr) {
        logAuthEvent('warn', 'signin:verification-email-rate-limited', {
          code: getFirebaseErrorCode(verifyErr),
        });
      }
      return {
        ok: false,
        needsVerification: true,
        reason: `Email verification is required once to unlock Firestore writes. A verification link was sent to ${PRIMARY_ADMIN_EMAIL}.`,
      };
    }

    if (!isAuthorizedAdminUser(user)) {
      await signOut(auth);
      logAuthEvent('warn', 'signin:unauthorized-email', { email: user.email });
      return { ok: false, reason: 'Access denied for this account.' };
    }

    // Force-refresh ID token immediately so Firestore rules receive email_verified: true
    await ensureFreshAdminToken(true);
    return { ok: true, user };
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unable to complete sign-in.';

    logAuthEvent('error', 'signin:sdk-error', {
      code: code || 'unknown',
      message,
    });

    if (code === 'auth/operation-not-allowed') {
      return {
        ok: false,
        errorCode: code,
        providerNotEnabled: true,
        reason:
          'Email/Password sign-in is not enabled in Firebase Authentication yet. Enable it once in Firebase Console to activate Admin ID & Password login.',
      };
    }

    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      return {
        ok: false,
        errorCode: code,
        reason:
          'Invalid Admin ID or password. If this is your first login after switching from Gmail, open "First-Time Setup" below to register your password.',
      };
    }

    if (code === 'auth/too-many-requests') {
      return {
        ok: false,
        errorCode: code,
        reason: 'Too many sign-in attempts. Please wait a moment before trying again.',
      };
    }

    return { ok: false, errorCode: code, reason: message };
  }
}

/**
 * One-time Firebase Auth Email/Password setup strictly for the authorized Admin ID.
 */
export async function setupAdminCredentials(
  adminId: string,
  password: string,
): Promise<AdminAuthResult> {
  const validation = validateAdminLoginInput(adminId, password);
  if (!validation.isValid) {
    logAuthEvent('warn', 'setup:validation-failed', { reason: validation.error });
    return { ok: false, reason: validation.error };
  }

  const resolvedEmail = resolveAuthorizedAdminEmail(
    adminId,
    PRIMARY_ADMIN_ID,
    PRIMARY_ADMIN_EMAIL,
  );
  if (!resolvedEmail) {
    logAuthEvent('warn', 'setup:unknown-admin-id', {});
    return {
      ok: false,
      reason: 'Only the configured primary Admin ID can initialize studio access.',
    };
  }

  logAuthEvent('info', 'setup:attempt', {
    provider: EmailAuthProvider.PROVIDER_ID,
    resolvedEmail,
  });

  try {
    const credential = await createUserWithEmailAndPassword(auth, resolvedEmail, password);
    const user = credential.user;

    logAuthEvent('info', 'setup:user-created', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
    });

    if (!user.emailVerified) {
      try {
        await sendEmailVerification(user);
      } catch (verifyErr) {
        logAuthEvent('warn', 'setup:verification-email-rate-limited', {
          code: getFirebaseErrorCode(verifyErr),
        });
      }
      return {
        ok: false,
        needsVerification: true,
        reason: `Admin password created! Open the verification link sent to ${PRIMARY_ADMIN_EMAIL}, then click "I've Verified — Continue".`,
      };
    }

    await ensureFreshAdminToken(true);
    return { ok: true, user };
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unable to create admin password.';

    logAuthEvent('error', 'setup:sdk-error', {
      code: code || 'unknown',
      message,
    });

    if (code === 'auth/operation-not-allowed') {
      return {
        ok: false,
        errorCode: code,
        providerNotEnabled: true,
        reason:
          'Enable the Email/Password sign-in provider in Firebase Console first, then retry First-Time Setup.',
      };
    }

    if (code === 'auth/email-already-in-use') {
      return {
        ok: false,
        errorCode: code,
        reason:
          'An account already exists for this Admin ID. Switch to Sign In, or use "Set / Reset Password" if you previously signed in via Google.',
      };
    }

    if (code === 'auth/weak-password') {
      return {
        ok: false,
        errorCode: code,
        reason: 'Please choose a stronger password (at least 6 characters).',
      };
    }

    return { ok: false, errorCode: code, reason: message };
  }
}

/**
 * Reloads the active Firebase Auth user AND force-refreshes the JWT ID token so
 * Firestore immediately recognizes `request.auth.token.email_verified == true`.
 */
export async function checkAdminVerificationStatus(): Promise<AdminAuthResult> {
  const current = auth.currentUser;
  if (!current) {
    return { ok: false, reason: 'Please sign in with your Admin ID and password first.' };
  }
  try {
    await current.reload();
    if (isAuthorizedAdminUser(auth.currentUser)) {
      const tokenVerified = await ensureFreshAdminToken(true);
      logAuthEvent('info', 'verify:status-confirmed', {
        uid: current.uid,
        email: current.email,
        tokenVerified,
      });
      return { ok: true, user: auth.currentUser ?? undefined };
    }
    logAuthEvent('info', 'verify:still-pending', {
      uid: current.uid,
      emailVerified: current.emailVerified,
    });
    return {
      ok: false,
      needsVerification: true,
      reason: `Verification not detected yet. Check ${PRIMARY_ADMIN_EMAIL} (including Spam/Updates) and click the verification link.`,
    };
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unable to refresh verification status.';
    logAuthEvent('error', 'verify:sdk-error', { code: code || 'unknown', message });
    return { ok: false, errorCode: code, reason: message };
  }
}

export async function resendAdminVerificationEmail(): Promise<{ ok: boolean; message: string }> {
  const current = auth.currentUser;
  if (!current) {
    return { ok: false, message: 'Sign in with your Admin ID and password first.' };
  }
  try {
    await sendEmailVerification(current);
    logAuthEvent('info', 'verify:resent', { email: current.email });
    return { ok: true, message: `Verification email resent to ${PRIMARY_ADMIN_EMAIL}.` };
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    const message = error instanceof Error ? error.message : 'Could not resend verification email right now.';
    logAuthEvent('error', 'verify:resend-failed', { code: code || 'unknown', message });
    return { ok: false, message };
  }
}

export async function sendAdminPasswordReset(
  adminId: string,
): Promise<{ ok: boolean; message: string; providerNotEnabled?: boolean; errorCode?: string }> {
  const resolvedEmail = resolveAuthorizedAdminEmail(
    adminId || PRIMARY_ADMIN_ID,
    PRIMARY_ADMIN_ID,
    PRIMARY_ADMIN_EMAIL,
  );
  if (!resolvedEmail) {
    return { ok: false, message: 'Enter your configured Admin ID to request a password reset.' };
  }
  try {
    await sendPasswordResetEmail(auth, resolvedEmail);
    logAuthEvent('info', 'password-reset:sent', { resolvedEmail });
    return {
      ok: true,
      message: `Password setup / reset link sent to ${PRIMARY_ADMIN_EMAIL}. Check your inbox to set your password.`,
    };
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    const message = error instanceof Error ? error.message : 'Could not send reset email.';
    logAuthEvent('error', 'password-reset:sdk-error', { code: code || 'unknown', message });
    if (code === 'auth/operation-not-allowed') {
      return {
        ok: false,
        errorCode: code,
        providerNotEnabled: true,
        message:
          'Email/Password sign-in is currently turned off in Firebase Console. Enable it once to send a password setup link.',
      };
    }
    return { ok: false, errorCode: code, message };
  }
}

/**
 * Temporary fallback sign-in via Google (pre-enabled by Firebase provisioning)
 * strictly for the authorized studio owner while Email/Password is still disabled
 * in Firebase Console.
 */
export async function signInWithGoogleAdminFallback(): Promise<AdminAuthResult> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  logAuthEvent('info', 'google-fallback:attempt', {
    provider: GoogleAuthProvider.PROVIDER_ID,
  });
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!isAuthorizedAdminUser(user)) {
      await signOut(auth);
      logAuthEvent('warn', 'google-fallback:unauthorized', { email: user.email });
      return {
        ok: false,
        reason: `Access denied. Only the studio owner account (${PRIMARY_ADMIN_EMAIL}) is authorized.`,
      };
    }
    await ensureFreshAdminToken(true);
    logAuthEvent('info', 'google-fallback:success', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
    });
    return { ok: true, user };
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unable to complete Google sign-in.';
    logAuthEvent('error', 'google-fallback:sdk-error', { code: code || 'unknown', message });
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { ok: false, errorCode: code, reason: 'Google sign-in popup was closed before completing.' };
    }
    if (code === 'auth/popup-blocked') {
      return {
        ok: false,
        errorCode: code,
        reason: 'Your browser blocked the sign-in popup. Allow popups for this site and try again.',
      };
    }
    return { ok: false, errorCode: code, reason: message };
  }
}

export async function signOutAdmin(): Promise<void> {
  logAuthEvent('info', 'signout', { uid: auth.currentUser?.uid ?? null });
  await signOut(auth);
}

// Startup Firestore connection check per firebase-integration-rpc guidelines (non-blocking)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();
