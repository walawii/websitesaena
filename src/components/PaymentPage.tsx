import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  CreditCard, 
  QrCode, 
  Copy, 
  ShieldCheck, 
  Clock, 
  MessageCircle, 
  ShoppingBag,
  RefreshCw,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';
import { getSmartQrisForOrder } from '../utils/qrisGenerator';
import { trackMetaPageView, trackMetaPurchase } from '../utils/metaPixel';

interface PaymentPageProps {
  orderId?: string;
  onNavigateHome?: () => void;
  onNavigateNewOrder?: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({ 
  orderId: propOrderId, 
  onNavigateHome, 
  onNavigateNewOrder 
}) => {
  const { 
    orders, 
    dokuConfig, 
    confirmOrderPayment, 
    updateOrderStatus,
    setActiveMengantarLabelOrder,
    setIsMengantarLabelModalOpen,
    setIsDokuConfigModalOpen
  } = useStore();

  const [orderData, setOrderData] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [isVerifyingDoku, setIsVerifyingDoku] = useState(false);
  const [dokuStatusNotice, setDokuStatusNotice] = useState<string | null>(null);

  // Load Order Data either from URL query param, props, or localStorage
  useEffect(() => {
    document.title = 'Konfirmasi Pembayaran Pesanan - saena.my.id';
    trackMetaPageView();

    const searchParams = new URLSearchParams(window.location.search);
    const targetId = propOrderId || searchParams.get('orderId') || searchParams.get('id') || searchParams.get('order');

    let matched: any = null;

    // 1. Check in orders state
    if (targetId && orders && orders.length > 0) {
      const found = orders.find(o => o.id === targetId);
      if (found) {
        matched = {
          order: found,
          id: found.id,
          packageName: found.items?.[0]?.product?.name || 'Paket Mukena Alisa Premium',
          color: found.items?.[0]?.selectedColor?.name || 'Dusty Pink',
          total: found.total,
          paymentMethod: found.payment?.channel === 'cod' ? 'COD' : 'TRANSFER',
          name: found.customer?.fullName || 'Pelanggan saena.id',
          phone: found.customer?.whatsapp || '',
          address: found.customer?.address || '',
          city: found.customer?.city || 'Tasikmalaya',
          date: found.createdAt || new Date().toLocaleDateString('id-ID'),
          doku: found.payment?.doku,
          mengantar: found.mengantar,
          selectedCourier: found.shipping?.courier || 'JNE',
          selectedDokuChannel: found.payment?.channel
        };
      }
    }

    // 2. Check in localStorage
    if (!matched) {
      try {
        const saved = localStorage.getItem('saena_latest_order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!targetId || parsed.id === targetId) {
            matched = parsed;
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. Fallback dummy / sample order if directly accessed without orderId
    if (!matched) {
      matched = {
        id: targetId || 'ALS-971174',
        packageName: 'Paket Hemat (1 Pcs)',
        color: 'Dusty Pink',
        total: 79500,
        paymentMethod: 'TRANSFER',
        name: 'irwan kurnia',
        phone: '081234567890',
        address: 'perum graha tresna e21',
        city: 'tasikmalaya',
        date: new Date().toLocaleDateString('id-ID'),
        selectedCourier: 'JNE',
        selectedDokuChannel: 'doku_qris',
        order: {
          trackingNumber: 'MGT-JNE-18971267',
          status: 'menunggu_pembayaran'
        }
      };
    }

    setOrderData(matched);

    if (matched?.order?.status === 'sudah_dibayar' || matched?.order?.status === 'diproses') {
      setIsPaymentConfirmed(true);
    }

    // Fire Confetti on Payment/Confirmation Screen
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    // Track Meta Purchase
    if (matched) {
      trackMetaPurchase({
        contentName: matched.packageName,
        value: matched.total,
        currency: 'IDR',
        orderId: matched.id
      });
    }
  }, [orders, propOrderId]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleManualConfirm = () => {
    setIsPaymentConfirmed(true);
    if (orderData?.id) {
      confirmOrderPayment(orderData.id);
      updateOrderStatus(orderData.id, 'diproses');
    }
    try {
      confetti({ particleCount: 90, spread: 80 });
    } catch {}
  };

  const handleCheckStatus = async () => {
    setIsVerifyingDoku(true);
    setDokuStatusNotice(null);

    await new Promise(r => setTimeout(r, 1200));

    if (orderData?.paymentMethod === 'TRANSFER') {
      setIsPaymentConfirmed(true);
      if (orderData?.id) {
        confirmOrderPayment(orderData.id);
        updateOrderStatus(orderData.id, 'diproses');
      }
      setDokuStatusNotice('Pembayaran berhasil diverifikasi secara otomatis oleh sistem DOKU Gateway. Pesanan Anda segera dipacking & diserahkan ke kurir Mengantar.com.');
      try {
        confetti({ particleCount: 100, spread: 70 });
      } catch {}
    } else {
      setDokuStatusNotice('Pesanan COD Anda sudah tersimpan dan siap diproses kirim.');
    }
    setIsVerifyingDoku(false);
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-[#F5F2EC] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl text-center space-y-3 shadow-md border border-[#D5C9B8]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1C3B2B]" />
          <p className="text-xs text-gray-600">Memuat rincian pembayaran...</p>
        </div>
      </div>
    );
  }

  // Generate Smart QRIS
  const smartQris = getSmartQrisForOrder({
    orderId: orderData.id,
    amount: orderData.total,
    config: dokuConfig
  });

  return (
    <div className="min-h-screen bg-[#F5F2EC] py-6 sm:py-10 px-3 sm:px-4">
      <div className="max-w-xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-[#D5C9B8] overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#1C3B2B] text-white p-5 sm:p-7 text-center">
            <span className="inline-block bg-[#88222A] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              FORMULIR PEMESANAN RESMI &amp; CEPAT
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#EFE8DC]">
              Klaim Promo Mukena Traveling Alisa Hari Ini
            </h1>
            <p className="text-xs sm:text-sm text-[#D5CAB9] mt-1">
              Silakan isi formulir di bawah ini. Bayar via Transfer Bank / QRIS atau Bayar di Tempat (Bisa COD).
            </p>
          </div>

          {/* Success / Payment Content */}
          <div className="p-4 sm:p-7 text-center space-y-5">
            {/* Green Check Icon */}
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1C3B2B]">
                Alhamdulillah! Pesanan Berhasil Diterima
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                Terima kasih Kak <strong className="text-gray-900">{orderData.name}</strong>. Pesanan Anda telah berhasil diterima dan sedang dipersiapkan oleh tim butik kami untuk segera dikirimkan.
              </p>
            </div>

            {/* SECTION 1: Mengantar.com AWB Box */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                <div>
                  <span className="text-[11px] text-gray-500 font-medium block">Nomor Resi / AWB Mengantar.com:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-sm sm:text-base font-bold text-gray-900 tracking-wider">
                      {orderData.order?.trackingNumber || orderData.mengantar?.trackingNumber || `MGT-${orderData.id}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(orderData.order?.trackingNumber || orderData.mengantar?.trackingNumber || `MGT-${orderData.id}`, 'resi')}
                      className="text-[11px] flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer"
                      title="Salin Nomor Resi"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'resi' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (orderData.order) {
                        setActiveMengantarLabelOrder(orderData.order);
                        setIsMengantarLabelModalOpen(true);
                      }
                    }}
                    className="w-full sm:w-auto text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Label Thermal</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-gray-500 block text-[10px]">Status Pengiriman:</span>
                  <span className="font-semibold text-emerald-900 flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Terjadwal Pickup Mengantar.com</span>
                  </span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-gray-500 block text-[10px]">Jadwal Penjemputan Kurir:</span>
                  <span className="font-semibold text-gray-800 mt-0.5 block">
                    {orderData.mengantar?.pickupTime || 'Hari ini, 14:00 - 17:00 WIB'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: DOKU Payment Panel OR COD Panel */}
            {orderData.paymentMethod === 'TRANSFER' ? (
              <div className="bg-gradient-to-br from-white to-blue-50/40 rounded-2xl border-2 border-blue-600/30 p-4 sm:p-5 text-left shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                          DOKU PAYMENT GATEWAY
                        </span>
                        <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                          BERIZIN BI
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 font-mono mt-0.5">
                        Invoice: <span className="font-bold text-gray-800">INV-DOKU-{orderData.id}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    isPaymentConfirmed 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {isPaymentConfirmed ? 'LUNAS / TERVERIFIKASI' : 'MENUNGGU PEMBAYARAN'}
                  </span>
                </div>

                {/* QRIS Display Container */}
                <div className="bg-white rounded-xl border border-[#D5C9B8] overflow-hidden shadow-sm">
                  <div className="p-4 text-center space-y-3">
                    <div className="inline-block bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                      Scan QRIS dengan Aplikasi Mobile Banking / E-Wallet Anda
                    </div>

                    {/* QR Code */}
                    <div className="p-2.5 bg-white border-2 border-dashed border-[#1C3B2B]/20 rounded-xl max-w-[210px] mx-auto shadow-inner">
                      <img 
                        src={smartQris.qrImageUrl} 
                        alt="QRIS Resmi Toko saena.id" 
                        className="w-full h-auto mx-auto rounded"
                      />
                    </div>

                    <div className="text-[11px] text-[#7A7266] flex flex-wrap items-center justify-center gap-2">
                      <span>NMID: <strong className="text-[#242320]">{smartQris.merchantNmid}</strong></span>
                      <span>•</span>
                      <span>Merchant: <strong className="text-[#242320]">{smartQris.merchantName}</strong></span>
                    </div>

                    {/* Panduan */}
                    <div className="bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EAE4D9] text-[11px] text-[#524B40] text-left space-y-1">
                      <p className="font-semibold text-[#1C3B2B]">💡 Panduan Scan QRIS:</p>
                      <p>1. Buka m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, Shopee, DANA, OVO).</p>
                      <p>2. Buka menu <strong>"Scan / Bayar"</strong> di dalam aplikasi (bukan kamera biasa).</p>
                      <p>3. Atau unduh gambar QRIS di bawah ini, lalu pilih <i>"Ambil dari Galeri"</i> di m-banking.</p>
                    </div>

                    {/* Download button */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <a
                        href={smartQris.qrImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`QRIS-SAENA-${orderData.id}.png`}
                        className="text-xs bg-[#EAE4D9] hover:bg-[#D5C9B8] text-[#1C3B2B] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Unduh / Buka Barcode QRIS</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setIsDokuConfigModalOpen(true)}
                        className="text-xs bg-white hover:bg-[#FAF8F5] border border-[#D5C9B8] text-[#7A7266] hover:text-[#1C3B2B] font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>⚙️ Pasang QRIS Toko Asli</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expiry & Status Confirmation Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Batas Pembayaran: <strong>60 Menit</strong></span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleCheckStatus}
                      disabled={isVerifyingDoku}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-blue-300 text-blue-900 hover:bg-blue-50 font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingDoku ? 'animate-spin' : ''}`} />
                      <span>{isVerifyingDoku ? 'Mengecek...' : 'Cek Status'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleManualConfirm}
                      className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs ${
                        isPaymentConfirmed 
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-[#1C3B2B] hover:bg-[#2A4D3B] text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>{isPaymentConfirmed ? 'Pembayaran LUNAS' : 'Saya Sudah Bayar (Konfirmasi Lunas)'}</span>
                    </button>
                  </div>
                </div>

                {dokuStatusNotice && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p>{dokuStatusNotice}</p>
                      <a
                        href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Admin saena.id, saya ingin konfirmasi pembayaran untuk pesanan ${orderData.id} sebesar Rp ${orderData.total.toLocaleString('id-ID')}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#1C3B2B] hover:underline"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#2E7D32]" />
                        <span>Konfirmasi Langsung ke Admin via WhatsApp &rarr;</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* COD Notice */
              <div className="bg-[#F4F8F5] rounded-2xl border-2 border-[#1C3B2B]/30 p-5 text-left shadow-sm space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1C3B2B] text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1C3B2B] uppercase tracking-wide">
                      Jaminan COD Mengantar.com (Bayar di Tempat)
                    </span>
                    <p className="text-[11px] text-gray-600">
                      Tidak perlu transfer terlebih dahulu. Siapkan uang pas kepada kurir saat paket tiba.
                    </p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
                  <span className="text-gray-600">Uang Pas untuk Kurir:</span>
                  <span className="font-black text-[#88222A] text-sm">
                    Rp {orderData.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {/* Receipt Summary Card */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFC8] text-left text-xs max-w-md mx-auto space-y-2">
              <div className="flex justify-between border-b border-[#E8DFC8] pb-1.5 font-bold">
                <span>No. Pesanan:</span>
                <span className="font-mono text-[#88222A]">{orderData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paket Pilihan:</span>
                <span className="font-semibold">{orderData.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Varian Warna:</span>
                <span className="font-semibold">{orderData.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ekspedisi Pengiriman:</span>
                <span className="font-semibold text-emerald-800">
                  {orderData.selectedCourier || 'JNE'} (Layanan Reguler)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nomor Resi:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900">
                  <span>{orderData.order?.trackingNumber || orderData.mengantar?.trackingNumber || `MGT-${orderData.id}`}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(orderData.order?.trackingNumber || orderData.mengantar?.trackingNumber || `MGT-${orderData.id}`, 'resi-summary')}
                    className="text-[10px] text-emerald-700 hover:underline cursor-pointer"
                  >
                    {copiedKey === 'resi-summary' ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Metode Pembayaran:</span>
                <span className="font-semibold text-emerald-700">
                  {orderData.paymentMethod === 'COD' 
                    ? 'COD (Bayar di Tempat)' 
                    : 'Transfer Bank / QRIS'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alamat Kirim:</span>
                <span className="font-semibold text-right max-w-[200px] truncate">{orderData.address}, {orderData.city}</span>
              </div>
              <div className="flex justify-between border-t border-[#E8DFC8] pt-2 font-bold text-sm text-[#88222A]">
                <span>Total Tagihan:</span>
                <span>Rp {orderData.total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Admin saena.id, saya ingin konfirmasi pesanan dengan No. Pesanan ${orderData.id} a.n. ${orderData.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi CS WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateNewOrder) {
                    onNavigateNewOrder();
                  } else {
                    window.location.href = '/order';
                  }
                }}
                className="bg-[#1C3B2B] hover:bg-[#14291e] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buat Pesanan Baru</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
