import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Download,
  Heart,
  Eye,
  Flag,
  Calendar,
  User,
  GraduationCap,
  BookOpen,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Presentation,
  Video,
  Sparkles,
} from 'lucide-react';
import { MediaItem, MediaType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  incrementMediaMetric,
  toggleFavorite,
  deleteMedia,
} from '../../services/mediaService';
import { ReportModal } from './ReportModal';

interface MediaDetailModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (item: MediaItem) => void;
  onDeleted?: (mediaId: string) => void;
  isFavorited?: boolean;
  onFavoriteChange?: (mediaId: string, isFav: boolean) => void;
  onRequireAuth?: () => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onDeleted,
  isFavorited = false,
  onFavoriteChange,
  onRequireAuth,
}) => {
  const { currentUser, isAdmin, isModerator } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [downloadsCount, setDownloadsCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [favStatus, setFavStatus] = useState(isFavorited);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (item) {
      setLikesCount(item.likesCount || 0);
      setDownloadsCount(item.downloadsCount || 0);
      setViewsCount((item.viewsCount || 0) + 1);
      setFavStatus(isFavorited);

      // Increment view metric
      incrementMediaMetric(item.id, 'views');
    }
  }, [item, isFavorited]);

  if (!isOpen || !item) return null;

  const isOwner = currentUser && currentUser.uid === item.authorId;
  const canManage = isOwner || isAdmin || isModerator;

  const handleLikeToggle = async () => {
    if (!currentUser) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    const newFav = await toggleFavorite(currentUser.uid, item);
    setFavStatus(newFav);
    setLikesCount((prev) => (newFav ? prev + 1 : Math.max(0, prev - 1)));
    if (onFavoriteChange) onFavoriteChange(item.id, newFav);
  };

  const handleDownloadClick = () => {
    setDownloadsCount((prev) => prev + 1);
    incrementMediaMetric(item.id, 'downloads');
  };

  const handleDelete = async () => {
    setDeleting(true);
    const success = await deleteMedia(item.id);
    setDeleting(false);
    if (success) {
      setDeleteConfirmOpen(false);
      if (onDeleted) onDeleted(item.id);
      onClose();
    }
  };

  const getMediaTypeLabel = (type: MediaType) => {
    switch (type) {
      case 'document':
        return 'เอกสาร / ใบงาน (Document)';
      case 'slide':
        return 'สไลด์บรรยาย (Slide Presentation)';
      case 'video':
        return 'คลิปวิดีโอ (Video)';
      case 'interactive':
        return 'สื่อโต้ตอบ / เกมการศึกษา (Interactive)';
      default:
        return 'แหล่งเรียนรู้ภายนอก (Web Resource)';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'ไม่ระบุวันที่';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'ไม่ระบุวันที่';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8">
          {/* Header Action Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                {item.categoryName || 'หมวดทั่วไป'}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-md">
                {item.subject}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setReportModalOpen(true)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-100 transition-colors"
                title="รายงานเนื้อหาไม่เหมาะสม"
                aria-label="รายงานเนื้อหาไม่เหมาะสม"
              >
                <Flag className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                title="ปิด"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Title & Level */}
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  ระดับ: {item.educationLevel || 'ทุกระดับชั้น'}
                </span>
                <span>•</span>
                <span>{getMediaTypeLabel(item.mediaType)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {item.title}
              </h1>
            </div>

            {/* Thumbnail Preview if present */}
            {item.thumbnailUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video max-h-72 w-full">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Author Profile Card */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {item.authorName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">แบ่งปันโดย</p>
                  <p className="text-sm font-bold text-slate-800">{item.authorName}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-right">
                {item.status === 'published' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> เผยแพร่แล้ว
                  </span>
                )}
                {item.status === 'pending_approval' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> รอผู้ดูแลอนุมัติ
                  </span>
                )}
                {item.status === 'hidden' && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-600 rounded-full">
                    ถูกซ่อน
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>คำอธิบายและแนวทางการนำไปใช้</span>
              </h2>
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {item.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
              </div>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 text-center">
              <div>
                <p className="text-[11px] font-medium text-slate-500">จำนวนการเข้าชม</p>
                <p className="text-base font-bold text-slate-800 mt-0.5 flex items-center justify-center gap-1">
                  <Eye className="w-4 h-4 text-indigo-500" />
                  {viewsCount}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">ถูกใจ / บันทึก</p>
                <p className="text-base font-bold text-slate-800 mt-0.5 flex items-center justify-center gap-1">
                  <Heart className="w-4 h-4 text-rose-500" />
                  {likesCount}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">ดาวน์โหลด / เปิดลิงก์</p>
                <p className="text-base font-bold text-slate-800 mt-0.5 flex items-center justify-center gap-1">
                  <Download className="w-4 h-4 text-blue-500" />
                  {downloadsCount}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Like / Favorite Button */}
              <button
                onClick={handleLikeToggle}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border transition-colors shadow-2xs ${
                  favStatus
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${favStatus ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{favStatus ? 'บันทึกในรายการโปรดแล้ว' : 'บันทึกเป็นรายการโปรด'}</span>
              </button>

              {/* Edit / Delete Buttons for Author / Admin */}
              {canManage && (
                <>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
                      title="แก้ไขข้อมูลสื่อ"
                    >
                      <Edit className="w-4 h-4 text-indigo-600" />
                      <span className="hidden sm:inline">แก้ไข</span>
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="py-2.5 px-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
                    title="ลบสื่อนี้"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span className="hidden sm:inline">ลบ</span>
                  </button>
                </>
              )}
            </div>

            {/* Resource Access Button (Direct Anchor tag) */}
            {item.resourceUrl ? (
              <a
                href={item.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDownloadClick}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all ml-auto"
              >
                <span>เปิดดูสื่อ / ดาวน์โหลด</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic">ไม่มีลิงก์ไฟล์แนบ</span>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">ยืนยันการลบสื่อการเรียนรู้นี้?</h3>
            <p className="text-xs text-slate-500">
              เมื่อลบแล้ว สื่อนี้จะไม่สามารถกู้คืนได้ และจะถูกนำออกจากคลังสื่อ EduShare
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        mediaId={item.id}
        mediaTitle={item.title}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </>
  );
};
