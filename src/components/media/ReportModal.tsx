import React, { useState } from 'react';
import { X, Flag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { submitContentReport } from '../../services/mediaService';
import { useAuth } from '../../context/AuthContext';

interface ReportModalProps {
  mediaId: string;
  mediaTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  'ละเมิดลิขสิทธิ์ / นำผลงานผู้อื่นมาลงโดยไม่ได้รับอนุญาต',
  'เนื้อหาไม่เหมาะสม ลามกอนาจาร หรือมีความรุนแรง',
  'ข้อมูลเท็จ บิดเบือน หรือขัดต่อหลักวิชาการ',
  'ไฟล์เสียหาย ลิงก์เสีย ไม่สามารถเปิดใช้งานได้',
  'โฆษณา สแปม หรือเนื้อหาที่ไม่เกี่ยวข้องกับการศึกษา',
  'อื่น ๆ (โปรดระบุรายละเอียด)',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  mediaId,
  mediaTitle,
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนรายงานเนื้อหา');
      return;
    }

    setSubmitting(true);
    setError(null);

    const success = await submitContentReport(
      mediaId,
      mediaTitle,
      { uid: currentUser.uid, email: currentUser.email || '' },
      reason,
      details
    );

    setSubmitting(false);
    if (success) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 2500);
    } else {
      setError('เกิดข้อผิดพลาดในการส่งรายงาน โปรดลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600 font-bold">
            <Flag className="w-5 h-5" />
            <h3>รายงานสื่อการเรียนรู้นี้</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-800">ส่งรายงานเรียบร้อยแล้ว</h4>
            <p className="text-xs text-slate-500">
              ขอบคุณสำหรับข้อมูล ทีมผู้ดูแลระบบจะดำเนินการตรวจสอบเนื้อหานี้โดยเร็วที่สุด
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">สื่อที่รายงาน:</p>
              <p className="text-sm font-semibold text-slate-800 line-clamp-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {mediaTitle}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                เหตุผลในการรายงาน <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                รายละเอียดเพิ่มเติม (ถ้ามี)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="อธิบายข้อเท็จจริงหรือลิงก์หลักฐาน..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                {submitting ? 'กำลังส่งรายงาน...' : 'ส่งรายงาน'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
