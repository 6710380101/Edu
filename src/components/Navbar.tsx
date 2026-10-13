import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  PlusCircle,
  User as UserIcon,
  LogOut,
  Shield,
  Bookmark,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  MailCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SystemSettings } from '../types';

interface NavbarProps {
  systemSettings: SystemSettings;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenUpload: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  systemSettings,
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenUpload,
  searchQuery,
  onSearchChange,
}) => {
  const { currentUser, userProfile, isAdmin, isModerator, logout, resendVerification } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResend = async () => {
    setResendingEmail(true);
    setEmailNotice(null);
    const res = await resendVerification();
    setResendingEmail(false);
    if (res.success) {
      setEmailNotice('ส่งลิงก์ยืนยันไปยังอีเมลของคุณแล้ว! โปรดตรวจสอบกล่องข้อความหรือสแปม');
      setTimeout(() => setEmailNotice(null), 6000);
    } else {
      setEmailNotice(res.error || 'ไม่สามารถส่งได้ โปรดลองอีกครั้ง');
      setTimeout(() => setEmailNotice(null), 6000);
    }
  };

  const getRoleLabel = (role?: string) => {
    if (role === 'admin') return { text: 'ผู้ดูแลระบบ', bg: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (role === 'moderator') return { text: 'ผู้ตรวจสอบ', bg: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { text: 'สมาชิก', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  };

  const roleInfo = getRoleLabel(userProfile?.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Unverified Email Warning Bar */}
      {currentUser && !currentUser.emailVerified && (
        <aside aria-label="แจ้งเตือนการยืนยันอีเมล" className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs md:text-sm text-amber-900">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                บัญชีของคุณยังไม่ได้ยืนยันที่อยู่อีเมล{' '}
                <strong className="underline">{currentUser.email}</strong> กรุณายืนยันเพื่อความปลอดภัย
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResend}
                disabled={resendingEmail}
                className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-amber-100/50 px-2.5 py-1 rounded-md border border-amber-300 transition-colors shadow-2xs disabled:opacity-50 text-xs"
              >
                <MailCheck className="w-3.5 h-3.5" />
                {resendingEmail ? 'กำลังส่ง...' : 'ส่งอีเมลยืนยันอีกครั้ง'}
              </button>
            </div>
          </div>
          {emailNotice && (
            <div className="max-w-7xl mx-auto mt-1 text-xs font-medium text-emerald-800 bg-emerald-100/70 p-1.5 rounded">
              {emailNotice}
            </div>
          )}
        </aside>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
                  {systemSettings.siteName || 'EduShare'}
                </span>
                <span className="hidden sm:block text-[10px] text-slate-600 font-medium tracking-wide uppercase">
                  คลังแบ่งปันสื่อการศึกษา
                </span>
              </div>
            </button>
          </div>

          {/* Search Box (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ค้นหาสื่อการเรียนรู้ ใบงาน สไลด์..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-indigo-400 rounded-full text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Items (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentView === 'home'
                  ? 'text-indigo-700 bg-indigo-50 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              หน้าหลัก
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentView === 'explore'
                  ? 'text-indigo-700 bg-indigo-50 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              คลังสื่อทั้งหมด
            </button>
            {(isAdmin || isModerator) && (
              <button
                onClick={() => onNavigate('admin')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  currentView === 'admin'
                    ? 'text-rose-700 bg-rose-50 font-semibold'
                    : 'text-slate-700 hover:text-rose-600 hover:bg-rose-50/50'
                }`}
              >
                <Shield className="w-4 h-4 text-rose-600" />
                <span>แผงควบคุมแอดมิน</span>
              </button>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Share Media Button */}
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth('login');
                } else {
                  onOpenUpload();
                }
              }}
              className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">แบ่งปันสื่อใหม่</span>
              <span className="sm:hidden">โพสต์สื่อ</span>
            </button>

            {/* Auth section */}
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors text-left"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shadow-2xs">
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      userProfile?.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[110px]">
                      {userProfile?.displayName || currentUser.displayName || 'ผู้ใช้งาน'}
                    </p>
                    <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${roleInfo.bg}`}>
                      {roleInfo.text}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">เข้าสู่ระบบในชื่อ</p>
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">
                        {userProfile?.displayName || currentUser.displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleInfo.bg}`}>
                          {roleInfo.text}
                        </span>
                        {currentUser.emailVerified ? (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ยืนยันแล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            ยังไม่ยืนยัน
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1 text-sm text-slate-700 font-medium">
                      <button
                        onClick={() => {
                          onNavigate('profile');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>โปรไฟล์และข้อมูลส่วนตัว</span>
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('profile-media');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>สื่อการเรียนรู้ของฉัน</span>
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('profile-favorites');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        <span>รายการโปรดที่บันทึกไว้</span>
                      </button>

                      {(isAdmin || isModerator) && (
                        <>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => {
                              onNavigate('admin');
                              setDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2.5 transition-colors font-semibold"
                          >
                            <Shield className="w-4 h-4 text-rose-600" />
                            <span>แผงควบคุมแอดมิน (Admin)</span>
                          </button>
                        </>
                      )}

                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          await logout();
                          onNavigate('home');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-600 hover:text-rose-600 flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-slate-400" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:inline-flex py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              title="เมนู"
              aria-label="เมนู"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ค้นหาสื่อการเรียนรู้..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm font-medium text-slate-700">
              <button
                onClick={() => {
                  onNavigate('home');
                  setMobileMenuOpen(false);
                }}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg"
              >
                หน้าหลัก
              </button>
              <button
                onClick={() => {
                  onNavigate('explore');
                  setMobileMenuOpen(false);
                }}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg"
              >
                คลังสื่อทั้งหมด
              </button>
              {(isAdmin || isModerator) && (
                <button
                  onClick={() => {
                    onNavigate('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="p-2 text-left col-span-2 bg-rose-50 text-rose-700 font-semibold rounded-lg flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-rose-600" />
                  แผงควบคุมแอดมิน
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
