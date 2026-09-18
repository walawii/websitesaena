import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Truck, 
  Lock, 
  ArrowRight, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard, 
  ShoppingBag,
  Home
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, PaymentChannel } from '../types';
import { createMengantarOrderApi } from '../utils/mengantarClient';
import { createDokuPaymentApi } from '../utils/dokuClient';
import { validateIndonesianAddress, AddressValidationResult } from '../utils/addressValidation';
import { getSmartQrisForOrder } from '../utils/qrisGenerator';
import { trackMetaInitiateCheckout, trackMetaPageView } from '../utils/metaPixel';

interface OrderPageProps {
  onNavigateToPayment?: (orderId: string) => void;
  onNavigateHome?: () => void;
}

export const OrderPage: React.FC<OrderPageProps> = ({ onNavigateToPayment, onNavigateHome }) => {
  const { 
    dokuConfig, 
    mengantarConfig, 
    products, 
    recordDirectOrder, 
    setOrders, 
    syncOrderToFirestore 
  } = useStore();

  const packages = [
    {
      id: 'pkg-1',
      title: 'Paket Hemat (1 Pcs)',
      badge: 'HARGA SATUAN',
      qty: 1,
      normalPrice: 159000,
      promoPrice: 79500,
      savings: 79500,
      description: '1x Mukena Traveling 2in1 + 1x Mini Pouch Cantik'
    },
    {
      id: 'pkg-2',
      title: 'Paket Best Seller (2 Pcs)',
      badge: '🔥 BELI 2 PCS GRATIS ONGKIR',
      isPopular: true,
      qty: 2,
      normalPrice: 318000,
      promoPrice: 159000,
      savings: 159000,
      description: '2x Mukena Traveling 2in1 (Bisa Beda Warna) + 2x Mini Pouch • GRATIS ONGKIR'
    },
    {
      id: 'pkg-3',
      title: 'Paket Seragam / Hadiah (3 Pcs)',
      badge: 'GRATIS ONGKIR + HEMAT',
      qty: 3,
      normalPrice: 477000,
      promoPrice: 238500,
      savings: 238500,
      description: '3x Mukena Traveling 2in1 (Bisa Mix Warna) + 3x Mini Pouch • GRATIS ONGKIR'
    }
  ];

  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-2');
  const currentPackage = packages.find(p => p.id === selectedPackageId) || packages[1];

  const [selectedColor, setSelectedColor] = useState<'Dusty Pink' | 'Sky Blue'>('Dusty Pink');
  const [secondaryColor, setSecondaryColor] = useState<'Dusty Pink' | 'Sky Blue'>('Sky Blue');

  // Customer Data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerSubdistrict, setCustomerSubdistrict] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [allowNoHouseNumber, setAllowNoHouseNumber] = useState(false);
  const [addressValidationAttempted, setAddressValidationAttempted] = useState(false);

  // Address validation
  const addressValidation: AddressValidationResult = React.useMemo(() => {
    return validateIndonesianAddress(customerAddress, customerSubdistrict, customerCity);
  }, [customerAddress, customerSubdistrict, customerCity]);

  // Shipping & Payment
  const [selectedCourier, setSelectedCourier] = useState<'JNE' | 'J&T Express' | 'SiCepat'>('JNE');
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'COD'>('TRANSFER');
  const [selectedDokuChannel, setSelectedDokuChannel] = useState<PaymentChannel>('doku_qris');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Formulir Pemesanan Resmi Mukena Alisa - saena.my.id';
    trackMetaPageView();
    trackMetaInitiateCheckout({
      contentName: 'Formulir Pemesanan Resmi Mukena Alisa',
      value: currentPackage.promoPrice,
      currency: 'IDR',
      numItems: currentPackage.qty
    });
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert('Mohon lengkapi Nama, No. WhatsApp, dan Alamat Pengiriman Anda.');
      return;
    }

    const isMissingHouseNumber = !addressValidation.hasHouseNumber && !allowNoHouseNumber;
    const isMissingSubdistrict = !addressValidation.hasSubdistrict;
    const isMissingStreet = !addressValidation.hasStreetDetail;

    if (isMissingHouseNumber || isMissingSubdistrict || isMissingStreet) {
      setAddressValidationAttempted(true);
      const addressSection = document.getElementById('order-address-section');
      addressSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = `ALS-${Date.now().toString().slice(-6)}`;
      const colorSelection = currentPackage.qty > 1 
        ? `${selectedColor} & ${secondaryColor}`
        : selectedColor;

      // 1. Electronic Payment processing via DOKU Payment Gateway
      let dokuResult: any = undefined;
      if (paymentMethod === 'TRANSFER') {
        const dokuRes = await createDokuPaymentApi({
          orderId,
          invoiceNumber: `INV-DOKU-${orderId}`,
          amount: currentPackage.promoPrice,
          customer: {
            fullName: customerName,
            whatsapp: customerPhone,
            address: `${customerAddress}, ${customerSubdistrict ? `Kec. ${customerSubdistrict}, ` : ''}${customerCity || 'Kota Tasikmalaya'}`
          },
          items: [{
            name: `Mukena Traveling 2in1 Alisa Premium (${currentPackage.title} - ${colorSelection})`,
            quantity: currentPackage.qty,
            price: Math.round(currentPackage.promoPrice / currentPackage.qty)
          }],
          channel: selectedDokuChannel
        }, dokuConfig);

        if (dokuRes.success && dokuRes.data) {
          dokuResult = dokuRes.data;
        }
      }

      // 2. Dispatch Order to Mengantar.com
      const targetProduct = products.find(p => p.id === 'alisa-01') || {
        id: 'alisa-01',
        name: 'Mukena Traveling 2in1 Laser Cut Alisa Premium',
        price: 79500,
        weight: 400 * currentPackage.qty,
        images: ['/assets/alisa/alisa-pink-model.webp']
      };

      const fullOrder: Order = {
        id: orderId,
        createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        customer: {
          fullName: customerName,
          whatsapp: customerPhone,
          email: `${customerPhone.replace(/[^0-9]/g, '')}@saena.my.id`,
          address: customerAddress,
          city: customerCity || 'Kota Tasikmalaya',
          subdistrict: customerSubdistrict || 'Tamansari',
          province: 'Jawa Barat',
          postalCode: '46196',
          country: 'Indonesia',
          notes: notes || undefined
        },
        items: [{
          id: `ci-${Date.now()}`,
          productId: 'alisa-01',
          product: targetProduct as any,
          selectedColor: { name: colorSelection, hex: '#C48B9F' },
          selectedSize: 'Standar Jumbo Dewasa',
          quantity: currentPackage.qty,
          price: Math.round(currentPackage.promoPrice / currentPackage.qty)
        }],
        shipping: {
          id: `ship-${selectedCourier.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: `Mengantar.com - ${selectedCourier}`,
          courier: selectedCourier,
          service: 'REG',
          cost: 0,
          estimatedDays: '1-3 Hari Kerja',
          logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&q=80'
        },
        payment: {
          channel: paymentMethod === 'COD' ? 'cod' : selectedDokuChannel,
          channelName: paymentMethod === 'COD' 
            ? 'COD (Bayar di Tempat - Mengantar.com)' 
            : (dokuResult?.virtualAccountInfo 
                ? `${dokuResult.virtualAccountInfo.bank} Virtual Account (DOKU)` 
                : 'QRIS Realtime Dynamic (DOKU Gateway)'),
          virtualAccount: dokuResult?.virtualAccountInfo?.vaNumber || (selectedDokuChannel.includes('va_') ? `88888${Math.floor(1000000000 + Math.random() * 9000000000)}` : undefined),
          qrCodeUrl: dokuResult?.qrisInfo?.qrImage || (paymentMethod === 'TRANSFER' && selectedDokuChannel === 'doku_qris' 
            ? getSmartQrisForOrder({ orderId, amount: currentPackage.promoPrice, config: dokuConfig }).qrImageUrl 
            : undefined),
          expiryMinutes: 60,
          doku: dokuResult
        },
        subtotal: currentPackage.promoPrice,
        discount: 0,
        shippingCost: 0,
        total: currentPackage.promoPrice,
        currency: 'IDR',
        currencyRate: 1,
        status: 'menunggu_pembayaran',
        trackingNumber: '',
        trackingHistory: [
          {
            time: 'Baru saja',
            location: 'Central Warehouse saena.my.id Tasikmalaya (Mengantar.com Hub)',
            description: `Pesanan dibuat dan dialokasikan ke ekspedisi ${selectedCourier} via Mengantar.com.`
          }
        ],
        notes
      };

      // Call Mengantar.com API
      const mengantarRes = await createMengantarOrderApi(fullOrder, mengantarConfig);
      if (mengantarRes.success && mengantarRes.data) {
        fullOrder.mengantar = mengantarRes.data;
        fullOrder.trackingNumber = mengantarRes.data.trackingNumber;
        fullOrder.trackingHistory.push({
          time: 'Baru saja',
          location: 'Mengantar.com Hub Tasikmalaya',
          description: `Nomor resi ${mengantarRes.data.courier} terbit otomatis (${mengantarRes.data.trackingNumber}). Kurir dijadwalkan pickup ${mengantarRes.data.pickupTime}.`
        });
      } else {
        const fallbackResi = `MGT-${selectedCourier.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-8)}`;
        fullOrder.trackingNumber = fallbackResi;
        fullOrder.mengantar = {
          mengantarOrderId: `MGT-${orderId}`,
          trackingNumber: fallbackResi,
          courier: selectedCourier,
          serviceType: 'REG',
          status: 'MENUNGGU_PICKUP',
          pickupTime: 'Hari ini, 14:00 - 17:00 WIB',
          shippingFee: 0,
          isCod: paymentMethod === 'COD',
          codAmount: paymentMethod === 'COD' ? currentPackage.promoPrice : 0,
          syncedAt: new Date().toISOString()
        };
      }

      // Success data stored to localStorage so /payment can pick it up immediately
      const successData = {
        order: fullOrder,
        id: orderId,
        packageName: currentPackage.title,
        color: colorSelection,
        total: currentPackage.promoPrice,
        paymentMethod,
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        city: customerCity || 'Kota Tasikmalaya',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        doku: fullOrder.payment.doku,
        mengantar: fullOrder.mengantar,
        selectedCourier,
        selectedDokuChannel
      };

      try {
        localStorage.setItem('saena_latest_order', JSON.stringify(successData));
      } catch {
        // ignore
      }

      // Save to centralized store & Firestore
      try {
        if (typeof recordDirectOrder === 'function') {
          await recordDirectOrder(fullOrder);
        } else {
          if (typeof setOrders === 'function') {
            setOrders(prev => Array.isArray(prev) ? [fullOrder, ...prev.filter(o => o.id !== fullOrder.id)] : [fullOrder]);
          }
          if (typeof syncOrderToFirestore === 'function') {
            await syncOrderToFirestore(fullOrder);
          }
        }
      } catch (saveErr) {
        console.warn('Order state save notice:', saveErr);
      }

      // Navigate to /payment?orderId=...
      if (onNavigateToPayment) {
        onNavigateToPayment(orderId);
      } else {
        window.location.href = `/payment?orderId=${orderId}`;
      }
    } catch (err: any) {
      alert(`Terjadi kendala saat memproses pesanan: ${err.message || 'Silakan coba lagi.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EC] py-6 sm:py-10 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-[#D5C9B8] overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#1C3B2B] text-white p-5 sm:p-7 text-center relative">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="absolute left-4 top-4 text-[#D5CAB9] hover:text-white text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                title="Kembali ke Beranda Utama"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Beranda</span>
              </button>
            )}
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

          {/* Form Content */}
          <form onSubmit={handleFormSubmit} className="p-4 sm:p-7 space-y-6">
            {/* 1. PILIH PAKET PROMO */}
            <div>
              <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white text-[11px] flex items-center justify-center font-bold">1</span>
                <span>PILIH PAKET PROMO YANG ANDA INGINKAN:</span>
              </label>

              <div className="space-y-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`relative p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedPackageId === pkg.id 
                        ? 'border-[#88222A] bg-[#FFF9F9] shadow-md ring-1 ring-[#88222A]' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {pkg.badge && (
                      <span className={`absolute -top-2.5 right-4 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-sm ${
                        pkg.isPopular ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {pkg.badge}
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input 
                          type="radio" 
                          name="package" 
                          checked={selectedPackageId === pkg.id}
                          onChange={() => setSelectedPackageId(pkg.id)}
                          className="mt-1 accent-[#88222A]" 
                        />
                        <div>
                          <div className="text-sm font-bold text-[#1C3B2B]">{pkg.title}</div>
                          <div className="text-xs text-[#615446] mt-0.5">{pkg.description}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base sm:text-lg font-black text-[#88222A]">
                          Rp {pkg.promoPrice.toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs text-gray-400 line-through">
                          Rp {pkg.normalPrice.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold">
                          Hemat Rp {pkg.savings.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. PILIH WARNA MUKENA */}
            <div>
              <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white text-[11px] flex items-center justify-center font-bold">2</span>
                <span>PILIH WARNA MUKENA:</span>
              </label>

              {currentPackage.qty === 1 ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedColor('Dusty Pink')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                      selectedColor === 'Dusty Pink'
                        ? 'border-[#88222A] bg-rose-50 text-[#88222A] font-bold shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#E8A5A5] border border-black/10 shrink-0" />
                    <span className="text-xs">Dusty Pink Sakura</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedColor('Sky Blue')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                      selectedColor === 'Sky Blue'
                        ? 'border-[#1C3B2B] bg-sky-50 text-[#1C3B2B] font-bold shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#99BBE0] border border-black/10 shrink-0" />
                    <span className="text-xs">Sky Blue Lavender</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8DFC8] space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-gray-700 block mb-1">Mukena Pertama:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedColor('Dusty Pink')}
                        className={`p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                          selectedColor === 'Dusty Pink' ? 'bg-[#88222A] text-white border-[#88222A]' : 'bg-white text-gray-700'
                        }`}
                      >
                        Dusty Pink
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedColor('Sky Blue')}
                        className={`p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                          selectedColor === 'Sky Blue' ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' : 'bg-white text-gray-700'
                        }`}
                      >
                        Sky Blue
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-700 block mb-1">Mukena Kedua / Ketiga:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSecondaryColor('Dusty Pink')}
                        className={`p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                          secondaryColor === 'Dusty Pink' ? 'bg-[#88222A] text-white border-[#88222A]' : 'bg-white text-gray-700'
                        }`}
                      >
                        Dusty Pink
                      </button>
                      <button
                        type="button"
                        onClick={() => setSecondaryColor('Sky Blue')}
                        className={`p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                          secondaryColor === 'Sky Blue' ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' : 'bg-white text-gray-700'
                        }`}
                      >
                        Sky Blue
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. ISI DATA PENGIRIMAN PAKET ANDA */}
            <div id="order-address-section">
              <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white text-[11px] flex items-center justify-center font-bold">3</span>
                <span>ISI DATA PENGIRIMAN PAKET ANDA:</span>
              </label>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Nama Lengkap Penerima *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ibu Rina Wulandari"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1C3B2B] focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Nomor WhatsApp Aktif *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890 (Untuk konfirmasi pengiriman kurir)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1C3B2B] focus:border-transparent outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Kota / Kabupaten *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Tasikmalaya / Bandung / Jakarta"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1C3B2B] focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-gray-700 font-semibold">Kecamatan *</label>
                      {(!addressValidation.hasSubdistrict && customerSubdistrict.length > 0) && (
                        <span className="text-[10px] text-amber-700 font-semibold">Wajib diisi</span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Tamansari / Sukasari"
                      value={customerSubdistrict}
                      onChange={(e) => setCustomerSubdistrict(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#1C3B2B] focus:border-transparent outline-none transition-all ${
                        addressValidationAttempted && !addressValidation.hasSubdistrict
                          ? 'border-rose-400 bg-rose-50/30'
                          : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-gray-700 font-semibold">
                      Alamat Lengkap (Nama Jalan, No. Rumah, RT/RW, Patokan) *
                    </label>
                    {(!addressValidation.hasHouseNumber && !allowNoHouseNumber && customerAddress.length > 2) && (
                      <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Nomor rumah belum ada
                      </span>
                    )}
                  </div>
                  <textarea
                    required
                    rows={2}
                    placeholder="Contoh: Jl. Melati No. 12 / Blok B3, RT 02/RW 05, Kel. Sukahurip (Depan Masjid Al-Ikhlas)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border focus:ring-2 focus:ring-[#1C3B2B] focus:border-transparent outline-none transition-all ${
                      addressValidationAttempted && (!addressValidation.hasHouseNumber && !allowNoHouseNumber)
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                {/* Real-time Address Status */}
                {(customerAddress.length > 2 || customerSubdistrict.length > 0 || addressValidationAttempted) ? (
                  <div>
                    {(!addressValidation.hasHouseNumber && !allowNoHouseNumber) || !addressValidation.hasSubdistrict || !addressValidation.hasStreetDetail ? (
                      <div className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                        addressValidationAttempted
                          ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                          : 'bg-amber-50/95 border-amber-300/80 text-amber-900'
                      }`}>
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className={`w-4 h-4 shrink-0 ${addressValidationAttempted ? 'text-rose-600' : 'text-amber-600'}`} />
                          <span>Pemberitahuan: Alamat Belum Benar-Benar Lengkap</span>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90">
                          Kurir ekspedisi Mengantar.com memerlukan nomor rumah/patokan dan kecamatan:
                        </p>
                        <div className="space-y-1 text-[11px]">
                          {(!addressValidation.hasHouseNumber && !allowNoHouseNumber) && (
                            <p className="text-amber-800">• Harap sertakan nomor rumah (contoh: <em>No. 12</em>) atau patokan (contoh: <em>Depan Masjid</em>).</p>
                          )}
                          {!addressValidation.hasSubdistrict && (
                            <p className="text-amber-800">• Kecamatan wajib diisi pada kolom di atas.</p>
                          )}
                        </div>

                        {(!addressValidation.hasHouseNumber && !allowNoHouseNumber) && (
                          <label className="flex items-center gap-2 pt-1 border-t border-amber-200 text-[11px] text-[#524B40] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allowNoHouseNumber}
                              onChange={(e) => setAllowNoHouseNumber(e.target.checked)}
                              className="w-3.5 h-3.5 rounded text-[#1C3B2B] focus:ring-[#1C3B2B]"
                            />
                            <span>Rumah saya di perkampungan tanpa nomor (patokan RT/RW jelas)</span>
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between gap-2 text-emerald-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-[11px]">
                            Alamat Lengkap Terverifikasi! (Nomor rumah/patokan &amp; Kecamatan terisi)
                          </span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Siap Antar
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#FAF7F2] border border-[#EAE2D5] rounded-xl text-[11px] text-[#7A7266] flex items-center gap-2">
                    <Home className="w-3.5 h-3.5 text-[#B38F5B] shrink-0" />
                    <span>💡 <strong>Tips:</strong> Pastikan menyertakan Nomor Rumah / Patokan dan Kecamatan agar kurir Mengantar tiba tepat waktu.</span>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Catatan Tambahan untuk Kurir (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Titipkan di satpam jika tidak ada orang / Tolong antar siang"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1C3B2B] focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. PILIHAN EKSPEDISI PENGIRIMAN */}
            <div>
              <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white text-[11px] flex items-center justify-center font-bold">4</span>
                <span>PILIHAN EKSPEDISI PENGIRIMAN (DIDUKUNG MENGANTAR.COM):</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'JNE', name: 'JNE Express', desc: 'Layanan Reguler (1-3 hari)', badge: 'REKOMENDASI' },
                  { id: 'J&T Express', name: 'J&T Express', desc: 'Layanan EZ Cepat (1-3 hari)', badge: 'PRIORITAS' },
                  { id: 'SiCepat', name: 'SiCepat', desc: 'Layanan REG (1-3 hari)', badge: 'AMAN' }
                ].map((courier) => (
                  <button
                    key={courier.id}
                    type="button"
                    onClick={() => setSelectedCourier(courier.id as any)}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      selectedCourier === courier.id
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-sm ring-1 ring-emerald-600'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900">{courier.name}</span>
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                        {courier.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">{courier.desc}</p>
                  </button>
                ))}
              </div>

              <div className="mt-2.5 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E8DFC8] flex items-center gap-2 text-[11px] text-[#615446]">
                <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  🚚 <strong>Terintegrasi Otomatis Mengantar.com:</strong> Resi resmi terbit otomatis &amp; paket langsung dijadwalkan pickup di Central Warehouse Tasikmalaya.
                </span>
              </div>
            </div>

            {/* 5. METODE PEMBAYARAN */}
            <div>
              <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white text-[11px] flex items-center justify-center font-bold">5</span>
                <span>METODE PEMBAYARAN:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Transfer & QRIS DOKU */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    paymentMethod === 'TRANSFER'
                      ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-1 ring-emerald-600'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="paymentMethodOption"
                      checked={paymentMethod === 'TRANSFER'}
                      onChange={() => setPaymentMethod('TRANSFER')}
                      className="mt-0.5 accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-900">Transfer Bank &amp; QRIS (DOKU)</span>
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                          POPULER
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        QRIS Instan &amp; Virtual Account (BCA, Mandiri, BRI, BNI). Verifikasi otomatis 24/7.
                      </p>
                    </div>
                  </div>
                </button>

                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    paymentMethod === 'COD'
                      ? 'border-[#1C3B2B] bg-[#F4F8F5] shadow-md ring-1 ring-[#1C3B2B]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="paymentMethodOption"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="mt-0.5 accent-[#1C3B2B] cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#1C3B2B]">COD (Bayar di Tempat)</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        Logistik Mengantar.com. Bayar tunai ke kurir saat barang sudah Anda terima di rumah.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* DOKU Channels */}
              {paymentMethod === 'TRANSFER' && (
                <div className="mt-3 p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pilih Jalur Pembayaran DOKU Payment Gateway:</span>
                    </span>
                    <span className="text-[10px] text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 font-semibold">
                      Berizin Bank Indonesia
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'doku_qris', name: 'QRIS Instan', sub: 'Semua Bank & E-Wallet' },
                      { id: 'doku_va_bca', name: 'BCA Virtual Account', sub: 'Verifikasi Otomatis' },
                      { id: 'doku_va_mandiri', name: 'Mandiri VA', sub: 'Verifikasi Otomatis' },
                      { id: 'doku_va_bri', name: 'BRI Virtual Account', sub: 'Verifikasi Otomatis' },
                      { id: 'doku_va_bni', name: 'BNI Virtual Account', sub: 'Verifikasi Otomatis' }
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setSelectedDokuChannel(ch.id as PaymentChannel)}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          selectedDokuChannel === ch.id
                            ? 'border-blue-600 bg-white text-blue-950 font-bold shadow-xs ring-1 ring-blue-600'
                            : 'border-blue-100 hover:border-blue-300 bg-white/70 text-gray-700'
                        }`}
                      >
                        <div className="text-xs leading-tight">{ch.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{ch.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Total Ringkasan Tagihan */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFC8] space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Paket:</span>
                <span className="font-semibold text-gray-800">{currentPackage.title}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Varian:</span>
                <span className="font-semibold text-gray-800">
                  {currentPackage.qty > 1 ? `${selectedColor} & ${secondaryColor}` : selectedColor}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ekspedisi Logistik:</span>
                <span className="font-semibold text-emerald-800">Mengantar.com ({selectedCourier})</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ongkos Kirim:</span>
                <span className={`font-semibold ${currentPackage.qty >= 2 ? 'text-emerald-700 font-bold' : 'text-gray-700'}`}>
                  {currentPackage.qty >= 2 ? 'GRATIS ONGKIR (Promo Beli 2 Pcs)' : 'Ongkir Reguler'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#88222A] pt-2 border-t border-[#E8DFC8]">
                <span>Total yang Harus Dibayar:</span>
                <span className="text-base">Rp {currentPackage.promoPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Incomplete address alert */}
            {addressValidationAttempted && ((!addressValidation.hasHouseNumber && !allowNoHouseNumber) || !addressValidation.hasSubdistrict || !addressValidation.hasStreetDetail) && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-900">Alamat Pengiriman Belum Benar-Benar Lengkap</p>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Mohon lengkapi <strong>nomor rumah/patokan</strong> dan <strong>kecamatan</strong> pada formulir di atas agar pengiriman kurir Mengantar.com lancar.
                  </p>
                </div>
              </div>
            )}

            {/* SUBMIT CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#88222A] hover:bg-[#721B22] text-white font-bold py-4 px-6 rounded-xl shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-yellow-300" />
              <span>
                {isSubmitting 
                  ? 'Menghubungkan ke Mengantar & DOKU...' 
                  : paymentMethod === 'TRANSFER' 
                    ? 'KONFIRMASI PESAN (BAYAR VIA DOKU GATEWAY) →' 
                    : 'KONFIRMASI PESAN (BISA COD MENGANTAR) →'}
              </span>
            </button>

            {/* Partner Trust Badges */}
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8DFC8] space-y-2">
              <div className="text-[10px] font-bold text-gray-500 text-center uppercase tracking-wider">
                PARTNER RESMI PEMBAYARAN &amp; LOGISTIK TERPADU SAENA.MY.ID
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                  <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] leading-tight">
                    <div className="font-bold text-gray-900">DOKU Payment Gateway</div>
                    <div className="text-gray-500 text-[10px]">Berizin Bank Indonesia &amp; PCI-DSS</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                  <div className="w-7 h-7 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] leading-tight">
                    <div className="font-bold text-gray-900">Mengantar.com Logistik</div>
                    <div className="text-gray-500 text-[10px]">Auto AWB JNE, J&amp;T &amp; COD Terpadu</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[11px] text-gray-500">
                🔒 Data Anda 100% aman dan terlindungi untuk keperluan pemrosesan pesanan resmi.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
