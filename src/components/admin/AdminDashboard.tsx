import React, { useState, useEffect } from 'react';
import {
  Users,
  Settings,
  FileCheck,
  AlertTriangle,
  History,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronRight,
  Database,
  RefreshCw,
  Plus,
  Eye,
  Info,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  UserProfile,
  SystemSettings,
  Category,
  ContentReport,
  AdminAuditLog,
  MediaItem,
  UserRole,
  AccountStatus,
} from '../../types';
import {
  fetchAllUsers,
  updateUserAccountStatus,
  updateUserRole,
  updateUserProfileByAdmin,
  fetchSystemSettings,
  saveSystemSettings,
  fetchCategories,
  saveCategory,
  deleteCategory,
  fetchReports,
  updateReportStatus,
  fetchAdminLogs,
} from '../../services/adminService';
import {
  fetchAllMediaForAdmin,
  updateMedia,
  deleteMedia,
} from '../../services/mediaService';
import { testFirestoreConnection } from '../../firebase/config';

interface AdminDashboardProps {
  onBackToHome: () => void;
  onOpenMediaDetail: (item: MediaItem) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToHome,
  onOpenMediaDetail,
}) => {
  const { currentUser, userProfile, isAdmin, isModerator } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'categories' | 'reports' | 'settings' | 'logs'>('overview');

  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Connection status state
  const [firebaseStatus, setFirebaseStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // User Filter & Search states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

  // Modals
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserProfile | null>(null);
  const [statusConfirmModal, setStatusConfirmModal] = useState<{
    user: UserProfile;
    newStatus: AccountStatus;
  } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const [roleChangeModal, setRoleChangeModal] = useState<{
    user: UserProfile;
    newRole: UserRole;
  } | null>(null);

  const [editUserModal, setEditUserModal] = useState<{
    user: UserProfile;
    displayName: string;
    bio: string;
  } | null>(null);

  // Category Modal
  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    category?: Category | null;
    name: string;
    description: string;
    icon: string;
    color: string;
    active: boolean;
    order: number;
  }>({
    isOpen: false,
    name: '',
    description: '',
    icon: 'BookOpen',
    color: 'indigo',
    active: true,
    order: 0,
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<Partial<SystemSettings>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  const notifySuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Load all initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, mList, cList, rList, lList, sData, connTest] = await Promise.all([
        fetchAllUsers(),
        fetchAllMediaForAdmin(),
        fetchCategories(),
        fetchReports(),
        fetchAdminLogs(),
        fetchSystemSettings(),
        testFirestoreConnection(),
      ]);

      setUsers(uList);
      setAllMedia(mList);
      setCategories(cList);
      setReports(rList);
      setLogs(lList);
      setSettings(sData);
      setSettingsForm(sData);
      setFirebaseStatus(connTest);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    notifySuccess('รีเฟรชข้อมูลเรียบร้อยแล้ว');
  };

  useEffect(() => {
    if (isAdmin || isModerator) {
      loadData();
    }
  }, [isAdmin, isModerator]);

  if (!isAdmin && !isModerator) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-4 shadow-sm">
        <Lock className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p className="text-sm text-slate-500">
          หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) และผู้ตรวจสอบ (Moderator) เท่านั้น
        </p>
        <button
          onClick={onBackToHome}
          className="mt-2 py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl"
        >
          กลับสู่หน้าหลัก
        </button>
      </div>
    );
  }

  // User Management Actions
  const handleConfirmStatusChange = async () => {
    if (!statusConfirmModal || !currentUser) return;
    const { user, newStatus } = statusConfirmModal;
    const ok = await updateUserAccountStatus(
      user.uid,
      newStatus,
      suspendReason,
      { uid: currentUser.uid, email: currentUser.email || '' }
    );
    if (ok) {
      setUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, accountStatus: newStatus } : u))
      );
      notifySuccess(
        newStatus === 'suspended'
          ? `ระงับบัญชีผู้ใช้ ${user.displayName} เรียบร้อยแล้ว`
          : `เปิดใช้งานบัญชี ${user.displayName} เรียบร้อยแล้ว`
      );
      setStatusConfirmModal(null);
      setSuspendReason('');
      // refresh logs
      const lList = await fetchAdminLogs();
      setLogs(lList);
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!roleChangeModal || !currentUser) return;
    const { user, newRole } = roleChangeModal;
    const ok = await updateUserRole(user.uid, newRole, {
      uid: currentUser.uid,
      email: currentUser.email || '',
    });
    if (ok) {
      setUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, role: newRole } : u))
      );
      notifySuccess(`เปลี่ยนบทบาทของ ${user.displayName} เป็น ${newRole} เรียบร้อยแล้ว`);
      setRoleChangeModal(null);
      const lList = await fetchAdminLogs();
      setLogs(lList);
    }
  };

  const handleSaveUserProfileByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModal || !currentUser) return;
    const ok = await updateUserProfileByAdmin(
      editUserModal.user.uid,
      {
        displayName: editUserModal.displayName,
        bio: editUserModal.bio,
      },
      { uid: currentUser.uid, email: currentUser.email || '' }
    );
    if (ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === editUserModal.user.uid
            ? { ...u, displayName: editUserModal.displayName, bio: editUserModal.bio }
            : u
        )
      );
      notifySuccess(`แก้ไขข้อมูลโปรไฟล์ของ ${editUserModal.displayName} สำเร็จ`);
      setEditUserModal(null);
    }
  };

  // Content Actions
  const handleApproveMedia = async (mediaId: string) => {
    const ok = await updateMedia(mediaId, { status: 'published' });
    if (ok) {
      setAllMedia((prev) =>
        prev.map((m) => (m.id === mediaId ? { ...m, status: 'published' } : m))
      );
      notifySuccess('อนุมัติสื่อการเรียนรู้และเผยแพร่เรียบร้อยแล้ว');
    }
  };

  const handleToggleHideMedia = async (media: MediaItem) => {
    const nextStatus = media.status === 'hidden' ? 'published' : 'hidden';
    const ok = await updateMedia(media.id, { status: nextStatus });
    if (ok) {
      setAllMedia((prev) =>
        prev.map((m) => (m.id === media.id ? { ...m, status: nextStatus } : m))
      );
      notifySuccess(nextStatus === 'hidden' ? 'ซ่อนสื่อเรียบร้อยแล้ว' : 'เผยแพร่สื่ออีกครั้งแล้ว');
    }
  };

  const handleDeleteMediaByAdmin = async (mediaId: string, title: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสื่อ "${title}" ออกจากระบบถาวร?`)) {
      const ok = await deleteMedia(mediaId);
      if (ok) {
        setAllMedia((prev) => prev.filter((m) => m.id !== mediaId));
        notifySuccess('ลบสื่อเรียบร้อยแล้ว');
      }
    }
  };

  // Categories Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const ok = await saveCategory(
      {
        id: categoryModal.category?.id,
        name: categoryModal.name.trim(),
        description: categoryModal.description.trim(),
        icon: categoryModal.icon,
        color: categoryModal.color,
        active: categoryModal.active,
        order: Number(categoryModal.order) || 0,
      },
      { uid: currentUser.uid, email: currentUser.email || '' }
    );
    if (ok) {
      const cList = await fetchCategories();
      setCategories(cList);
      setCategoryModal({ ...categoryModal, isOpen: false });
      notifySuccess('บันทึกหมวดหมู่เรียบร้อยแล้ว');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!currentUser) return;
    if (window.confirm(`ต้องการลบหมวดหมู่ "${cat.name}" ใช่หรือไม่?`)) {
      const ok = await deleteCategory(cat.id, cat.name, {
        uid: currentUser.uid,
        email: currentUser.email || '',
      });
      if (ok) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        notifySuccess(`ลบหมวดหมู่ ${cat.name} สำเร็จ`);
      }
    }
  };

  // Reports Actions
  const handleResolveReport = async (reportId: string, status: ContentReport['status']) => {
    if (!currentUser) return;
    const ok = await updateReportStatus(reportId, status, {
      uid: currentUser.uid,
      email: currentUser.email || '',
    });
    if (ok) {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      notifySuccess(`จัดการรายงานเรียบร้อยแล้ว (สถานะ: ${status})`);
    }
  };

  // Settings Actions
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingSettings(true);
    const ok = await saveSystemSettings(settingsForm, {
      uid: currentUser.uid,
      email: currentUser.email || '',
    });
    setSavingSettings(false);
    if (ok) {
      setSettings((prev) => ({ ...(prev as SystemSettings), ...settingsForm }));
      notifySuccess('บันทึกการตั้งค่าเว็บไซต์ไปยัง Firestore สำเร็จแล้ว!');
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    const matchQuery =
      !q ||
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q);

    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchStatus = userStatusFilter === 'all' || u.accountStatus === userStatusFilter;

    return matchQuery && matchRole && matchStatus;
  });

  // Pending media count
  const pendingMediaList = allMedia.filter((m) => m.status === 'pending_approval');
  const pendingReportsList = reports.filter((r) => r.status === 'pending');

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
        <button onClick={onBackToHome} className="hover:text-indigo-600 transition-colors">
          หน้าหลัก
        </button>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="text-slate-800 font-bold">แผงควบคุมผู้ดูแลระบบ (Admin Dashboard)</span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="text-indigo-600 font-semibold capitalize">
          {activeTab === 'overview' && 'ภาพรวมระบบ'}
          {activeTab === 'users' && 'จัดการสมาชิก'}
          {activeTab === 'content' && 'ตรวจสอบและจัดการสื่อ'}
          {activeTab === 'categories' && 'หมวดหมู่วิชา'}
          {activeTab === 'reports' && 'รายงานเนื้อหา'}
          {activeTab === 'settings' && 'การตั้งค่าเว็บไซต์'}
          {activeTab === 'logs' && 'ประวัติการดำเนินการ'}
        </span>
      </nav>

      {/* Top Banner Alert / Success Notice */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header Info Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                ระบบจัดการผู้ดูแล EduShare
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                เชื่อมต่อฐานข้อมูล Cloud Firestore จริง บันทึกและควบคุมระบบแบบ Real-time
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>ภาพรวมระบบ</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการสมาชิก ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'content'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>
            สื่อ & การอนุมัติ
            {pendingMediaList.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px]">
                {pendingMediaList.length}
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>หมวดหมู่วิชา ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'reports'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>
            รายงานเนื้อหา
            {pendingReportsList.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px]">
                {pendingReportsList.length}
              </span>
            )}
          </span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>การตั้งค่าเว็บไซต์</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'logs'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติการดำเนินการ</span>
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">สมาชิกทั้งหมด</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
                {users.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                ใช้งานอยู่: {users.filter((u) => u.accountStatus === 'active').length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">สื่อการเรียนรู้ทั้งหมด</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-1">
                {allMedia.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                เผยแพร่แล้ว: {allMedia.filter((m) => m.status === 'published').length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">สื่อรอการตรวจสอบ</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                {pendingMediaList.length}
              </p>
              <button
                onClick={() => setActiveTab('content')}
                className="text-[11px] text-indigo-600 font-semibold hover:underline mt-1 block"
              >
                ดูรายการรอตรวจ →
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">รายงานการละเมิด</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
                {pendingReportsList.length}
              </p>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-[11px] text-rose-600 font-semibold hover:underline mt-1 block"
              >
                จัดการรายงาน →
              </button>
            </div>
          </div>

          {/* Firebase Connection Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>สถานะการเชื่อมต่อ Firebase Cloud Firestore</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400">สถานะเซิร์ฟเวอร์</span>
                <p className="font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {firebaseStatus?.message || 'เชื่อมต่อสำเร็จ'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400">Project ID</span>
                <p className="font-bold text-slate-800 mt-1 font-mono">coastal-quote-5hl8x</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400">Database ID</span>
                <p className="font-bold text-slate-800 mt-1 font-mono text-[11px] truncate">
                  ai-studio-71db1ffb-50bb-4f36-9a6d-83b27e0fdd2a
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filter Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, อีเมล หรือ UID ของสมาชิก..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none"
              >
                <option value="all">บทบาททั้งหมด</option>
                <option value="member">สมาชิก (Member)</option>
                <option value="moderator">ผู้ตรวจสอบ (Moderator)</option>
                <option value="admin">ผู้ดูแลระบบ (Admin)</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="active">ปกติ (Active)</option>
                <option value="suspended">ระงับการใช้งาน (Suspended)</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">ผู้ใช้งาน</th>
                    <th className="py-3.5 px-4">อีเมล & ยืนยัน</th>
                    <th className="py-3.5 px-4">บทบาท (Role)</th>
                    <th className="py-3.5 px-4">สถานะบัญชี</th>
                    <th className="py-3.5 px-4">วันที่สมัคร</th>
                    <th className="py-3.5 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        {users.length === 0 ? 'ยังไม่มีข้อมูลสมาชิกในระบบ' : 'ไม่พบสมาชิกที่ตรงกับเงื่อนไขการค้นหา'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {u.displayName?.charAt(0) || u.email?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 line-clamp-1">{u.displayName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{u.uid}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="text-slate-700">{u.email}</p>
                          {u.emailVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> ยืนยันแล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                              <AlertTriangle className="w-3 h-3" /> ยังไม่ยืนยัน
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              u.role === 'admin'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : u.role === 'moderator'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {u.role === 'admin' ? 'ผู้ดูแลระบบ' : u.role === 'moderator' ? 'ผู้ตรวจสอบ' : 'สมาชิก'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              u.accountStatus === 'suspended'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {u.accountStatus === 'suspended' ? 'ระงับการใช้งาน' : 'ปกติ'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-500">
                          {formatDate(u.createdAt)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit Profile */}
                            <button
                              onClick={() =>
                                setEditUserModal({
                                  user: u,
                                  displayName: u.displayName,
                                  bio: u.bio || '',
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="แก้ไขข้อมูลผู้ใช้"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Change Role Button */}
                            {isAdmin && (
                              <button
                                onClick={() =>
                                  setRoleChangeModal({
                                    user: u,
                                    newRole: u.role === 'admin' ? 'member' : u.role === 'moderator' ? 'admin' : 'moderator',
                                  })
                                }
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="เปลี่ยนบทบาทผู้ใช้"
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            )}

                            {/* Suspend / Activate Button */}
                            {isAdmin && (
                              <button
                                onClick={() =>
                                  setStatusConfirmModal({
                                    user: u,
                                    newStatus: u.accountStatus === 'suspended' ? 'active' : 'suspended',
                                  })
                                }
                                className={`p-1.5 rounded-lg transition-colors ${
                                  u.accountStatus === 'suspended'
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-rose-500 hover:bg-rose-50'
                                }`}
                                title={u.accountStatus === 'suspended' ? 'เปิดใช้งานบัญชี' : 'ระงับบัญชีนี้'}
                              >
                                {u.accountStatus === 'suspended' ? (
                                  <UserCheck className="w-4 h-4" />
                                ) : (
                                  <UserX className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT & APPROVALS */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Pending Reviews Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>คิวสื่อรอการตรวจสอบ (Pending Approval)</span>
              </span>
              <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold">
                {pendingMediaList.length} รายการ
              </span>
            </h2>

            {pendingMediaList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                ไม่มีสื่อที่ค้างการตรวจสอบในขณะนี้
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingMediaList.map((m) => (
                  <div key={m.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                          {m.categoryName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ส่งโดย: {m.authorName} ({m.authorEmail})
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm hover:text-indigo-600 cursor-pointer" onClick={() => onOpenMediaDetail(m)}>
                        {m.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{m.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={m.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิดตรวจไฟล์</span>
                      </a>
                      <button
                        onClick={() => handleApproveMedia(m.id)}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>อนุมัติเผยแพร่</span>
                      </button>
                      <button
                        onClick={() => handleToggleHideMedia(m)}
                        className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg"
                      >
                        <span>ปฏิเสธ/ซ่อน</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Media Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-800">สื่อการเรียนรู้ทั้งหมดในระบบ ({allMedia.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">ชื่อสื่อ</th>
                    <th className="py-3 px-4">หมวดหมู่ & วิชา</th>
                    <th className="py-3 px-4">ผู้แบ่งปัน</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allMedia.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800 line-clamp-1 hover:text-indigo-600 cursor-pointer" onClick={() => onOpenMediaDetail(m)}>
                          {m.title}
                        </p>
                        <span className="text-[10px] text-slate-400">ระดับ: {m.educationLevel}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-700 font-medium">{m.categoryName}</p>
                        <span className="text-[10px] text-slate-400">{m.subject}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {m.authorName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            m.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.status === 'pending_approval'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {m.status === 'published' ? 'เผยแพร่' : m.status === 'pending_approval' ? 'รอตรวจ' : 'ซ่อน'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleHideMedia(m)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                            title={m.status === 'hidden' ? 'แสดงสู่สาธารณะ' : 'ซ่อนสื่อนี้'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMediaByAdmin(m.id, m.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                            title="ลบสื่อถาวร"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">จัดการหมวดหมู่วิชาและสื่อ</h2>
            <button
              onClick={() =>
                setCategoryModal({
                  isOpen: true,
                  category: null,
                  name: '',
                  description: '',
                  icon: 'BookOpen',
                  color: 'indigo',
                  active: true,
                  order: categories.length + 1,
                })
              }
              className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มหมวดหมู่ใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      {c.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                    <span className="text-[11px] text-slate-400">ลำดับ: {c.order || 0}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'ไม่มีคำอธิบาย'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      setCategoryModal({
                        isOpen: true,
                        category: c,
                        name: c.name,
                        description: c.description || '',
                        icon: c.icon || 'BookOpen',
                        color: c.color || 'indigo',
                        active: c.active,
                        order: c.order || 0,
                      })
                    }
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                    title="แก้ไขหมวดหมู่"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="ลบหมวดหมู่"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800">รายงานเนื้อหาไม่เหมาะสม ({reports.length})</h2>
          {reports.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              ยังไม่มีรายงานเนื้อหาจากสมาชิก
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        {r.reason}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">สื่อที่ถูกรายงาน: {r.mediaTitle}</h4>
                      <p className="text-[11px] text-slate-400">
                        รายงานโดย: {r.reportedByEmail} เมื่อ {formatDate(r.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        r.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : r.status === 'dismissed'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        สถานะ: {r.status === 'resolved' ? 'จัดการแล้ว' : r.status === 'dismissed' ? 'ยกเลิกรายงาน' : 'รอดำเนินการ'}
                      </span>
                    </div>
                  </div>

                  {r.details && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong>รายละเอียดเพิ่มเติม:</strong> {r.details}
                    </p>
                  )}

                  {r.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleResolveReport(r.id, 'dismissed')}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        ยกเลิกรายงาน (ไม่มีมูล)
                      </button>
                      <button
                        onClick={() => handleResolveReport(r.id, 'resolved')}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                      >
                        ทำเครื่องหมายว่าจัดการแล้ว
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SETTINGS (General, Content, Security) */}
      {activeTab === 'settings' && isAdmin && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">การตั้งค่าระบบ EduShare</h2>
            <p className="text-xs text-slate-500 mt-1">
              การเปลี่ยนแปลงจะถูกบันทึกไปยังเอกสาร <code className="text-indigo-600">system_settings/general</code> ใน Firestore แบบถาวร
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Site Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อเว็บไซต์ (Site Name)</label>
              <input
                type="text"
                required
                value={settingsForm.siteName || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">อีเมลติดต่อผู้ดูแล (Contact Email)</label>
              <input
                type="email"
                required
                value={settingsForm.contactEmail || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Site Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">คำอธิบายเว็บไซต์ (Site Description)</label>
              <textarea
                rows={2}
                value={settingsForm.siteDescription || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, siteDescription: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Announcement Banner */}
            <div className="md:col-span-2 p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900">ข้อความประกาศบนแถบด้านบน (Announcement Banner)</label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-900">
                  <input
                    type="checkbox"
                    checked={settingsForm.announcementEnabled || false}
                    onChange={(e) => setSettingsForm({ ...settingsForm, announcementEnabled: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>เปิดแสดงประกาศ</span>
                </label>
              </div>
              <input
                type="text"
                value={settingsForm.announcement || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                placeholder="ข้อความประกาศข่าวสาร กิจกรรม หรือประชาสัมพันธ์..."
                className="w-full px-4 py-2 bg-white border border-amber-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Content Approval Toggle */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">ระบบคัดกรองสื่อก่อนเผยแพร่</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  เมื่อเปิดใช้งาน สื่อที่สมาชิกส่งมาต้องผ่านการอนุมัติจากแอดมินก่อน
                </p>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.requireApproval || false}
                onChange={(e) => setSettingsForm({ ...settingsForm, requireApproval: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded"
              />
            </div>

            {/* Allowed File Types */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">นามสกุลไฟล์ที่อนุญาต (Allowed Extensions)</label>
              <input
                type="text"
                value={settingsForm.allowedFileTypes || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, allowedFileTypes: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
            >
              {savingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าลง Firestore'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'logs' && isAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>ประวัติการเปลี่ยนแปลงและการกระทำของผู้ดูแล (Audit Trail)</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">วันและเวลา</th>
                  <th className="py-3 px-4">การกระทำ (Action)</th>
                  <th className="py-3 px-4">เป้าหมาย (Target)</th>
                  <th className="py-3 px-4">รายละเอียด</th>
                  <th className="py-3 px-4">ผู้ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      ยังไม่มีประวัติการกระทำบันทึกไว้
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 text-xs">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {log.targetType}: {log.targetId}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {log.performedByEmail}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: SUSPEND / ACTIVATE CONFIRMATION */}
      {statusConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              statusConfirmModal.newStatus === 'suspended' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800">
                {statusConfirmModal.newStatus === 'suspended'
                  ? `ยืนยันการระงับบัญชี ${statusConfirmModal.user.displayName}?`
                  : `ยืนยันการเปิดใช้งานบัญชี ${statusConfirmModal.user.displayName}?`}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {statusConfirmModal.newStatus === 'suspended'
                  ? 'ผู้ใช้จะไม่สามารถเข้าสู่ระบบและใช้งานฟังก์ชันใด ๆ ได้จนกว่าจะได้รับการปลดระงับ'
                  : 'ผู้ใช้จะสามารถเข้าสู่ระบบและใช้งานสื่อการเรียนรู้ได้ตามปกติ'}
              </p>
            </div>

            {statusConfirmModal.newStatus === 'suspended' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เหตุผลในการระงับ (สำหรับ Audit Log)</label>
                <input
                  type="text"
                  required
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="เช่น ละเมิดข้อกำหนดการใช้งาน, เผยแพร่สแปม"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStatusConfirmModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs ${
                  statusConfirmModal.newStatus === 'suspended'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                ยืนยันการทำรายการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ROLE CHANGE CONFIRMATION */}
      {roleChangeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              กำหนดบทบาทของ {roleChangeModal.user.displayName}
            </h3>
            <p className="text-xs text-slate-500">
              เลือกบทบาทและสิทธิ์การเข้าถึงสำหรับผู้ใช้งานนี้:
            </p>

            <div className="space-y-2">
              {(['member', 'moderator', 'admin'] as UserRole[]).map((r) => (
                <label
                  key={r}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    roleChangeModal.newRole === r
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="role"
                      checked={roleChangeModal.newRole === r}
                      onChange={() => setRoleChangeModal({ ...roleChangeModal, newRole: r })}
                      className="text-indigo-600"
                    />
                    <span className="capitalize text-sm font-semibold">
                      {r === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : r === 'moderator' ? 'ผู้ตรวจสอบ (Moderator)' : 'สมาชิกทั่วไป (Member)'}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRoleChangeModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmRoleChange}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                บันทึกบทบาท
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER PROFILE BY ADMIN */}
      {editUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              แก้ไขข้อมูลสมาชิก: {editUserModal.user.email}
            </h3>

            <form onSubmit={handleSaveUserProfileByAdmin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อที่แสดง</label>
                <input
                  type="text"
                  required
                  value={editUserModal.displayName}
                  onChange={(e) => setEditUserModal({ ...editUserModal, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เกี่ยวกับตัวผู้ใช้ (Bio)</label>
                <textarea
                  rows={3}
                  value={editUserModal.bio}
                  onChange={(e) => setEditUserModal({ ...editUserModal, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUserModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CATEGORY */}
      {categoryModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              {categoryModal.category ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อหมวดหมู่</label>
                <input
                  type="text"
                  required
                  value={categoryModal.name}
                  onChange={(e) => setCategoryModal({ ...categoryModal, name: e.target.value })}
                  placeholder="เช่น สื่อปฐมวัย, วิทยาศาสตร์และเทคโนโลยี"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">คำอธิบาย</label>
                <textarea
                  rows={2}
                  value={categoryModal.description}
                  onChange={(e) => setCategoryModal({ ...categoryModal, description: e.target.value })}
                  placeholder="คำอธิบายสั้น ๆ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ลำดับการแสดงผล</label>
                  <input
                    type="number"
                    value={categoryModal.order}
                    onChange={(e) => setCategoryModal({ ...categoryModal, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={categoryModal.active}
                      onChange={(e) => setCategoryModal({ ...categoryModal, active: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>เปิดใช้งานหมวดนี้</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModal({ ...categoryModal, isOpen: false })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
