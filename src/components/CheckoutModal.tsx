import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { SHIPPING_SERVICES, SHIPPING_ORIGIN } from '../data/mockData';
import { 
  CustomerDetails, 
  ShippingMethod, 
  PaymentChannel, 
  Order 
} from '../types';
import { 
  X, 
  CheckCircle2, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  Copy, 
  Check, 
  ArrowRight, 
  AlertCircle,
  QrCode,
  Smartphone,
  Building2,
  Lock,
  Sparkles,
  MapPin
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    formatPrice,
    couponDiscount,
    appliedCoupon,
    placeOrder,
    simulatePaymentSuccess,
    setIsWhatsAppModalOpen,
    setIsOrderTrackingOpen,
    setActiveOrder,
    t
  } = useStore();

  const [step, setStep] = useState<'form' | 'payment_pending' | 'success'>('form');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedVA, setCopiedVA] = useState(false);

  // Customer Shipping Address Form (Default: Kecamatan Tamansari, Kota Tasikmalaya)
  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: 'Fatimah Zahra',
    whatsapp: '081234567890',
    email: 'fatimah.zahra@example.com',
    address: 'Jl. Tamansari No. 45, RT 02 / RW 04, Kel. Mugarsari',
    province: 'Jawa Barat',
    city: 'Kota Tasikmalaya',
    subdistrict: 'Kecamatan Tamansari',
    postalCode: '46196',
    country: 'Indonesia',
    notes: 'Mohon cantumkan kartu ucapan Hari Raya'
  });

  // Courier selection (default to JNE Reguler as primary courier)
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod>(SHIPPING_SERVICES[0]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentChannel>('qris');

  if (!isCheckoutOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Calculate estimated parcel weight in kilograms based on garment category
  const estimatedWeightKg = cart.reduce((sum, item) => {
    let weightPerUnit = 0.5; // default 500g
    const cat = item.product.category;
    if (cat === 'abaya-gamis') weightPerUnit = 0.65;
    else if (cat === 'dress-kaftan') weightPerUnit = 0.6;
    else if (cat === 'mukena-silk') weightPerUnit = 0.75;
    else if (cat === 'koko-kurta') weightPerUnit = 0.4;
    else if (cat === 'hijab-pashmina') weightPerUnit = 0.18;
    else if (cat === 'aksesoris') weightPerUnit = 0.12;
    return sum + (weightPerUnit * item.quantity);
  }, 0);

  // Standard courier rule: minimum billable weight is 1 kg, rounded up
  const billableWeight = Math.max(1, Math.ceil(estimatedWeightKg));
  
  // Dynamic Shipping calculation based on origin: Kecamatan Tamansari, Kota Tasikmalaya (46196)
  const calculateShippingRate = (method: ShippingMethod): number => {
    if (customer.country !== 'Indonesia') {
      return 175000 * billableWeight; // International flat base for DHL Worldwide
    }

    const cityLower = (customer.city || '').toLowerCase();
    const subdistrictLower = (customer.subdistrict || '').toLowerCase();
    const provinceLower = (customer.province || '').toLowerCase();

    // Zone 1: Intra-City Tasikmalaya (Kec. Tamansari & sekitarnya)
    const isTamansariTasik = 
      cityLower.includes('tasikmalaya') || 
      subdistrictLower.includes('tamansari') ||
      customer.postalCode === '46196';

    // Zone 2: Priangan Timur (Ciamis, Garut, Banjar, Pangandaran)
    const isPrianganTimur = 
      cityLower.includes('ciamis') || 
      cityLower.includes('garut') || 
      cityLower.includes('banjar') || 
      cityLower.includes('pangandaran');

    // Zone 3: Jawa Barat & Jabodetabek (Bandung, Jakarta, Bogor, Depok, Tangerang, Bekasi, Cirebon, dll)
    const isJabarJabodetabek = 
      provinceLower.includes('jawa barat') || 
      provinceLower.includes('dki jakarta') || 
      provinceLower.includes('jakarta') ||
      cityLower.includes('bandung') ||
      cityLower.includes('bekasi') ||
      cityLower.includes('depok') ||
      cityLower.includes('bogor') ||
      cityLower.includes('tangerang') ||
      cityLower.includes('cirebon') ||
      cityLower.includes('sukabumi');

    // Zone 4: Banten, Jawa Tengah & DIY (Semarang, Solo, Jogja, dll)
    const isJatengDIYBanten = 
      provinceLower.includes('jawa tengah') || 
      provinceLower.includes('yogyakarta') || 
      provinceLower.includes('jogja') || 
      provinceLower.includes('banten') ||
      cityLower.includes('semarang') ||
      cityLower.includes('solo') ||
      cityLower.includes('surakarta');

    // Zone 5: Jawa Timur (Surabaya, Malang, Sidoarjo, dll)
    const isJatim = provinceLower.includes('jawa timur') || cityLower.includes('surabaya') || cityLower.includes('malang');

    // Zone 6: Bali & Nusa Tenggara
    const isBaliNT = provinceLower.includes('bali') || provinceLower.includes('nusa tenggara') || cityLower.includes('denpasar');

    // Zone 7: Pulau Sumatera
    const isSumatera = 
      provinceLower.includes('sumatera') || 
      provinceLower.includes('lampung') || 
      provinceLower.includes('riau') || 
      provinceLower.includes('aceh') ||
      provinceLower.includes('jambi') ||
      provinceLower.includes('bengkulu') ||
      provinceLower.includes('bangka') ||
      provinceLower.includes('kepulauan riau');

    // Zone 8: Kalimantan & Sulawesi
    const isKalimantanSulawesi = 
      provinceLower.includes('kalimantan') || 
      provinceLower.includes('sulawesi');

    // JNE Express Tariff Calculation (Origin: Tamansari, Kota Tasikmalaya)
    if (method.id === 'jne-reg') {
      if (isTamansariTasik) return 9000 * billableWeight;
      if (isPrianganTimur) return 10000 * billableWeight;
      if (isJabarJabodetabek) return 12000 * billableWeight;
      if (isJatengDIYBanten) return 18000 * billableWeight;
      if (isJatim) return 21000 * billableWeight;
      if (isBaliNT) return 28000 * billableWeight;
      if (isSumatera) return 34000 * billableWeight;
      if (isKalimantanSulawesi) return 42000 * billableWeight;
      return 65000 * billableWeight; // Maluku & Papua
    }

    if (method.id === 'jne-yes') {
      if (isTamansariTasik) return 15000 * billableWeight;
      if (isPrianganTimur) return 18000 * billableWeight;
      if (isJabarJabodetabek) return 22000 * billableWeight;
      if (isJatengDIYBanten) return 28000 * billableWeight;
      if (isJatim) return 32000 * billableWeight;
      if (isBaliNT) return 42000 * billableWeight;
      if (isSumatera) return 48000 * billableWeight;
      if (isKalimantanSulawesi) return 58000 * billableWeight;
      return 85000 * billableWeight;
    }

    if (method.id === 'jne-oke') {
      if (isTamansariTasik) return 7500 * billableWeight;
      if (isPrianganTimur) return 8500 * billableWeight;
      if (isJabarJabodetabek) return 10000 * billableWeight;
      if (isJatengDIYBanten) return 14000 * billableWeight;
      if (isJatim) return 17000 * billableWeight;
      if (isBaliNT) return 23000 * billableWeight;
      if (isSumatera) return 27000 * billableWeight;
      if (isKalimantanSulawesi) return 34000 * billableWeight;
      return 52000 * billableWeight;
    }

    // J&T Express Tariff Calculation (Origin: Tamansari, Kota Tasikmalaya)
    if (method.id === 'jnt-ez') {
      if (isTamansariTasik) return 9500 * billableWeight;
      if (isPrianganTimur) return 10000 * billableWeight;
      if (isJabarJabodetabek) return 12000 * billableWeight;
      if (isJatengDIYBanten) return 17000 * billableWeight;
      if (isJatim) return 20000 * billableWeight;
      if (isBaliNT) return 27000 * billableWeight;
      if (isSumatera) return 33000 * billableWeight;
      if (isKalimantanSulawesi) return 40000 * billableWeight;
      return 62000 * billableWeight;
    }

    if (method.id === 'jnt-super') {
      if (isTamansariTasik) return 16000 * billableWeight;
      if (isPrianganTimur) return 18000 * billableWeight;
      if (isJabarJabodetabek) return 22000 * billableWeight;
      if (isJatengDIYBanten) return 27000 * billableWeight;
      if (isJatim) return 31000 * billableWeight;
      if (isBaliNT) return 40000 * billableWeight;
      if (isSumatera) return 47000 * billableWeight;
      if (isKalimantanSulawesi) return 56000 * billableWeight;
      return 82000 * billableWeight;
    }

    // Alternative couriers
    if (method.id === 'sicepat-reg') {
      if (isTamansariTasik) return 10000 * billableWeight;
      if (isPrianganTimur) return 11000 * billableWeight;
      if (isJabarJabodetabek) return 13000 * billableWeight;
      if (isJatengDIYBanten) return 18000 * billableWeight;
      if (isJatim) return 21000 * billableWeight;
      if (isBaliNT) return 28000 * billableWeight;
      if (isSumatera) return 35000 * billableWeight;
      return 45000 * billableWeight;
    }

    return (method.cost || 12000) * billableWeight;
  };

  const dynamicShippingCost = calculateShippingRate(selectedShipping);
  const finalTotal = Math.max(0, subtotal - couponDiscount + dynamicShippingCost);

  // Quick action to reset/fill address to Kecamatan Tamansari, Kota Tasikmalaya
  const handlePresetTamansari = () => {
    setCustomer(prev => ({
      ...prev,
      address: 'Jl. Tamansari No. 45, RT 02 / RW 04, Kel. Mugarsari',
      province: 'Jawa Barat',
      city: 'Kota Tasikmalaya',
      subdistrict: 'Kecamatan Tamansari',
      postalCode: '46196',
      country: 'Indonesia'
    }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const shippingWithDynamicCost: ShippingMethod = {
        ...selectedShipping,
        cost: dynamicShippingCost
      };

      const order = await placeOrder(customer, shippingWithDynamicCost, selectedPayment);
      setCreatedOrder(order);

      if (selectedPayment === 'cod') {
        setStep('success');
      } else {
        setStep('payment_pending');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePayment = () => {
    if (!createdOrder) return;
    simulatePaymentSuccess(createdOrder.id);
    setStep('success');
  };

  const handleCopyVA = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVA(true);
    setTimeout(() => setCopiedVA(false), 2500);
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setStep('form');
    setCreatedOrder(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E5DDD2] my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE2D5] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#1C3B2B]" />
            <h3 className="font-display text-base sm:text-lg font-semibold text-[#1C3B2B]">
              {step === 'form' && t.checkout.title}
              {step === 'payment_pending' && 'Selesaikan Pembayaran Otomatis'}
              {step === 'success' && 'Pesanan Berhasil Diselesaikan!'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-gray-500 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: FORM */}
          {step === 'form' && (
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              
              {/* Section 1: Address Details */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE9E0] pb-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1C3B2B]">
                    <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white flex items-center justify-center text-[10px]">1</span>
                    <span>{t.checkout.step1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePresetTamansari}
                    className="text-[11px] font-medium text-[#1C3B2B] hover:text-[#2E7D32] bg-[#FAF3E8] hover:bg-[#F2E5D0] px-2.5 py-1 rounded-lg border border-[#D5C9B8] flex items-center gap-1 transition-colors"
                    title="Gunakan alamat default Tamansari, Kota Tasikmalaya"
                  >
                    <MapPin className="w-3 h-3 text-[#B38F5B]" />
                    <span>Preset Alamat: Kec. Tamansari, Kota Tasikmalaya</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#3D3830] block mb-1">
                      {t.checkout.fullName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={customer.fullName}
                      onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#3D3830] block mb-1">
                      {t.checkout.whatsapp} *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="08xxxxxxxxxx"
                      value={customer.whatsapp}
                      onChange={(e) => setCustomer({ ...customer, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                    />
                    <span className="text-[10px] text-[#7A7266] block mt-0.5">
                      Notifikasi WhatsApp & link invoice akan dikirim ke nomor ini
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#3D3830] block mb-1">
                      {t.checkout.email} *
                    </label>
                    <input
                      type="email"
                      required
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#3D3830] block mb-1">
                      Negara Tujuan
                    </label>
                    <select
                      value={customer.country}
                      onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                    >
                      <option value="Indonesia">🇮🇩 Indonesia</option>
                      <option value="Malaysia">🇲🇾 Malaysia</option>
                      <option value="Singapore">🇸🇬 Singapore</option>
                      <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
                      <option value="UAE">🇦🇪 United Arab Emirates</option>
                      <option value="United Kingdom">🇬🇧 United Kingdom</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-[#3D3830] block mb-1">
                      {t.checkout.address} *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan"
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#3D3830] block mb-1">
                      {t.checkout.province} *
                    </label>
                    <input
                      type="text"
                      required
                      value={customer.province}
                      onChange={(e) => setCustomer({ ...customer, province: e.target.value })}
                      placeholder="Contoh: Jawa Barat, DKI Jakarta"
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#3D3830] block mb-1">
                      {t.checkout.city} *
                    </label>
                    <input
                      type="text"
                      required
                      value={customer.city}
                      onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                      placeholder="Contoh: Kota Tasikmalaya, Bandung, Jakarta"
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#3D3830] block mb-1">
                      {t.checkout.subdistrict} *
                    </label>
                    <input
                      type="text"
                      required
                      value={customer.subdistrict}
                      onChange={(e) => setCustomer({ ...customer, subdistrict: e.target.value })}
                      placeholder="Contoh: Kecamatan Tamansari"
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#3D3830] block mb-1">
                      {t.checkout.postalCode} *
                    </label>
                    <input
                      type="text"
                      required
                      value={customer.postalCode}
                      onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })}
                      placeholder="Contoh: 46196"
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Auto Shipping Calculation based on Tamansari Tasikmalaya */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1C3B2B]">
                    <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white flex items-center justify-center text-[10px]">2</span>
                    <span>{t.checkout.autoShippingTitle}</span>
                  </div>
                  <span className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dihitung ke: {customer.city || 'Tujuan'}, {customer.subdistrict || ''}</span>
                  </span>
                </div>

                {/* Shipping Origin & Benchmark Reference Banner */}
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E2D8CA] text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C3B2B]">
                      <MapPin className="w-4 h-4 text-[#B38F5B]" />
                      <span>Acuan Pengiriman:</span>
                      <span className="text-[#3D3830]">{SHIPPING_ORIGIN.subdistrict}, {SHIPPING_ORIGIN.city} ({SHIPPING_ORIGIN.postalCode})</span>
                    </div>
                    <span className="text-[10px] bg-[#1C3B2B] text-white font-semibold px-2.5 py-0.5 rounded-full tracking-wide">
                      Tarif Resmi JNE Express & J&T Express
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#5C5549] pt-1.5 border-t border-[#EAE0D3]">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-[#1F2421]">Lokasi Gudang:</span>
                      <span className="truncate">{SHIPPING_ORIGIN.warehouseName}</span>
                    </div>
                    <div className="flex items-center justify-start sm:justify-end gap-1">
                      <span className="font-semibold text-[#1F2421]">Kalkulasi Berat:</span>
                      <span className="text-[#1C3B2B] font-bold">{billableWeight} kg</span>
                      <span className="text-[#7A7266]">({estimatedWeightKg.toFixed(2)} kg total pakaian)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SHIPPING_SERVICES.filter(service => {
                    if (customer.country !== 'Indonesia') {
                      return service.id === 'dhl-intl';
                    }
                    return service.id !== 'dhl-intl';
                  }).map(shipping => {
                    const dynamicCost = calculateShippingRate(shipping);
                    const isSelected = selectedShipping.id === shipping.id;
                    const isOfficialCourier = shipping.courier.includes('JNE') || shipping.courier.includes('J&T');

                    return (
                      <div
                        key={shipping.id}
                        onClick={() => setSelectedShipping(shipping)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                          isSelected 
                            ? 'border-[#1C3B2B] bg-[#1C3B2B]/5 ring-1 ring-[#1C3B2B]' 
                            : 'border-[#E2D8CA] bg-white hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl leading-none">{shipping.logo}</span>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="text-xs font-bold text-[#1F2421]">{shipping.courier}</h4>
                              <span className="text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.2 rounded font-medium">
                                {shipping.service}
                              </span>
                              {isOfficialCourier && (
                                <span className="text-[9px] bg-[#1C3B2B]/10 text-[#1C3B2B] font-bold px-1.5 py-0.5 rounded">
                                  Resmi Tasikmalaya
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#787063] mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#B38F5B]" />
                              <span>{shipping.estimatedDays}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right whitespace-nowrap pl-2">
                          <span className="text-xs font-bold text-[#1C3B2B] block">
                            {formatPrice(dynamicCost)}
                          </span>
                          <span className="text-[9px] text-[#8C8377]">
                            /{billableWeight} kg
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Integrated Payment Methods */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1C3B2B] border-b border-[#EFE9E0] pb-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white flex items-center justify-center text-[10px]">3</span>
                  <span>{t.checkout.selectPayment}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* QRIS */}
                  <div
                    onClick={() => setSelectedPayment('qris')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedPayment === 'qris'
                        ? 'border-[#1C3B2B] bg-[#1C3B2B]/5 ring-1 ring-[#1C3B2B]'
                        : 'border-[#E2D8CA] bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-[#1C3B2B] shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-[#1F2421]">QRIS Otomatis</h4>
                        <span className="text-[9px] bg-[#2E7D32] text-white px-1.5 py-0.2 rounded-full font-bold">
                          INSTANT
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7A7266] mt-0.5">
                        Scan via BCA, Mandiri, GoPay, OVO, ShopeePay, DANA
                      </p>
                    </div>
                  </div>

                  {/* BCA Virtual Account */}
                  <div
                    onClick={() => setSelectedPayment('va_bca')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedPayment === 'va_bca'
                        ? 'border-[#1C3B2B] bg-[#1C3B2B]/5 ring-1 ring-[#1C3B2B]'
                        : 'border-[#E2D8CA] bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-[#005EAA] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#1F2421]">BCA Virtual Account</h4>
                      <p className="text-[10px] text-[#7A7266] mt-0.5">
                        Verifikasi otomatis 24 jam tanpa perlu bukti transfer
                      </p>
                    </div>
                  </div>

                  {/* Mandiri Virtual Account */}
                  <div
                    onClick={() => setSelectedPayment('va_mandiri')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedPayment === 'va_mandiri'
                        ? 'border-[#1C3B2B] bg-[#1C3B2B]/5 ring-1 ring-[#1C3B2B]'
                        : 'border-[#E2D8CA] bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-[#E5A010] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#1F2421]">Mandiri Virtual Account</h4>
                      <p className="text-[10px] text-[#7A7266] mt-0.5">
                        Bayar via Livin' by Mandiri atau ATM
                      </p>
                    </div>
                  </div>

                  {/* E-Wallet GoPay / ShopeePay */}
                  <div
                    onClick={() => setSelectedPayment('gopay')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedPayment === 'gopay'
                        ? 'border-[#1C3B2B] bg-[#1C3B2B]/5 ring-1 ring-[#1C3B2B]'
                        : 'border-[#E2D8CA] bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-[#00AA13] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#1F2421]">GoPay / Dompet Digital</h4>
                      <p className="text-[10px] text-[#7A7266] mt-0.5">
                        Langsung terhubung dengan aplikasi dompet Anda
                      </p>
                    </div>
                  </div>

                  {/* Credit / Debit Card */}
                  <div
                    onClick={() => setSelectedPayment('cc')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedPayment === 'cc'
                        ? 'border-[#1C3B2B] bg-[#1C3B2B]/5 ring-1 ring-[#1C3B2B]'
                        : 'border-[#E2D8CA] bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-[#4A453E] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#1F2421]">Kartu Kredit / Debit Online</h4>
                      <p className="text-[10px] text-[#7A7266] mt-0.5">
                        Visa, Mastercard, JCB dengan keamanan 3D Secure
                      </p>
                    </div>
                  </div>

                  {/* COD */}
                  <div
                    onClick={() => setSelectedPayment('cod')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedPayment === 'cod'
                        ? 'border-[#1C3B2B] bg-[#1C3B2B]/5 ring-1 ring-[#1C3B2B]'
                        : 'border-[#E2D8CA] bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-[#1C3B2B] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#1F2421]">COD (Bayar di Tempat)</h4>
                      <p className="text-[10px] text-[#7A7266] mt-0.5">
                        Bayar tunai kepada kurir saat paket sampai
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Final Summary */}
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E5DDD2] space-y-2 text-xs">
                <div className="flex justify-between text-[#5C5549]">
                  <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} Produk)</span>
                  <span className="font-semibold text-[#1F2421]">{formatPrice(subtotal)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[#2E7D32]">
                    <span>Potongan Voucher Promo ({appliedCoupon})</span>
                    <span className="font-semibold">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#5C5549]">
                  <span>Ongkos Kirim ({selectedShipping.courier} - {selectedShipping.service})</span>
                  <span className="font-semibold text-[#1F2421]">{formatPrice(dynamicShippingCost)}</span>
                </div>

                <div className="flex justify-between text-base font-bold text-[#1C3B2B] pt-2 border-t border-[#E5DDD2]">
                  <span>Total Tagihan</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#1C3B2B] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#28523C] shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                <span>{isSubmitting ? 'Memproses Pesanan...' : t.checkout.processOrder}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-[#787063]">
                {t.checkout.guarantee}
              </p>
            </form>
          )}

          {/* STEP 2: PAYMENT PENDING (QRIS / VA / SIMULATION) */}
          {step === 'payment_pending' && createdOrder && (
            <div className="space-y-6 text-center py-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Menunggu Pembayaran Otomatis</span>
              </div>

              <div>
                <h3 className="font-display text-xl font-bold text-[#1C3B2B]">
                  ID Pesanan: {createdOrder.id}
                </h3>
                <p className="text-xs text-[#7A7266] mt-1">
                  Selesaikan pembayaran dalam <strong className="text-[#1C3B2B]">15:00 menit</strong>
                </p>
              </div>

              {/* Payment Box Display */}
              <div className="max-w-md mx-auto p-5 bg-[#FAF7F2] rounded-2xl border border-[#E5DDD2] space-y-4">
                <div className="text-sm font-bold text-[#1C3B2B]">
                  Total Tagihan: {formatPrice(createdOrder.total)}
                </div>

                {/* QRIS Display */}
                {createdOrder.payment.channel === 'qris' && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#524B40]">
                      Scan kode QRIS resmi saena.id di bawah ini menggunakan aplikasi mobile banking atau e-wallet:
                    </p>
                    <div className="w-52 h-52 mx-auto p-2 bg-white rounded-xl shadow-md border border-[#E2D8CA]">
                      <img
                        src={createdOrder.payment.qrCodeUrl}
                        alt="QRIS saena.id"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-[11px] text-[#7A7266] flex items-center justify-center gap-2">
                      <span>NMID: ID10200382910</span>
                      <span>•</span>
                      <span>A/N: SAENA ID BOUTIQUE</span>
                    </div>
                  </div>
                )}

                {/* Virtual Account Display */}
                {createdOrder.payment.channel.startsWith('va_') && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#524B40]">
                      Transfer ke Nomor Virtual Account resmi:
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-[#E2D8CA] flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold text-[#1C3B2B] tracking-wider">
                        {createdOrder.payment.virtualAccount}
                      </span>
                      <button
                        onClick={() => handleCopyVA(createdOrder.payment.virtualAccount || '')}
                        className="px-2.5 py-1 text-xs bg-[#1C3B2B]/10 hover:bg-[#1C3B2B]/20 text-[#1C3B2B] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        {copiedVA ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#7A7266]">
                      Bisa ditransfer dari semua bank anggota ATM Bersama / Prima / Alto.
                    </p>
                  </div>
                )}

                {/* E-Wallet / CC display */}
                {!createdOrder.payment.channel.startsWith('va_') && createdOrder.payment.channel !== 'qris' && (
                  <div className="p-3 bg-white rounded-xl border border-[#E2D8CA] text-xs text-[#524B40]">
                    Sistem telah mengirimkan notifikasi otorisasi transaksi ke akun dompet/kartu Anda.
                  </div>
                )}

                {/* SIMULATE PAYMENT BUTTON (Crucial for Instant Verification Demo!) */}
                <div className="pt-2 border-t border-[#EAE2D5]">
                  <button
                    onClick={handleSimulatePayment}
                    className="w-full py-3 px-4 bg-[#2E7D32] hover:bg-[#256829] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#C5A880]" />
                    <span>⚡ Simulasi Pembayaran Berhasil (Webhook Realtime)</span>
                  </button>
                  <span className="text-[10px] text-[#7A7266] block mt-1.5">
                    Klik untuk mensimulasikan callback webhook gateway pembayaran sukses
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ORDER SUCCESS / PAID */}
          {step === 'success' && createdOrder && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="font-display text-2xl font-bold text-[#1C3B2B]">
                  Alhamdulillah, Pesanan Diterima!
                </h3>
                <p className="text-xs text-[#5A5348] mt-1 max-w-md mx-auto">
                  Terima kasih, <strong>{createdOrder.customer.fullName}</strong>. Pesanan Anda dengan ID <strong className="text-[#1C3B2B]">{createdOrder.id}</strong> telah tercatat dan siap dipersiapkan oleh tim butik kami.
                </p>
              </div>

              {/* Order Highlight Card */}
              <div className="max-w-md mx-auto p-4 bg-[#FAF7F2] rounded-2xl border border-[#E5DDD2] text-left text-xs space-y-2.5">
                <div className="flex justify-between pb-2 border-b border-[#EAE2D5]">
                  <span className="text-[#7A7266]">Status Pesanan</span>
                  <span className="font-bold text-[#2E7D32] uppercase">
                    {createdOrder.status === 'dibayar' ? 'LUNAS (Terverifikasi)' : 'DIPROSES (COD)'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#7A7266]">Kurir Ekspedisi</span>
                  <span className="font-semibold text-[#1F2421]">{createdOrder.shipping.courier} ({createdOrder.shipping.service})</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#7A7266]">Nomor Resi Otomatis</span>
                  <span className="font-mono font-bold text-[#1C3B2B]">{createdOrder.trackingNumber}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#7A7266]">Alamat Pengiriman</span>
                  <span className="text-right max-w-[200px] truncate text-[#1F2421]">
                    {createdOrder.customer.city}, {createdOrder.customer.province}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-[#EAE2D5] font-bold text-sm text-[#1C3B2B]">
                  <span>Total Transaksi</span>
                  <span>{formatPrice(createdOrder.total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <button
                  onClick={() => {
                    handleClose();
                    setIsWhatsAppModalOpen(true);
                  }}
                  className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Kirim Notifikasi WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    handleClose();
                    setActiveOrder(createdOrder);
                    setIsOrderTrackingOpen(true);
                  }}
                  className="flex-1 py-3 px-4 bg-[#1C3B2B] hover:bg-[#28523C] text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Lacak Pengiriman Live</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
