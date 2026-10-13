import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  BookOpen,
  Sparkles,
  Layers,
  Filter,
  ArrowRight,
  PlusCircle,
  FileText,
  Presentation,
  Video,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Heart,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AnnouncementBar } from './components/AnnouncementBar';
import { AuthModals, ResetPasswordModal } from './components/auth/AuthModals';
import { MediaCard } from './components/media/MediaCard';
import { MediaDetailModal } from './components/media/MediaDetailModal';
import { MediaUploadModal } from './components/media/MediaUploadModal';
import { ProfileView } from './components/profile/ProfileView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  MediaItem,
  Category,
  SystemSettings,
  MediaType,
} from './types';
import {
  fetchPublishedMedia,
  toggleFavorite,
  fetchUserFavorites,
} from './services/mediaService';
import { fetchCategories, fetchSystemSettings, DEFAULT_SETTINGS } from './services/adminService';

const EDUCATION_LEVEL_OPTIONS = [
  { value: 'all', label: 'ทุกระดับชั้น' },
  { value: 'ปฐมวัย / อนุบาล', label: 'ปฐมวัย / อนุบาล' },
  { value: 'ประถมศึกษาตอนต้น (ป.1 - ป.3)', label: 'ประถมต้น (ป.1-3)' },
  { value: 'ประถมศึกษาตอนปลาย (ป.4 - ป.6)', label: 'ประถมปลาย (ป.4-6)' },
  { value: 'มัธยมศึกษาตอนต้น (ม.1 - ม.3)', label: 'มัธยมต้น (ม.1-3)' },
  { value: 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)', label: 'มัธยมปลาย (ม.4-6)' },
  { value: 'อาชีวศึกษา (ปวช. / ปวส.)', label: 'อาชีวศึกษา' },
  { value: 'อุดมศึกษา / มหาวิทยาลัย', label: 'อุดมศึกษา' },
  { value: 'การศึกษาตามอัธยาศัย / บุคคลทั่วไป', label: 'บุคคลทั่วไป' },
];

const SUBJECT_OPTIONS = [
  { value: 'all', label: 'ทุกกลุ่มสาระวิชา' },
  { value: 'ภาษาไทย', label: 'ภาษาไทย' },
  { value: 'คณิตศาสตร์', label: 'คณิตศาสตร์' },
  { value: 'วิทยาศาสตร์และเทคโนโลยี', label: 'วิทยาศาสตร์' },
  { value: 'สังคมศึกษา ศาสนา และวัฒนธรรม', label: 'สังคมศึกษา' },
  { value: 'ภาษาอังกฤษและภาษาต่างประเทศ', label: 'ภาษาต่างประเทศ' },
  { value: 'คอมพิวเตอร์และวิทยาการคำนวณ', label: 'คอมพิวเตอร์' },
  { value: 'ศิลปะ ดนตรี นาฏศิลป์', label: 'ศิลปะ/ดนตรี' },
  { value: 'การงานอาชีพและเทคโนโลยี', label: 'การงานอาชีพ' },
  { value: 'สุขศึกษาและพลศึกษา', label: 'สุขศึกษา/พลศึกษา' },
];

const MEDIA_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'ทุกประเภทสื่อ' },
  { value: 'document', label: '📄 เอกสาร/ใบงาน' },
  { value: 'slide', label: '📊 สไลด์นำเสนอ' },
  { value: 'video', label: '🎥 วิดีโอการสอน' },
  { value: 'interactive', label: '✨ สื่อโต้ตอบ' },
  { value: 'link', label: '🌐 แหล่งเรียนรู้' },
];

function EduShareApp() {
  const { currentUser, isAdmin, isModerator } = useAuth();

  // Navigation
  const [currentView, setCurrentView] = useState<'home' | 'explore' | 'profile' | 'profile-media' | 'profile-favorites' | 'admin'>('home');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'likes'>('latest');

  // Core Data
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [userFavIds, setUserFavIds] = useState<Set<string>>(new Set());
  const [loadingMedia, setLoadingMedia] = useState(true);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [selectedMediaDetail, setSelectedMediaDetail] = useState<MediaItem | null>(null);

  // Password Reset URL code handler
  const [resetCode, setResetCode] = useState<string | null>(null);

  // Check URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    if (mode === 'resetPassword' && oobCode) {
      setResetCode(oobCode);
    }
  }, []);

  // Fetch initial settings & categories
  useEffect(() => {
    const initData = async () => {
      try {
        const [settingsData, categoriesData] = await Promise.all([
          fetchSystemSettings(),
          fetchCategories(),
        ]);
        setSystemSettings(settingsData);
        setCategories(categoriesData);
      } catch (err) {
        console.warn('Init fetch error:', err);
      }
    };
    initData();
  }, []);

  // Fetch published media
  const loadMedia = async () => {
    setLoadingMedia(true);
    const items = await fetchPublishedMedia({
      searchQuery,
      categoryId: selectedCategory,
      educationLevel: selectedLevel,
      subject: selectedSubject,
      mediaType: selectedMediaType,
      sortBy,
    });
    setMediaList(items);
    setLoadingMedia(false);
  };

  useEffect(() => {
    loadMedia();
  }, [searchQuery, selectedCategory, selectedLevel, selectedSubject, selectedMediaType, sortBy]);

  // Load user favorites
  useEffect(() => {
    const loadFavs = async () => {
      if (currentUser) {
        const favs = await fetchUserFavorites(currentUser.uid);
        setUserFavIds(new Set(favs.map((f) => f.mediaId)));
      } else {
        setUserFavIds(new Set());
      }
    };
    loadFavs();
  }, [currentUser]);

  const handleToggleFavorite = async (item: MediaItem) => {
    if (!currentUser) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    const isAdded = await toggleFavorite(currentUser.uid, item);
    setUserFavIds((prev) => {
      const next = new Set(prev);
      if (isAdded) next.add(item.id);
      else next.delete(item.id);
      return next;
    });

    setMediaList((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? { ...m, likesCount: Math.max(0, (m.likesCount || 0) + (isAdded ? 1 : -1)) }
          : m
      )
    );
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedSubject('all');
    setSelectedMediaType('all');
    setSortBy('latest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Announcement Bar */}
      <AnnouncementBar
        message={systemSettings.announcement}
        enabled={systemSettings.announcementEnabled}
      />

      {/* Main Navbar */}
      <Navbar
        systemSettings={systemSettings}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view as any)}
        onOpenAuth={handleOpenAuth}
        onOpenUpload={() => {
          setEditingMedia(null);
          setUploadModalOpen(true);
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (currentView !== 'home' && currentView !== 'explore') {
            setCurrentView('explore');
          }
        }}
      />

      {/* MAIN VIEW ROUTING */}
      <main className="flex-1">
        {/* VIEW: ADMIN DASHBOARD */}
        {currentView === 'admin' ? (
          <AdminDashboard
            onBackToHome={() => setCurrentView('home')}
            onOpenMediaDetail={(item) => setSelectedMediaDetail(item)}
          />
        ) : currentView.startsWith('profile') ? (
          /* VIEW: USER PROFILE */
          <ProfileView
            initialTab={
              currentView === 'profile-media'
                ? 'media'
                : currentView === 'profile-favorites'
                ? 'favorites'
                : 'info'
            }
            onOpenUpload={() => {
              setEditingMedia(null);
              setUploadModalOpen(true);
            }}
            onOpenDetail={(item) => setSelectedMediaDetail(item)}
            onEditMedia={(item) => {
              setEditingMedia(item);
              setUploadModalOpen(true);
            }}
          />
        ) : (
          /* VIEW: HOME & EXPLORE */
          <div className="space-y-10 pb-16">
            {/* HERO SECTION (Only on Home View when no search active) */}
            {currentView === 'home' && !searchQuery && (
              <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
                {/* Decorative glow circles */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
                  <div className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs sm:text-sm font-semibold">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>แพลตฟอร์มแบ่งปันสื่อการเรียนรู้คุณภาพสำหรับทุกคน</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                    แบ่งปันสื่อการเรียนรู้ <br className="hidden sm:inline" />
                    <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                      สร้างสรรค์อนาคตการศึกษา
                    </span>
                  </h1>

                  <p className="max-w-2xl mx-auto text-sm sm:text-base text-indigo-100/90 leading-relaxed font-normal">
                    {systemSettings.siteDescription ||
                      'คลังรวมใบงาน แผนการสอน สื่อมัลติมีเดีย และนวัตกรรมการศึกษา ที่คุณครูและนักเรียนสามารถแลกเปลี่ยนได้ฟรี'}
                  </p>

                  {/* Hero Quick Search Box */}
                  <div className="max-w-2xl mx-auto pt-2">
                    <div className="relative flex items-center bg-white rounded-2xl shadow-2xl p-1.5 sm:p-2 border border-white/20">
                      <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาชื่อสื่อการสอน ใบงาน สไลด์ หรือกลุ่มวิชา..."
                        className="w-full px-3 py-2.5 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                      />
                      <button
                        onClick={() => setCurrentView('explore')}
                        className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all shrink-0"
                      >
                        ค้นหาสื่อ
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        if (!currentUser) handleOpenAuth('login');
                        else {
                          setEditingMedia(null);
                          setUploadModalOpen(true);
                        }
                      }}
                      className="py-2.5 px-5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4 text-indigo-600" />
                      <span>แบ่งปันสื่อของคุณเลย</span>
                    </button>
                    <button
                      onClick={() => setCurrentView('explore')}
                      className="py-2.5 px-5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all inline-flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>สำรวจคลังสื่อทั้งหมด</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SUBJECT & CATEGORY PILLS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    หมวดหมู่วิชาและสื่อยอดนิยม
                  </h2>
                </div>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    ล้างการเลือกหมวดหมู่
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ทั้งหมด
                </button>
                {categories
                  .filter((c) => c.active)
                  .map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
              </div>
            </section>

            {/* CATALOG & FILTER BAR */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              {/* Filter Controls Box */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  {/* Title & Stats */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-sm text-slate-800">ตัวกรองสื่อการเรียนรู้</h3>
                    <span className="text-xs text-slate-400">
                      (พบ {mediaList.length} รายการ)
                    </span>
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                    {/* Education Level */}
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {/* Subject */}
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {/* Media Type */}
                    <select
                      value={selectedMediaType}
                      onChange={(e) => setSelectedMediaType(e.target.value)}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {MEDIA_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {/* Sort By */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl font-bold focus:outline-none"
                    >
                      <option value="latest">⏱️ ล่าสุด</option>
                      <option value="popular">👁️ ยอดนิยม (เข้าชมมากสุด)</option>
                      <option value="likes">❤️ ถูกใจสูงสุด</option>
                    </select>
                  </div>
                </div>

                {/* Active filter pills / Reset button */}
                {(selectedCategory !== 'all' ||
                  selectedLevel !== 'all' ||
                  selectedSubject !== 'all' ||
                  selectedMediaType !== 'all' ||
                  searchQuery) && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">เงื่อนไขที่เลือก:</span>
                    {searchQuery && (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-semibold">
                        คำค้น: "{searchQuery}"
                      </span>
                    )}
                    {selectedLevel !== 'all' && (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                        ระดับ: {selectedLevel}
                      </span>
                    )}
                    {selectedSubject !== 'all' && (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                        วิชา: {selectedSubject}
                      </span>
                    )}
                    {selectedMediaType !== 'all' && (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                        ประเภท: {selectedMediaType}
                      </span>
                    )}
                    <button
                      onClick={resetAllFilters}
                      className="ml-auto font-bold text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </div>
                )}
              </div>

              {/* MEDIA CARDS GRID */}
              {loadingMedia ? (
                <div className="py-24 text-center text-slate-400 space-y-3">
                  <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold">กำลังโหลดสื่อการเรียนรู้จาก Firestore...</p>
                </div>
              ) : mediaList.length === 0 ? (
                /* EMPTY STATE */
                <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-4 shadow-2xs">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    ไม่พบสื่อการเรียนรู้ที่ตรงกับเงื่อนไข
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    ลองปรับเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูสื่อการสอนทั้งหมด หรือเป็นคนแรกที่ร่วมแบ่งปันสื่อในหัวข้อนี้
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={resetAllFilters}
                      className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors"
                    >
                      ล้างตัวกรอง
                    </button>
                    <button
                      onClick={() => {
                        if (!currentUser) handleOpenAuth('login');
                        else {
                          setEditingMedia(null);
                          setUploadModalOpen(true);
                        }
                      }}
                      className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>แบ่งปันสื่อใหม่</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* CARDS GRID */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mediaList.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onOpenDetail={(it) => setSelectedMediaDetail(it)}
                      isFavorited={userFavIds.has(item.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{systemSettings.siteName || 'EduShare'}</p>
              <p className="text-[11px] text-slate-400">แพลตฟอร์มแบ่งปันสื่อการเรียนรู้เพื่อการศึกษาไทย</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <button onClick={() => setCurrentView('home')} className="hover:text-indigo-600">
              หน้าหลัก
            </button>
            <button onClick={() => setCurrentView('explore')} className="hover:text-indigo-600">
              คลังสื่อทั้งหมด
            </button>
            <a href={`mailto:${systemSettings.contactEmail}`} className="hover:text-indigo-600 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>ติดต่อผู้ดูแล: {systemSettings.contactEmail}</span>
            </a>
          </div>

          <p className="text-slate-400">
            © {new Date().getFullYear()} {systemSettings.siteName || 'EduShare'}. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ALL MODALS */}
      {/* 1. Auth Modals (Login, Register, Forgot Password) */}
      <AuthModals
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          loadMedia();
        }}
      />

      {/* 2. Password Reset Action URL Modal */}
      {resetCode && (
        <ResetPasswordModal
          oobCode={resetCode}
          onComplete={() => {
            setResetCode(null);
            // clean url parameter
            window.history.replaceState({}, document.title, window.location.pathname);
            handleOpenAuth('login');
          }}
        />
      )}

      {/* 3. Media Upload & Edit Modal */}
      <MediaUploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setEditingMedia(null);
        }}
        categories={categories}
        systemSettings={systemSettings}
        editingItem={editingMedia}
        onSaved={() => {
          loadMedia();
        }}
      />

      {/* 4. Media Detail Modal */}
      <MediaDetailModal
        item={selectedMediaDetail}
        isOpen={Boolean(selectedMediaDetail)}
        onClose={() => setSelectedMediaDetail(null)}
        isFavorited={selectedMediaDetail ? userFavIds.has(selectedMediaDetail.id) : false}
        onFavoriteChange={(mediaId, isFav) => {
          setUserFavIds((prev) => {
            const next = new Set(prev);
            if (isFav) next.add(mediaId);
            else next.delete(mediaId);
            return next;
          });
        }}
        onRequireAuth={() => handleOpenAuth('login')}
        onEdit={(item) => {
          setSelectedMediaDetail(null);
          setEditingMedia(item);
          setUploadModalOpen(true);
        }}
        onDeleted={(mediaId) => {
          setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EduShareApp />
    </AuthProvider>
  );
}
