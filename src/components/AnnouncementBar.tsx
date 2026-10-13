import React, { useState } from 'react';
import { Megaphone, X } from 'lucide-react';

interface AnnouncementBarProps {
  message: string;
  enabled: boolean;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ message, enabled }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!enabled || !message || dismissed) return null;

  return (
    <aside aria-label="ประกาศจากระบบ" className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white py-2.5 px-4 shadow-sm relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs md:text-sm font-medium">
        <div className="flex items-center gap-2 flex-1">
          <span className="p-1 bg-white/20 rounded-full shrink-0">
            <Megaphone className="w-4 h-4 text-white" />
          </span>
          <span className="font-semibold shrink-0">ประกาศ:</span>
          <p className="line-clamp-1 md:line-clamp-none">{message}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/20 rounded text-white/90 hover:text-white transition-colors shrink-0"
          title="ปิดประกาศ"
          aria-label="ปิดประกาศ"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
