import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

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

export const PRIMARY_ADMIN_EMAIL =
  env.VITE_ADMIN_EMAIL || 'malaymaniyar2020@gmail.com';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
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

export async function signInAsAdmin(): Promise<{
  ok: boolean;
  reason?: string;
  user?: User;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (!isAuthorizedAdminUser(user)) {
      await signOut(auth);
      return {
        ok: false,
        reason: `Access denied. Only the verified primary admin account (${PRIMARY_ADMIN_EMAIL}) can sign in.`,
      };
    }
    return { ok: true, user };
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';

    if (code === 'auth/unauthorized-domain') {
      const host =
        typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      return {
        ok: false,
        reason: `Domain "${host}" is not authorized for Google Sign-In yet. Add "${host}" under Firebase Console → Authentication → Settings → Authorized domains.`,
      };
    }

    if (code === 'auth/popup-blocked') {
      return {
        ok: false,
        reason: 'Sign-in popup was blocked by your browser. Allow popups for this site and try again.',
      };
    }

    if (code === 'auth/popup-closed-by-user') {
      return {
        ok: false,
        reason: 'Sign-in popup was closed before authentication completed.',
      };
    }

    const message = error instanceof Error ? error.message : 'Unable to complete sign-in.';
    return { ok: false, reason: message };
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
