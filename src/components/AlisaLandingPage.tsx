import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Star, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Sparkles, 
  Heart, 
  ChevronRight, 
  ChevronDown, 
  ChevronLeft,
  ShoppingBag, 
  ArrowRight, 
  RotateCcw, 
  Tag, 
  Package, 
  Layers, 
  Scissors, 
  Compass, 
  Award,
  AlertCircle,
  ThumbsUp,
  Share2,
  Lock,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Eye,
  Camera,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  CreditCard,
  Printer,
  FileText,
  Building2,
  Smartphone,
  AlertTriangle,
  Home,
  RefreshCw,
  MessageCircle,
  LayoutDashboard,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';
import { Order, PaymentChannel, MengantarOrderData, DokuPaymentData } from '../types';
import { createMengantarOrderApi } from '../utils/mengantarClient';
import { createDokuPaymentApi } from '../utils/dokuClient';
import { validateIndonesianAddress, AddressValidationResult } from '../utils/addressValidation';
import { generateValidQrisPayload, getQrisImageUrl, getSmartQrisForOrder } from '../utils/qrisGenerator';
import { 
  trackMetaPageView, 
  trackMetaViewContent, 
  trackMetaInitiateCheckout, 
  trackMetaPurchase 
} from '../utils/metaPixel';

// Visual Assets downloaded locally
const IMAGES = {
  pinkModel: '/assets/alisa/alisa-pink-model.webp',
  pinkClose: '/assets/alisa/alisa-pink-close.webp',
  sageModel: '/assets/alisa/alisa-sage-model-v3.webp',
  sageDetail: '/assets/alisa/alisa-sage-detail-v3.webp',
  sageFull: '/assets/alisa/alisa-sage-full-v3.webp'
};

// Curated Gallery Items with rich metadata
export const GALLERY_PHOTOS = [
  {
    id: 'pink-model',
    src: IMAGES.pinkModel,
    title: 'Mukena Alisa Dusty Pink - Tampak Depan Model',
    shortTitle: 'Tampak Depan',
    category: 'Varian Dusty Pink',
    description: 'Bahan katun mikro grade A premium jatuh anggun, adem di kulit, dan tidak menerawang. Motif bunga sakura pastel menawan.',
    color: 'Dusty Pink' as const,
    tag: 'Best Seller'
  },
  {
    id: 'pink-close',
    src: IMAGES.pinkClose,
    title: 'Detail Resleting Dagu 2in1 & Penutup Dagu',
    shortTitle: 'Detail Dagu & Resleting',
    category: 'Fitur 2in1 Fleksibel',
    description: 'Resleting jepang rapi di bawah dagu. Bisa dibuka jadi model ponco tanpa merusak hijab, atau ditutup rapi menutup aurat dagu sesuai syariat.',
    color: 'Dusty Pink' as const,
    tag: 'Fitur 2in1'
  },
  {
    id: 'sage-model',
    src: IMAGES.sageModel,
    title: 'Mukena Alisa Sage Green - Tampak Penuh Model',
    shortTitle: 'Model Sage Green',
    category: 'Varian Sage Green',
    description: 'Nuansa hijau sage floral pastel yang sejuk, adem, dan menenangkan dipadu motif bunga mekar lembut dan aksen daun.',
    color: 'Sage Green' as const,
    tag: 'Warna Sejuk'
  },
  {
    id: 'sage-detail',
    src: IMAGES.sageDetail,
    title: 'Finishing Pinggiran Laser Cut Bergelombang Presisi',
    shortTitle: 'Laser Cut Presisi',
    category: 'Finishing Mewah',
    description: 'Tepian dipotong menggunakan laser cut presisi membentuk motif kelopak melengkung rapi tanpa benang obras yang berudul.',
    color: 'Sage Green' as const,
    tag: 'Laser Cut'
  },
  {
    id: 'sage-full',
    src: IMAGES.sageFull,
    title: 'Satu Set Lengkap Mukena + Mini Pouch Traveling',
    shortTitle: 'Set + Mini Pouch',
    category: 'Kelengkapan Set',
    description: 'Satu set terdiri dari atasan mukena jumbo (117/120 cm), rok bawahan (110x73 cm), dan tas pouch traveling ringkas (18x15 cm, ±400 gr).',
    color: 'Sage Green' as const,
    tag: 'Set Lengkap'
  }
];

interface AlisaLandingPageProps {
  onNavigateHome?: () => void;
  onNavigateOrder?: (packageId?: string, color?: string) => void;
}

export const AlisaLandingPage: React.FC<AlisaLandingPageProps> = ({ onNavigateHome, onNavigateOrder }) => {
  const { 
    orders,
    sendPushNotification,
    setOrders,
    dokuConfig,
    mengantarConfig,
    products,
    syncOrderToFirestore,
    recordDirectOrder,
    setActiveMengantarLabelOrder,
    setIsMengantarLabelModalOpen,
    isAdminMode,
    isAuthenticatedAdmin,
    setIsAdminMode,
    setIsDokuConfigModalOpen,
    confirmOrderPayment,
    updateOrderStatus
  } = useStore();

  // Variant & Image State
  const [selectedColor, setSelectedColor] = useState<'Dusty Pink' | 'Sage Green'>('Dusty Pink');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // Active image derived from activePhotoIndex
  const activeImage = GALLERY_PHOTOS[activePhotoIndex]?.src || IMAGES.pinkModel;

  // Auto switch image when color variant changes
  useEffect(() => {
    if (selectedColor === 'Dusty Pink') {
      // Find first pink photo
      const idx = GALLERY_PHOTOS.findIndex(p => p.color === 'Dusty Pink');
      if (idx !== -1 && GALLERY_PHOTOS[activePhotoIndex]?.color !== 'Dusty Pink') {
        setActivePhotoIndex(idx);
      }
    } else {
      // Find first sage green photo
      const idx = GALLERY_PHOTOS.findIndex(p => p.color === 'Sage Green');
      if (idx !== -1 && GALLERY_PHOTOS[activePhotoIndex]?.color !== 'Sage Green') {
        setActivePhotoIndex(idx);
      }
    }
  }, [selectedColor]);

  // Sync color when user selects a photo
  const handleSelectPhoto = (index: number) => {
    setActivePhotoIndex(index);
    const photo = GALLERY_PHOTOS[index];
    if (photo && photo.color !== selectedColor) {
      setSelectedColor(photo.color);
    }
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextIdx = (activePhotoIndex + 1) % GALLERY_PHOTOS.length;
    handleSelectPhoto(nextIdx);
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const prevIdx = (activePhotoIndex - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length;
    handleSelectPhoto(prevIdx);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsZoomed(false);
    setLightboxOpen(true);
  };

  const handleLightboxNext = () => {
    setIsZoomed(false);
    setLightboxIndex((prev) => (prev + 1) % GALLERY_PHOTOS.length);
  };

  const handleLightboxPrev = () => {
    setIsZoomed(false);
    setLightboxIndex((prev) => (prev - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        handleLightboxNext();
      } else if (e.key === 'ArrowLeft') {
        handleLightboxPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // Packages
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

  // Secondary color for 2pcs / 3pcs bundle
  const [secondaryColor, setSecondaryColor] = useState<'Dusty Pink' | 'Sage Green'>('Sage Green');

  // Countdown timer state (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 47, seconds: 18 });
  useEffect(() => {
    // Fire Meta Ads Pixel PageView & ViewContent
    trackMetaPageView();
    trackMetaViewContent({
      contentName: 'Mukena Traveling 2in1 Laser Cut Alisa Premium',
      contentCategory: 'Mukena Traveling',
      value: 79500,
      currency: 'IDR'
    });

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 2, minutes: 59, seconds: 59 }; // reset loop
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Stock scarcity indicator
  const [stockLeft] = useState(14);

  // Central redirect function to domain https://order.saena.my.id/order
  const handleGoToOrder = (packageId?: string, color?: string) => {
    const pkg = packageId || selectedPackageId;
    const col = color || selectedColor;
    const targetPkgObj = packages.find(p => p.id === pkg) || currentPackage;

    try {
      trackMetaInitiateCheckout({
        contentName: targetPkgObj.title,
        value: targetPkgObj.promoPrice,
        currency: 'IDR',
        numItems: targetPkgObj.qty
      });
    } catch {
      // ignore
    }

    const params = new URLSearchParams();
    if (pkg) params.set('package', pkg);
    if (col) params.set('color', col);
    const qs = params.toString();
    const targetUrl = qs ? `https://order.saena.my.id/order?${qs}` : 'https://order.saena.my.id/order';

    // Karena domain order.saena.my.id tersimpan di host/server eksternal terpisah:
    if (onNavigateOrder) {
      onNavigateOrder(pkg, col);
    }
    window.location.href = targetUrl;
  };

  const scrollToForm = (pkgId?: any, colName?: any) => {
    handleGoToOrder(typeof pkgId === 'string' ? pkgId : undefined, typeof colName === 'string' ? colName : undefined);
  };

  // Central redirect to /payment
  const handleGoToPayment = (orderId?: string) => {
    const targetId = orderId || (orders && orders.length > 0 ? orders[0].id : '');
    const url = targetId ? '/payment?orderId=' + targetId : '/payment';
    window.location.href = url;
  };

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = [
    {
      q: 'Apakah benar bisa bayar di tempat (COD)?',
      a: 'Sangat bisa! Anda cukup isi data alamat di form pemesanan ini. Paket akan dikirim oleh kurir ke rumah Anda, dan Anda baru bayar uangnya langsung ke kurir saat barang sudah diterima.'
    },
    {
      q: 'Bagaimana syarat mendapatkan Gratis Ongkir?',
      a: 'Sangat mudah! Beli 2 Pcs atau lebih, promo Bebas Ongkos Kirim (Gratis Ongkir) ke seluruh wilayah Indonesia langsung aktif secara otomatis di formulir pesanan Anda. Anda juga bebas memilih kombinasi warna (Dusty Pink & Sage Green).'
    },
    {
      q: 'Apakah bahan katun mikro Alisa ini panas atau menerawang?',
      a: 'Sama sekali tidak! Bahan katun mikro grade A Alisa dirancang dengan kerapatan serat tinggi sehingga tidak menerawang saat dipakai sholat, namun tetap lembut, dingin semriwing di kulit, dan ringan.'
    },
    {
      q: 'Bagaimana cara menggunakan fitur 2in1?',
      a: 'Di bawah dagu terdapat resleting jepang rapi. Anda bisa memakainya sebagai mukena biasa bertali menutup dagu, atau membuka resletingnya untuk dipakai model ponco (di bawah leher) sehingga tatanan hijab/jilbab Anda tetap rapi saat sholat di kantor atau perjalanan.'
    },
    {
      q: 'Berapa ukuran mukena Alisa ini? Apakah muat untuk badan gemuk?',
      a: 'Ukuran mukena ini berstandar jumbo dewasa: Panjang depan 117 cm, panjang belakang 120 cm, dan keliling rok hingga 146 cm. Sangat aman dan leluasa dipakai hingga tinggi 170 cm dan berat badan 85 kg.'
    },
    {
      q: 'Berapa lama pengiriman sampai ke rumah saya?',
      a: 'Pengiriman dilakukan setiap hari kerja langsung dari gudang butik kami di Tasikmalaya. Untuk area Jabodetabek & Jawa Barat rata-rata 1-2 hari, Jawa Tengah & Jawa Timur 2-3 hari, dan luar pulau Jawa 3-5 hari kerja.'
    },
    {
      q: 'Bagaimana sistem pengiriman melalui Mengantar.com?',
      a: 'Situs saena.my.id terintegrasi langsung dengan platform logistik Mengantar.com. Saat Anda menyelesaikan pesanan, nomor resi kurir resmi (JNE, J&T, atau SiCepat) otomatis terbit seketika dan kurir langsung dijadwalkan pickup di Central Warehouse Tasikmalaya. Anda bisa melacak status paket secara real-time kapan saja.'
    },
    {
      q: 'Apakah aman bertransaksi transfer atau QRIS melalui DOKU?',
      a: 'Sangat aman! Seluruh pembayaran Transfer Bank (Virtual Account) dan QRIS diproses resmi melalui DOKU Payment Gateway yang telah berlisensi Bank Indonesia dan bersertifikasi PCI-DSS Level 1. Verifikasi otomatis 24 jam tanpa perlu konfirmasi manual.'
    },
    {
      q: 'Bagaimana jika pesanan saya cacat atau tidak sesuai?',
      a: 'Kami memberikan Garansi 100% Tukar Baru atau Uang Kembali! Cukup hubungi tim layanan pelanggan kami, pesanan Anda akan kami gantikan tanpa dipungut biaya sepeser pun.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C241E] font-sans antialiased pb-24">
      {/* 1. Urgency Countdown Top Ribbon */}
      <div className="bg-gradient-to-r from-[#88222A] via-[#9E2A2B] to-[#751A20] text-white py-2 px-3 text-center text-xs sm:text-sm font-medium shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> PROMO SPESIAL HARI INI
          </span>
          <span className="hidden sm:inline">Harga Rp 79.500 • Beli 2 Pcs Gratis Ongkir:</span>
          <div className="flex items-center gap-1 font-mono font-bold text-yellow-300 bg-black/30 px-2 py-0.5 rounded text-xs">
            <span>{String(timeLeft.hours).padStart(2, '0')}</span> :
            <span>{String(timeLeft.minutes).padStart(2, '0')}</span> :
            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
          <span className="text-[11px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
            TERSEDIA TF BANK & COD
          </span>
        </div>
      </div>

      {/* 2. Brand Nav Header */}
      <header className="bg-white/95 backdrop-blur border-b border-[#E8DFC8]/60 py-3.5 px-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1C3B2B] flex items-center justify-center text-[#E6CBA6] font-serif font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <div className="font-serif text-lg font-bold text-[#1C3B2B] tracking-tight leading-none">
                saena<span className="text-[#C5A880]">.my.id</span>
              </div>
              <p className="text-[10px] text-[#7A6E5F] tracking-wider uppercase font-semibold">Alisa Premium Series</p>
            </div>
          </div>
          <button
            onClick={scrollToForm}
            className="bg-[#C5A880] hover:bg-[#b09267] text-[#1C3B2B] font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
          >
            <span>Pesan Sekarang</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. Hero Section (High Impact Conversion) */}
      <section className="py-6 sm:py-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-[#1C3B2B] text-[#E6CBA6] text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> 100% KATUN MIKRO GRADE A
            </span>
            <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> RESLETING 2IN1 + LASER CUT
            </span>
            <div className="flex items-center gap-1 text-amber-500 text-xs ml-auto">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-[#4A3E31] font-semibold text-xs ml-1">4.9 / 5.0 (1.840+ Terjual)</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#1C3B2B] leading-tight mb-3">
            Mukena Traveling Terbaru Mini Pouch 2in1 Laser Cut Motif Katun Micro Alisa Premium
          </h1>
          <p className="text-sm sm:text-base text-[#615446] leading-relaxed mb-6">
            Solusi ibadah khusyuk di mana saja tanpa repot! Dibuat dari bahan katun mikro super adem, lembut, tidak menerawang dengan resleting dagu fleksibel dan tas pouch mungil yang muat masuk ke dalam tas kerja ataupun koper bepergian Anda.
          </p>

          {/* Media Showcase & Variant Selector */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-[#E8DFC8] shadow-sm mb-8">
            {/* Gallery Column */}
            <div className="md:col-span-7 flex flex-col gap-3">
              {/* Main Product Frame */}
              <div 
                onClick={() => openLightbox(activePhotoIndex)}
                className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#E8DFC8] shadow-md group cursor-pointer"
                title="Klik untuk memperbesar foto resolusi tinggi"
              >
                <img 
                  src={activeImage} 
                  alt={GALLERY_PHOTOS[activePhotoIndex]?.title || "Mukena Traveling Alisa Premium"} 
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />

                {/* Floating Navigation Controls */}
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#1C3B2B] flex items-center justify-center shadow-md backdrop-blur-sm transition-all hover:scale-110 z-10 cursor-pointer"
                  aria-label="Foto Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#1C3B2B] flex items-center justify-center shadow-md backdrop-blur-sm transition-all hover:scale-110 z-10 cursor-pointer"
                  aria-label="Foto Berikutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <div className="bg-[#1C3B2B]/90 backdrop-blur text-[#E6CBA6] text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1.5 border border-white/20">
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-white/50" 
                      style={{ backgroundColor: selectedColor === 'Dusty Pink' ? '#E8A5A5' : '#7D9C86' }}
                    />
                    <span>{GALLERY_PHOTOS[activePhotoIndex]?.color || selectedColor}</span>
                  </div>
                </div>

                <div className="absolute top-3 right-3 z-10">
                  <span className="bg-[#88222A]/90 backdrop-blur text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow border border-white/20">
                    {GALLERY_PHOTOS[activePhotoIndex]?.tag || 'Real-Pict Butik'}
                  </span>
                </div>

                {/* Bottom Caption & Zoom Bar */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 text-white flex items-end justify-between z-10">
                  <div>
                    <p className="text-xs font-bold leading-snug drop-shadow-sm text-white/95">
                      {GALLERY_PHOTOS[activePhotoIndex]?.title}
                    </p>
                    <p className="text-[10px] text-white/75 flex items-center gap-1 mt-0.5">
                      <Camera className="w-3 h-3 text-[#E6CBA6]" /> 100% Foto Asli saena.my.id • Katun Mikro Grade A
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all">
                    <ZoomIn className="w-3.5 h-3.5 text-[#E6CBA6]" />
                    <span>Zoom HD</span>
                  </div>
                </div>
              </div>

              {/* Thumbnails Strip with Rich Labels */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#7A6E5F] font-semibold mb-1.5 px-1">
                  <span>Pilih Sudut Pandang Foto:</span>
                  <span className="text-[#1C3B2B] font-mono font-bold">Foto {activePhotoIndex + 1} dari {GALLERY_PHOTOS.length}</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {GALLERY_PHOTOS.map((thumb, idx) => {
                    const isActive = activePhotoIndex === idx;
                    return (
                      <button
                        key={thumb.id}
                        type="button"
                        onClick={() => handleSelectPhoto(idx)}
                        className={`group flex flex-col items-center text-left transition-all cursor-pointer focus:outline-none ${
                          isActive ? 'scale-[1.02]' : 'opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className={`relative aspect-square w-full rounded-xl overflow-hidden border-2 transition-all ${
                          isActive 
                            ? 'border-[#1C3B2B] shadow-md ring-2 ring-[#C5A880]' 
                            : 'border-gray-200 bg-gray-100 hover:border-[#C5A880]/60'
                        }`}>
                          <img 
                            src={thumb.src} 
                            alt={thumb.shortTitle} 
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" 
                          />
                          {isActive && (
                            <div className="absolute inset-0 bg-[#1C3B2B]/10 ring-1 ring-inset ring-[#C5A880]" />
                          )}
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded font-mono">
                            0{idx + 1}
                          </div>
                        </div>
                        <span className={`text-[10px] leading-tight text-center mt-1 truncate max-w-full ${
                          isActive ? 'font-bold text-[#1C3B2B]' : 'font-medium text-gray-500'
                        }`}>
                          {thumb.shortTitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Product Quick Info & Pricing Box */}
            <div className="md:col-span-5 flex flex-col justify-between">
              <div>
                {/* Promo Price Box */}
                <div className="bg-gradient-to-br from-[#FAF6EE] to-[#F3ECE0] p-4 rounded-xl border border-[#C5A880]/40 mb-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-[#7A6E5F] uppercase tracking-wider font-semibold">Harga Promo Satuan</span>
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Hemat 50%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-[#88222A]">
                      Rp 79.500
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      Rp 159.000
                    </span>
                    <span className="text-xs text-gray-500 font-medium">/ pcs</span>
                  </div>

                  {/* Free shipping trigger */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-2.5 text-xs text-emerald-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-800">Beli 2 Pcs Langsung GRATIS ONGKIR!</span>
                      <p className="text-[11px] text-emerald-700 font-normal">Bisa campur warna Dusty Pink & Sage Green.</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#4A3E31] flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Termasuk 1x Mukena 2in1 + 1x Tas Pouch Traveling Cantik
                  </p>

                  {/* Scarcity Meter */}
                  <div className="mt-3 pt-3 border-t border-[#E8DFC8]">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#88222A]">Sisa Kuota Diskon:</span>
                      <span className="text-[#88222A] font-bold">{stockLeft} Pcs Lagi</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-red-600 w-[78%] rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Color Selection Pill */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider mb-2">
                    Pilih Varian Warna Favorit:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedColor('Dusty Pink');
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedColor === 'Dusty Pink'
                          ? 'border-[#88222A] bg-rose-50 text-[#88222A] font-bold shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-[#E8A5A5] border border-black/10 shadow-inner" />
                      <div className="text-left">
                        <div className="text-xs">Dusty Pink</div>
                        <div className="text-[10px] text-gray-500 font-normal">Floral Sakura Manis</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedColor('Sage Green');
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedColor === 'Sage Green'
                          ? 'border-[#1C3B2B] bg-emerald-50 text-[#1C3B2B] font-bold shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-[#7D9C86] border border-black/10 shadow-inner" />
                      <div className="text-left">
                        <div className="text-xs">Sage Green</div>
                        <div className="text-[10px] text-gray-500 font-normal">Floral Sage Lembut</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Trust Highlights */}
                <div className="space-y-1.5 text-xs text-[#524436] mb-5">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Bisa Bayar di Tempat (COD)</strong> ke kurir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#1C3B2B] shrink-0" />
                    <span><strong>Garansi 100% Uang Kembali</strong> jika cacat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#C5A880] shrink-0" />
                    <span>Pengiriman Cepat dari Butik Tasikmalaya</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="w-full bg-[#88222A] hover:bg-[#721B22] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base animate-pulse"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>PESAN SEKARANG (BISA TF BANK & COD)</span>
                </button>
                <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-medium pt-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Beli 2 Pcs Langsung Gratis Ongkos Kirim</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Masalah vs Solusi (Direct Response Hook) */}
      <section className="py-8 bg-[#F5EFE6] px-4 border-y border-[#E8DFC8]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <span className="text-xs font-bold text-[#88222A] uppercase tracking-wider bg-red-100 px-3 py-1 rounded-full">
              Pernahkah Anda Mengalami Ini?
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C3B2B] mt-2">
              Sering Merasa Risih & Ribet Saat Mau Sholat di Luar Rumah?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* The Pain */}
            <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm space-y-3">
              <h3 className="font-bold text-red-700 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" /> Kendala Mukena Pasaran Biasa:
              </h3>
              <ul className="space-y-2 text-xs text-[#524436]">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span><strong>Bahan Panas & Gerah:</strong> Baru pakai sebentar sudah keringatan, sholat jadi buru-buru dan tidak tenang.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span><strong>Tipis Menerawang:</strong> Bahan parasut murahan tembus pandang saat terkena lampu musholla/masjid.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span><strong>Ribet Bongkar Hijab:</strong> Harus melepas jilbab dan menata ulang rambut serta jarum pentul.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span><strong>Tas Tebal & Berat:</strong> Menghabiskan ruang di tas kerja atau ransel perjalanan Anda.</span>
                </li>
              </ul>
            </div>

            {/* The Solution */}
            <div className="bg-gradient-to-br from-[#1C3B2B] to-[#254F3A] p-5 rounded-2xl text-white shadow-md space-y-3">
              <h3 className="font-bold text-[#E6CBA6] flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4" /> Solusi Mukena Alisa Premium:
              </h3>
              <ul className="space-y-2 text-xs text-white/90">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 font-bold shrink-0" />
                  <span><strong>Katun Mikro Adem Semriwing:</strong> Lembut, dingin di kulit, nyaman dipakai di semua musim cuaca.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 font-bold shrink-0" />
                  <span><strong>Serat Padat Anti Nerawang:</strong> Sholat tenang & khusyuk tanpa was-was aurat terlihat.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 font-bold shrink-0" />
                  <span><strong>Resleting Dagu 2in1:</strong> Bisa model ponco tanpa melepas hijab, atau model biasa bertali.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 font-bold shrink-0" />
                  <span><strong>Mini Pouch Ringkas 400 gram:</strong> Mungil, estetik, tinggal masukkan ke tas tanpa repot!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Galeri Detail Kualitas Butik (Real-Pict Showcase) */}
      <section className="py-10 px-4 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-[#1C3B2B] uppercase tracking-wider bg-[#E8DFC8]/70 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#88222A]" /> Foto Real-Pict Butik Saena
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C3B2B] mt-2">
              Bongkar Detail Kualitas Mukena Alisa
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6E5F] max-w-xl mx-auto mt-1">
              Setiap helai kain, jahitan, dan potongan laser cut dikerjakan dengan standar butik tinggi demi kenyamanan ibadah terbaik Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Card 1: Laser Cut Detail */}
            <div 
              onClick={() => openLightbox(3)}
              className="bg-white rounded-2xl border border-[#E8DFC8] overflow-hidden shadow-sm hover:shadow-md hover:border-[#C5A880] transition-all group cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                <img 
                  src={IMAGES.sageDetail} 
                  alt="Detail Laser Cut Mukena Alisa" 
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-[#1C3B2B]/90 backdrop-blur text-[#E6CBA6] text-[11px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-[#E6CBA6]" /> Laser Cut Presisi
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-[#E6CBA6]" /> Perbesar Foto
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1C3B2B] mb-1">
                    1. Finishing Pinggiran Laser Cut Bergelombang
                  </h3>
                  <p className="text-xs text-[#615446] leading-relaxed">
                    Tepian dipotong mesin laser termal presisi membentuk motif kelopak melengkung mewah. Rapi sempurna tanpa benang rontok atau jahitan obras yang berudul meski dicuci berulang kali.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Standar Jahitan Butik Premium
                </div>
              </div>
            </div>

            {/* Card 2: 2in1 Zipper Detail */}
            <div 
              onClick={() => openLightbox(1)}
              className="bg-white rounded-2xl border border-[#E8DFC8] overflow-hidden shadow-sm hover:shadow-md hover:border-[#C5A880] transition-all group cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                <img 
                  src={IMAGES.pinkClose} 
                  alt="Detail Resleting 2in1 Mukena Alisa" 
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-[#88222A]/90 backdrop-blur text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-300" /> Inovasi 2in1 Praktis
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-[#E6CBA6]" /> Perbesar Foto
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1C3B2B] mb-1">
                    2. Desain 2in1 Resleting Dagu Tanpa Lepas Hijab
                  </h3>
                  <p className="text-xs text-[#615446] leading-relaxed">
                    Resleting jepang rapi di bawah leher memudahkan Anda memakai model ponco tanpa merusak jilbab & jarum pentul saat di kantor atau mall, atau ditutup rapat menutup dagu sempurna sesuai syariat.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Praktis Saat Jam Istirahat Kerja
                </div>
              </div>
            </div>

            {/* Card 3: Fabric Quality Detail */}
            <div 
              onClick={() => openLightbox(0)}
              className="bg-white rounded-2xl border border-[#E8DFC8] overflow-hidden shadow-sm hover:shadow-md hover:border-[#C5A880] transition-all group cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                <img 
                  src={IMAGES.pinkModel} 
                  alt="Bahan Katun Mikro Premium Alisa" 
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-[#1C3B2B]/90 backdrop-blur text-[#E6CBA6] text-[11px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                  <Award className="w-3 h-3 text-[#C5A880]" /> Katun Mikro Grade A
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-[#E6CBA6]" /> Perbesar Foto
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1C3B2B] mb-1">
                    3. Bahan Katun Mikro Adem, Dingin & Tidak Menerawang
                  </h3>
                  <p className="text-xs text-[#615446] leading-relaxed">
                    Dingin semriwing saat bersentuhan dengan kulit, tekstur halus lembut tidak berisik, jatuh anggun di badan, dan serat kain padat tebal sehingga tidak tembus pandang di bawah sorot lampu musholla.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Terbukti Adem di Semua Musim
                </div>
              </div>
            </div>

            {/* Card 4: Mini Pouch & Full Set */}
            <div 
              onClick={() => openLightbox(4)}
              className="bg-white rounded-2xl border border-[#E8DFC8] overflow-hidden shadow-sm hover:shadow-md hover:border-[#C5A880] transition-all group cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                <img 
                  src={IMAGES.sageFull} 
                  alt="Satu Set Lengkap + Mini Pouch Mukena Alisa" 
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-[#1C3B2B]/90 backdrop-blur text-[#E6CBA6] text-[11px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                  <Package className="w-3 h-3 text-[#C5A880]" /> Mini Pouch Ringkas
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-[#E6CBA6]" /> Perbesar Foto
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1C3B2B] mb-1">
                    4. Lengkap dengan Mini Pouch Traveling Ringkas (400 gr)
                  </h3>
                  <p className="text-xs text-[#615446] leading-relaxed">
                    Setiap pembelian sudah termasuk tas serut pouch imut (18 x 15 cm) bermotif senada. Sangat hemat ruang, ringan dibawa di dalam sling bag kerja, tote bag, maupun koper perjalanan ibadah umroh/haji.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Traveling-Friendly & Ringkas
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Spesifikasi & Ukuran Standar Dewasa (Sesuai Referensi) */}
      <section className="py-8 bg-white px-4 border-y border-[#E8DFC8]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <span className="text-xs font-bold text-[#88222A] uppercase tracking-wider bg-rose-50 px-3 py-1 rounded-full">
              Ukuran Leluasa & Pas
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#1C3B2B] mt-2">
              Spesifikasi Ukuran Standar Dewasa (Jumbo Fit)
            </h2>
            <p className="text-xs text-[#7A6E5F] mt-1">
              Potongan leluasa menjamin kenyamanan sempurna, tidak menggantung saat sujud maupun rukuk.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-6">
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8DFC8]">
              <div className="text-[11px] text-[#7A6E5F] font-semibold uppercase">Panjang Depan</div>
              <div className="font-mono text-xl font-black text-[#1C3B2B] mt-1">117 cm</div>
              <div className="text-[10px] text-gray-500">Atasan Bagian Muka</div>
            </div>
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8DFC8]">
              <div className="text-[11px] text-[#7A6E5F] font-semibold uppercase">Panjang Belakang</div>
              <div className="font-mono text-xl font-black text-[#1C3B2B] mt-1">120 cm</div>
              <div className="text-[10px] text-gray-500">Atasan Bagian Belakang</div>
            </div>
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8DFC8]">
              <div className="text-[11px] text-[#7A6E5F] font-semibold uppercase">Panjang Rok</div>
              <div className="font-mono text-xl font-black text-[#1C3B2B] mt-1">110 cm</div>
              <div className="text-[10px] text-gray-500">Bawahan Menutup Kaki</div>
            </div>
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8DFC8]">
              <div className="text-[11px] text-[#7A6E5F] font-semibold uppercase">Lebar Rok</div>
              <div className="font-mono text-xl font-black text-[#1C3B2B] mt-1">73 cm</div>
              <div className="text-[10px] text-gray-500">Keliling 146 cm (Jumbo)</div>
            </div>
          </div>

          <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#C5A880]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#524436]">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#1C3B2B] text-[#E6CBA6] flex items-center justify-center font-bold shrink-0">
                ✓
              </span>
              <div>
                <strong>Kesesuaian Badan:</strong> Muat untuk tinggi badan s/d <strong>170 cm</strong> dan berat badan hingga <strong>85 kg</strong>.
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#7A6E5F]">
              <Package className="w-4 h-4 text-[#88222A]" />
              <span>Ukuran Tas: <strong>18 x 15 cm</strong> | Bobot: <strong>±400 gr</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Galeri Varian Warna (Real-Pict Lookbook) */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-[#1C3B2B] uppercase tracking-wider bg-[#E8DFC8]/60 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> 2 Pilihan Warna Anggun
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C3B2B] mt-2">
              Katalog Varian Warna Mukena Alisa
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6E5F] mt-1">
              Motif bunga shabby chic pastel yang memberikan aura wajah segar, cerah, dan menenangkan saat beribadah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Color 1: Dusty Pink */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[#E8DFC8] shadow-sm hover:shadow-md transition-all flex flex-col">
              <div 
                onClick={() => openLightbox(0)}
                className="relative aspect-[4/5] bg-gray-100 overflow-hidden group cursor-pointer"
              >
                <img 
                  src={IMAGES.pinkModel} 
                  alt="Mukena Alisa Dusty Pink" 
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 bg-[#88222A] text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-white" /> Favorit Terlaris
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-[#E6CBA6]" /> Klik Zoom HD
                </div>
              </div>

              {/* Sub photo selectors for Dusty Pink */}
              <div className="px-4 pt-3 pb-2 bg-[#FAF8F5] border-y border-[#E8DFC8] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#7A6E5F]">Sudut Foto Pink:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openLightbox(0)}
                    className="text-[10px] bg-white border border-[#C5A880] text-[#1C3B2B] font-bold px-2 py-1 rounded-lg hover:bg-[#FAF6EE] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-[#88222A]" /> Tampak Depan
                  </button>
                  <button
                    type="button"
                    onClick={() => openLightbox(1)}
                    className="text-[10px] bg-white border border-[#C5A880] text-[#1C3B2B] font-bold px-2 py-1 rounded-lg hover:bg-[#FAF6EE] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-[#88222A]" /> Detail Dagu
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-serif text-lg font-bold text-[#1C3B2B]">Dusty Pink Sakura</h3>
                    <span className="text-[11px] bg-rose-50 text-[#88222A] font-bold px-2 py-0.5 rounded border border-rose-200">
                      Stok Tersedia
                    </span>
                  </div>
                  <p className="text-xs text-[#615446] leading-relaxed">
                    Warna pink pastel lembut dengan sentuhan motif bunga lavender dan dedaunan zaitun. Sangat manis, anggun, dan membuat kulit tampak lebih cerah berseri.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openLightbox(0)}
                    className="w-10 h-10 rounded-xl border border-[#C5A880] text-[#1C3B2B] hover:bg-[#FAF6EE] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Perbesar Foto HD"
                  >
                    <ZoomIn className="w-4 h-4 text-[#88222A]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedColor('Dusty Pink');
                      setActivePhotoIndex(0);
                      handleGoToOrder(undefined, 'Dusty Pink');
                    }}
                    className="flex-1 bg-[#88222A] hover:bg-[#721B22] text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    Pilih Warna Dusty Pink
                  </button>
                </div>
              </div>
            </div>

            {/* Color 2: Sage Green */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[#E8DFC8] shadow-sm hover:shadow-md transition-all flex flex-col">
              <div 
                onClick={() => openLightbox(2)}
                className="relative aspect-[4/5] bg-gray-100 overflow-hidden group cursor-pointer"
              >
                <img 
                  src={IMAGES.sageModel} 
                  alt="Mukena Alisa Sage Green Floral" 
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 bg-[#1C3B2B] text-[#E6CBA6] text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#E6CBA6]" /> Nuansa Sejuk Alami
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-[#E6CBA6]" /> Klik Zoom HD
                </div>
              </div>

              {/* Sub photo selectors for Sage Green */}
              <div className="px-4 pt-3 pb-2 bg-[#FAF8F5] border-y border-[#E8DFC8] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#7A6E5F]">Sudut Foto Sage:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openLightbox(2)}
                    className="text-[10px] bg-white border border-[#C5A880] text-[#1C3B2B] font-bold px-2 py-1 rounded-lg hover:bg-[#FAF6EE] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-[#1C3B2B]" /> Model
                  </button>
                  <button
                    type="button"
                    onClick={() => openLightbox(3)}
                    className="text-[10px] bg-white border border-[#C5A880] text-[#1C3B2B] font-bold px-2 py-1 rounded-lg hover:bg-[#FAF6EE] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-[#1C3B2B]" /> Laser Cut
                  </button>
                  <button
                    type="button"
                    onClick={() => openLightbox(4)}
                    className="text-[10px] bg-white border border-[#C5A880] text-[#1C3B2B] font-bold px-2 py-1 rounded-lg hover:bg-[#FAF6EE] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-[#1C3B2B]" /> Tas Pouch
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-serif text-lg font-bold text-[#1C3B2B]">Sage Green Floral</h3>
                    <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                      Stok Tersedia
                    </span>
                  </div>
                  <p className="text-xs text-[#615446] leading-relaxed">
                    Warna hijau sage lembut natural (matte pastel alami) hasil jepretan asli kamera, dipadu motif bunga mekar dan dedaunan zaitun. Sangat adem di mata, tidak mencolok, dan menenangkan jiwa saat beribadah.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openLightbox(2)}
                    className="w-10 h-10 rounded-xl border border-[#C5A880] text-[#1C3B2B] hover:bg-[#FAF6EE] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Perbesar Foto HD"
                  >
                    <ZoomIn className="w-4 h-4 text-[#1C3B2B]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedColor('Sage Green');
                      setActivePhotoIndex(2);
                      handleGoToOrder(undefined, 'Sage Green');
                    }}
                    className="flex-1 bg-[#1C3B2B] hover:bg-[#14291e] text-[#E6CBA6] text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    Pilih Warna Sage Green
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Testimoni Pembeli (Social Proof + Foto Pembeli) */}
      <section className="py-10 bg-[#FAF6EE] px-4 border-y border-[#E8DFC8]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-1 text-amber-500 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1C3B2B]">
              Apa Kata Mereka yang Sudah Membeli?
            </h2>
            <p className="text-xs text-[#7A6E5F] mt-1">
              Foto dan kepuasan nyata dari 1.800+ muslimah di seluruh Indonesia
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Review 1 */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8DFC8] shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-[#88222A] font-bold flex items-center justify-center text-xs">
                    DA
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1C3B2B]">dr. Annisa Larasati</div>
                    <div className="text-[10px] text-gray-500">Jakarta Selatan • Pembeli Terverifikasi</div>
                  </div>
                </div>
                <p className="text-xs text-[#524436] italic leading-relaxed">
                  "Bagus banget Masya Allah! Sebagai dokter yang sering jaga malam di RS, butuh mukena yang ringkas tapi gak bikin gerah. Katun mikronya beneran adem semriwing, resleting 2in1 nya penyelamat pas lagi buru-buru sholat tanpa lepas jilbab."
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div 
                  onClick={() => openLightbox(0)}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-[#FAF8F5] border border-gray-200 hover:border-[#C5A880] cursor-pointer group transition-all"
                >
                  <img src={IMAGES.pinkModel} alt="Foto dari dr. Annisa" className="w-10 h-10 object-cover rounded-md" />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-[#1C3B2B] group-hover:text-[#88222A] block">Foto Kiriman dr. Annisa</span>
                    <span className="text-gray-500 text-[10px] flex items-center gap-1">
                      <Camera className="w-3 h-3 text-[#C5A880]" /> Klik lihat foto
                    </span>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Membeli Paket 2 Pcs (Pink & Blue)
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8DFC8] shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                    RN
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1C3B2B]">Riana Nurul Hidayah</div>
                    <div className="text-[10px] text-gray-500">Bandung • Pembeli Terverifikasi</div>
                  </div>
                </div>
                <p className="text-xs text-[#524436] italic leading-relaxed">
                  "Laser cut-nya rapi banget gak ada benang rontok sama sekali. Pouch-nya imut banget, muat di sling bag saya. Warna Sage Green nya mewah dan adem banget dipakai. Teman sekantor pada nanya beli di mana, akhirnya order lagi buat kado."
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div 
                  onClick={() => openLightbox(3)}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-[#FAF8F5] border border-gray-200 hover:border-[#C5A880] cursor-pointer group transition-all"
                >
                  <img src={IMAGES.sageDetail} alt="Foto dari Riana Nurul" className="w-10 h-10 object-cover rounded-md" />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-[#1C3B2B] group-hover:text-[#88222A] block">Foto Laser Cut Riana</span>
                    <span className="text-gray-500 text-[10px] flex items-center gap-1">
                      <Camera className="w-3 h-3 text-[#C5A880]" /> Klik lihat foto
                    </span>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Membeli Sage Green Floral
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8DFC8] shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                    SM
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1C3B2B]">Hj. Siti Maryam</div>
                    <div className="text-[10px] text-gray-500">Surabaya • Jamaah Umroh</div>
                  </div>
                </div>
                <p className="text-xs text-[#524436] italic leading-relaxed">
                  "Saya bawa mukena ini kemarin umroh ke Mekkah & Madinah. Sangat nyaman, gak tembus pandang pas kena cahaya terik Masjidil Haram, ringkas masuk tas serut pas tawaf. Terima kasih saena.my.id, pengiriman Tasikmalaya sangat cepat."
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div 
                  onClick={() => openLightbox(4)}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-[#FAF8F5] border border-gray-200 hover:border-[#C5A880] cursor-pointer group transition-all"
                >
                  <img src={IMAGES.sageFull} alt="Foto dari Hj. Siti Maryam" className="w-10 h-10 object-cover rounded-md" />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-[#1C3B2B] group-hover:text-[#88222A] block">Foto Pouch Umroh</span>
                    <span className="text-gray-500 text-[10px] flex items-center gap-1">
                      <Camera className="w-3 h-3 text-[#C5A880]" /> Klik lihat foto
                    </span>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Membeli Paket 3 Pcs Seragam
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Risk Reversal & Garansi */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#1C3B2B] to-[#14291E] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[#E6CBA6]/10 border-2 border-[#C5A880] flex items-center justify-center text-[#E6CBA6] shrink-0">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <span className="text-xs font-bold text-[#E6CBA6] uppercase tracking-wider">
                Jaminan 100% Bebas Resiko
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                Garansi Kepuasan Pelanggan saena.my.id
              </h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1.5 leading-relaxed">
                Kami sangat yakin Anda akan jatuh cinta dengan kelembutan dan kepraktisan Mukena Alisa ini. Jika saat barang sampai terdapat cacat jahitan, kain sobek, atau salah warna, kami <strong>ganti baru</strong> atau <strong>kembalikan uang Anda 100%</strong> tanpa dipersulit!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FAQ Accordion */}
      <section className="py-8 bg-white px-4 border-t border-[#E8DFC8]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C3B2B]">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-xs text-[#7A6E5F] mt-1">
              Jawaban cepat seputar Mukena Traveling Alisa Premium
            </p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-[#E8DFC8] rounded-xl overflow-hidden transition-all bg-[#FAF8F5]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left p-4 font-semibold text-xs sm:text-sm text-[#1C3B2B] flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#C5A880] transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-[#615446] leading-relaxed border-t border-[#E8DFC8]/60 pt-3 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="py-6 px-4 text-center text-xs text-[#7A6E5F] border-t border-[#E8DFC8] bg-[#FAF8F5]">
        <div className="max-w-md mx-auto space-y-1.5">
          <div className="font-serif font-bold text-[#1C3B2B] text-sm">saena.my.id - Busana Muslim & Mukena Tasikmalaya</div>
          <p className="text-[11px]">Tamansari, Kota Tasikmalaya, Jawa Barat 46196</p>
          <p className="text-[10px] text-gray-400">© 2026 saena.my.id. All rights reserved.</p>
        </div>
      </footer>

      {/* 13. Sticky Floating CTA Bottom Bar (Mobile & Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DFC8] px-4 py-2.5 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Harga Satuan Promo:</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-[#88222A]">Rp 79.500</span>
              <span className="text-xs text-gray-400 line-through">Rp 159.000</span>
            </div>
            <div className="text-[10px] font-bold text-emerald-700 hidden sm:block">
              ✨ Beli 2 Pcs Langsung Gratis Ongkir!
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollToForm}
              className="bg-[#88222A] hover:bg-[#721B22] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02]"
            >
              <span>PESAN SEKARANG (TF BANK & COD)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 14. Professional HD Photo Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 text-white"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Lightbox Header */}
          <div 
            className="flex items-center justify-between gap-4 pb-3 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-white/15 px-2.5 py-1 rounded-full text-white/90">
                Foto {lightboxIndex + 1} / {GALLERY_PHOTOS.length}
              </span>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-bold bg-[#88222A] px-2.5 py-0.5 rounded-full text-white">
                  {GALLERY_PHOTOS[lightboxIndex]?.tag}
                </span>
                <span className="text-xs text-gray-300">
                  {GALLERY_PHOTOS[lightboxIndex]?.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title={isZoomed ? "Kecilkan Foto" : "Perbesar Foto"}
              >
                {isZoomed ? <ZoomOut className="w-4 h-4 text-[#E6CBA6]" /> : <ZoomIn className="w-4 h-4 text-[#E6CBA6]" />}
                <span className="hidden sm:inline">{isZoomed ? 'Zoom 100%' : 'Zoom HD'}</span>
              </button>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Tutup Galeri (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Image & Navigation Area */}
          <div 
            className="relative flex-1 flex items-center justify-center my-2 sm:my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            <button
              type="button"
              onClick={handleLightboxPrev}
              className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all hover:scale-110 cursor-pointer"
              aria-label="Foto Sebelumnya"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Image Viewer */}
            <div 
              className={`relative max-w-full max-h-full flex items-center justify-center overflow-auto transition-all ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img 
                src={GALLERY_PHOTOS[lightboxIndex]?.src} 
                alt={GALLERY_PHOTOS[lightboxIndex]?.title}
                className={`transition-all duration-300 rounded-xl shadow-2xl ${
                  isZoomed 
                    ? 'scale-125 sm:scale-150 max-w-none my-10' 
                    : 'max-h-[62vh] sm:max-h-[70vh] w-auto max-w-full object-contain'
                }`}
              />
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleLightboxNext}
              className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all hover:scale-110 cursor-pointer"
              aria-label="Foto Berikutnya"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Footer with Info & Action */}
          <div 
            className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Description & Specs */}
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-sm text-[#E6CBA6]">
                  {GALLERY_PHOTOS[lightboxIndex]?.title}
                </span>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white/90">
                  {GALLERY_PHOTOS[lightboxIndex]?.color}
                </span>
              </div>
              <p className="text-xs text-white/70 max-w-xl mt-0.5 line-clamp-2 sm:line-clamp-none">
                {GALLERY_PHOTOS[lightboxIndex]?.description}
              </p>
            </div>

            {/* Thumbnails strip & Order CTA */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Micro thumbnails */}
              <div className="hidden md:flex items-center gap-1.5">
                {GALLERY_PHOTOS.map((thumb, idx) => (
                  <button
                    key={thumb.id}
                    type="button"
                    onClick={() => {
                      setIsZoomed(false);
                      setLightboxIndex(idx);
                    }}
                    className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      lightboxIndex === idx 
                        ? 'border-[#E6CBA6] scale-105 ring-1 ring-[#E6CBA6]' 
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={thumb.src} alt={thumb.shortTitle} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Instant Select & Order Button */}
              <button
                type="button"
                onClick={() => {
                  const targetCol = GALLERY_PHOTOS[lightboxIndex]?.color || 'Dusty Pink';
                  setSelectedColor(targetCol);
                  setActivePhotoIndex(lightboxIndex);
                  setLightboxOpen(false);
                  handleGoToOrder(undefined, targetCol);
                }}
                className="w-full sm:w-auto bg-[#88222A] hover:bg-[#a02c36] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Pilih Varian Ini & Pesan Sekarang</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AlisaLandingPage;
