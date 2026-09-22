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
import { createDokuPaymentApi } from '../utils/dokuClient';
import { validateIndonesianAddress, AddressValidationResult } from '../utils/addressValidation';
import { getSmartQrisForOrder } from '../utils/qrisGenerator';
import { trackMetaInitiateCheckout, trackMetaPageView, getFbpCookie, getFbcCookie } from '../utils/metaPixel';

interface OrderPageProps {
  onNavigateToPayment?: (orderId: string) => void;
  onNavigateToThankYou?: (orderNumber: string) => void;
  onNavigateHome?: () => void;
}

export const OrderPage: React.FC<OrderPageProps> = ({ 
  onNavigateToPayment, 
  onNavigateToThankYou, 
  onNavigateHome 
}) => {
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
      badge: 'HARGA SATUAN (600gr)',
      qty: 1,
      normalPrice: 159000,
      promoPrice: 79500,
      savings: 79500,
      description: '1x Mukena Traveling 2in1 + 1x Mini Pouch Cantik (Berat: 600gr)'
    },
    {
      id: 'pkg-2',
      title: 'Paket Best Seller (2 Pcs)',
      badge: '🔥 BELI 2 PCS BEBAS ONGKIR*',
      isPopular: true,
      qty: 2,
      normalPrice: 318000,
      promoPrice: 159000,
      savings: 159000,
      description: '2x Mukena Traveling 2in1 (Bisa Beda Warna) + 2x Mini Pouch • Bebas Ongkir Khusus Bayar Dimuka (Berat: 1.200gr)'
    },
    {
      id: 'pkg-3',
      title: 'Paket Seragam / Hadiah (3 Pcs)',
      badge: 'BEBAS ONGKIR* + HEMAT',
      qty: 3,
      normalPrice: 477000,
      promoPrice: 238500,
      savings: 238500,
      description: '3x Mukena Traveling 2in1 (Bisa Mix Warna) + 3x Mini Pouch • Bebas Ongkir Khusus Bayar Dimuka (Berat: 1.800gr)'
    }
  ];

  const [selectedPackageId, setSelectedPackageId] = useState<string>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const p = sp.get('package') || sp.get('pkg');
      if (p === 'pkg-1' || p === '1') return 'pkg-1';
      if (p === 'pkg-2' || p === '2') return 'pkg-2';
      if (p === 'pkg-3' || p === '3') return 'pkg-3';
    } catch {
      // fallback
    }
    return 'pkg-2';
  });
  const currentPackage = packages.find(p => p.id === selectedPackageId) || packages[1];

  const [selectedColor, setSelectedColor] = useState<'Dusty Pink' | 'Sage Green'>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const c = sp.get('color');
      if (c && (c.toLowerCase().includes('sage') || c.toLowerCase().includes('green') || c.toLowerCase().includes('blue'))) return 'Sage Green';
      if (c && c.toLowerCase().includes('pink')) return 'Dusty Pink';
    } catch {
      // fallback
    }
    return 'Dusty Pink';
  });
  const [secondaryColor, setSecondaryColor] = useState<'Dusty Pink' | 'Sage Green'>('Sage Green');

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

  // Weight Calculation: 1 product is exactly 600 grams
  const PRODUCT_WEIGHT_GRAMS = 600;
  const totalWeightInGrams = currentPackage.qty * PRODUCT_WEIGHT_GRAMS;
  const weightInKg = Math.max(1, Math.ceil(totalWeightInGrams / 1000));

  // Courier live rates from Mengantar.com (No hardcoded fake fallback rates)
  const [courierRates, setCourierRates] = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // Dynamic rates from Mengantar endpoint
  useEffect(() => {
    let isCancelled = false;
    const fetchRates = async () => {
      setRatesLoading(true);
      setRatesError(null);
      try {
        const res = await fetch('/api/shipping/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originCity: 'Kota Tasikmalaya',
            destinationCity: customerCity || 'Kota Tasikmalaya',
            weight: totalWeightInGrams
          })
        });
        const data = await res.json();
        if (!isCancelled) {
          if (data && data.success && Array.isArray(data.rates) && data.rates.length > 0) {
            const newRates: Record<string, number> = {};
            data.rates.forEach((r: any) => {
              if (r.courier && typeof r.cost === 'number' && Number.isFinite(r.cost) && r.cost > 0) {
                newRates[r.courier] = r.cost;
              }
            });
            if (Object.keys(newRates).length > 0) {
              setCourierRates(newRates);
              setRatesError(null);
            } else {
              setCourierRates({});
              setRatesError('Ongkir belum dapat dihitung. Silakan coba lagi.');
            }
          } else {
            setCourierRates({});
            setRatesError('Ongkir belum dapat dihitung. Silakan coba lagi.');
          }
        }
      } catch {
        if (!isCancelled) {
          setCourierRates({});
          setRatesError('Ongkir belum dapat dihitung. Silakan coba lagi.');
        }
      } finally {
        if (!isCancelled) {
          setRatesLoading(false);
        }
      }
    };

    fetchRates();
    return () => { isCancelled = true; };
  }, [customerCity, totalWeightInGrams]);

  // Current shipping cost calculation - SEMUA GRATIS ONGKIR SE-INDONESIA (Rp 0)
  const actualCourierRate = courierRates[selectedCourier];
  const shippingCost = 0; // SEMUA GRATIS ONGKIR (baik COD maupun Transfer/QRIS)
  const finalTotal = currentPackage.promoPrice;

  useEffect(() => {
    document.title = 'Formulir Pemesanan Resmi Mukena Alisa - saena.my.id';
    trackMetaPageView();
    trackMetaInitiateCheckout({
      contentName: 'Formulir Pemesanan Resmi Mukena Alisa',
      value: finalTotal,
      currency: 'IDR',
      numItems: currentPackage.qty
    });
  }, [finalTotal, currentPackage.qty]);

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
      const colorSelection = currentPackage.qty > 1 
        ? `${selectedColor} & ${secondaryColor}`
        : selectedColor;

      const orderPayload = {
        customer: {
          customerName: customerName.trim(),
          phone: customerPhone.trim(),
          email: `${customerPhone.replace(/[^0-9]/g, '')}@saena.my.id`
        },
        shippingAddress: {
          address: customerAddress.trim(),
          province: 'Jawa Barat',
          city: customerCity || 'Kota Tasikmalaya',
          district: customerSubdistrict || 'Tamansari',
          postalCode: '46196'
        },
        items: [
          {
            id: 'alisa-01',
            name: `Mukena Traveling 2in1 Laser Cut Alisa (${currentPackage.title})`,
            variant: colorSelection,
            color: selectedColor,
            size: 'Standar Jumbo Dewasa',
            price: Math.round(currentPackage.promoPrice / currentPackage.qty),
            quantity: currentPackage.qty,
            weight: 600 * currentPackage.qty
          }
        ],
        courier: selectedCourier,
        service: 'REG',
        shippingCost: 0,
        paymentMethod: paymentMethod === 'COD' ? 'COD' : 'DOKU',
        paymentChannel: paymentMethod === 'COD' ? 'cod' : selectedDokuChannel,
        notes: notes || undefined,
        metaTracking: {
          fbp: getFbpCookie(),
          fbc: getFbcCookie(),
          eventSourceUrl: window.location.href
        }
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Gagal menerbitkan pesanan resmi.');
      }

      const orderNumber = json.data.orderNumber;
      const accessToken = json.data.accessToken;

      if (accessToken) {
        try {
          sessionStorage.setItem(`order_token_${orderNumber}`, accessToken);
        } catch {}
      }

      if (onNavigateToThankYou) {
        onNavigateToThankYou(orderNumber);
      } else {
        const tokenQuery = accessToken ? `&token=${encodeURIComponent(accessToken)}` : '';
        window.location.href = `/thank-you?order=${encodeURIComponent(orderNumber)}${tokenQuery}`;
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
                    onClick={() => setSelectedColor('Sage Green')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                      selectedColor === 'Sage Green'
                        ? 'border-[#1C3B2B] bg-emerald-50 text-[#1C3B2B] font-bold shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#7D9C86] border border-black/10 shrink-0" />
                    <span className="text-xs">Sage Green Floral</span>
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
                        onClick={() => setSelectedColor('Sage Green')}
                        className={`p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                          selectedColor === 'Sage Green' ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' : 'bg-white text-gray-700'
                        }`}
                      >
                        Sage Green
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
                        onClick={() => setSecondaryColor('Sage Green')}
                        className={`p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                          secondaryColor === 'Sage Green' ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' : 'bg-white text-gray-700'
                        }`}
                      >
                        Sage Green
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
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white text-[11px] flex items-center justify-center font-bold">4</span>
                  <span>PILIHAN EKSPEDISI PENGIRIMAN (DIDUKUNG MENGANTAR.COM):</span>
                </label>
                <span className="text-[11px] text-gray-500 font-medium">
                  Berat: <strong className="text-gray-800">{totalWeightInGrams}gr</strong> ({weightInKg} kg @ 600gr/pcs)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'JNE', name: 'JNE Express', desc: 'Layanan Reguler (1-3 hari)', badge: 'REKOMENDASI' },
                  { id: 'J&T Express', name: 'J&T Express', desc: 'Layanan EZ Cepat (1-3 hari)', badge: 'PRIORITAS' },
                  { id: 'SiCepat', name: 'SiCepat', desc: 'Layanan REG (1-3 hari)', badge: 'AMAN' }
                ].map((courier) => {
                  const rate = courierRates[courier.id];
                  const hasValidRate = typeof rate === 'number' && Number.isFinite(rate) && rate > 0;
                  return (
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
                      <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Tarif ({totalWeightInGrams}gr):</span>
                        {hasValidRate ? (
                          <span className="font-bold text-emerald-700">
                            GRATIS <del className="text-gray-400 font-normal">Rp {rate.toLocaleString('id-ID')}</del>
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700">
                            GRATIS ONGKIR
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {ratesLoading && (
                <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Menghubungi API Mengantar untuk kalkulasi tarif resmi...</span>
                </div>
              )}

              {ratesError && (
                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Ongkir belum dapat dihitung. Silakan coba lagi. (Promo aktif: Seluruh pesanan tetap Bebas Ongkir Rp 0).</span>
                </div>
              )}

              <div className="mt-2.5 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E8DFC8] flex items-center justify-between gap-2 text-[11px] text-[#615446]">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    🚚 <strong>Logistik Resmi Mengantar.com:</strong> Resi resmi terbit otomatis &amp; pickup dari Central Warehouse Tasikmalaya (Berat per pcs: 600gr).
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded shrink-0">
                  Tarif Resmi
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
                          GRATIS ONGKIR
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        QRIS Instan &amp; Virtual Account (BCA, Mandiri, BRI, BNI). Verifikasi otomatis 24/7.
                      </p>
                      <div className="mt-1.5 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>
                          Bebas ongkir kurir Mengantar {typeof actualCourierRate === 'number' && actualCourierRate > 0 ? `(Hemat Rp ${actualCourierRate.toLocaleString('id-ID')})` : '(Promo Bebas Ongkir Rp 0)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    paymentMethod === 'COD'
                      ? 'border-[#1C3B2B] bg-emerald-50/60 shadow-md ring-1 ring-[#1C3B2B]'
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
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                          GRATIS ONGKIR
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        Bayar tunai ke kurir Mengantar saat barang tiba di rumah — <strong>Bebas Ongkir Se-Indonesia (Rp 0)</strong>!
                      </p>
                      <div className="mt-1.5 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>
                          Bebas ongkir kurir Mengantar {typeof actualCourierRate === 'number' && actualCourierRate > 0 ? `(Hemat Rp ${actualCourierRate.toLocaleString('id-ID')})` : '(Promo Bebas Ongkir Rp 0)'}
                        </span>
                      </div>
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
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFC8] space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Paket Produk:</span>
                <span className="font-semibold text-gray-800">{currentPackage.title}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Varian:</span>
                <span className="font-semibold text-gray-800">
                  {currentPackage.qty > 1 ? `${selectedColor} & ${secondaryColor}` : selectedColor}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Berat Pengiriman:</span>
                <span className="font-semibold text-gray-800">
                  {totalWeightInGrams} gram ({weightInKg} kg @ 600gr/pcs)
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ekspedisi Logistik:</span>
                <span className="font-semibold text-emerald-800">Mengantar.com ({selectedCourier})</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Ongkos Kirim Mengantar:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <span>Rp 0 (GRATIS ONGKIR SE-INDONESIA)</span>
                  {typeof actualCourierRate === 'number' && actualCourierRate > 0 && (
                    <del className="text-gray-400 font-normal">Rp {actualCourierRate.toLocaleString('id-ID')}</del>
                  )}
                </span>
              </div>

              {paymentMethod === 'COD' && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 space-y-1">
                  <div className="flex items-start gap-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Metode COD: Bebas Ongkos Kirim (Gratis)!</span>
                  </div>
                  <p className="text-[10px] text-emerald-800 leading-relaxed">
                    Anda cukup menyiapkan uang pas sebesar <strong>Rp {finalTotal.toLocaleString('id-ID')}</strong> kepada kurir Mengantar saat paket tiba di alamat Anda. Tidak ada biaya tambahan apapun.
                  </p>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-[#88222A] pt-2 border-t border-[#E8DFC8]">
                <div>
                  <span>Total yang Harus Dibayar:</span>
                  <div className="text-[10px] text-gray-500 font-normal">
                    {paymentMethod === 'COD' 
                      ? 'Total uang pas yang diserahkan ke kurir saat barang sampai'
                      : 'Total pembayaran lunas via DOKU Payment Gateway'}
                  </div>
                </div>
                <span className="text-base sm:text-lg">Rp {finalTotal.toLocaleString('id-ID')}</span>
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
                    ? `KONFIRMASI PESAN (BAYAR VIA DOKU RP ${finalTotal.toLocaleString('id-ID')}) →` 
                    : `KONFIRMASI PESAN COD (TOTAL RP ${finalTotal.toLocaleString('id-ID')}) →`}
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
