import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { DEFAULT_WHATSAPP_CLEAN, DEFAULT_WHATSAPP_DISPLAY, DEFAULT_WHATSAPP_NUMBER } from '../data/mockData';
import { normalizeIndonesianPhone, createCustomerWhatsAppMessage } from '../utils/textHelper';
import { 
  X, 
  Send, 
  Check, 
  Copy, 
  Phone,
  ShieldCheck, 
  Sparkles,
  Smartphone,
  ExternalLink
} from 'lucide-react';

export const WhatsAppModal: React.FC = () => {
  const {
    isWhatsAppModalOpen,
    setIsWhatsAppModalOpen,
    activeWhatsAppOrder
  } = useStore();

  const [copied, setCopied] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isWhatsAppModalOpen || !activeWhatsAppOrder) return null;

  const order = activeWhatsAppOrder;
  const waMessage = createCustomerWhatsAppMessage(order);
  const rawPhone = order.customer.whatsapp || '';
  const cleanPhone = normalizeIndonesianPhone(rawPhone) || DEFAULT_WHATSAPP_CLEAN;
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(rawPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E5DDD2] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with WhatsApp Branding */}
        <div className="p-4 sm:p-5 bg-[#075E54] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-1.5">
                <span>Hubungi Pengunjung via WhatsApp</span>
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              </h3>
              <p className="text-[11px] text-white/80">
                Penerima: <strong>{order.customer.fullName}</strong> ({rawPhone})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWhatsAppModalOpen(false)}
            className="p-1 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Customer info bar */}
          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EBE3D7] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#7A7266] block text-[10px]">NOMOR WA PENGUNJUNG:</span>
              <span className="font-bold text-[#1C3B2B] text-sm">{rawPhone}</span>
              <span className="text-[10px] text-emerald-700 font-semibold block">Format: +{cleanPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPhone}
                className="px-2.5 py-1 bg-white border border-[#D5C9B8] hover:bg-[#F2ECE4] text-[#1C3B2B] text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPhone ? 'Tersalin' : 'Salin No. HP'}</span>
              </button>
              <a
                href={`tel:+${cleanPhone}`}
                className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                title="Panggilan telepon biasa"
              >
                <Phone className="w-3 h-3" />
                <span>Telepon</span>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5A5348] font-medium">
              Format Pesan WhatsApp Konfirmasi Resmi:
            </span>
            <button
              onClick={handleCopy}
              className="text-[#1C3B2B] hover:underline font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#2E7D32]" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Pesan</span>
                </>
              )}
            </button>
          </div>

          {/* WhatsApp Chat Bubble Mockup */}
          <div className="p-4 bg-[#E5DDD5] rounded-xl border border-[#D1C7BB] max-h-64 overflow-y-auto">
            <div className="bg-[#DCF8C6] p-3.5 rounded-lg rounded-tl-none shadow-xs text-xs text-[#1F2421] whitespace-pre-wrap font-mono leading-relaxed">
              {waMessage}
            </div>
            <span className="text-[10px] text-[#787063] block text-right mt-1 font-sans">
              Otomatis tersusun • Bebas Ongkir • Resi: {order.trackingNumber || 'Dalam Proses'}
            </span>
          </div>

          {/* Value note */}
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Klik tombol di bawah untuk langsung membuka WhatsApp Web / Aplikasi WhatsApp resmi ke pengunjung tanpa pop-up terblokir.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Buka Chat WhatsApp Pengunjung</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="py-3 px-4 bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#1C3B2B] border border-[#D5C9B8] text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-[#1C3B2B]" />
              <span>{copied ? 'Pesan Tersalin!' : 'Salin Pesan'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWhatsAppModalOpen(false)}
              className="py-3 px-4 bg-[#F2ECE4] hover:bg-[#EAE2D5] text-[#3D3830] text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

