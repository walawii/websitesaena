import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { DEFAULT_WHATSAPP_CLEAN, DEFAULT_WHATSAPP_DISPLAY, DEFAULT_WHATSAPP_NUMBER } from '../data/mockData';
import { 
  X, 
  Send, 
  Check, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Smartphone,
  MessageCircle
} from 'lucide-react';

export const WhatsAppModal: React.FC = () => {
  const {
    isWhatsAppModalOpen,
    setIsWhatsAppModalOpen,
    activeWhatsAppOrder,
    formatPrice
  } = useStore();

  const [copied, setCopied] = useState(false);
  const [isSimulatedSent, setIsSimulatedSent] = useState(false);

  if (!isWhatsAppModalOpen || !activeWhatsAppOrder) return null;

  const order = activeWhatsAppOrder;

  // Format WhatsApp message
  const itemsText = order.items
    .map((item, idx) => `${idx + 1}. *${item.product.name}*\n   - Varian: ${item.selectedColor.name}, ${item.selectedSize}\n   - Qty: ${item.quantity} pcs (${formatPrice(item.price * item.quantity)})`)
    .join('\n');

  const waMessage = 
`*SAENA.ID - NOTIFIKASI PESANAN RESMI* 🌙
Assalamualaikum wr. wb. Kak *${order.customer.fullName}*,

Terima kasih telah berbelanja busana muslim di *saena.id*. Pesanan Anda telah kami terima dan tercatat di sistem kami:

🧾 *No. Invoice*: ${order.id}
📅 *Tanggal*: ${order.createdAt}
🚚 *Ekspedisi*: ${order.shipping.courier} (${order.shipping.service})
📦 *No. Resi*: *${order.trackingNumber}*
🏢 *Dikirim Dari*: Kec. Tamansari, Kota Tasikmalaya, Jawa Barat (46196)
💳 *Metode Pembayaran*: ${order.payment.channelName}
💎 *Status Transaksi*: ${order.status === 'dibayar' ? '✅ LUNAS (Terverifikasi)' : '⏳ MENUNGGU PEMBAYARAN'}

📋 *Rincian Produk:*
${itemsText}

💰 *Subtotal*: ${formatPrice(order.subtotal)}
🏷️ *Diskon*: -${formatPrice(order.discount)}
🚚 *Ongkos Kirim*: ${formatPrice(order.shippingCost)}
✨ *TOTAL AKHIR*: *${formatPrice(order.total)}*

📍 *Alamat Pengiriman:*
${order.customer.address}, ${order.customer.city}, ${order.customer.province} (${order.customer.postalCode})

🔍 *Lacak Pengiriman Real-Time:*
Klik link berikut untuk memantau perjalanan kurir Anda:
https://saena.id/lacak?order=${order.id}

Apabila membutuhkan bantuan atau konsultasi ukuran, silakan hubungi Customer Service di ${DEFAULT_WHATSAPP_DISPLAY}.
_Wassalamu'alaikum wr. wb._
*Customer Care saena.id* (${DEFAULT_WHATSAPP_NUMBER})`;

  const cleanPhone = order.customer.whatsapp.replace(/^0/, '62').replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone || DEFAULT_WHATSAPP_CLEAN}?text=${encodeURIComponent(waMessage)}`;
  const adminWaUrl = `https://wa.me/${DEFAULT_WHATSAPP_CLEAN}?text=${encodeURIComponent(`Halo Admin saena.id, saya ingin konfirmasi pesanan No. Invoice #${order.id} atas nama ${order.customer.fullName}.`)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendSimulated = () => {
    setIsSimulatedSent(true);
    setTimeout(() => {
      // open wa window safely
      window.open(waUrl, '_blank');
    }, 500);
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
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-1.5">
                <span>Notifikasi WhatsApp Otomatis</span>
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              </h3>
              <p className="text-[11px] text-white/80">
                Pesan resmi siap dikirim ke {order.customer.whatsapp}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWhatsAppModalOpen(false)}
            className="p-1 rounded-full text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4">
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5A5348] font-medium">
              Pratinjau Format Pesan Otomatis (Template Resmi):
            </span>
            <button
              onClick={handleCopy}
              className="text-[#1C3B2B] hover:underline font-semibold flex items-center gap-1 text-[11px]"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#2E7D32]" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>

          {/* WhatsApp Chat Bubble Mockup */}
          <div className="p-4 bg-[#E5DDD5] rounded-xl border border-[#D1C7BB] max-h-72 overflow-y-auto">
            <div className="bg-[#DCF8C6] p-3.5 rounded-lg rounded-tl-none shadow-xs text-xs text-[#1F2421] whitespace-pre-wrap font-mono leading-relaxed">
              {waMessage}
            </div>
            <span className="text-[10px] text-[#787063] block text-right mt-1 font-sans">
              Hari ini • Otomatis dari saena.id Bot API
            </span>
          </div>

          {/* Value note */}
          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EBE3D7] flex items-center gap-2.5 text-xs text-[#524B40]">
            <ShieldCheck className="w-4 h-4 text-[#25D366] shrink-0" />
            <span>
              Nomor resi <strong>{order.trackingNumber}</strong> dan link pelacakan kurir telah disematkan secara otomatis.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={handleSendSimulated}
              className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSimulatedSent ? 'Membuka WhatsApp...' : 'Buka Obrolan WhatsApp Resmi'}</span>
            </button>

            <a
              href={adminWaUrl}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#1C3B2B] border border-[#D5C9B8] text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
              title={`Chat WhatsApp Admin Butik: ${DEFAULT_WHATSAPP_DISPLAY}`}
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Chat Admin ({DEFAULT_WHATSAPP_DISPLAY})</span>
            </a>

            <button
              onClick={() => setIsWhatsAppModalOpen(false)}
              className="py-3 px-4 bg-[#F2ECE4] hover:bg-[#EAE2D5] text-[#3D3830] text-xs font-semibold rounded-xl transition-all"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
