import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError } from '../firebase/config';
import { UserProfile, OperationType } from '../types';

// Runtime environment bootstrapped admin email
const BOOTSTRAP_ADMIN_EMAIL = 't.gan5140@gmail.com';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isSuspended: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
  updateUserProfileData: (data: { displayName?: string; bio?: string; photoURL?: string }) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);

  const clearAuthError = () => setAuthError(null);

  // Sync and fetch profile from Firestore
  const syncUserProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      const isBootstrapped = (user.email || '').toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;

        // Check if account is suspended
        if (data.accountStatus === 'suspended') {
          setIsSuspended(true);
          await signOut(auth);
          setCurrentUser(null);
          setUserProfile(null);
          setAuthError('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบที่ admin@edushare.org');
          return null;
        }

        // If bootstrapped admin and not yet recorded as admin
        if (isBootstrapped && data.role !== 'admin') {
          await updateDoc(userDocRef, {
            role: 'admin',
            updatedAt: serverTimestamp(),
          });
          data.role = 'admin';

          // Ensure admins/{uid} document exists
          await setDoc(doc(db, 'admins', user.uid), {
            uid: user.uid,
            email: user.email,
            assignedAt: serverTimestamp(),
            assignedBy: 'system_bootstrap',
          });
        }

        // Sync email verification state if changed
        if (user.emailVerified !== data.emailVerified) {
          await updateDoc(userDocRef, {
            emailVerified: user.emailVerified,
            updatedAt: serverTimestamp(),
          });
          data.emailVerified = user.emailVerified;
        }

        // Update last login
        await updateDoc(userDocRef, {
          lastLoginAt: serverTimestamp(),
        });

        setIsSuspended(false);
        setUserProfile(data);
        return data;
      } else {
        // Create new user profile document in Firestore
        const role = isBootstrapped ? 'admin' : 'member';
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน EduShare',
          email: user.email || '',
          photoURL: user.photoURL || '',
          bio: '',
          role,
          accountStatus: 'active',
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        };

        await setDoc(userDocRef, newProfile);

        if (isBootstrapped) {
          await setDoc(doc(db, 'admins', user.uid), {
            uid: user.uid,
            email: user.email,
            assignedAt: serverTimestamp(),
            assignedBy: 'system_bootstrap',
          });
        }

        setIsSuspended(false);
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.error('Error fetching or creating user profile:', err);
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          await syncUserProfile(user);
        } catch (error) {
          console.error('Error in onAuthStateChanged profile sync:', error);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await syncUserProfile(auth.currentUser);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Update Firebase Auth displayName
      await updateProfile(user, {
        displayName: displayName.trim(),
      });

      // Send email verification
      try {
        await sendEmailVerification(user);
      } catch (verificationErr) {
        console.warn('Could not send verification email immediately:', verificationErr);
      }

      // Sync user profile to Firestore
      await syncUserProfile(user);

      return { success: true };
    } catch (err: any) {
      let message = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      if (err.code === 'auth/email-already-in-use') {
        message = 'อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ';
      } else if (err.code === 'auth/invalid-email') {
        message = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (err.code === 'auth/weak-password') {
        message = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      } else if (err.message) {
        message = err.message;
      }
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Sync and check profile
      const profile = await syncUserProfile(user);
      if (!profile) {
        return { success: false, error: 'บัญชีถูกระงับการใช้งาน' };
      }

      return { success: true };
    } catch (err: any) {
      let message = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'มีการพยายามเข้าสู่ระบบผิดหลายครั้ง โปรดรอสักครู่แล้วลองใหม่';
      } else if (err.code === 'auth/user-disabled') {
        message = 'บัญชีนี้ถูกปิดการใช้งานในระบบยืนยันตัวตน';
      } else if (err.message) {
        message = err.message;
      }
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const signInGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      const profile = await syncUserProfile(user);
      if (!profile) {
        return { success: false, error: 'บัญชีถูกระงับการใช้งาน' };
      }

      return { success: true };
    } catch (err: any) {
      let message = 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'หน้าต่างเข้าสู่ระบบด้วย Google ถูกปิดก่อนทำรายการเสร็จสิ้น';
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = 'คำขอเข้าสู่ระบบถูกยกเลิก';
      } else if (err.message) {
        message = err.message;
      }
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setIsSuspended(false);
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      let message = 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้ กรุณาตรวจสอบอีเมล';
      if (err.code === 'auth/invalid-email') {
        message = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (err.code === 'auth/user-not-found') {
        message = 'ไม่พบที่อยู่อีเมลนี้ในระบบ EduShare';
      }
      return { success: false, error: message };
    }
  };

  const resendVerification = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนส่งอีเมลยืนยัน' };
    }
    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'ส่งอีเมลยืนยันไม่สำเร็จ โปรดลองใหม่อีกครั้งในภายหลัง' };
    }
  };

  const updateUserProfileData = async (data: {
    displayName?: string;
    bio?: string;
    photoURL?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser || !userProfile) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
    }
    try {
      if (data.displayName && data.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: data.displayName });
      }

      const updatePayload: any = {
        updatedAt: serverTimestamp(),
      };
      if (data.displayName !== undefined) updatePayload.displayName = data.displayName;
      if (data.bio !== undefined) updatePayload.bio = data.bio;
      if (data.photoURL !== undefined) updatePayload.photoURL = data.photoURL;

      await updateDoc(doc(db, 'users', currentUser.uid), updatePayload);

      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      return { success: false, error: 'ไม่สามารถอัปเดตข้อมูลส่วนตัวได้' };
    }
  };

  const isAdmin = userProfile?.role === 'admin';
  const isModerator = userProfile?.role === 'moderator' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isModerator,
        isSuspended,
        authError,
        clearAuthError,
        signUp,
        signIn,
        signInGoogle,
        logout,
        sendPasswordReset,
        resendVerification,
        updateUserProfileData,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
