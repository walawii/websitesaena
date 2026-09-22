import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Truck, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight, 
  ShoppingBag, 
  HelpCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface OrderDetail {
  orderNumber: string;
  invoiceNumber: string;
  customer: {
    customerName: string;
    phone: string;
    email?: string;
  };
  shippingAddress: {
    address: string;
    province: string;
    city: string;
    district?: string;
    postalCode?: string;
  };
  items: Array<{
    id: string;
    name: string;
    variant?: string;
    color?: string;
    size?: string;
    price: number;
    quantity: number;
    weight?: number;
    image?: string;
  }>;
  quantity: number;
  weight: number;
  price: {
    subtotal: number;
    discount: number;
    shippingCost: number;
    grandTotal: number;
  };
  payment: {
    paymentMethod: 'DOKU' | 'COD';
    paymentProvider: string;
    paymentChannel: string;
    paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
    paymentAmount: number;
    paymentCreatedAt: string;
    paymentPaidAt?: string | null;
    paymentUrl?: string | null;
    vaNumber?: string | null;
    bank?: string | null;
    qrisString?: string | null;
    qrisImage?: string | null;
  };
  shipping: {
    shippingProvider: string;
    courier: string;
    service: string;
    shippingStatus: string;
    trackingNumber?: string | null;
    airwaybill?: string | null;
    labelUrl?: string | null;
    estimatedDelivery?: string;
  };
  createdAt: string;
}

interface ThankYouPageProps {
  onNavigateHome?: () => void;
  onNavigateOrder?: () => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({ onNavigateHome, onNavigateOrder }) => {
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract order identifier & token from URL (?order=SNA-...&token=...)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const oNum = sp.get('order') || sp.get('orderId') || sp.get('orderNumber') || '';
      setOrderNumber(oNum);
    } catch {
      // fallback
    }
  }, []);

  const getOrderAccessToken = (ordNo: string): string => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const urlToken = sp.get('token');
      if (urlToken) return urlToken;
      const stored = sessionStorage.getItem(`order_token_${ordNo}`);
      if (stored) return stored;
    } catch {}
    return '';
  };

  // Fetch full verified order data from backend API
  const fetchOrderData = async (ordNo: string, showSpinner = true) => {
    if (!ordNo) {
      setLoading(false);
      setError('Nomor pesanan tidak ditemukan di URL.');
      return;
    }

    if (showSpinner) setLoading(true);
    setError(null);

    try {
      const token = getOrderAccessToken(ordNo);
      const queryParams = new URLSearchParams();
      if (token) queryParams.set('token', token);

      const url = `/api/orders/${encodeURIComponent(ordNo)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setOrder(json.data);
      } else {
        setError(json.error || 'Pesanan tidak ditemukan di sistem.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat status pesanan.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (orderNumber) {
      fetchOrderData(orderNumber, true);
    }
  }, [orderNumber]);

  // Polling order payment status if DOKU & PENDING
  useEffect(() => {
    if (!orderNumber || !order) return;
    if (order.payment.paymentMethod !== 'DOKU' || order.payment.paymentStatus === 'PAID') return;

    const interval = setInterval(async () => {
      try {
        const token = getOrderAccessToken(orderNumber);
        const queryParams = new URLSearchParams();
        if (token) queryParams.set('token', token);

        const url = `/api/orders/${encodeURIComponent(orderNumber)}/status${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const st = await res.json();
          if (st.success && st.paymentStatus === 'PAID') {
            // Update full order view
            fetchOrderData(orderNumber, false);
          }
        }
      } catch {
        // silent polling failure
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [orderNumber, order?.payment?.paymentStatus]);


  const handleCopy = (text: string, type: 'va' | 'order') => {
    navigator.clipboard.writeText(text);
    if (type === 'va') {
      setCopiedVa(true);
      setTimeout(() => setCopiedVa(false), 2000);
    } else {
      setCopiedOrderNo(true);
      setTimeout(() => setCopiedOrderNo(false), 2000);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#1C3B2B]/20 border-t-[#1C3B2B] animate-spin mb-4" />
        <p className="font-serif text-base text-[#1C3B2B] font-medium animate-pulse">
          Memuat rincian pesanan resmi saena.id...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DFC8] shadow-lg max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
            Data Pesanan Tidak Ditemukan
          </h2>
          <p className="text-xs sm:text-sm text-[#615446] leading-relaxed">
            {error || 'Silakan periksa kembali link pesanan Anda atau hubungi layanan pelanggan kami.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => onNavigateOrder ? onNavigateOrder() : (window.location.href = '/order')}
              className="w-full py-3 px-4 bg-[#88222A] hover:bg-[#701C22] text-white font-medium text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
            >
              Buka Halaman Pemesanan
            </button>
            <button
              onClick={() => onNavigateHome ? onNavigateHome() : (window.location.href = '/')}
              className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-[#1C3B2B] font-medium text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = order.payment.paymentStatus === 'PAID';
  const isCod = order.payment.paymentMethod === 'COD';
  const isPending = !isPaid && !isCod;

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 sm:py-12 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#E8DFC8] shadow-sm text-center relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className={`h-2 w-full absolute top-0 left-0 ${isPaid ? 'bg-emerald-600' : isCod ? 'bg-blue-600' : 'bg-amber-500'}`} />

          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center shadow-inner">
            {isPaid ? (
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle className="w-9 h-9" />
              </div>
            ) : isCod ? (
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                <Truck className="w-9 h-9" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-9 h-9 animate-pulse" />
              </div>
            )}
          </div>

          <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 bg-[#1C3B2B]/10 text-[#1C3B2B]">
            TERIMA KASIH ATAS PESANAN ANDA
          </span>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C3B2B]">
            {isPaid 
              ? 'Pembayaran Berhasil Diverifikasi!' 
              : isCod 
              ? 'Pesanan COD Berhasil Dibuat!' 
              : 'Pesanan Diterima — Menunggu Pembayaran'}
          </h1>

          <p className="text-xs sm:text-sm text-[#615446] mt-2 max-w-lg mx-auto leading-relaxed">
            {isPaid
              ? 'Terima kasih, pembayaran Anda telah kami terima lunas. Tim warehouse Central Butik Tasikmalaya sedang menyiapkan paket Anda.'
              : isCod
              ? 'Pesanan Anda telah dijadwalkan untuk penjemputan ekspedisi. Siapkan uang pas saat kurir tiba di alamat Anda.'
              : 'Selesaikan pembayaran sebelum batas waktu berakhir agar pesanan segera diproses ke tahap pengemasan.'}
          </p>

          {/* Order ID Bar */}
          <div className="mt-6 pt-5 border-t border-[#E8DFC8]/60 flex flex-wrap items-center justify-center gap-3">
            <div className="bg-[#FAF8F5] border border-[#E8DFC8] px-3.5 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-xs text-[#8A7968]">No. Pesanan:</span>
              <strong className="text-xs sm:text-sm text-[#1C3B2B] font-mono tracking-wide">{order.orderNumber}</strong>
              <button
                type="button"
                onClick={() => handleCopy(order.orderNumber, 'order')}
                className="text-[#8A7968] hover:text-[#1C3B2B] transition-colors p-0.5"
                title="Salin Nomor Pesanan"
              >
                {copiedOrderNo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setIsRefreshing(true); fetchOrderData(orderNumber, false); }}
              className="text-xs text-[#8A7968] hover:text-[#1C3B2B] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DFC8] hover:bg-[#FAF8F5] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Cek Status</span>
            </button>
          </div>
        </div>

        {/* Action Panel for Pending DOKU Online Payment */}
        {isPending && (
          <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-200/60 text-amber-800">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C3B2B]">
                  Instruksi Pembayaran DOKU Gateway
                </h3>
                <p className="text-xs text-[#615446] mt-0.5">
                  Total Tagihan: <strong className="text-sm font-bold text-[#88222A]">{formatRupiah(order.price.grandTotal)}</strong>
                </p>
              </div>
            </div>

            {/* If DOKU generated a direct VA */}
            {order.payment.vaNumber && (
              <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-2">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                  Virtual Account {order.payment.bank || ''}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-lg sm:text-xl font-bold text-[#1C3B2B] tracking-wider">
                    {order.payment.vaNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.payment.vaNumber || '', 'va')}
                    className="flex items-center gap-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    {copiedVa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedVa ? 'Tersalin' : 'Salin VA'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* If DOKU Hosted Checkout URL is available */}
            {order.payment.paymentUrl && (
              <div>
                <a
                  href={order.payment.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-[#88222A] hover:bg-[#701C22] text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>Buka Halaman Pembayaran DOKU Resmi</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-[11px] text-center text-[#8A7968] mt-2">
                  Halaman resmi terenkripsi SSL 256-bit DOKU Payment Gateway (Jokul).
                </p>
              </div>
            )}

            {/* Auto-sync hint */}
            <div className="flex items-center gap-2 text-[11px] text-[#615446] pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sistem otomatis mendeteksi ketika Anda menyelesaikan pembayaran di DOKU.</span>
            </div>
          </div>
        )}

        {/* Shipping Status Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#E8DFC8] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8DFC8]/60 pb-3">
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C3B2B] flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#88222A]" />
              <span>Status Pengiriman Ekspedisi</span>
            </h3>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
              order.shipping.shippingStatus === 'CREATED' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-[#FAF8F5] text-[#8A7968] border border-[#E8DFC8]'
            }`}>
              {order.shipping.shippingStatus === 'CREATED' ? 'Resi Diterbitkan' : 'Menunggu Pengemasan'}
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-[#E8DFC8]/40">
              <span className="text-[#8A7968]">Kurir Ekspedisi:</span>
              <strong className="text-[#1C3B2B]">{order.shipping.courier} ({order.shipping.service})</strong>
            </div>

            {order.shipping.trackingNumber ? (
              <div className="flex items-center justify-between py-1.5 bg-emerald-50/60 px-3 rounded-xl border border-emerald-200">
                <span className="text-emerald-900 font-medium">Nomor Resi:</span>
                <span className="font-mono font-bold text-emerald-900 text-sm tracking-wide">
                  {order.shipping.trackingNumber}
                </span>
              </div>
            ) : (
              <div className="text-xs text-[#8A7968] py-1 bg-[#FAF8F5] px-3 py-2 rounded-xl">
                Nomor resi resmi Mengantar.com akan otomatis diperbarui begitu paket dijemput kurir dari Central Warehouse Tamansari Tasikmalaya.
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-[#E8DFC8]/40">
              <span className="text-[#8A7968]">Estimasi Tiba:</span>
              <strong className="text-[#1C3B2B]">{order.shipping.estimatedDelivery || '2 - 3 Hari Kerja'}</strong>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-[#8A7968]">Alamat Penerima:</span>
              <span className="text-right text-[#1C3B2B] max-w-[60%] leading-snug">
                {order.customer.customerName} ({order.customer.phone})<br />
                {order.shippingAddress.address}, {order.shippingAddress.district ? `${order.shippingAddress.district}, ` : ''}{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items Breakdown */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#E8DFC8] shadow-sm space-y-4">
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C3B2B] flex items-center gap-2 border-b border-[#E8DFC8]/60 pb-3">
            <ShoppingBag className="w-5 h-5 text-[#88222A]" />
            <span>Rincian Produk Dipesan</span>
          </h3>

          <div className="divide-y divide-[#E8DFC8]/50">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex-1">
                  <p className="font-bold text-[#1C3B2B]">{item.name}</p>
                  <p className="text-[11px] text-[#8A7968]">
                    {item.variant ? `Warna: ${item.variant}` : ''} {item.size ? `• Ukuran: ${item.size}` : ''} • Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right font-bold text-[#1C3B2B]">
                  {formatRupiah(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E8DFC8] space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between text-[#8A7968]">
              <span>Subtotal Produk:</span>
              <span>{formatRupiah(order.price.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#8A7968]">
              <span>Ongkos Kirim ({order.shipping.courier}):</span>
              <span>{order.price.shippingCost === 0 ? 'GRATIS' : formatRupiah(order.price.shippingCost)}</span>
            </div>
            {order.price.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Potongan Promo:</span>
                <span>-{formatRupiah(order.price.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm sm:text-base font-bold text-[#1C3B2B] pt-2 border-t border-[#E8DFC8]/60">
              <span>Total Akhir:</span>
              <span className="text-[#88222A]">{formatRupiah(order.price.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigateHome ? onNavigateHome() : (window.location.href = '/')}
            className="w-full sm:w-auto py-3 px-6 bg-white hover:bg-[#FAF8F5] text-[#1C3B2B] font-medium text-xs sm:text-sm rounded-xl border border-[#E8DFC8] shadow-sm transition-all cursor-pointer"
          >
            ← Kembali ke Katalog Butik
          </button>

          <a
            href={`https://wa.me/6285724023064?text=${encodeURIComponent(`Halo Butik Saena, saya ingin konfirmasi pesanan saya dengan nomor: ${order.orderNumber}. Terima kasih.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto py-3 px-6 bg-[#1C3B2B] hover:bg-[#142b1f] text-white font-medium text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Bantuan WhatsApp Butik</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};
