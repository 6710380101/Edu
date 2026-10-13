import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase/config';
import {
  UserProfile,
  SystemSettings,
  Category,
  ContentReport,
  AdminAuditLog,
  UserRole,
  AccountStatus,
  OperationType,
} from '../types';

export const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'EduShare',
  siteDescription: 'แพลตฟอร์มแบ่งปันสื่อการเรียนรู้ นวัตกรรมทางการศึกษา และคลังความรู้สำหรับครูและนักเรียน',
  logoUrl: '',
  contactEmail: 'admin@edushare.org',
  announcement: 'ยินดีต้อนรับสู่ EduShare แหล่งรวมสื่อการเรียนรู้คุณภาพ ร่วมแบ่งปันใบงาน สไลด์สอน และสื่อการสอนได้แล้ววันนี้!',
  announcementEnabled: true,
  requireApproval: false,
  allowedFileTypes: 'PDF, DOCX, PPTX, MP4, PNG, JPG, ZIP',
  maxFileSizeMb: 25,
  registrationEnabled: true,
};

/**
 * Audit Logger
 */
export async function logAdminAction(
  action: string,
  targetType: string,
  targetId: string,
  details: string,
  adminUser: { uid: string; email: string }
) {
  try {
    const logRef = doc(collection(db, 'admin_logs'));
    const logData: AdminAuditLog = {
      id: logRef.id,
      action,
      targetType,
      targetId,
      details,
      performedByUid: adminUser.uid,
      performedByEmail: adminUser.email,
      timestamp: serverTimestamp(),
    };
    await setDoc(logRef, logData);
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Fetch all users from Firestore
 */
export async function fetchAllUsers(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'));
    const snap = await getDocs(q);
    const users: UserProfile[] = [];
    snap.forEach((docSnap) => {
      users.push(docSnap.data() as UserProfile);
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

/**
 * Update user account status (Active / Suspended)
 */
export async function updateUserAccountStatus(
  targetUid: string,
  newStatus: AccountStatus,
  reason: string,
  adminUser: { uid: string; email: string }
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', targetUid);
    await updateDoc(userRef, {
      accountStatus: newStatus,
      updatedAt: serverTimestamp(),
    });

    await logAdminAction(
      newStatus === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
      'user',
      targetUid,
      `เปลี่ยนสถานะเป็น ${newStatus} เหตุผล: ${reason || 'ไม่มีระบุ'}`,
      adminUser
    );

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
    return false;
  }
}

/**
 * Update user role (Member / Moderator / Admin)
 */
export async function updateUserRole(
  targetUid: string,
  newRole: UserRole,
  adminUser: { uid: string; email: string }
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', targetUid);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
    });

    // If made admin, ensure admins/{targetUid} exists
    if (newRole === 'admin') {
      const targetDoc = await getDoc(userRef);
      const email = targetDoc.data()?.email || '';
      await setDoc(doc(db, 'admins', targetUid), {
        uid: targetUid,
        email,
        assignedAt: serverTimestamp(),
        assignedBy: adminUser.uid,
      });
    } else {
      // If removed from admin, delete admins/{targetUid} doc
      try {
        await deleteDoc(doc(db, 'admins', targetUid));
      } catch (e) {
        console.warn('Admin record removal warning:', e);
      }
    }

    await logAdminAction(
      'CHANGE_USER_ROLE',
      'user',
      targetUid,
      `ปรับเปลี่ยนบทบาทผู้ใช้เป็น: ${newRole}`,
      adminUser
    );

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
    return false;
  }
}

/**
 * Update user profile details by Admin
 */
export async function updateUserProfileByAdmin(
  targetUid: string,
  data: Partial<UserProfile>,
  adminUser: { uid: string; email: string }
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', targetUid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    await logAdminAction(
      'UPDATE_USER_PROFILE',
      'user',
      targetUid,
      `อัปเดตข้อมูลผู้ใช้โดยแอดมิน: ${JSON.stringify(data)}`,
      adminUser
    );

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
    return false;
  }
}

/**
 * Fetch website system settings
 */
export async function fetchSystemSettings(): Promise<SystemSettings> {
  try {
    const settingRef = doc(db, 'system_settings', 'general');
    const snap = await getDoc(settingRef);
    if (snap.exists()) {
      return snap.data() as SystemSettings;
    } else {
      // Initialize default settings document in Firestore
      await setDoc(settingRef, {
        ...DEFAULT_SETTINGS,
        updatedAt: serverTimestamp(),
        updatedBy: 'system_init',
      });
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.warn('Using default settings due to Firestore fetch error:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save website system settings
 */
export async function saveSystemSettings(
  settings: Partial<SystemSettings>,
  adminUser: { uid: string; email: string }
): Promise<boolean> {
  try {
    const settingRef = doc(db, 'system_settings', 'general');
    await setDoc(
      settingRef,
      {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: adminUser.uid,
      },
      { merge: true }
    );

    await logAdminAction(
      'UPDATE_SYSTEM_SETTINGS',
      'settings',
      'general',
      'บันทึกการตั้งค่าระบบเว็บไซต์',
      adminUser
    );

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_settings/general');
    return false;
  }
}

/**
 * Categories Management
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const q = query(collection(db, 'categories'));
    const snap = await getDocs(q);
    const list: Category[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'categories');
    return [];
  }
}

export async function saveCategory(
  category: Partial<Category>,
  adminUser: { uid: string; email: string }
): Promise<boolean> {
  try {
    if (category.id) {
      const ref = doc(db, 'categories', category.id);
      await updateDoc(ref, {
        ...category,
        updatedAt: serverTimestamp(),
      });
      await logAdminAction('UPDATE_CATEGORY', 'category', category.id, `แก้ไขหมวดหมู่ ${category.name}`, adminUser);
    } else {
      const ref = doc(collection(db, 'categories'));
      await setDoc(ref, {
        ...category,
        id: ref.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAdminAction('CREATE_CATEGORY', 'category', ref.id, `สร้างหมวดหมู่ใหม่ ${category.name}`, adminUser);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'categories');
    return false;
  }
}

export async function deleteCategory(
  categoryId: string,
  categoryName: string,
  adminUser: { uid: string; email: string }
): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
    await logAdminAction('DELETE_CATEGORY', 'category', categoryId, `ลบหมวดหมู่ ${categoryName}`, adminUser);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${categoryId}`);
    return false;
  }
}

/**
 * Content Reports Management
 */
export async function fetchReports(): Promise<ContentReport[]> {
  try {
    const snap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100)));
    const reports: ContentReport[] = [];
    snap.forEach((d) => reports.push(d.data() as ContentReport));
    return reports;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'reports');
    return [];
  }
}

export async function updateReportStatus(
  reportId: string,
  status: ContentReport['status'],
  adminUser: { uid: string; email: string }
): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      resolvedAt: serverTimestamp(),
      resolvedBy: adminUser.uid,
    });
    await logAdminAction('RESOLVE_REPORT', 'report', reportId, `ปรับสถานะรายงานเป็น ${status}`, adminUser);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
    return false;
  }
}

/**
 * Fetch Audit Logs
 */
export async function fetchAdminLogs(): Promise<AdminAuditLog[]> {
  try {
    const snap = await getDocs(query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(100)));
    const logs: AdminAuditLog[] = [];
    snap.forEach((d) => logs.push(d.data() as AdminAuditLog));
    return logs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin_logs');
    return [];
  }
}
