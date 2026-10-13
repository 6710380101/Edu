import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { OperationType, FirestoreErrorInfo } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore (CRITICAL: with custom firestoreDatabaseId if configured)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Standard error handler conforming to Firebase Integration Skill specifications
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate live connection to Firestore on boot
 */
export async function testFirestoreConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, 'system_settings', 'ping'));
    return { ok: true, message: 'เชื่อมต่อ Firestore สำเร็จ' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return { ok: false, message: 'ไม่สามารถเชื่อมต่อ Firestore: ออฟไลน์' };
    }
    // Any permission check or missing doc still confirms connection reached server
    return { ok: true, message: 'เชื่อมต่อเซิร์ฟเวอร์ Firebase สำเร็จ' };
  }
}
