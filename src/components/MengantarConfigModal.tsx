import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Truck, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Building2, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Phone,
  MapPin,
  Save,
  Check
} from 'lucide-react';
import { testMengantarConnectionApi } from '../utils/mengantarClient';

interface MengantarConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MengantarConfigModal: React.FC<MengantarConfigModalProps> = ({
  isOpen,
  onClose
}) => {
  const { mengantarConfig, updateMengantarConfig } = useStore();

  const [apiKey, setApiKey] = useState(mengantarConfig?.apiKey || '');
  const [environment, setEnvironment] = useState<'production' | 'sandbox'>(mengantarConfig?.environment || 'production');
  const [autoCreateOnPaid, setAutoCreateOnPaid] = useState(mengantarConfig?.autoCreateOnPaid ?? true);
  const [defaultCourier, setDefaultCourier] = useState(mengantarConfig?.defaultCourier || 'JNE');
  const [pickupTimeSlot, setPickupTimeSlot] = useState(mengantarConfig?.pickupTimeSlot || '14:00 - 17:00 WIB');
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testMengantarConnectionApi(apiKey);
      setTestResult({
        success: result.success,
        message: result.message || 'Koneksi ke Mengantar.com sukses!'
      });
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Gagal menghubungi Mengantar.com'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    updateMengantarConfig({
      apiKey,
      environment,
      autoCreateOnPaid,
      defaultCourier,
      pickupTimeSlot
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-[#E8DFC0]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#1C3B2B] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center text-[#F3E8CE] border border-[#C5A880]/40">
              <Truck className="w-5 h-5 text-[#C5A880]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-wide">Integrasi Mengantar.com</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#C5A880] text-[#1C3B2B] rounded-full uppercase">
                  Connected
                </span>
              </div>
              <p className="text-xs text-[#C5A880]/90">
                Otomasi Buat Pesanan, Request Pickup Kurir & Terbitkan Resi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Status Banner */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-800 space-y-1">
              <p className="font-semibold text-emerald-900">
                Sistem Mengantar.com Siap Memproses Pesanan
              </p>
              <p>
                Setiap pesanan di <strong>saena.id</strong> dapat langsung diterbitkan nomor resi kurir (JNE, J&T, SiCepat, Anteraja, dll.), cetak label pengiriman thermal, dan jadwalkan penjemputan paket kurir otomatis.
              </p>
            </div>
          </div>

          {/* API Key Setting */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F2421] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Public API Key Mengantar.com</span>
              </label>
              <a
                href="https://mengantar.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#1C3B2B] hover:text-[#C5A880] font-medium flex items-center gap-1 transition-colors"
              >
                <span>Buka Dashboard Mengantar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Masukkan API Key Mengantar (opsional, auto-active sandbox)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1C3B2B] focus:border-[#1C3B2B] outline-none"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-[#1F2421] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1C3B2B]" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Tes Koneksi</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
            <p className="text-[11px] text-neutral-500">
              Dapatkan API Key di <em>Pengaturan Akun &gt; API Key</em> pada dashboard akun Mengantar.com Anda. Jika kosong, sistem otomatis menggunakan engine simulasi sandbox resmi.
            </p>
          </div>

          {/* Origin Warehouse Setting Info */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1C3B2B]">
              <Building2 className="w-4 h-4 text-[#C5A880]" />
              <span>Lokasi Gudang Penjemputan Paket (Origin Pickup)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-700">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold block text-neutral-900">Alamat Gudang Butik:</span>
                  <span>Jl. Tamansari No. 88, Kel. Mugarsari, Kec. Tamansari, Kota Tasikmalaya 46196</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold block text-neutral-900">Kontak WhatsApp Gudang:</span>
                  <span>+6285724023064</span>
                </div>
              </div>
            </div>
          </div>

          {/* Automation & Courier Preferences */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#1F2421] uppercase tracking-wider">
              Preferensi Otomasi Pengiriman
            </h4>

            {/* Auto Create toggle */}
            <label className="flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 cursor-pointer transition-colors">
              <div>
                <span className="text-xs font-bold text-neutral-900 block">
                  Otomatis Buat Pesanan di Mengantar saat Lunas
                </span>
                <span className="text-[11px] text-neutral-500 block mt-0.5">
                  Begitu pesanan berstatus "Dibayar" atau "COD Dikonfirmasi", resi otomatis diterbitkan ke Mengantar.com.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoCreateOnPaid}
                onChange={(e) => setAutoCreateOnPaid(e.target.checked)}
                className="w-4 h-4 text-[#1C3B2B] rounded border-neutral-300 focus:ring-[#1C3B2B]"
              />
            </label>

            {/* Default Courier & Pickup Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Kurir Default Prioritas
                </label>
                <select
                  value={defaultCourier}
                  onChange={(e) => setDefaultCourier(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1C3B2B] outline-none"
                >
                  <option value="JNE">JNE (Reguler & YES)</option>
                  <option value="J&T Express">J&T Express (EZ)</option>
                  <option value="SiCepat">SiCepat Ekspres (SiUntung)</option>
                  <option value="Anteraja">Anteraja</option>
                  <option value="Ninja Xpress">Ninja Xpress</option>
                  <option value="Lion Parcel">Lion Parcel</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Jadwal Pickup Harian
                </label>
                <select
                  value={pickupTimeSlot}
                  onChange={(e) => setPickupTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1C3B2B] outline-none"
                >
                  <option value="10:00 - 13:00 WIB">Pagi (10:00 - 13:00 WIB)</option>
                  <option value="14:00 - 17:00 WIB">Siang/Sore (14:00 - 17:00 WIB)</option>
                  <option value="18:00 - 20:00 WIB">Malam (18:00 - 20:00 WIB)</option>
                </select>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-[#E8DFC0] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-100 text-[#1F2421] text-xs font-semibold rounded-xl transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#1C3B2B] hover:bg-[#28523C] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-[#C5A880]" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#C5A880]" />
                <span>Simpan Pengaturan Mengantar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
