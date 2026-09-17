import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  CreditCard, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Building2, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Copy,
  Check,
  Save,
  QrCode,
  Smartphone,
  Store,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { testDokuConnectionApi } from '../utils/dokuClient';

interface DokuConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DokuConfigModal: React.FC<DokuConfigModalProps> = ({
  isOpen,
  onClose
}) => {
  const { dokuConfig, updateDokuConfig, sendPushNotification } = useStore();

  const [clientId, setClientId] = useState(dokuConfig?.clientId || '');
  const [secretKey, setSecretKey] = useState(dokuConfig?.secretKey || '');
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>(dokuConfig?.environment || 'sandbox');
  const [enabled, setEnabled] = useState(dokuConfig?.enabled ?? true);
  const [autoRedirect, setAutoRedirect] = useState(dokuConfig?.autoRedirectToPaymentUrl ?? false);
  const [activeChannels, setActiveChannels] = useState(dokuConfig?.activeChannels || {
    qris: true,
    virtualAccounts: true,
    eWallet: true,
    creditCard: true,
    convenienceStore: true
  });

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; mode?: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  if (!isOpen) return null;

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/doku/notification` 
    : 'https://saena.my.id/api/doku/notification';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testDokuConnectionApi(clientId, secretKey, environment);
      setTestResult({
        success: result.success,
        message: result.message || 'Koneksi DOKU Payment Gateway berhasil diverifikasi!',
        mode: result.mode
      });
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Gagal menghubungi endpoint DOKU'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    updateDokuConfig({
      clientId: clientId.trim(),
      secretKey: secretKey.trim(),
      environment,
      enabled,
      autoRedirectToPaymentUrl: autoRedirect,
      activeChannels
    });

    setIsSaved(true);
    sendPushNotification(
      'Konfigurasi DOKU Disimpan! 💳',
      `Integrasi DOKU.com berhasil diperbarui (Mode: ${environment.toUpperCase()}).`,
      'system'
    );
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div id="doku-config-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        id="doku-config-modal-content"
        className="bg-[#FAF8F5] text-[#242320] w-full max-w-xl rounded-2xl shadow-2xl border border-[#D5C9B8] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-[#1C3B2B] text-white p-4 sm:p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#C5A880]/15 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <CreditCard className="w-5 h-5 text-[#E6D7C3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-[#F5F2EB]">
                  Integrasi DOKU.com
                </h3>
                <span className="text-[10px] bg-[#C5A880] text-[#1C3B2B] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Payment Gateway
                </span>
              </div>
              <p className="text-xs text-white/70">
                Gerbang pembayaran resmi berizin Bank Indonesia & PCI DSS Level 1
              </p>
            </div>
          </div>

          <button 
            id="close-doku-config-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status Alert */}
          <div className="p-3.5 bg-[#EAE4D9] rounded-xl border border-[#D5C9B8] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#1C3B2B] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#1C3B2B]">
                {environment === 'production' ? '🔴 Mode Production (Live API)' : '🟡 Mode Sandbox (Pengujian Realtime)'}
              </p>
              <p className="text-[#665E51] mt-0.5 leading-relaxed">
                {environment === 'production'
                  ? 'Setiap transaksi akan memproses uang riil melalui rekening merchant DOKU saena.id.'
                  : 'Mode sandbox pengujian aktif. Anda dapat memverifikasi koneksi API, alur checkout QRIS, dan Virtual Account untuk memastikan integrasi berjalan lancar.'}
              </p>
            </div>
          </div>

          {/* Environment Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#3D3830] block">
              Lingkungan API DOKU (Environment)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEnvironment('sandbox')}
                className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                  environment === 'sandbox'
                    ? 'bg-[#1C3B2B] text-white font-bold border-[#1C3B2B] shadow-sm'
                    : 'bg-white text-[#3D3830] border-[#D5C9B8] hover:bg-[#EAE4D9]'
                }`}
              >
                Sandbox (Testing Jokul)
              </button>
              <button
                type="button"
                onClick={() => setEnvironment('production')}
                className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                  environment === 'production'
                    ? 'bg-[#1C3B2B] text-white font-bold border-[#1C3B2B] shadow-sm'
                    : 'bg-white text-[#3D3830] border-[#D5C9B8] hover:bg-[#EAE4D9]'
                }`}
              >
                Production (Live Merchant)
              </button>
            </div>
          </div>

          {/* Credentials Inputs */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-[#E2D8CA]">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
              <span className="font-bold text-[#1C3B2B] flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#B38F5B]" />
                Kredensial Akun Merchant DOKU
              </span>
              <a 
                href="https://dashboard.doku.com" 
                target="_blank" 
                rel="noreferrer"
                className="text-[#1C3B2B] hover:underline flex items-center gap-1 font-semibold text-[11px]"
              >
                Buka Dashboard DOKU <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Client ID */}
            <div>
              <label className="font-semibold text-[#4A443B] block mb-1">
                Client ID (MALL ID / Client-Id)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Contoh: MALLID-12345678 atau CLIENT-..."
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg font-mono text-xs focus:outline-none focus:border-[#1C3B2B]"
              />
              <p className="text-[10px] text-[#7A7266] mt-1">
                Dapat ditemukan pada menu: <i>Integrasi &gt; Pengaturan &gt; API Credentials</i>
              </p>
            </div>

            {/* Secret Key */}
            <div>
              <label className="font-semibold text-[#4A443B] block mb-1">
                Shared Key / Secret Key
              </label>
              <div className="relative">
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="SK-••••••••••••••••••••••••"
                  className="w-full pl-3 pr-10 py-2 bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg font-mono text-xs focus:outline-none focus:border-[#1C3B2B]"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A7266] hover:text-[#242320]"
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Webhook Notification URL */}
            <div className="pt-2">
              <label className="font-semibold text-[#4A443B] block mb-1">
                URL Notifikasi Webhook (Paste di Dashboard DOKU)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg font-mono text-[11px] text-[#554E44]"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="px-3 py-2 bg-[#EAE4D9] hover:bg-[#D5C9B8] text-[#1C3B2B] rounded-lg font-semibold flex items-center gap-1 shrink-0 transition-colors"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Channel Toggles */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-[#E2D8CA]">
            <span className="font-bold text-[#1C3B2B] block pb-2 border-b border-[#F0EAE1]">
              Kanal Pembayaran DOKU Aktif
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#FAF8F5]">
                <input
                  type="checkbox"
                  checked={activeChannels.qris}
                  onChange={(e) => setActiveChannels({ ...activeChannels, qris: e.target.checked })}
                  className="rounded text-[#1C3B2B] focus:ring-[#1C3B2B]"
                />
                <QrCode className="w-4 h-4 text-[#1C3B2B]" />
                <span className="font-medium text-[#2C2822]">QRIS Realtime Dynamic</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#FAF8F5]">
                <input
                  type="checkbox"
                  checked={activeChannels.virtualAccounts}
                  onChange={(e) => setActiveChannels({ ...activeChannels, virtualAccounts: e.target.checked })}
                  className="rounded text-[#1C3B2B] focus:ring-[#1C3B2B]"
                />
                <Building2 className="w-4 h-4 text-[#005EAA]" />
                <span className="font-medium text-[#2C2822]">Virtual Account (BCA, Mandiri, BRI, BNI, BSI)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#FAF8F5]">
                <input
                  type="checkbox"
                  checked={activeChannels.eWallet}
                  onChange={(e) => setActiveChannels({ ...activeChannels, eWallet: e.target.checked })}
                  className="rounded text-[#1C3B2B] focus:ring-[#1C3B2B]"
                />
                <Smartphone className="w-4 h-4 text-[#00AA13]" />
                <span className="font-medium text-[#2C2822]">E-Wallet (OVO, DANA, ShopeePay)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#FAF8F5]">
                <input
                  type="checkbox"
                  checked={activeChannels.creditCard}
                  onChange={(e) => setActiveChannels({ ...activeChannels, creditCard: e.target.checked })}
                  className="rounded text-[#1C3B2B] focus:ring-[#1C3B2B]"
                />
                <CreditCard className="w-4 h-4 text-[#4A453E]" />
                <span className="font-medium text-[#2C2822]">Kartu Kredit / Debit (3D Secure)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#FAF8F5] sm:col-span-2">
                <input
                  type="checkbox"
                  checked={activeChannels.convenienceStore}
                  onChange={(e) => setActiveChannels({ ...activeChannels, convenienceStore: e.target.checked })}
                  className="rounded text-[#1C3B2B] focus:ring-[#1C3B2B]"
                />
                <Store className="w-4 h-4 text-[#E5A010]" />
                <span className="font-medium text-[#2C2822]">Gerai Retail (Indomaret &amp; Alfamart)</span>
              </label>
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="space-y-2">
            <button
              type="button"
              id="test-doku-connection-btn"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="w-full py-2.5 px-4 bg-[#EAE4D9] hover:bg-[#D5C9B8] text-[#1C3B2B] font-bold rounded-xl border border-[#C5BAA8] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Sedang Memeriksa Koneksi DOKU...' : 'Uji Koneksi API DOKU'}</span>
            </button>

            {testResult && (
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {testResult.success ? 'Koneksi DOKU Terhubung' : 'Uji Koneksi Gagal'}
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#EAE4D9] border-t border-[#D5C9B8] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-neutral-100 text-[#4A443B] font-semibold rounded-xl border border-[#D5C9B8] transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            id="save-doku-config-btn"
            onClick={handleSave}
            disabled={isSaved}
            className="px-5 py-2 bg-[#1C3B2B] hover:bg-[#254F3A] text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-75"
          >
            {isSaved ? <Check className="w-4 h-4 text-[#E6D7C3]" /> : <Save className="w-4 h-4 text-[#E6D7C3]" />}
            <span>{isSaved ? 'Tersimpan!' : 'Simpan Konfigurasi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
