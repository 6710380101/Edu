export type UserRole = 'member' | 'moderator' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;
}

export type MediaType = 'document' | 'slide' | 'video' | 'link' | 'interactive';
export type MediaStatus = 'published' | 'pending_approval' | 'hidden';

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  educationLevel: string;
  subject: string;
  mediaType: MediaType;
  resourceUrl: string;
  thumbnailUrl?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  status: MediaStatus;
  likesCount: number;
  viewsCount: number;
  downloadsCount: number;
  tags?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  active: boolean;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  contactEmail: string;
  announcement: string;
  announcementEnabled: boolean;
  requireApproval: boolean;
  allowedFileTypes: string;
  maxFileSizeMb: number;
  registrationEnabled: boolean;
  updatedAt?: any;
  updatedBy?: string;
}

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface ContentReport {
  id: string;
  mediaId: string;
  mediaTitle: string;
  reportedByUid: string;
  reportedByEmail: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt?: any;
  resolvedAt?: any;
  resolvedBy?: string;
}

export interface UserFavorite {
  id: string;
  userId: string;
  mediaId: string;
  mediaTitle: string;
  categoryName?: string;
  createdAt?: any;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  performedByUid: string;
  performedByEmail: string;
  timestamp?: any;
}

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
