import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  Copy, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  ExternalLink,
  QrCode,
  Building2,
  Smartphone,
  CreditCard,
  Store,
  Upload,
  Image as ImageIcon,
  Trash2,
  HelpCircle,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { testDokuConnectionApi } from '../utils/dokuClient';
import { getSmartQrisForOrder, parseQrisPayload } from '../utils/qrisGenerator';

interface DokuConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DokuConfigModal: React.FC<DokuConfigModalProps> = ({ isOpen, onClose }) => {
  const { dokuConfig, updateDokuConfig, sendPushNotification } = useStore();

  // Active Tab: 'qris_settings' | 'doku_api'
  const [activeTab, setActiveTab] = useState<'qris_settings' | 'doku_api'>('qris_settings');

  // QRIS & Store Direct Payment States
  const [customQrisImage, setCustomQrisImage] = useState(dokuConfig?.customQrisImage || '');
  const [customQrisString, setCustomQrisString] = useState(dokuConfig?.customQrisString || '');
  const [merchantName, setMerchantName] = useState(dokuConfig?.merchantName || 'SAENA BUTIK MUSLIMAH');
  const [merchantNmid, setMerchantNmid] = useState(dokuConfig?.merchantNmid || 'ID10200382910');
  const [merchantCity, setMerchantCity] = useState(dokuConfig?.merchantCity || 'TASIKMALAYA');
  const [bankAccounts, setBankAccounts] = useState(dokuConfig?.bankAccounts || [
    { bank: 'BCA', accountNumber: '1480928371', holderName: 'SAENA BUTIK MUSLIMAH' },
    { bank: 'Mandiri', accountNumber: '1310018293847', holderName: 'SAENA BUTIK MUSLIMAH' },
    { bank: 'BRI', accountNumber: '010901029384501', holderName: 'SAENA BUTIK MUSLIMAH' }
  ]);

  // DOKU API Gateway States
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
  const [copiedQrisText, setCopiedQrisText] = useState(false);

  // Sync when props change or modal re-opens
  useEffect(() => {
    if (isOpen) {
      setCustomQrisImage(dokuConfig?.customQrisImage || '');
      setCustomQrisString(dokuConfig?.customQrisString || '');
      setMerchantName(dokuConfig?.merchantName || 'SAENA BUTIK MUSLIMAH');
      setMerchantNmid(dokuConfig?.merchantNmid || 'ID10200382910');
      setMerchantCity(dokuConfig?.merchantCity || 'TASIKMALAYA');
      setClientId(dokuConfig?.clientId || '');
      setSecretKey(dokuConfig?.secretKey || '');
      setEnvironment(dokuConfig?.environment || 'sandbox');
      setEnabled(dokuConfig?.enabled ?? true);
      setAutoRedirect(dokuConfig?.autoRedirectToPaymentUrl ?? false);
      setActiveChannels(dokuConfig?.activeChannels || {
        qris: true,
        virtualAccounts: true,
        eWallet: true,
        creditCard: true,
        convenienceStore: true
      });
      if (dokuConfig?.bankAccounts && dokuConfig.bankAccounts.length > 0) {
        setBankAccounts(dokuConfig.bankAccounts);
      }
    }
  }, [isOpen, dokuConfig]);

  if (!isOpen) return null;

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/doku/notification` 
    : 'https://saena.my.id/api/doku/notification';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomQrisImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Live QRIS Preview data for Rp 79.500 (standard product price)
  const previewQris = getSmartQrisForOrder({
    orderId: 'PREVIEW-TEST',
    amount: 79500,
    config: {
      customQrisImage,
      customQrisString,
      merchantName,
      merchantCity,
      merchantNmid
    }
  });

  const handleQrisStringChange = (val: string) => {
    setCustomQrisString(val);
    if (val.startsWith('000201')) {
      const parsed = parseQrisPayload(val);
      if (parsed.merchantName) setMerchantName(parsed.merchantName);
      if (parsed.merchantCity) setMerchantCity(parsed.merchantCity);
      if (parsed.nmid) setMerchantNmid(parsed.nmid);
    }
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
      activeChannels,
      customQrisImage: customQrisImage.trim(),
      customQrisString: customQrisString.trim(),
      merchantName: merchantName.trim(),
      merchantNmid: merchantNmid.trim(),
      merchantCity: merchantCity.trim(),
      bankAccounts
    });

    setIsSaved(true);
    sendPushNotification(
      'Konfigurasi QRIS & DOKU Disimpan! 💳',
      `QRIS toko "${merchantName}" berhasil diperbarui dan siap digunakan di checkout & landing page.`,
      'system'
    );
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div id="doku-config-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        id="doku-config-modal-content"
        className="bg-[#FAF8F5] text-[#242320] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#D5C9B8] overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="bg-[#1C3B2B] text-white p-4 sm:p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#C5A880]/15 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center shadow-inner">
              <QrCode className="w-5 h-5 text-[#E6D7C3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide">
                  Pengaturan QRIS &amp; Pembayaran Toko
                </h2>
                <span className="text-[10px] bg-[#C5A880]/30 text-[#E6D7C3] px-2 py-0.5 rounded-full border border-[#C5A880]/30 font-semibold">
                  EMVCo / ASPI
                </span>
              </div>
              <p className="text-xs text-[#C5A880] mt-0.5">
                Pastikan kode QRIS dapat dibaca oleh seluruh m-Banking (BCA, Mandiri, BRI) &amp; E-Wallet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-[#EAE4D9] px-4 pt-2 border-b border-[#D5C9B8] flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('qris_settings')}
            className={`pb-2.5 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'qris_settings'
                ? 'border-[#1C3B2B] text-[#1C3B2B]'
                : 'border-transparent text-[#7A7266] hover:text-[#242320]'
            }`}
          >
            <QrCode className="w-4 h-4 text-[#C5A880]" />
            <span>QRIS Resmi Toko &amp; Rekening Bank</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('doku_api')}
            className={`pb-2.5 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'doku_api'
                ? 'border-[#1C3B2B] text-[#1C3B2B]'
                : 'border-transparent text-[#7A7266] hover:text-[#242320]'
            }`}
          >
            <Key className="w-4 h-4 text-[#C5A880]" />
            <span>Gateway API DOKU.com (Opsional)</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'qris_settings' ? (
            <div className="space-y-4">
              {/* Alert Penjelasan Masalah Scan QRIS */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-900 leading-relaxed">
                  <p className="font-bold text-xs mb-1">
                    Kenapa aplikasi m-Banking bisa memunculkan pesan "QR Tidak Sesuai"?
                  </p>
                  <p>
                    Aplikasi m-Banking seperti BCA Mobile, Livin Mandiri, dan BRImo mewajibkan merchant terdaftar di 
                    <strong> Bank Indonesia National Switch</strong>. Anda dapat memasang <strong>Foto Barcode QRIS Resmi Toko Anda</strong> 
                    (dari BCA QRIS, GoPay Merchant, ShopeePay, DANA Bisnis, atau DOKU) di bawah ini agar pelanggan dapat langsung membayar ke rekening resmi Anda!
                  </p>
                </div>
              </div>

              {/* Grid: Upload QRIS Image + Live Scanner Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload & String QRIS */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-[#E2D8CA] shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
                    <span className="font-bold text-[#1C3B2B] flex items-center gap-1.5 text-xs">
                      <ImageIcon className="w-4 h-4 text-[#B38F5B]" />
                      Pasang Foto QRIS Toko Anda
                    </span>
                    {customQrisImage && (
                      <button
                        type="button"
                        onClick={() => setCustomQrisImage('')}
                        className="text-rose-600 hover:text-rose-800 text-[10px] flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus Foto
                      </button>
                    )}
                  </div>

                  {/* Upload Dropzone */}
                  <label className="block border-2 border-dashed border-[#D5C9B8] hover:border-[#1C3B2B] rounded-xl p-4 text-center cursor-pointer bg-[#FAF8F5] transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-[#7A7266] mx-auto mb-1.5" />
                    <span className="font-bold text-[#1C3B2B] block text-xs">
                      Klik untuk Upload Foto QRIS Resmi
                    </span>
                    <span className="text-[10px] text-[#7A7266] block mt-0.5">
                      Pilih screenshot / file barcode QRIS (PNG, JPG)
                    </span>
                  </label>

                  {/* Or Paste Image URL */}
                  <div>
                    <label className="font-semibold text-[#4A443B] block mb-1 text-[11px]">
                      Atau URL Gambar QRIS Online:
                    </label>
                    <input
                      type="text"
                      value={customQrisImage.startsWith('data:') ? '(Gambar Lokal Berhasil Diupload)' : customQrisImage}
                      onChange={(e) => setCustomQrisImage(e.target.value)}
                      placeholder="https://.../qris-toko-saya.png"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg font-mono text-[11px] focus:outline-none focus:border-[#1C3B2B]"
                    />
                  </div>

                  {/* Paste Static QRIS Code String */}
                  <div className="pt-2 border-t border-[#F0EAE1]">
                    <label className="font-semibold text-[#4A443B] block mb-1 text-[11px]">
                      Kode Teks QRIS EMVCo (Opsional):
                    </label>
                    <textarea
                      rows={2}
                      value={customQrisString}
                      onChange={(e) => handleQrisStringChange(e.target.value)}
                      placeholder="00020101021126570014ID.CO.QRIS.WWW..."
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg font-mono text-[10px] focus:outline-none focus:border-[#1C3B2B] resize-none"
                    />
                    <p className="text-[10px] text-[#7A7266] mt-0.5">
                      Jika Anda menempelkan string QRIS statis toko, sistem akan otomatis mengubahnya menjadi dynamic QRIS dengan nominal belanja yang presisi.
                    </p>
                  </div>
                </div>

                {/* Live Preview QRIS Box (Tampilan yang akan dilihat pelanggan) */}
                <div className="bg-white p-4 rounded-xl border border-[#E2D8CA] shadow-2xs flex flex-col items-center justify-center text-center space-y-2.5">
                  <div className="flex items-center justify-between w-full pb-2 border-b border-[#F0EAE1]">
                    <span className="font-bold text-[#1C3B2B] text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                      Preview Barcode QRIS Toko
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Siap Scan
                    </span>
                  </div>

                  {/* QR Image Box */}
                  <div className="p-2 bg-white border-2 border-[#1C3B2B]/20 rounded-xl shadow-inner max-w-[180px]">
                    <img
                      src={previewQris.qrImageUrl}
                      alt="Preview QRIS Toko"
                      className="w-full h-auto object-contain rounded"
                    />
                  </div>

                  <div className="text-[11px] space-y-0.5">
                    <p className="font-bold text-[#1C3B2B]">{previewQris.merchantName}</p>
                    <p className="text-[#7A7266] font-mono text-[10px]">NMID: {previewQris.merchantNmid}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      {previewQris.isCustomImage ? '✓ Menggunakan Gambar QRIS Toko Asli' : '✓ QRIS Dynamic ASPI Berstandar Bank Indonesia'}
                    </p>
                  </div>

                  {/* Copy QRIS Payload button */}
                  {previewQris.qrisString && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(previewQris.qrisString);
                        setCopiedQrisText(true);
                        setTimeout(() => setCopiedQrisText(false), 2000);
                      }}
                      className="text-[10px] text-[#1C3B2B] bg-[#FAF8F5] hover:bg-[#EAE4D9] border border-[#D5C9B8] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedQrisText ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedQrisText ? 'String QRIS Tersalin!' : 'Salin Kode QRIS EMVCo'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Data Merchant Resmi */}
              <div className="bg-white p-4 rounded-xl border border-[#E2D8CA] space-y-3">
                <span className="font-bold text-[#1C3B2B] block pb-2 border-b border-[#F0EAE1] text-xs">
                  Identitas Toko &amp; Merchant QRIS
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-[#4A443B] block mb-1 text-[11px]">
                      Nama Toko / Merchant
                    </label>
                    <input
                      type="text"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      placeholder="SAENA BUTIK MUSLIMAH"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg font-bold text-xs focus:outline-none focus:border-[#1C3B2B]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#4A443B] block mb-1 text-[11px]">
                      NMID Merchant (Jika ada)
                    </label>
                    <input
                      type="text"
                      value={merchantNmid}
                      onChange={(e) => setMerchantNmid(e.target.value)}
                      placeholder="ID10200382910"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg font-mono text-xs focus:outline-none focus:border-[#1C3B2B]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#4A443B] block mb-1 text-[11px]">
                      Kota Merchant
                    </label>
                    <input
                      type="text"
                      value={merchantCity}
                      onChange={(e) => setMerchantCity(e.target.value)}
                      placeholder="TASIKMALAYA"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg text-xs focus:outline-none focus:border-[#1C3B2B]"
                    />
                  </div>
                </div>
              </div>

              {/* Rekening Bank Toko Cadangan (BCA, Mandiri, BRI) */}
              <div className="bg-white p-4 rounded-xl border border-[#E2D8CA] space-y-3">
                <span className="font-bold text-[#1C3B2B] block pb-2 border-b border-[#F0EAE1] text-xs">
                  Rekening Bank Resmi Toko (Cadangan Transfer Langsung)
                </span>

                <div className="space-y-2">
                  {bankAccounts.map((acc, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EAE4D9]">
                      <div>
                        <span className="text-[10px] text-[#7A7266] block">Bank:</span>
                        <input
                          type="text"
                          value={acc.bank}
                          onChange={(e) => {
                            const copy = [...bankAccounts];
                            copy[idx].bank = e.target.value;
                            setBankAccounts(copy);
                          }}
                          className="w-full px-2 py-1 bg-white border border-[#D5C9B8] rounded font-bold text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A7266] block">Nomor Rekening:</span>
                        <input
                          type="text"
                          value={acc.accountNumber}
                          onChange={(e) => {
                            const copy = [...bankAccounts];
                            copy[idx].accountNumber = e.target.value;
                            setBankAccounts(copy);
                          }}
                          className="w-full px-2 py-1 bg-white border border-[#D5C9B8] rounded font-mono font-bold text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A7266] block">Atas Nama:</span>
                        <input
                          type="text"
                          value={acc.holderName}
                          onChange={(e) => {
                            const copy = [...bankAccounts];
                            copy[idx].holderName = e.target.value;
                            setBankAccounts(copy);
                          }}
                          className="w-full px-2 py-1 bg-white border border-[#D5C9B8] rounded text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* DOKU API Tab Content */}
              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E2D8CA]">
                <div>
                  <span className="font-bold text-[#1C3B2B] block text-sm">
                    Status Integrasi DOKU.com
                  </span>
                  <span className="text-[11px] text-[#7A7266]">
                    {enabled ? 'Gateway aktif memproses pembayaran online' : 'Gateway dinonaktifkan sementara'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D5C9B8] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C3B2B]"></div>
                </label>
              </div>

              {/* Mode Environment */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[#4A443B] block">
                  Pilih Lingkungan (Environment)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEnvironment('sandbox')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
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
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
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

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-[#4A443B] block text-xs">
                      Client ID (MALL ID / Client-Id)
                    </label>
                    {!clientId && (
                      <button
                        type="button"
                        onClick={() => {
                          setClientId('BRN-0286-1789185802157');
                          setEnvironment('production');
                        }}
                        className="text-[10px] text-blue-700 hover:underline font-bold"
                      >
                        Gunakan Akun BRN Toko
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Contoh: BRN-0286-1789185802157"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg font-mono text-xs focus:outline-none focus:border-[#1C3B2B]"
                  />
                  <p className="text-[10px] text-[#7A7266] mt-1">
                    Sesuai dashboard DOKU Anda: <code>BRN-0286-1789185802157</code>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-[#4A443B] block text-xs">
                      Active Secret Key (Bukan API Key)
                    </label>
                    <span className="text-[10px] text-[#7A7266]">
                      Wajib unmasked (tanpa sensor *)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="SK-LP... (Klik Reveal Key di DOKU dulu)"
                      className={`w-full pl-3 pr-10 py-2 bg-[#FAF8F5] border rounded-lg font-mono text-xs focus:outline-none ${
                        secretKey.includes('*') 
                          ? 'border-red-500 bg-red-50/50 text-red-900 focus:border-red-600' 
                          : 'border-[#D5C9B8] focus:border-[#1C3B2B]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A7266] hover:text-[#242320]"
                    >
                      {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {secretKey.includes('*') ? (
                    <div className="mt-2 p-2.5 bg-red-50 border border-red-300 rounded-lg text-xs text-red-800 space-y-1 animate-pulse">
                      <p className="font-bold flex items-center gap-1 text-red-900">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        KUNCI MASIH TERSENSOR BINTANG (*) !
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Di dashboard DOKU Anda, klik tombol <strong>"Reveal Key"</strong> di sebelah <i>Active Secret Key</i> terlebih dahulu hingga seluruh huruf kuncinya terbuka (tanpa sensor *), baru klik <strong>"Copy Secret Key"</strong>.
                      </p>
                      <p className="text-[10px] text-red-700">
                        *Catatan: Jangan gunakan baris "API Key" (doku_key_...), gunakan "Active Secret Key" yang diawali <code>SK-LP...</code>.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#7A7266] mt-1">
                      Klik <strong>Reveal Key</strong> di dashboard DOKU sebelum menyalin agar seluruh string kunci lengkap.
                    </p>
                  )}
                </div>

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
                      className="px-3 py-2 bg-[#EAE4D9] hover:bg-[#D5C9B8] text-[#1C3B2B] rounded-lg font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
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
                    <span className="font-medium text-[#2C2822]">Virtual Account (BCA, Mandiri, BRI)</span>
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
                </div>
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2">
                <button
                  type="button"
                  id="test-doku-connection-btn"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="w-full py-2.5 px-4 bg-[#EAE4D9] hover:bg-[#D5C9B8] text-[#1C3B2B] font-bold rounded-xl border border-[#C5BAA8] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#EAE4D9] border-t border-[#D5C9B8] flex items-center justify-between">
          <span className="text-[11px] text-[#7A7266]">
            Perubahan otomatis tersimpan dan aktif pada checkout.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-neutral-100 text-[#4A443B] font-semibold rounded-xl border border-[#D5C9B8] transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              id="save-doku-config-btn"
              onClick={handleSave}
              disabled={isSaved}
              className="px-5 py-2 bg-[#1C3B2B] hover:bg-[#254F3A] text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-75 cursor-pointer"
            >
              {isSaved ? <Check className="w-4 h-4 text-[#E6D7C3]" /> : <Save className="w-4 h-4 text-[#E6D7C3]" />}
              <span>{isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
