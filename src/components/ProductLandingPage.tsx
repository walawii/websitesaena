import React, { useState, useEffect, useMemo } from 'react';
import { 
  Product, 
  LandingPageConfig, 
  ProductColor 
} from '../types';
import { useStore } from '../context/StoreContext';
import { 
  Star, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  ArrowLeft, 
  Clock, 
  Flame, 
  ShoppingBag, 
  MessageCircle, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Award, 
  Check, 
  X, 
  Package, 
  Lock, 
  PhoneCall, 
  AlertCircle,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProductLandingPageProps {
  product: Product;
  config?: LandingPageConfig;
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export const ProductLandingPage: React.FC<ProductLandingPageProps> = ({
  product,
  config: propConfig,
  isPreview = false,
  onClosePreview
}) => {
  const { 
    landingPages, 
    formatPrice, 
    addToCart, 
    setIsCheckoutOpen, 
    setActiveLandingProductId,
    sendPushNotification,
    setActiveWhatsAppOrder,
    setIsWhatsAppModalOpen
  } = useStore();

  // Active configuration: prop or stored or default generated
  const config: LandingPageConfig = useMemo(() => {
    if (propConfig) return propConfig;
    if (landingPages[product.id]) return landingPages[product.id];
    
    // Fallback default
    const discountAmount = product.originalPrice && product.originalPrice > product.price 
      ? product.originalPrice - product.price 
      : 120000;
    
    return {
      id: `lp-${product.id}`,
      productId: product.id,
      slug: product.slug,
      isActive: true,
      theme: 'emerald',
      announcementText: `🔥 PROMO EKSKLUSIF HARI INI: Gratis Ongkir Seluruh Indonesia + Diskon s/d 30% & Garansi 100% Uang Kembali!`,
      showCountdown: true,
      countdownMinutes: 180,
      headline: `Tampil Anggun, Mewah & Penuh Percaya Diri dengan ${product.name}`,
      subheadline: `Dibalut kelembutan ${product.material || 'bahan premium berstandar butik'}. Siluet jatuh anggun, sejuk di kulit, dan dibuat dengan dedikasi penjahit terbaik Tasikmalaya.`,
      badge: 'Koleksi Eksklusif Butik Tasikmalaya • 100% Original',
      discountHighlightText: `Hemat ${formatPrice(discountAmount)} Hari Ini`,
      painPoints: [
        'Sering merasa gerah, panas, dan tidak nyaman saat mengenakan gamis seharian di acara resmi?',
        'Kecewa dengan kualitas jahitan pasaran yang mudah robek, benang mencuat, dan pola tidak proporsional?',
        'Khawatir bahan menerawang dan merepotkan saat harus wudhu atau menyusui?'
      ],
      solutions: [
        `Serat kain ${product.material || 'premium pilihan'} dengan sirkulasi udara optimal yang adem dan menyerap keringat.`,
        'Standar jahitan butik Tasikmalaya dengan kerapian stik kecil dan obras halus yang kuat tahan lama.',
        'Potongan syar\'i yang elegan, dilengkapi resleting dada (Busui Friendly) dan manset wudhu friendly.'
      ],
      benefits: [
        {
          title: 'Bahan Adem & Tidak Menerawang',
          description: `Serat kain ${product.material || 'pilihan butik'} dengan ketebalan ideal yang jatuh anggun, tidak panas, dan sangat nyaman dipakai berjam-jam.`
        },
        {
          title: 'Jahitan Halus Khas Tasikmalaya',
          description: 'Dikerjakan langsung oleh penjahit ahli berpengalaman dengan standar quality control ketat 2 lapis.'
        },
        {
          title: 'Praktis: Wudhu & Busui Friendly',
          description: 'Aksen zipper atau kancing fungsional yang mudah dibuka tanpa mengurangi keindahan desain.'
        },
        {
          title: 'Kemasan Eksklusif Wangi Kasturi',
          description: 'Dikirim dengan pouch/box eksklusif bernuansa butik mewah, cocok juga sebagai kado atau hantaran istimewa.'
        }
      ],
      craftsmanshipTitle: 'Dedikasi Karya Jahit Butik Tasikmalaya',
      craftsmanshipDesc: product.description || 'Setiap jahitan mencerminkan kesempurnaan busana muslimah Indonesia. Kami mengutamakan detail terkecil untuk menghadirkan kenyamanan dan keanggunan sejati bagi Anda.',
      socialProofHeading: 'Telah Memikat Hati Ribuan Muslimah di Seluruh Indonesia',
      guaranteeHeading: '100% Garansi Bebas Resiko & Kepuasan Pelanggan',
      guaranteeText: 'Apabila barang yang Anda terima cacat, ukuran tidak pas, atau tidak sesuai harapan Anda, kami ganti baru atau uang kami kembalikan 100% tanpa dipersulit.',
      faqs: [
        {
          q: 'Apakah bahannya menerawang saat terkena cahaya terang?',
          a: 'Tidak sama sekali. Kami menggunakan bahan dengan kerapatan serat tinggi dan gramasi yang tepat sehingga aman, sopan, dan tidak menerawang.'
        },
        {
          q: 'Berapa lama estimasi pesanan sampai ke alamat saya?',
          a: 'Pesanan dikirim langsung dari warehouse kami di Tamansari, Tasikmalaya. Wilayah Jabodetabek & Jabar 1-2 hari, Pulau Jawa 2-3 hari, dan Luar Jawa 3-5 hari kerja.'
        },
        {
          q: 'Apakah bisa bayar di tempat (COD)?',
          a: 'Bisa sekali! Anda dapat memilih metode Bayar di Tempat (COD) saat kurir mengantarkan paket ke pintu rumah Anda.'
        },
        {
          q: 'Bagaimana jika ukurannya kebesaran atau kekecilan?',
          a: 'Kami menyediakan Garansi Tukar Ukuran dalam 3 hari setelah paket tiba. Silakan hubungi CS kami yang ramah untuk proses tukar ukuran cepat.'
        }
      ],
      primaryCtaText: 'PESAN SEKARANG - KLAIM DISKON SPESIAL',
      primaryCtaAction: 'checkout',
      whatsappCustomText: `Halo CS saena.id, saya ingin memesan produk promo *${product.name}* melalui landing page. Mohon info ketersediaan promo hari ini ya!`,
      urgencyStockRemaining: Math.min(Math.max(product.totalStock, 3), 9),
      showStickyBar: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [propConfig, landingPages, product, formatPrice]);

  // Gallery & Variant State
  const [selectedColor, setSelectedColor] = useState<ProductColor>(() => {
    return product.colors && product.colors.length > 0 ? product.colors[0] : { name: 'Standar', hex: '#1C3B2B', stock: product.totalStock };
  });

  const [selectedSize, setSelectedSize] = useState<string>(() => {
    return product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'All Size';
  });

  const [activeImage, setActiveImage] = useState<string>(() => {
    return selectedColor.image || product.images[0] || '';
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Real-time Countdown Timer (Hours, Minutes, Seconds)
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 47,
    seconds: 35
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 2, minutes: 59, seconds: 59 }; // reset loop
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sticky bottom bar appearance on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowStickyBar(scrollY > 550);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Switch image when color changes
  const handleColorChange = (col: ProductColor) => {
    setSelectedColor(col);
    if (col.image) {
      setActiveImage(col.image);
    }
  };

  // Price calculations
  const originalPrice = product.originalPrice || Math.round(product.price * 1.25);
  const savings = originalPrice - product.price;
  const discountPercent = Math.round((savings / originalPrice) * 100);

  // CTA Click Actions
  const handlePrimaryCta = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });

    if (config.primaryCtaAction === 'whatsapp') {
      handleWhatsAppOrder();
      return;
    }

    // Direct checkout flow
    addToCart(product, selectedSize, { name: selectedColor.name, hex: selectedColor.hex }, quantity);
    setIsCheckoutOpen(true);
  };

  const handleWhatsAppOrder = () => {
    const waNumber = '6281220002821';
    const text = encodeURIComponent(
      `Halo CS saena.id, saya ingin memesan promo Landing Page:\n` +
      `• Produk: ${product.name}\n` +
      `• Warna: ${selectedColor.name}\n` +
      `• Ukuran: ${selectedSize}\n` +
      `• Jumlah: ${quantity} pcs\n` +
      `• Harga Promo: ${formatPrice(product.price * quantity)} (Hemat ${formatPrice(savings * quantity)})\n\n` +
      `Mohon dibantu proses pesanan dan gratis ongkirnya ya. Terima kasih!`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?landing=${product.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    sendPushNotification('Link Landing Page Disalin! 📋', 'Tautan siap dibagikan ke calon pembeli atau dipasang di iklan.', 'system');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleBackToStore = () => {
    if (isPreview && onClosePreview) {
      onClosePreview();
      return;
    }
    setActiveLandingProductId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('landing');
    url.searchParams.delete('lp');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D2821] font-sans antialiased selection:bg-[#1C3B2B] selection:text-white">
      
      {/* 1. TOP ANNOUNCEMENT BAR (STICKY WITH COUNTDOWN) */}
      <div className="bg-[#1C3B2B] text-white py-2.5 px-4 text-xs font-medium sticky top-0 z-40 shadow-sm border-b border-[#2D543F]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#C5A880]/20 text-[#E6CBA6]">
              <Flame className="w-3.5 h-3.5 text-[#E6CBA6] animate-pulse" />
            </span>
            <span className="font-semibold text-xs sm:text-sm tracking-wide text-[#F3EEE7]">
              {config.announcementText}
            </span>
          </div>

          {/* Countdown timer */}
          {config.showCountdown && (
            <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full border border-white/10 text-xs">
              <Clock className="w-3.5 h-3.5 text-[#E6CBA6]" />
              <span className="text-white/70 text-[11px] font-mono">Berakhir dlm:</span>
              <span className="font-mono font-bold text-[#E6CBA6]">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. LANDING HEADER / NAVIGATION */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#EAE3D6] sticky top-[41px] z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToStore}
              className="flex items-center gap-1.5 text-xs text-[#7A7266] hover:text-[#1C3B2B] font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[#FAF6F0]"
              title="Kembali ke Toko Utama saena.id"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Katalog Utama</span>
            </button>

            <div className="h-4 w-px bg-[#E2D8CA] hidden sm:block" />

            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1C3B2B]">
                saena<span className="text-[#C5A880]">.id</span>
              </span>
              <span className="text-[10px] text-[#8C8377] block font-mono -mt-1 uppercase tracking-wider">
                Butik Tasikmalaya
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Share / Copy Link button */}
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FAF6F0] hover:bg-[#EFE9E0] text-[#1C3B2B] border border-[#DCD2C3] transition-colors"
              title="Salin link Landing Page ini untuk promosi iklan"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Tersalin!' : 'Bagikan Link'}</span>
            </button>

            {/* Direct WhatsApp Quick Chat */}
            <button
              onClick={handleWhatsAppOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CS WhatsApp</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO & DIRECT PURCHASE SECTION (HIGH CONVERSION CORE) */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* 3A. PRODUCT GALLERY (LEFT - 6 COLS) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Main Image Display with Luxury Border */}
            <div className="relative aspect-3/4 sm:aspect-4/5 rounded-2xl overflow-hidden bg-[#EFE9E0] border border-[#E2D8CA] shadow-md group">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />

              {/* Floating Badges */}
              <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 items-start">
                <span className="px-3 py-1 rounded-full bg-[#1C3B2B]/90 backdrop-blur-md text-white font-bold text-xs shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Koleksi Eksklusif</span>
                </span>
                {discountPercent > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#B34033] text-white font-black text-xs shadow-sm">
                    Diskon {discountPercent}%
                  </span>
                )}
              </div>

              <div className="absolute bottom-3.5 right-3.5">
                <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Garansi 100% Original</span>
                </span>
              </div>
            </div>

            {/* Thumbnail Carousel / Variant Selector */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`relative flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === imgUrl 
                      ? 'border-[#1C3B2B] ring-2 ring-[#1C3B2B]/20 scale-105 shadow-xs' 
                      : 'border-[#E2D8CA] hover:border-[#8C8377] opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Trust Mini-Banners below image */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="p-3 bg-white rounded-xl border border-[#E5DDD2] text-center space-y-1">
                <Truck className="w-5 h-5 mx-auto text-[#1C3B2B]" />
                <span className="text-[11px] font-bold text-[#1C3B2B] block">Gratis Ongkir</span>
                <span className="text-[9px] text-[#7A7266] block leading-tight">Seluruh Indonesia</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E5DDD2] text-center space-y-1">
                <Package className="w-5 h-5 mx-auto text-[#1C3B2B]" />
                <span className="text-[11px] font-bold text-[#1C3B2B] block">Bisa COD</span>
                <span className="text-[9px] text-[#7A7266] block leading-tight">Bayar Saat Tiba</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E5DDD2] text-center space-y-1">
                <ShieldCheck className="w-5 h-5 mx-auto text-[#1C3B2B]" />
                <span className="text-[11px] font-bold text-[#1C3B2B] block">Garansi Tukar</span>
                <span className="text-[9px] text-[#7A7266] block leading-tight">Bebas Resiko</span>
              </div>
            </div>

          </div>

          {/* 3B. PRODUCT OFFER & IMMEDIATE CTA (RIGHT - 6 COLS) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Tag, Rating, & Title */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C5A880]/15 text-[#85683F] border border-[#C5A880]/30">
                  {config.badge}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-[#5A5348] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-bold text-[#1F2421]">{product.rating}</span>
                  <span className="text-[11px] text-[#7A7266]">({product.reviewCount} ulasan pembeli)</span>
                </div>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1C3B2B] leading-tight">
                {config.headline}
              </h1>

              <p className="text-sm sm:text-base text-[#5A5348] leading-relaxed">
                {config.subheadline}
              </p>
            </div>

            {/* PRICE & SAVINGS HIGHLIGHT BOX */}
            <div className="p-5 rounded-2xl bg-linear-to-br from-[#FAF5EC] to-[#F2E8D8] border-2 border-[#D9C4A5] shadow-xs space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs text-[#7A7266] line-through mr-2 font-medium">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-[#B34033] tracking-tight">
                    {formatPrice(product.price)}
                  </span>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#B34033] text-white font-extrabold text-xs shadow-xs animate-bounce">
                  {config.discountHighlightText || `Hemat ${formatPrice(savings)}!`}
                </span>
              </div>

              {/* Scarcity / Stock remaining progress bar */}
              <div className="pt-2 border-t border-[#D9C4A5]/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#B34033] flex items-center gap-1">
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Sisa Stok Promo Terbatas:</span>
                  </span>
                  <span className="font-black text-[#1C3B2B]">{config.urgencyStockRemaining} Unit Lagi!</span>
                </div>
                
                <div className="w-full bg-[#E5D8C4] rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-linear-to-r from-amber-500 to-[#B34033] h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(15, (config.urgencyStockRemaining / 15) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-[#7A7266] block text-right">
                  Kuota diskon gratis ongkir akan ditutup setelah stok habis.
                </span>
              </div>
            </div>

            {/* VARIANT SELECTION (COLOR & SIZE) */}
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs">
              
              {/* Color Options */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1C3B2B] uppercase tracking-wider flex items-center justify-between">
                    <span>Pilih Varian Warna:</span>
                    <span className="text-[#C5A880] font-semibold capitalize">{selectedColor.name}</span>
                  </label>
                  
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map(col => (
                      <button
                        key={col.name}
                        onClick={() => handleColorChange(col)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          selectedColor.name === col.name
                            ? 'bg-[#1C3B2B] text-white border-[#1C3B2B] shadow-xs scale-102'
                            : 'bg-[#FAF8F5] text-[#3D3830] border-[#DCD2C3] hover:border-[#8C8377]'
                        }`}
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" 
                          style={{ backgroundColor: col.hex }} 
                        />
                        <span>{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Options */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#F2ECE4]">
                  <label className="text-xs font-bold text-[#1C3B2B] uppercase tracking-wider flex items-center justify-between">
                    <span>Pilih Ukuran:</span>
                    <span className="text-[#C5A880] font-semibold">{selectedSize}</span>
                  </label>
                  
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(sz => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`min-w-12 py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                          selectedSize === sz
                            ? 'bg-[#1C3B2B] text-white border-[#1C3B2B] shadow-xs scale-102'
                            : 'bg-[#FAF8F5] text-[#3D3830] border-[#DCD2C3] hover:border-[#8C8377]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center justify-between pt-2 border-t border-[#F2ECE4]">
                <span className="text-xs font-bold text-[#1C3B2B]">Jumlah Pesanan:</span>
                <div className="flex items-center gap-3 bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl px-2.5 py-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 flex items-center justify-center font-bold text-[#1C3B2B] hover:text-[#C5A880] text-sm"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm text-[#1C3B2B] min-w-6 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center font-bold text-[#1C3B2B] hover:text-[#C5A880] text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* CALL TO ACTION BUTTONS (HIGH IMPACT) */}
            <div className="space-y-3 pt-2">
              <button
                id="landing-page-primary-cta"
                onClick={handlePrimaryCta}
                className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-[#1C3B2B] via-[#2A523D] to-[#1C3B2B] hover:from-[#152e21] hover:to-[#224432] text-white font-extrabold text-base sm:text-lg shadow-lg shadow-[#1C3B2B]/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex flex-col items-center justify-center gap-1 border border-[#406852] cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#C5A880] group-hover:rotate-6 transition-transform" />
                  <span>{config.primaryCtaText}</span>
                </div>
                <span className="text-[11px] font-normal text-white/80">
                  (Checkout Cepat • Bisa COD Bayar di Tempat)
                </span>
              </button>

              {/* Secondary WhatsApp CTA Button */}
              <button
                onClick={handleWhatsAppOrder}
                className="w-full py-3 px-5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Pesan Cepat via WhatsApp Customer Service</span>
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-[#7A7266] pt-1">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  100% Pembayaran Aman
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Garansi Uang Kembali
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. PROBLEM & SOLUTION MATRIX ("KENAPA HARUS MEMILIKI INI?") */}
      <section className="bg-white py-14 border-y border-[#EAE3D6]">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C5A880]/15 text-[#85683F]">
              Solusi Tepat Untuk Anda
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1C3B2B]">
              Jangan Biarkan Busana Biasa Merusak Momen Berharga Anda
            </h2>
            <p className="text-xs sm:text-sm text-[#7A7266]">
              Perbedaan nyata antara produk massal biasa dengan mahakarya butik saena.id Tasikmalaya:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PAIN POINTS CARD */}
            <div className="p-6 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-4">
              <div className="flex items-center gap-2.5 text-rose-800 font-bold text-base">
                <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center">
                  <X className="w-4 h-4 text-rose-700" />
                </div>
                <span>Masalah yang Sering Dialami:</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-[#5C2B29]">
                {config.painPoints.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SOLUTION CARD */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border-2 border-[#1C3B2B]/20 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 text-[#1C3B2B] font-bold text-base">
                <div className="w-8 h-8 rounded-full bg-[#1C3B2B] flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#C5A880]" />
                </div>
                <span>Solusi Nyata saena.id:</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-[#1F2421]">
                {config.solutions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 5. CRAFTSMANSHIP & 4-BENEFIT SPOTLIGHT */}
      <section className="py-16 max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1C3B2B]/10 text-[#1C3B2B]">
            Kualitas & Keunggulan
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1C3B2B]">
            {config.craftsmanshipTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7266] leading-relaxed">
            {config.craftsmanshipDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {config.benefits.map((b, i) => (
            <div 
              key={i} 
              className="bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs hover:shadow-md transition-shadow space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FAF5EC] border border-[#E8DFC0] flex items-center justify-center text-[#1C3B2B]">
                <Award className="w-5 h-5 text-[#C5A880]" />
              </div>
              <h3 className="font-bold text-[#1C3B2B] text-sm sm:text-base">
                {b.title}
              </h3>
              <p className="text-xs text-[#7A7266] leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. REAL SOCIAL PROOF / REVIEWS */}
      <section className="bg-white py-14 border-y border-[#EAE3D6]">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1C3B2B]">
              {config.socialProofHeading}
            </h2>
            <div className="flex items-center justify-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
              <span className="font-bold text-xs text-[#3D3830] ml-2">4.9 / 5.0 dari 150+ Ulasan Pembeli</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(product.reviews && product.reviews.length > 0 ? product.reviews : [
              {
                id: 'rev-1',
                userName: 'Hj. Dewi Sartika',
                rating: 5,
                date: '2 hari lalu',
                comment: 'Masya Allah jahitannya rapi sekali, bahannya beneran adem jatuh mewah. Sangat pas untuk dipakai silaturahmi lebaran!',
                variantInfo: 'Emerald Forest / L',
                verifiedBuyer: true
              },
              {
                id: 'rev-2',
                userName: 'Nadia Rahmawati',
                rating: 5,
                date: '4 hari lalu',
                comment: 'Packagingnya wangi kasturi, kardusnya kokoh. Bahan tidak terawang sama sekali. Suami memuji pas saya pakai. Recommended butik!',
                variantInfo: 'Champagne Taupe / M',
                verifiedBuyer: true
              },
              {
                id: 'rev-3',
                userName: 'dr. Siti Fatimah',
                rating: 5,
                date: '1 minggu lalu',
                comment: 'Pengiriman dari Tasikmalaya cepat sekali, 1 hari sampai Jakarta. Manset wudhunya elastis dan nyaman banget.',
                variantInfo: 'Midnight Onyx / XL',
                verifiedBuyer: true
              }
            ]).slice(0, 3).map((r, idx) => (
              <div key={idx} className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5DDD2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-500">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#8C8377]">{r.date}</span>
                </div>

                <p className="text-xs text-[#3D3830] leading-relaxed italic">
                  "{r.comment}"
                </p>

                <div className="pt-2 border-t border-[#EAE3D6] flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#1C3B2B]">{r.userName}</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Terverifikasi
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. 100% SATISFACTION GUARANTEE BANNER */}
      <section className="py-12 max-w-4xl mx-auto px-4">
        <div className="bg-linear-to-br from-[#1C3B2B] to-[#254F3A] text-white p-8 sm:p-10 rounded-3xl border border-[#3E6B53] shadow-lg relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-10 h-10 text-[#E6CBA6]" />
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#E6CBA6]">
                {config.guaranteeHeading}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-xl">
                {config.guaranteeText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ (FREQUENTLY ASKED QUESTIONS) ACCORDION */}
      <section className="bg-white py-14 border-t border-[#EAE3D6]">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-display text-2xl font-bold text-[#1C3B2B]">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs text-[#7A7266]">
              Semua yang perlu Anda ketahui sebelum memesan
            </p>
          </div>

          <div className="divide-y divide-[#EAE3D6] border border-[#EAE3D6] rounded-2xl overflow-hidden bg-[#FAF8F5]">
            {config.faqs.map((faq, i) => (
              <div key={i} className="p-4 sm:p-5">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left font-bold text-sm text-[#1C3B2B] focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    className={`w-4 h-4 text-[#8C8377] transition-transform duration-200 ${openFaqIndex === i ? 'rotate-180 text-[#1C3B2B]' : ''}`} 
                  />
                </button>

                {openFaqIndex === i && (
                  <p className="text-xs sm:text-sm text-[#5A5348] mt-3 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION BOX */}
      <section className="py-16 max-w-4xl mx-auto px-4 text-center space-y-6">
        <div className="bg-[#FAF5EC] p-8 sm:p-10 rounded-3xl border-2 border-[#D9C4A5] space-y-5 shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B34033] text-white text-xs font-bold animate-pulse">
            <Flame className="w-3.5 h-3.5" />
            <span>Kesempatan Terakhir Hari Ini</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1C3B2B]">
            Siap Tampil Memukau di Setiap Momen Spesial?
          </h2>

          <p className="text-xs sm:text-sm text-[#5A5348] max-w-lg mx-auto">
            Dapatkan {product.name} dengan harga promo spesial, gratis ongkos kirim, dan garansi penuh hari ini sebelum stok habis.
          </p>

          <div className="max-w-md mx-auto pt-2 space-y-3">
            <button
              onClick={handlePrimaryCta}
              className="w-full py-4 px-6 rounded-2xl bg-[#1C3B2B] hover:bg-[#27533C] text-white font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-[#C5A880]" />
              <span>{config.primaryCtaText}</span>
            </button>

            <button
              onClick={handleWhatsAppOrder}
              className="w-full py-3 px-5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-sm border-2 border-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Konsultasi Ukuran & Pesan Lewat WhatsApp</span>
            </button>
          </div>
        </div>
      </section>

      {/* 10. STICKY FLOATING BOTTOM BAR (HIGH CONVERSION MOBILE & DESKTOP) */}
      {config.showStickyBar && showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E5DDD2] py-3 px-4 z-50 shadow-2xl transition-all duration-300">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            
            {/* Product summary snippet */}
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src={activeImage} 
                alt={product.name} 
                className="w-11 h-13 rounded-lg object-cover border border-[#E2D8CA] flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm text-[#1C3B2B] truncate block">
                  {product.name}
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] text-[#7A7266] line-through">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="font-black text-[#B34033]">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleWhatsAppOrder}
                className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
                title="Pesan via WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrimaryCta}
                className="py-2.5 px-4 sm:px-6 rounded-xl bg-[#1C3B2B] hover:bg-[#28523C] text-white text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
                <span>Beli Sekarang</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#FAF8F5] py-8 text-center text-xs text-[#8C8377] border-t border-[#EAE3D6] space-y-2">
        <p className="font-semibold text-[#1C3B2B]">
          saena.id • Butik Busana Muslimah Eksklusif Tasikmalaya
        </p>
        <p className="text-[11px]">
          Hak Cipta Dilindungi Undang-Undang. Garansi Keamanan Berbelanja.
        </p>
      </footer>

    </div>
  );
};
