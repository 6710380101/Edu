import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Image,
  BookOpen,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  Presentation,
  Video,
  Sparkles,
} from 'lucide-react';
import { MediaItem, Category, MediaType, SystemSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { createMedia, updateMedia } from '../../services/mediaService';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  systemSettings: SystemSettings;
  editingItem?: MediaItem | null;
  onSaved: () => void;
}

const EDUCATION_LEVELS = [
  'ปฐมวัย / อนุบาล',
  'ประถมศึกษาตอนต้น (ป.1 - ป.3)',
  'ประถมศึกษาตอนปลาย (ป.4 - ป.6)',
  'มัธยมศึกษาตอนต้น (ม.1 - ม.3)',
  'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
  'อาชีวศึกษา (ปวช. / ปวส.)',
  'อุดมศึกษา / มหาวิทยาลัย',
  'ครูและบุคลากรทางการศึกษา',
  'การศึกษาตามอัธยาศัย / บุคคลทั่วไป',
];

const SUBJECT_LIST = [
  'ภาษาไทย',
  'คณิตศาสตร์',
  'วิทยาศาสตร์และเทคโนโลยี',
  'สังคมศึกษา ศาสนา และวัฒนธรรม',
  'ภาษาอังกฤษและภาษาต่างประเทศ',
  'สุขศึกษาและพลศึกษา',
  'ศิลปะ ดนตรี นาฏศิลป์',
  'การงานอาชีพและเทคโนโลยี',
  'คอมพิวเตอร์และวิทยาการคำนวณ',
  'การแนะแนวและทักษะชีวิต',
  'อื่น ๆ / สหวิทยาการ',
];

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  categories,
  systemSettings,
  editingItem,
  onSaved,
}) => {
  const { currentUser, userProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subject, setSubject] = useState(SUBJECT_LIST[0]);
  const [educationLevel, setEducationLevel] = useState(EDUCATION_LEVELS[1]);
  const [mediaType, setMediaType] = useState<MediaType>('document');
  const [resourceUrl, setResourceUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || '');
      setDescription(editingItem.description || '');
      setCategoryId(editingItem.categoryId || (categories[0]?.id || ''));
      setSubject(editingItem.subject || SUBJECT_LIST[0]);
      setEducationLevel(editingItem.educationLevel || EDUCATION_LEVELS[1]);
      setMediaType(editingItem.mediaType || 'document');
      setResourceUrl(editingItem.resourceUrl || '');
      setThumbnailUrl(editingItem.thumbnailUrl || '');
    } else {
      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setSubject(SUBJECT_LIST[0]);
      setEducationLevel(EDUCATION_LEVELS[1]);
      setMediaType('document');
      setResourceUrl('');
      setThumbnailUrl('');
    }
    setError(null);
    setSuccess(false);
  }, [editingItem, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนทำการแบ่งปันสื่อ');
      return;
    }

    if (!title.trim()) {
      setError('กรุณากรอกชื่อสื่อการเรียนรู้');
      return;
    }

    if (!resourceUrl.trim()) {
      setError('กรุณาระบุลิงก์ทรัพยากรหรือไฟล์สื่อการเรียนรู้');
      return;
    }

    // Verify URL format
    try {
      new URL(resourceUrl);
    } catch {
      setError('รูปแบบลิงก์ทรัพยากรไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const categoryName = selectedCategory?.name || 'หมวดทั่วไป';

    setSubmitting(true);

    if (editingItem) {
      // Update
      const ok = await updateMedia(editingItem.id, {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        categoryName,
        subject,
        educationLevel,
        mediaType,
        resourceUrl: resourceUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
      });
      setSubmitting(false);
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1200);
      } else {
        setError('ไม่สามารถอัปเดตสื่อได้');
      }
    } else {
      // Create
      const res = await createMedia(
        {
          title: title.trim(),
          description: description.trim(),
          categoryId,
          categoryName,
          subject,
          educationLevel,
          mediaType,
          resourceUrl: resourceUrl.trim(),
          thumbnailUrl: thumbnailUrl.trim(),
          authorId: currentUser.uid,
          authorName: userProfile?.displayName || currentUser.displayName || 'ผู้ใช้งาน EduShare',
          authorEmail: currentUser.email || '',
        },
        systemSettings.requireApproval
      );

      setSubmitting(false);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1500);
      } else {
        setError(res.error || 'ไม่สามารถสร้างสื่อได้');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {editingItem ? 'แก้ไขข้อมูลสื่อการเรียนรู้' : 'แบ่งปันสื่อการเรียนรู้ใหม่'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ร่วมแบ่งปันองค์ความรู้ สื่อ ใบงาน และเครื่องมือเพื่อการศึกษา
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
            title="ปิด"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {success ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-bold text-slate-800">
                {editingItem ? 'บันทึกการแก้ไขเรียบร้อยแล้ว!' : 'แบ่งปันสื่อสำเร็จแล้ว!'}
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {systemSettings.requireApproval && !editingItem
                  ? 'สื่อการเรียนรู้ของคุณถูกส่งไปยังคิวรอการตรวจสอบแล้ว เมื่อผ่านการอนุมัติจะแสดงในคลังสื่อสาธารณะทันที'
                  : 'สื่อการเรียนรู้ของคุณถูกเผยแพร่ในคลัง EduShare เรียบร้อยแล้ว'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs sm:text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {systemSettings.requireApproval && !editingItem && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>หมายเหตุจากระบบ:</strong> สื่อที่คุณส่งจะได้รับการตรวจสอบโดยผู้ดูแลระบบก่อนเผยแพร่สู่สาธารณะ
                  </span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  ชื่อสื่อการเรียนรู้ / หัวข้อบทเรียน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ใบงานวิทยาศาสตร์ เรื่อง วงจรชีวิตของพืช ป.4"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                />
              </div>

              {/* Category & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    หมวดหมู่สื่อ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    {categories.length === 0 && <option value="">หมวดทั่วไป</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    กลุ่มสาระวิชา <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {SUBJECT_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Education Level & Media Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    ระดับชั้น <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {EDUCATION_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    ประเภทสื่อ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as MediaType)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  >
                    <option value="document">📄 เอกสาร / ใบงาน (PDF, Word)</option>
                    <option value="slide">📊 สไลด์นำเสนอ (PPTX, Canva)</option>
                    <option value="video">🎥 คลิปวิดีโอ (YouTube, MP4)</option>
                    <option value="interactive">✨ สื่อโต้ตอบ / เกมการศึกษา</option>
                    <option value="link">🌐 แหล่งเรียนรู้ / เว็บไซต์ภายนอก</option>
                  </select>
                </div>
              </div>

              {/* Resource URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  ลิงก์ไฟล์หรือแหล่งดาวน์โหลด <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <LinkIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    placeholder="https://drive.google.com/... หรือ ลิงก์ไฟล์ PDF, OneDrive"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  รองรับลิงก์ Google Drive, Canva, YouTube, เว็บไซต์โรงเรียน หรือ Cloud Storage
                </p>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  ลิงก์ภาพหน้าปก / ตัวอย่าง (Thumbnail URL) <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <div className="relative">
                  <Image className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... หรือ ลิงก์รูปภาพ"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  คำอธิบายสื่อและวัตถุประสงค์การเรียนรู้
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="อธิบายเนื้อหาโดยย่อ สาระการเรียนรู้ มาตรฐานตัวชี้วัด หรือวิธีนำไปจัดกิจกรรมในห้องเรียน..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{editingItem ? 'บันทึกการแก้ไข' : 'เผยแพร่สื่อการเรียนรู้'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
