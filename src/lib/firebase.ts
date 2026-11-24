import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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

function getFirebaseErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code);
  }
  return '';
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
    return { ok: false, reason: validation.error };
  }

  const resolvedEmail = resolveAuthorizedAdminEmail(
    adminId,
    PRIMARY_ADMIN_ID,
    PRIMARY_ADMIN_EMAIL,
  );
  if (!resolvedEmail) {
    return {
      ok: false,
      reason: 'Invalid Admin ID or password.',
    };
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, resolvedEmail, password);
    const user = credential.user;

    if (!user.emailVerified) {
      try {
        await sendEmailVerification(user);
      } catch {
        // Verification email may already have been sent recently
      }
      return {
        ok: false,
        needsVerification: true,
        reason: `Email verification is required once to unlock Firestore writes. A verification link was sent to ${PRIMARY_ADMIN_EMAIL}.`,
      };
    }

    if (!isAuthorizedAdminUser(user)) {
      await signOut(auth);
      return { ok: false, reason: 'Access denied for this account.' };
    }

    return { ok: true, user };
  } catch (error) {
    const code = getFirebaseErrorCode(error);

    if (code === 'auth/operation-not-allowed') {
      return {
        ok: false,
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
        reason:
          'Invalid Admin ID or password. If this is your first login after switching from Gmail, open "First-Time Setup" below to register your password.',
      };
    }

    if (code === 'auth/too-many-requests') {
      return {
        ok: false,
        reason: 'Too many sign-in attempts. Please wait a moment before trying again.',
      };
    }

    const message = error instanceof Error ? error.message : 'Unable to complete sign-in.';
    return { ok: false, reason: message };
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
    return { ok: false, reason: validation.error };
  }

  const resolvedEmail = resolveAuthorizedAdminEmail(
    adminId,
    PRIMARY_ADMIN_ID,
    PRIMARY_ADMIN_EMAIL,
  );
  if (!resolvedEmail) {
    return {
      ok: false,
      reason: 'Only the configured primary Admin ID can initialize studio access.',
    };
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, resolvedEmail, password);
    const user = credential.user;

    if (!user.emailVerified) {
      try {
        await sendEmailVerification(user);
      } catch {
        // Ignore rate-limit on repeat requests
      }
      return {
        ok: false,
        needsVerification: true,
        reason: `Admin password created! Open the verification link sent to ${PRIMARY_ADMIN_EMAIL}, then click "I've Verified — Continue".`,
      };
    }

    return { ok: true, user };
  } catch (error) {
    const code = getFirebaseErrorCode(error);

    if (code === 'auth/operation-not-allowed') {
      return {
        ok: false,
        providerNotEnabled: true,
        reason:
          'Enable the Email/Password sign-in provider in Firebase Console first, then retry First-Time Setup.',
      };
    }

    if (code === 'auth/email-already-in-use') {
      return {
        ok: false,
        reason:
          'An account already exists for this Admin ID. Switch to Sign In, or use "Reset Password" if you previously signed in via Google.',
      };
    }

    if (code === 'auth/weak-password') {
      return {
        ok: false,
        reason: 'Please choose a stronger password (at least 6 characters).',
      };
    }

    const message = error instanceof Error ? error.message : 'Unable to create admin password.';
    return { ok: false, reason: message };
  }
}

/**
 * Reloads the active Firebase Auth user to check whether email verification completed.
 */
export async function checkAdminVerificationStatus(): Promise<AdminAuthResult> {
  const current = auth.currentUser;
  if (!current) {
    return { ok: false, reason: 'Please sign in with your Admin ID and password first.' };
  }
  try {
    await current.reload();
    if (isAuthorizedAdminUser(auth.currentUser)) {
      return { ok: true, user: auth.currentUser ?? undefined };
    }
    return {
      ok: false,
      needsVerification: true,
      reason: `Verification not detected yet. Check ${PRIMARY_ADMIN_EMAIL} (including Spam/Updates) and click the verification link.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to refresh verification status.';
    return { ok: false, reason: message };
  }
}

export async function resendAdminVerificationEmail(): Promise<{ ok: boolean; message: string }> {
  const current = auth.currentUser;
  if (!current) {
    return { ok: false, message: 'Sign in with your Admin ID and password first.' };
  }
  try {
    await sendEmailVerification(current);
    return { ok: true, message: `Verification email resent to ${PRIMARY_ADMIN_EMAIL}.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not resend verification email right now.';
    return { ok: false, message };
  }
}

export async function sendAdminPasswordReset(
  adminId: string,
): Promise<{ ok: boolean; message: string }> {
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
    return {
      ok: true,
      message: `Password setup / reset link sent to ${PRIMARY_ADMIN_EMAIL}. Check your inbox to set your password.`,
    };
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    if (code === 'auth/operation-not-allowed') {
      return {
        ok: false,
        message: 'Enable Email/Password provider in Firebase Console before sending a reset link.',
      };
    }
    const message = error instanceof Error ? error.message : 'Could not send reset email.';
    return { ok: false, message };
  }
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

// Startup Firestore connection check per firebase-integration-rpc guidelines
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
