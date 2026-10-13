import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase/config';
import { MediaItem, UserFavorite, ContentReport, OperationType } from '../types';

export interface MediaFilterOptions {
  searchQuery?: string;
  categoryId?: string;
  educationLevel?: string;
  mediaType?: string;
  subject?: string;
  sortBy?: 'latest' | 'popular' | 'likes';
}

/**
 * Fetch published educational media items
 */
export async function fetchPublishedMedia(filters: MediaFilterOptions = {}): Promise<MediaItem[]> {
  try {
    const mediaRef = collection(db, 'media');
    let q = query(mediaRef, where('status', '==', 'published'));

    const snap = await getDocs(q);
    let items: MediaItem[] = [];

    snap.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as any) });
    });

    // Client-side filtering & search (for multi-field combination without composite index errors)
    if (filters.categoryId && filters.categoryId !== 'all') {
      items = items.filter((item) => item.categoryId === filters.categoryId);
    }
    if (filters.educationLevel && filters.educationLevel !== 'all') {
      items = items.filter((item) => item.educationLevel === filters.educationLevel);
    }
    if (filters.mediaType && filters.mediaType !== 'all') {
      items = items.filter((item) => item.mediaType === filters.mediaType);
    }
    if (filters.subject && filters.subject !== 'all') {
      items = items.filter((item) => item.subject === filters.subject);
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const qLower = filters.searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title?.toLowerCase().includes(qLower) ||
          item.description?.toLowerCase().includes(qLower) ||
          item.subject?.toLowerCase().includes(qLower) ||
          item.authorName?.toLowerCase().includes(qLower)
      );
    }

    // Sort
    if (filters.sortBy === 'popular') {
      items.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    } else if (filters.sortBy === 'likes') {
      items.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else {
      // Default latest
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
    }

    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'media');
    return [];
  }
}

/**
 * Fetch media items by specific author (for My Media tab)
 */
export async function fetchUserMedia(authorId: string): Promise<MediaItem[]> {
  try {
    const q = query(collection(db, 'media'), where('authorId', '==', authorId));
    const snap = await getDocs(q);
    const list: MediaItem[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'media');
    return [];
  }
}

/**
 * Fetch all media items including pending for moderators & admins
 */
export async function fetchAllMediaForAdmin(): Promise<MediaItem[]> {
  try {
    const snap = await getDocs(query(collection(db, 'media'), limit(150)));
    const list: MediaItem[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'media');
    return [];
  }
}

/**
 * Create a new learning media item
 */
export async function createMedia(
  data: Omit<MediaItem, 'id' | 'likesCount' | 'viewsCount' | 'downloadsCount' | 'status' | 'createdAt' | 'updatedAt'>,
  requireApproval: boolean
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const mediaRef = doc(collection(db, 'media'));
    const status = requireApproval ? 'pending_approval' : 'published';

    const newItem: MediaItem = {
      ...data,
      id: mediaRef.id,
      status,
      likesCount: 0,
      viewsCount: 0,
      downloadsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(mediaRef, newItem);
    return { success: true, id: mediaRef.id };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.CREATE, 'media');
    return { success: false, error: error.message };
  }
}

/**
 * Update media item
 */
export async function updateMedia(id: string, data: Partial<MediaItem>): Promise<boolean> {
  try {
    const mediaRef = doc(db, 'media', id);
    await updateDoc(mediaRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `media/${id}`);
    return false;
  }
}

/**
 * Delete media item
 */
export async function deleteMedia(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'media', id));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `media/${id}`);
    return false;
  }
}

/**
 * Increment metrics
 */
export async function incrementMediaMetric(
  mediaId: string,
  metric: 'views' | 'likes' | 'downloads',
  decrement: boolean = false
): Promise<void> {
  try {
    const mediaRef = doc(db, 'media', mediaId);
    const amount = decrement ? -1 : 1;
    if (metric === 'views') {
      await updateDoc(mediaRef, { viewsCount: increment(amount), updatedAt: serverTimestamp() });
    } else if (metric === 'likes') {
      await updateDoc(mediaRef, { likesCount: increment(amount), updatedAt: serverTimestamp() });
    } else if (metric === 'downloads') {
      await updateDoc(mediaRef, { downloadsCount: increment(amount), updatedAt: serverTimestamp() });
    }
  } catch (error) {
    console.warn(`Could not update metric ${metric} for ${mediaId}:`, error);
  }
}

/**
 * Favorites / Bookmarks
 */
export async function toggleFavorite(userId: string, media: MediaItem): Promise<boolean> {
  try {
    const favId = `${userId}_${media.id}`;
    const favRef = doc(db, 'favorites', favId);
    const snap = await getDoc(favRef);

    if (snap.exists()) {
      await deleteDoc(favRef);
      await incrementMediaMetric(media.id, 'likes', true);
      return false; // removed
    } else {
      const favData: UserFavorite = {
        id: favId,
        userId,
        mediaId: media.id,
        mediaTitle: media.title,
        categoryName: media.categoryName,
        createdAt: serverTimestamp(),
      };
      await setDoc(favRef, favData);
      await incrementMediaMetric(media.id, 'likes', false);
      return true; // added
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'favorites');
    return false;
  }
}

export async function fetchUserFavorites(userId: string): Promise<UserFavorite[]> {
  try {
    const q = query(collection(db, 'favorites'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: UserFavorite[] = [];
    snap.forEach((d) => list.push(d.data() as UserFavorite));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'favorites');
    return [];
  }
}

/**
 * Submit content violation report
 */
export async function submitContentReport(
  mediaId: string,
  mediaTitle: string,
  user: { uid: string; email: string },
  reason: string,
  details: string
): Promise<boolean> {
  try {
    const reportRef = doc(collection(db, 'reports'));
    const reportData: ContentReport = {
      id: reportRef.id,
      mediaId,
      mediaTitle,
      reportedByUid: user.uid,
      reportedByEmail: user.email,
      reason,
      details,
      status: 'pending',
      createdAt: serverTimestamp(),
    };
    await setDoc(reportRef, reportData);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'reports');
    return false;
  }
}
