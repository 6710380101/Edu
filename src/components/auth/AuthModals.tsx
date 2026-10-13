import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase/config';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

interface AuthModalsProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const { signUp, signIn, signInGoogle, sendPasswordReset, authError, clearAuthError } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSentSuccess, setResetSentSuccess] = useState(false);
  const [registerSuccessMessage, setRegisterSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    clearAuthError();
    setLocalError(null);
    setResetSentSuccess(false);
    setRegisterSuccessMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    onClose();
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    clearAuthError();
    setLocalError(null);
    setResetSentSuccess(false);
    setRegisterSuccessMessage(null);
    setMode(newMode);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    // Validations
    if (!email || !email.includes('@')) {
      setLocalError('กรุณากรอกที่อยู่อีเมลที่ถูกต้อง');
      return;
    }

    if (mode === 'forgot') {
      setSubmitting(true);
      const res = await sendPasswordReset(email);
      setSubmitting(false);
      if (res.success) {
        setResetSentSuccess(true);
      } else {
        setLocalError(res.error || 'ไม่สามารถส่งคำขอรีเซ็ตรหัสผ่านได้');
      }
      return;
    }

    if (!password) {
      setLocalError('กรุณากรอกรหัสผ่าน');
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setLocalError('กรุณากรอกชื่อที่ใช้แสดงในระบบ');
        return;
      }
      if (password.length < 6) {
        setLocalError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
        return;
      }

      setSubmitting(true);
      const res = await signUp(email, password, displayName);
      setSubmitting(false);
      if (res.success) {
        setRegisterSuccessMessage(
          'สมัครสมาชิกสำเร็จ! ระบบได้ส่งอีเมลยืนยันตัวตนไปยัง ' +
            email +
            ' แล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ'
        );
        setTimeout(() => {
          if (onSuccess) onSuccess();
          handleClose();
        }, 3000);
      } else {
        setLocalError(res.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
      return;
    }

    if (mode === 'login') {
      setSubmitting(true);
      const res = await signIn(email, password);
      setSubmitting(false);
      if (res.success) {
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        setLocalError(res.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearAuthError();
    setSubmitting(true);
    const res = await signInGoogle();
    setSubmitting(false);
    if (res.success) {
      if (onSuccess) onSuccess();
      handleClose();
    } else {
      setLocalError(res.error || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    }
  };

  const displayError = localError || authError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {mode === 'login' && 'เข้าสู่ระบบ EduShare'}
              {mode === 'register' && 'สร้างบัญชีสมาชิกใหม่'}
              {mode === 'forgot' && 'ลืมรหัสผ่าน'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'login' && 'เข้าสู่ระบบเพื่อใช้งานคลังสื่อการเรียนรู้'}
              {mode === 'register' && 'ร่วมเป็นส่วนหนึ่งในชุมชนแบ่งปันสื่อการศึกษา'}
              {mode === 'forgot' && 'กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            title="ปิดหน้าต่าง"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Notice */}
          {displayError && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{displayError}</div>
            </div>
          )}

          {/* Register Success Message */}
          {registerSuccessMessage && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">ยินดีต้อนรับสู่ EduShare</p>
                <p className="mt-1">{registerSuccessMessage}</p>
              </div>
            </div>
          )}

          {/* Forgot Password Sent Feedback */}
          {mode === 'forgot' && resetSentSuccess ? (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-slate-800">ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว!</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยัง{' '}
                  <span className="font-semibold text-indigo-700">{email}</span> แล้ว
                </p>
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 text-left">
                  💡 <strong>ข้อแนะนำ:</strong> หากไม่พบอีเมลในกล่องข้อความหลัก โปรดตรวจสอบในโฟลเดอร์ <strong>ขยะ (Spam)</strong> หรือ <strong>จดหมายขยะ (Junk)</strong> ของท่าน
                </p>
              </div>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name (Only in Register mode) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    ชื่อที่ใช้แสดงในระบบ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="เช่น ครูสมศักดิ์ หรือ KruNat"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  อีเมล <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              {/* Password Input (In Login and Register mode) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      รหัสผ่าน <span className="text-rose-500">*</span>
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'register' ? 'อย่างน้อย 6 ตัวอักษร' : '••••••••'}
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password (Only in Register mode) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      title={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'เข้าสู่ระบบ'}
                      {mode === 'register' && 'สมัครสมาชิก'}
                      {mode === 'forgot' && 'ส่งคำขอรีเซ็ตรหัสผ่าน'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Google Sign In Divider & Button (Login & Register) */}
              {mode !== 'forgot' && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-slate-400 font-medium">หรือ</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={submitting}
                    className="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>ดำเนินการต่อด้วย Google</span>
                  </button>
                </>
              )}
            </form>
          )}

          {/* Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            {mode === 'login' && (
              <p>
                ยังไม่มีบัญชีสมาชิก?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  สมัครสมาชิกฟรีที่นี่
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p>
                มีบัญชีสมาชิกอยู่แล้ว?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-medium text-slate-600 hover:text-indigo-600 hover:underline"
              >
                ← กลับไปหน้าเข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Reset Password Handler Component
 * Catches Firebase Action URL params (mode=resetPassword, oobCode=...)
 */
export const ResetPasswordModal: React.FC<{
  oobCode: string;
  onComplete: () => void;
}> = ({ oobCode, onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      // First verify the action code
      await verifyPasswordResetCode(auth, oobCode);
      // Then confirm new password
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/expired-action-code') {
        setError('ลิงก์รีเซ็ตรหัสผ่านนี้หมดอายุแล้ว กรุณาส่งคำขอรีเซ็ตใหม่อีกครั้ง');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือถูกใช้งานไปแล้ว');
      } else {
        setError('ไม่สามารถตั้งรหัสผ่านใหม่ได้: ' + (err.message || 'โปรดลองใหม่อีกครั้ง'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
        {success ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-xl font-bold text-slate-800">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว!</h3>
            <p className="text-sm text-slate-600">
              รหัสผ่านของคุณได้รับการอัปเดตแล้ว ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
            </p>
            <button
              onClick={onComplete}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              ไปยังหน้าเข้าสู่ระบบ
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">ตั้งรหัสผ่านใหม่</h3>
              <p className="text-xs text-slate-500 mt-1">กำหนดรหัสผ่านใหม่สำหรับบัญชี EduShare ของคุณ</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึกรหัสผ่าน...' : 'บันทึกรหัสผ่านใหม่'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
