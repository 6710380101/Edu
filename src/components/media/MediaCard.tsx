import React from 'react';
import {
  FileText,
  Presentation,
  Video,
  ExternalLink,
  Sparkles,
  Eye,
  Heart,
  Download,
  Calendar,
  User,
  GraduationCap,
} from 'lucide-react';
import { MediaItem, MediaType } from '../../types';

interface MediaCardProps {
  item: MediaItem;
  onOpenDetail: (item: MediaItem) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onOpenDetail,
  isFavorited = false,
  onToggleFavorite,
}) => {
  const getMediaTypeConfig = (type: MediaType) => {
    switch (type) {
      case 'document':
        return { label: 'เอกสาร/ใบงาน', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'slide':
        return { label: 'สไลด์บรรยาย', icon: Presentation, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'video':
        return { label: 'คลิปวิดีโอ', icon: Video, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'interactive':
        return { label: 'สื่อโต้ตอบ', icon: Sparkles, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'link':
      default:
        return { label: 'แหล่งเรียนรู้', icon: ExternalLink, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    }
  };

  const typeConfig = getMediaTypeConfig(item.mediaType);
  const TypeIcon = typeConfig.icon;

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
    >
      {/* Thumbnail or Graphic header */}
      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback to placeholder graphic if broken url
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 flex items-center justify-center p-6 text-slate-300 group-hover:text-indigo-400 transition-colors">
            <TypeIcon className="w-16 h-16 stroke-1" />
          </div>
        )}

        {/* Media type badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border shadow-2xs backdrop-blur-md bg-white/90 ${typeConfig.color}`}
          >
            <TypeIcon className="w-3 h-3" />
            <span>{typeConfig.label}</span>
          </span>
        </div>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item);
            }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
              isFavorited
                ? 'bg-rose-500 text-white'
                : 'bg-white/80 hover:bg-white text-slate-600 hover:text-rose-500'
            }`}
            title={isFavorited ? 'ลบออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
            aria-label={isFavorited ? 'ลบออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
          </button>
        )}

        {/* Subject & Education Level overlay */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-medium text-slate-700">
          <span className="bg-slate-900/70 text-white px-2 py-0.5 rounded-md backdrop-blur-xs font-semibold">
            {item.subject || 'ทั่วไป'}
          </span>
          <span className="bg-white/80 text-slate-800 px-2 py-0.5 rounded-md backdrop-blur-xs shadow-2xs">
            {item.educationLevel || 'ทุกระดับชั้น'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 line-clamp-2 transition-colors">
            {item.title}
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Footer info: Author & Metrics */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate max-w-[150px]">
            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">
              {item.authorName?.charAt(0) || 'U'}
            </div>
            <span className="truncate font-medium text-slate-700">{item.authorName}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.viewsCount || 0}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>{item.likesCount || 0}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>{item.downloadsCount || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
