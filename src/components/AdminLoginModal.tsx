import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound 
} from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const { 
    isAdminLoginModalOpen, 
    setIsAdminLoginModalOpen, 
    loginAsAdmin,
    isAuthenticatedAdmin
  } = useStore();

  const [secretInput, setSecretInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdminLoginModalOpen) {
      setSecretInput('');
      setErrorMessage('');
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isAdminLoginModalOpen]);

  if (!isAdminLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim()) {
      setErrorMessage('Silakan masukkan PIN atau email pengelola.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    setTimeout(() => {
      const result = loginAsAdmin(secretInput);
      setIsSubmitting(false);
      if (!result.success) {
        setErrorMessage(result.message);
        inputRef.current?.select();
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E8DFC0] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Emerald Theme */}
        <div className="bg-[#1C3B2B] text-white px-6 py-6 text-center relative">
          <button
            onClick={() => setIsAdminLoginModalOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-full bg-[#B38F5B]/20 border border-[#B38F5B]/50 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-[#C9B195]" />
          </div>

          <h3 className="font-display text-xl font-bold tracking-tight text-[#FAF8F5]">
            Portal Pengelola Butik
          </h3>
          <p className="text-xs text-[#C5BBAE] mt-1 max-w-xs mx-auto">
            Akses verifikasi staf resmi & operasional gudang saena.id
          </p>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Security Alert if any error */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#3D3830]">
              PIN Staf / Email Akun Admin
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8377]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={secretInput}
                onChange={(e) => {
                  setSecretInput(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Masukkan PIN atau email pengelola..."
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-[#DCD2C3] rounded-xl text-[#242320] placeholder-[#A0988A] focus:outline-none focus:border-[#1C3B2B] focus:ring-1 focus:ring-[#1C3B2B] transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8377] hover:text-[#3D3830] p-1"
                title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdminLoginModalOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#DCD2C3] text-xs font-semibold text-[#5A5348] hover:bg-[#EFE9E0] transition-colors"
            >
              Kembali ke Toko
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1C3B2B] hover:bg-[#142C20] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Buka Akses Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
