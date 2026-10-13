import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Edit,
  PlusCircle,
  FileText,
  Bookmark,
  Calendar,
  Eye,
  Heart,
  Trash2,
  ExternalLink,
  MailCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MediaItem, UserFavorite } from '../../types';
import {
  fetchUserMedia,
  fetchUserFavorites,
  deleteMedia,
  toggleFavorite,
} from '../../services/mediaService';

interface ProfileViewProps {
  initialTab?: 'info' | 'media' | 'favorites';
  onOpenUpload: () => void;
  onOpenDetail: (item: MediaItem) => void;
  onEditMedia: (item: MediaItem) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  initialTab = 'media',
  onOpenUpload,
  onOpenDetail,
  onEditMedia,
}) => {
  const {
    currentUser,
    userProfile,
    resendVerification,
    updateUserProfileData,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'favorites'>(initialTab);
  const [myMedia, setMyMedia] = useState<MediaItem[]>([]);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Edit profile state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Verification state
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Load user media
  const loadMyMedia = async () => {
    if (!currentUser) return;
    setLoadingMedia(true);
    const items = await fetchUserMedia(currentUser.uid);
    setMyMedia(items);
    setLoadingMedia(false);
  };

  // Load user favorites
  const loadFavorites = async () => {
    if (!currentUser) return;
    setLoadingFavs(true);
    const favs = await fetchUserFavorites(currentUser.uid);
    setFavorites(favs);
    setLoadingFavs(false);
  };

  useEffect(() => {
    if (currentUser) {
      loadMyMedia();
      loadFavorites();
      setEditName(userProfile?.displayName || currentUser.displayName || '');
      setEditBio(userProfile?.bio || '');
      setEditPhotoURL(userProfile?.photoURL || '');
    }
  }, [currentUser, userProfile]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-sm text-slate-500 mt-1">เข้าสู่ระบบเพื่อดูโปรไฟล์และจัดการสื่อของคุณ</p>
      </div>
    );
  }

  const handleResend = async () => {
    setResending(true);
    setResendStatus(null);
    const res = await resendVerification();
    setResending(false);
    if (res.success) {
      setResendStatus('ส่งลิงก์ยืนยันตัวตนเรียบร้อยแล้ว กรุณาตรวจสอบอีเมลของคุณ');
    } else {
      setResendStatus(res.error || 'ส่งไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    const res = await updateUserProfileData({
      displayName: editName.trim(),
      bio: editBio.trim(),
      photoURL: editPhotoURL.trim(),
    });
    setSavingProfile(false);
    if (res.success) {
      setProfileMsg('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว!');
      setTimeout(() => {
        setProfileMsg(null);
        setEditModalOpen(false);
      }, 1200);
    } else {
      setProfileMsg(res.error || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (window.confirm('คุณต้องการลบสื่อการเรียนรู้นี้ใช่หรือไม่?')) {
      const ok = await deleteMedia(mediaId);
      if (ok) {
        setMyMedia((prev) => prev.filter((m) => m.id !== mediaId));
      }
    }
  };

  const getRoleLabel = (role?: string) => {
    if (role === 'admin') return { text: 'ผู้ดูแลระบบ (Admin)', bg: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (role === 'moderator') return { text: 'ผู้ตรวจสอบ (Moderator)', bg: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { text: 'สมาชิกทั่วไป (Member)', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  };

  const roleInfo = getRoleLabel(userProfile?.role);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-indigo-500/20 overflow-hidden shrink-0">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                userProfile?.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {userProfile?.displayName || currentUser.displayName || 'ผู้ใช้งาน EduShare'}
                </h1>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleInfo.bg}`}>
                  {roleInfo.text}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.email}</span>
                {currentUser.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ยืนยันแล้ว
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600" /> ยังไม่ยืนยัน
                  </span>
                )}
              </p>
              {userProfile?.bio && (
                <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl">
                  {userProfile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => setEditModalOpen(true)}
              className="flex-1 sm:flex-none py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit className="w-4 h-4 text-slate-500" />
              <span>แก้ไขโปรไฟล์</span>
            </button>
            <button
              onClick={onOpenUpload}
              className="flex-1 sm:flex-none py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>แบ่งปันสื่อใหม่</span>
            </button>
          </div>
        </div>

        {/* Unverified email notification in card */}
        {!currentUser.emailVerified && (
          <div className="mt-6 p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                ยังไม่ได้ยืนยันที่อยู่อีเมลของคุณ กรุณาตรวจสอบกล่องจดหมาย หรือกดส่งอีเมลใหม่
              </span>
            </div>
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-semibold text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1.5 rounded-lg border border-amber-300 text-xs shadow-2xs disabled:opacity-50 flex items-center gap-1"
            >
              <MailCheck className="w-3.5 h-3.5" />
              {resending ? 'กำลังส่ง...' : 'ส่งอีเมลยืนยันอีกครั้ง'}
            </button>
            {resendStatus && (
              <p className="w-full text-xs font-semibold text-emerald-800 bg-emerald-100/80 p-2 rounded-lg mt-1">
                {resendStatus}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('media')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'media'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>สื่อการเรียนรู้ของฉัน ({myMedia.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'favorites'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>รายการโปรดที่บันทึกไว้ ({favorites.length})</span>
        </button>
      </div>

      {/* Tab Content: My Media */}
      {activeTab === 'media' && (
        <div className="space-y-4">
          {loadingMedia ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">กำลังโหลดสื่อของคุณ...</p>
            </div>
          ) : myMedia.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">คุณยังไม่ได้แบ่งปันสื่อการเรียนรู้</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ร่วมแบ่งปันผลงาน ใบงาน สไลด์สอน หรือแผนการสอนของคุณให้เพื่อนครูและนักเรียนได้นำไปใช้ประโยชน์
              </p>
              <button
                onClick={onOpenUpload}
                className="mt-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>เริ่มแบ่งปันสื่อแรกของคุณ</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myMedia.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                        {item.categoryName}
                      </span>
                      {item.status === 'published' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                          เผยแพร่แล้ว
                        </span>
                      )}
                      {item.status === 'pending_approval' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                          รออนุมัติ
                        </span>
                      )}
                      {item.status === 'hidden' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                          ซ่อนอยู่
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-800 text-base line-clamp-2 hover:text-indigo-600 cursor-pointer" onClick={() => onOpenDetail(item)}>
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {item.viewsCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {item.likesCount || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditMedia(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMedia(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {loadingFavs ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">กำลังโหลดรายการโปรด...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">ไม่มีรายการโปรดที่บันทึกไว้</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                เมื่อคุณพบสื่อการเรียนรู้ที่ถูกใจ ให้กดไอคอนรูปหัวใจเพื่อบันทึกไว้ดูภายหลัง
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {fav.categoryName || 'หมวดทั่วไป'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 truncate mt-1">
                      {fav.mediaTitle}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">แก้ไขข้อมูลส่วนตัว</h3>
            <p className="text-xs text-slate-500 mb-4">ปรับปรุงชื่อที่ใช้แสดงและข้อมูลโปรไฟล์ของคุณ</p>

            {profileMsg && (
              <div className="mb-4 p-3 bg-indigo-50 text-indigo-800 text-xs rounded-xl font-medium">
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อที่ใช้แสดง</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ลิงก์รูปภาพโปรไฟล์ (URL)</label>
                <input
                  type="url"
                  value={editPhotoURL}
                  onChange={(e) => setEditPhotoURL(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เกี่ยวกับฉัน / ข้อมูลสังเขป</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="เช่น คุณครูกลุ่มสาระการเรียนรู้วิทยาศาสตร์ โรงเรียน..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {savingProfile ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
