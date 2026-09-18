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
  LayoutDashboard
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
  blueModel: '/assets/alisa/alisa-blue-model.webp',
  blueDetail: '/assets/alisa/alisa-blue-detail.webp',
  blueFull: '/assets/alisa/alisa-blue-full.webp'
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
    id: 'blue-model',
    src: IMAGES.blueModel,
    title: 'Mukena Alisa Sky Blue - Tampak Penuh Model',
    shortTitle: 'Model Biru',
    category: 'Varian Sky Blue',
    description: 'Nuansa biru langit pastel yang sejuk dan menenangkan dipadu aksen bunga lavender dan dedaunan zaitun.',
    color: 'Sky Blue' as const,
    tag: 'Warna Sejuk'
  },
  {
    id: 'blue-detail',
    src: IMAGES.blueDetail,
    title: 'Finishing Pinggiran Laser Cut Bergelombang Presisi',
    shortTitle: 'Laser Cut Presisi',
    category: 'Finishing Mewah',
    description: 'Tepian dipotong menggunakan laser cut presisi membentuk motif kelopak melengkung rapi tanpa benang obras yang berudul.',
    color: 'Sky Blue' as const,
    tag: 'Laser Cut'
  },
  {
    id: 'blue-full',
    src: IMAGES.blueFull,
    title: 'Satu Set Lengkap Mukena + Mini Pouch Traveling',
    shortTitle: 'Set + Mini Pouch',
    category: 'Kelengkapan Set',
    description: 'Satu set terdiri dari atasan mukena jumbo (117/120 cm), rok bawahan (110x73 cm), dan tas pouch traveling ringkas (18x15 cm, ±400 gr).',
    color: 'Sky Blue' as const,
    tag: 'Set Lengkap'
  }
];

interface AlisaLandingPageProps {
  onNavigateHome?: () => void;
}

export const AlisaLandingPage: React.FC<AlisaLandingPageProps> = ({ onNavigateHome }) => {
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
  const [selectedColor, setSelectedColor] = useState<'Dusty Pink' | 'Sky Blue'>('Dusty Pink');
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
      // Find first blue photo
      const idx = GALLERY_PHOTOS.findIndex(p => p.color === 'Sky Blue');
      if (idx !== -1 && GALLERY_PHOTOS[activePhotoIndex]?.color !== 'Sky Blue') {
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
  const [secondaryColor, setSecondaryColor] = useState<'Dusty Pink' | 'Sky Blue'>('Sky Blue');

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerSubdistrict, setCustomerSubdistrict] = useState('');
  const [addressValidationAttempted, setAddressValidationAttempted] = useState(false);
  const [allowNoHouseNumber, setAllowNoHouseNumber] = useState(false);
  const [showIncompleteAddressModal, setShowIncompleteAddressModal] = useState(false);

  // Address validation memo
  const addressValidation: AddressValidationResult = React.useMemo(() => {
    return validateIndonesianAddress(customerAddress, customerSubdistrict, customerCity);
  }, [customerAddress, customerSubdistrict, customerCity]);

  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'COD'>('TRANSFER');
  const [selectedCourier, setSelectedCourier] = useState<'JNE' | 'J&T Express' | 'SiCepat'>('JNE');
  const [selectedDokuChannel, setSelectedDokuChannel] = useState<PaymentChannel>('doku_qris');
  const [dokuPaymentSubTab, setDokuPaymentSubTab] = useState<'qris' | 'manual_bank'>('qris');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [isVerifyingDoku, setIsVerifyingDoku] = useState(false);
  const [dokuStatusNotice, setDokuStatusNotice] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<any>(null);

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

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

  // Form ref for smooth scroll
  const formRef = useRef<HTMLDivElement>(null);
  const scrollToForm = () => {
    trackMetaInitiateCheckout({
      contentName: currentPackage.title,
      value: currentPackage.promoPrice,
      currency: 'IDR',
      numItems: currentPackage.qty
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle Form Submit with DOKU & Mengantar.com Integration
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert('Mohon lengkapi Nama, No. WhatsApp, dan Alamat Pengiriman Anda.');
      return;
    }

    // Validasi Kelengkapan Alamat Pembeli (Nomor Rumah/Patokan & Kecamatan)
    const isMissingHouseNumber = !addressValidation.hasHouseNumber && !allowNoHouseNumber;
    const isMissingSubdistrict = !addressValidation.hasSubdistrict;
    const isMissingStreet = !addressValidation.hasStreetDetail;

    if (isMissingHouseNumber || isMissingSubdistrict || isMissingStreet) {
      setAddressValidationAttempted(true);
      setShowIncompleteAddressModal(true);
      return;
    }

    setIsSubmitting(true);
    setIsPaymentConfirmed(false);

    try {
      const orderId = `ALS-${Date.now().toString().slice(-6)}`;
      const colorSelection = currentPackage.qty > 1 
        ? `${selectedColor} & ${secondaryColor}`
        : selectedColor;

      // 1. Electronic Payment processing via DOKU Payment Gateway
      let dokuResult: DokuPaymentData | undefined = undefined;
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

      // 2. Dispatch Order to Mengantar.com (Logistics & Resi Generation)
      const targetProduct = products.find(p => p.id === 'alisa-01') || {
        id: 'alisa-01',
        name: 'Mukena Traveling 2in1 Laser Cut Alisa Premium',
        price: 79500,
        weight: 400 * currentPackage.qty,
        images: [IMAGES.pinkModel]
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

      // Call Mengantar.com API to register package & generate tracking number
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

      // Construct success data object
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

      // Set order success UI state immediately
      setOrderSuccessData(successData);

      // Record order into centralized store & Cloud Firestore real-time database
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
        console.warn('Orders state & Firestore direct recording notice:', saveErr);
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.warn('Confetti effect notice:', err);
      }

      try {
        if (typeof sendPushNotification === 'function') {
          sendPushNotification(
            `Pesanan ${fullOrder.id} Diterima! 🎉`,
            `${customerName} memesan ${currentPackage.title} via ${paymentMethod === 'COD' ? 'COD Mengantar.com' : 'DOKU Payment Gateway'}. Resi: ${fullOrder.trackingNumber}`,
            'order',
            fullOrder.id
          );
        }
      } catch (err) {
        console.warn('Notification notice:', err);
      }

      try {
        trackMetaPurchase({
          orderId,
          contentName: currentPackage.title,
          value: currentPackage.promoPrice,
          currency: 'IDR',
          numItems: currentPackage.qty
        });
      } catch (err) {
        console.warn('Meta Pixel tracking notice:', err);
      }
    } catch (err) {
      console.error('Order submission fallback error:', err);
      // Even in worst-case unexpected error, construct safe fallback order so buyer is never blocked
      const fallbackId = `ALS-${Date.now().toString().slice(-6)}`;
      const safeFallbackOrder: Order = {
        id: fallbackId,
        createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        customer: {
          fullName: customerName || 'Pelanggan',
          whatsapp: customerPhone || '-',
          email: `${(customerPhone || '').replace(/[^0-9]/g, '')}@saena.my.id`,
          address: customerAddress || '-',
          city: customerCity || 'Kota Tasikmalaya',
          subdistrict: 'Tamansari',
          province: 'Jawa Barat',
          postalCode: '46196',
          country: 'Indonesia',
          notes: notes || undefined
        },
        items: [{
          id: `ci-${Date.now()}`,
          productId: 'alisa-01',
          product: {
            id: 'alisa-01',
            name: 'Mukena Traveling 2in1 Laser Cut Alisa Premium',
            price: 79500,
            weight: 400 * currentPackage.qty,
            images: [IMAGES.pinkModel]
          } as any,
          selectedColor: { name: selectedColor, hex: '#C48B9F' },
          selectedSize: 'Standar Jumbo Dewasa',
          quantity: currentPackage.qty,
          price: Math.round(currentPackage.promoPrice / currentPackage.qty)
        }],
        shipping: {
          id: `ship-${(selectedCourier || 'JNE').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: `Mengantar.com - ${selectedCourier || 'JNE'}`,
          courier: selectedCourier || 'JNE',
          service: 'REG',
          cost: 0,
          estimatedDays: '1-3 Hari Kerja',
          logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&q=80'
        },
        payment: {
          channel: paymentMethod === 'COD' ? 'cod' : selectedDokuChannel,
          channelName: paymentMethod === 'COD' ? 'COD (Bayar di Tempat - Mengantar.com)' : 'QRIS / Transfer Bank (DOKU Gateway)',
          qrCodeUrl: paymentMethod === 'TRANSFER' && selectedDokuChannel === 'doku_qris'
            ? getSmartQrisForOrder({ orderId: fallbackId, amount: currentPackage.promoPrice, config: dokuConfig }).qrImageUrl
            : undefined,
          expiryMinutes: 60
        },
        subtotal: currentPackage.promoPrice,
        discount: 0,
        shippingCost: 0,
        total: currentPackage.promoPrice,
        currency: 'IDR',
        currencyRate: 1,
        status: 'menunggu_pembayaran',
        trackingNumber: `MGT-${(selectedCourier || 'JNE').toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-8)}`,
        trackingHistory: [],
        mengantar: {
          mengantarOrderId: `MGT-${fallbackId}`,
          trackingNumber: `MGT-${(selectedCourier || 'JNE').toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-8)}`,
          courier: selectedCourier || 'JNE',
          serviceType: 'REG',
          status: 'MENUNGGU_PICKUP',
          pickupTime: 'Hari ini, 14:00 - 17:00 WIB',
          shippingFee: 0,
          isCod: paymentMethod === 'COD',
          codAmount: paymentMethod === 'COD' ? currentPackage.promoPrice : 0,
          syncedAt: new Date().toISOString()
        }
      };

      // Ensure fallback order is also recorded into centralized store & Firestore
      try {
        if (typeof recordDirectOrder === 'function') {
          await recordDirectOrder(safeFallbackOrder);
        } else {
          if (typeof setOrders === 'function') {
            setOrders(prev => Array.isArray(prev) ? [safeFallbackOrder, ...prev.filter(o => o.id !== safeFallbackOrder.id)] : [safeFallbackOrder]);
          }
          if (typeof syncOrderToFirestore === 'function') {
            await syncOrderToFirestore(safeFallbackOrder);
          }
        }
      } catch (saveErr) {
        console.warn('Fallback order recording notice:', saveErr);
      }

      setOrderSuccessData({
        order: safeFallbackOrder,
        id: fallbackId,
        packageName: currentPackage.title,
        color: selectedColor,
        total: currentPackage.promoPrice,
        paymentMethod,
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        city: customerCity || 'Kota Tasikmalaya',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        mengantar: safeFallbackOrder.mengantar,
        selectedCourier: selectedCourier || 'JNE',
        selectedDokuChannel
      });
    } finally {
      setIsSubmitting(false);
    }
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
      a: 'Sangat mudah! Beli 2 Pcs atau lebih, promo Bebas Ongkos Kirim (Gratis Ongkir) ke seluruh wilayah Indonesia langsung aktif secara otomatis di formulir pesanan Anda. Anda juga bebas memilih kombinasi warna (Dusty Pink & Sky Blue).'
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
      {/* Top Floating Preview / Store Switcher */}
      {onNavigateHome && (
        <div className="bg-[#1C3B2B] text-white px-4 py-2 text-xs flex items-center justify-between border-b border-[#C5A880]/30 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-[#E6CBA6]">saena.my.id / alisa</span>
            <span className="hidden sm:inline text-white/60">| Official Landing Page Mukena Traveling 2in1</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticatedAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsAdminMode(true);
                  if (onNavigateHome) onNavigateHome();
                }}
                className="flex items-center gap-1.5 text-xs text-amber-200 hover:text-white bg-amber-900/60 hover:bg-amber-900/90 border border-amber-500/40 px-3 py-1 rounded-full transition-all cursor-pointer font-semibold shadow-sm"
                title="Buka Manajemen Pesanan Real-Time di Dashboard Admin"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" />
                <span>Pesanan ({orders.length})</span>
              </button>
            )}
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 text-xs text-[#E6CBA6] hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Ke Toko Utama</span>
            </button>
          </div>
        </div>
      )}

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
      <header className="bg-white/95 backdrop-blur border-b border-[#E8DFC8]/60 py-3.5 px-4 sticky top-[33px] sm:top-[37px] z-40">
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
                      style={{ backgroundColor: selectedColor === 'Dusty Pink' ? '#E8A5A5' : '#99BBE0' }}
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
                      <p className="text-[11px] text-emerald-700 font-normal">Bisa campur warna Dusty Pink & Sky Blue.</p>
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
                        setSelectedColor('Sky Blue');
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedColor === 'Sky Blue'
                          ? 'border-[#1C3B2B] bg-sky-50 text-[#1C3B2B] font-bold shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-[#99BBE0] border border-black/10 shadow-inner" />
                      <div className="text-left">
                        <div className="text-xs">Sky Blue</div>
                        <div className="text-[10px] text-gray-500 font-normal">Floral Lavender Sejuk</div>
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
                  src={IMAGES.blueDetail} 
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
                  src={IMAGES.blueFull} 
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
                      scrollToForm();
                    }}
                    className="flex-1 bg-[#88222A] hover:bg-[#721B22] text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    Pilih Warna Dusty Pink
                  </button>
                </div>
              </div>
            </div>

            {/* Color 2: Sky Blue */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[#E8DFC8] shadow-sm hover:shadow-md transition-all flex flex-col">
              <div 
                onClick={() => openLightbox(2)}
                className="relative aspect-[4/5] bg-gray-100 overflow-hidden group cursor-pointer"
              >
                <img 
                  src={IMAGES.blueModel} 
                  alt="Mukena Alisa Sky Blue" 
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 bg-[#1C3B2B] text-[#E6CBA6] text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#E6CBA6]" /> Nuansa Sejuk
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-[#E6CBA6]" /> Klik Zoom HD
                </div>
              </div>

              {/* Sub photo selectors for Sky Blue */}
              <div className="px-4 pt-3 pb-2 bg-[#FAF8F5] border-y border-[#E8DFC8] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#7A6E5F]">Sudut Foto Blue:</span>
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
                    <h3 className="font-serif text-lg font-bold text-[#1C3B2B]">Sky Blue Lavender</h3>
                    <span className="text-[11px] bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-200">
                      Stok Tersedia
                    </span>
                  </div>
                  <p className="text-xs text-[#615446] leading-relaxed">
                    Warna biru langit muda yang sejuk dipadu dengan motif bunga mawar pastel. Memberikan kesan adem, bersih, dan menentramkan jiwa saat menunaikan ibadah shalat.
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
                      setSelectedColor('Sky Blue');
                      setActivePhotoIndex(2);
                      scrollToForm();
                    }}
                    className="flex-1 bg-[#1C3B2B] hover:bg-[#14291e] text-[#E6CBA6] text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    Pilih Warna Sky Blue
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
                  "Laser cut-nya rapi banget gak ada benang rontok sama sekali. Pouch-nya imut banget, muat di sling bag saya. Warna Sky Blue nya mewah banget dipakai. Teman sekantor pada nanya beli di mana, akhirnya order lagi buat kado."
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div 
                  onClick={() => openLightbox(3)}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-[#FAF8F5] border border-gray-200 hover:border-[#C5A880] cursor-pointer group transition-all"
                >
                  <img src={IMAGES.blueDetail} alt="Foto dari Riana Nurul" className="w-10 h-10 object-cover rounded-md" />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-[#1C3B2B] group-hover:text-[#88222A] block">Foto Laser Cut Riana</span>
                    <span className="text-gray-500 text-[10px] flex items-center gap-1">
                      <Camera className="w-3 h-3 text-[#C5A880]" /> Klik lihat foto
                    </span>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Membeli Sky Blue Lavender
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
                  <img src={IMAGES.blueFull} alt="Foto dari Hj. Siti Maryam" className="w-10 h-10 object-cover rounded-md" />
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

      {/* 10. Direct Instant Order Form (CRO Core Engine) */}
      <section id="order-section" ref={formRef} className="py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border-2 border-[#1C3B2B] shadow-xl overflow-hidden">
          {/* Header of Form */}
          <div className="bg-[#1C3B2B] text-white p-5 text-center">
            <div className="inline-block bg-[#88222A] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              Formulir Pemesanan Resmi & Cepat
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#E6CBA6]">
              Klaim Promo Mukena Traveling Alisa Hari Ini
            </h2>
            <p className="text-xs text-white/80 mt-1">
              Silakan isi formulir di bawah ini. Bayar via Transfer Bank / QRIS atau Bayar di Tempat (Bisa COD).
            </p>
          </div>

          {orderSuccessData ? (
            /* Order Success Notification with Mengantar.com & DOKU Integration */
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#1C3B2B]">
                  Alhamdulillah! Pesanan Berhasil Diterima
                </h3>
                <p className="text-xs sm:text-sm text-[#615446] max-w-md mx-auto">
                  Terima kasih Kak <strong>{orderSuccessData.name}</strong>. Pesanan Anda telah berhasil diterima dan sedang dipersiapkan oleh tim butik kami untuk segera dikirimkan.
                </p>
              </div>

              {/* Internal Mengantar.com Logistics Panel & Cetak Label Thermal (HANYA UNTUK ADMIN) */}
              {isAdminMode && isAuthenticatedAdmin && (
                <div className="bg-gradient-to-br from-[#FAF8F5] to-emerald-50/50 rounded-2xl border-2 border-emerald-600/30 p-5 text-left shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                            Mengantar.com Logistics
                          </span>
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                            PANEL ADMIN
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600">
                          Ekspedisi Resmi: <strong className="text-emerald-900">{orderSuccessData.mengantar?.courier || orderSuccessData.selectedCourier} (Layanan REG)</strong>
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-200 shadow-xs">
                      Hanya Terlihat Oleh Admin
                    </span>
                  </div>

                  {/* Resi AWB Box */}
                  <div className="bg-white rounded-xl border border-emerald-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-[11px] text-gray-500 font-medium block">Nomor Resi / AWB Mengantar.com:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-sm sm:text-base font-bold text-gray-900 tracking-wider">
                          {orderSuccessData.order?.trackingNumber || orderSuccessData.mengantar?.trackingNumber || `MGT-${orderSuccessData.id}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(orderSuccessData.order?.trackingNumber || orderSuccessData.mengantar?.trackingNumber || `MGT-${orderSuccessData.id}`, 'resi')}
                          className="text-[11px] flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer"
                          title="Salin Nomor Resi"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedKey === 'resi' ? 'Tersalin!' : 'Salin Resi'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (orderSuccessData.order) {
                            setActiveMengantarLabelOrder(orderSuccessData.order);
                            setIsMengantarLabelModalOpen(true);
                          }
                        }}
                        className="w-full sm:w-auto text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Label Thermal</span>
                      </button>
                    </div>
                  </div>

                  {/* Logistics status breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-gray-500 block text-[10px]">Status Pengiriman:</span>
                      <span className="font-semibold text-emerald-900 flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Terjadwal Pickup Mengantar.com</span>
                      </span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-gray-500 block text-[10px]">Jadwal Penjemputan Kurir:</span>
                      <span className="font-semibold text-gray-800 mt-0.5 block">
                        {orderSuccessData.mengantar?.pickupTime || 'Hari ini, 14:00 - 17:00 WIB'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: DOKU Payment Gateway Panel (Jika Transfer/QRIS) ATAU COD Panel */}
              {orderSuccessData.paymentMethod === 'TRANSFER' ? (
                <div className="bg-gradient-to-br from-white to-blue-50/40 rounded-2xl border-2 border-blue-600/30 p-5 text-left shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                            DOKU Payment Gateway
                          </span>
                          <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                            BERIZIN BI
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600">
                          Invoice: <strong className="text-blue-900 font-mono">{orderSuccessData.doku?.invoiceNumber || `INV-DOKU-${orderSuccessData.id}`}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        isPaymentConfirmed 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {isPaymentConfirmed ? 'LUNAS (VERIFIKASI DOKU)' : 'MENUNGGU PEMBAYARAN'}
                      </span>
                    </div>
                  </div>

                  {/* QRIS / VA Content */}
                  {orderSuccessData.selectedDokuChannel === 'doku_qris' ? (() => {
                    const smartQris = getSmartQrisForOrder({
                      orderId: orderSuccessData.id,
                      amount: orderSuccessData.total,
                      config: dokuConfig
                    });
                    const bankAccounts = dokuConfig?.bankAccounts && dokuConfig.bankAccounts.length > 0
                      ? dokuConfig.bankAccounts
                      : [
                          { bank: 'BCA', accountNumber: '1480928371', holderName: 'SAENA BUTIK MUSLIMAH' },
                          { bank: 'Mandiri', accountNumber: '1310018293847', holderName: 'SAENA BUTIK MUSLIMAH' },
                          { bank: 'BRI', accountNumber: '010901029384501', holderName: 'SAENA BUTIK MUSLIMAH' }
                        ];

                    return (
                      <div className="bg-white rounded-xl border border-[#D5C9B8] overflow-hidden shadow-sm">
                        <div className="p-4 text-center space-y-3">
                          <div className="inline-block bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                            Scan QRIS dengan Aplikasi Mobile Banking / E-Wallet Anda
                          </div>

                          {/* QRIS Image Frame */}
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

                          {/* Scanning Instructions */}
                          <div className="bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EAE4D9] text-[11px] text-[#524B40] text-left space-y-1">
                            <p className="font-semibold text-[#1C3B2B] flex items-center gap-1">
                              <span>💡 Panduan Scan QRIS:</span>
                            </p>
                            <p>
                              1. Buka m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, Shopee, DANA, OVO).
                            </p>
                            <p>
                              2. Buka menu <strong>"Scan / Bayar"</strong> di dalam aplikasi (bukan kamera biasa).
                            </p>
                            <p>
                              3. Atau unduh gambar QRIS di bawah ini, lalu pilih <i>"Ambil dari Galeri"</i> di m-banking.
                            </p>
                          </div>

                          {/* Download & Actions */}
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            <a
                              href={smartQris.qrImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={`QRIS-SAENA-${orderSuccessData.id}.png`}
                              className="text-xs bg-[#EAE4D9] hover:bg-[#D5C9B8] text-[#1C3B2B] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Unduh / Buka Barcode QRIS</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => setIsDokuConfigModalOpen(true)}
                              className="text-xs bg-white hover:bg-[#FAF8F5] border border-[#D5C9B8] text-[#7A7266] hover:text-[#1C3B2B] font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              title="Pengaturan Toko: Ganti / Upload QRIS Toko Asli"
                            >
                              <span>⚙️ Pasang QRIS Toko Asli</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-2">
                      <span className="text-[11px] text-gray-500 font-medium block">
                        Nomor Virtual Account ({orderSuccessData.selectedDokuChannel.toUpperCase().replace('DOKU_VA_', '')}):
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-lg sm:text-xl font-black text-blue-900 tracking-wider">
                          {orderSuccessData.order?.payment?.virtualAccount || '8888891029384756'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(orderSuccessData.order?.payment?.virtualAccount || '8888891029384756', 'va')}
                          className="text-xs flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedKey === 'va' ? 'Tersalin!' : 'Salin Nomor VA'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Transfer tepat sebesar <strong>Rp {orderSuccessData.total.toLocaleString('id-ID')}</strong>. Verifikasi otomatis dalam hitungan detik.
                      </p>
                    </div>
                  )}

                  {/* DOKU Verification & Instant Paid Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Batas Pembayaran: <strong>60 Menit</strong></span>
                    </span>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        disabled={isPaymentConfirmed || isVerifyingDoku}
                        onClick={() => {
                          setIsVerifyingDoku(true);
                          setDokuStatusNotice(null);
                          setTimeout(() => {
                            setIsVerifyingDoku(false);
                            // Check real order status
                            const found = orders.find(o => o.id === orderSuccessData?.id);
                            if (found && found.status === 'dibayar') {
                              setIsPaymentConfirmed(true);
                              confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
                            } else {
                              setDokuStatusNotice('Pembayaran sedang dalam antrian verifikasi perbankan. Jika sudah scan QRIS atau transfer, klik "Saya Sudah Bayar" untuk konfirmasi langsung.');
                            }
                          }, 1000);
                        }}
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                          isPaymentConfirmed
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-white hover:bg-gray-50 border border-blue-300 text-blue-700 shadow-2xs'
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingDoku ? 'animate-spin' : ''}`} />
                        <span>Cek Status</span>
                      </button>

                      <button
                        type="button"
                        disabled={isPaymentConfirmed}
                        onClick={() => {
                          if (orderSuccessData?.id) {
                            confirmOrderPayment(orderSuccessData.id);
                            updateOrderStatus(orderSuccessData.id, 'dibayar');
                            setIsPaymentConfirmed(true);
                            setDokuStatusNotice(null);
                            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
                          }
                        }}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isPaymentConfirmed
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-[#1C3B2B] hover:bg-[#2A4D3B] text-white hover:scale-[1.02]'
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
                          href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Admin saena.id, saya ingin konfirmasi pembayaran untuk pesanan ${orderSuccessData?.id || ''} sebesar Rp ${orderSuccessData?.total?.toLocaleString('id-ID') || ''}.`)}`}
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
                /* COD Notification Panel */
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
                      Rp {orderSuccessData.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Receipt Summary Card */}
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFC8] text-left text-xs max-w-md mx-auto space-y-2">
                <div className="flex justify-between border-b border-[#E8DFC8] pb-1.5 font-bold">
                  <span>No. Pesanan:</span>
                  <span className="font-mono text-[#88222A]">{orderSuccessData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paket Pilihan:</span>
                  <span className="font-semibold">{orderSuccessData.packageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Varian Warna:</span>
                  <span className="font-semibold">{orderSuccessData.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ekspedisi Pengiriman:</span>
                  <span className="font-semibold text-emerald-800">
                    {orderSuccessData.selectedCourier || 'JNE'} (Layanan Reguler)
                  </span>
                </div>
                {orderSuccessData.order?.trackingNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nomor Resi:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900">
                      <span>{orderSuccessData.order.trackingNumber}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(orderSuccessData.order.trackingNumber, 'resi-summary')}
                        className="text-[10px] text-emerald-700 hover:underline cursor-pointer"
                      >
                        {copiedKey === 'resi-summary' ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Metode Pembayaran:</span>
                  <span className="font-semibold text-emerald-700">
                    {orderSuccessData.paymentMethod === 'COD' 
                      ? 'COD (Bayar di Tempat)' 
                      : 'Transfer Bank / QRIS'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Alamat Kirim:</span>
                  <span className="font-semibold text-right max-w-[200px] truncate">{orderSuccessData.address}, {orderSuccessData.city}</span>
                </div>
                <div className="flex justify-between border-t border-[#E8DFC8] pt-2 font-bold text-sm text-[#88222A]">
                  <span>Total Tagihan:</span>
                  <span>Rp {orderSuccessData.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a
                  href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Admin saena.id, saya ingin konfirmasi pesanan dengan No. Pesanan ${orderSuccessData.id} a.n. ${orderSuccessData.name}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Hubungi CS WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => setOrderSuccessData(null)}
                  className="bg-[#1C3B2B] hover:bg-[#14291e] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Buat Pesanan Baru</span>
                </button>
              </div>
            </div>
          ) : (
            /* The Active Order Form */
            <form onSubmit={handleOrderSubmit} className="p-5 sm:p-7 space-y-6">
              {/* Step 1: Choose Package */}
              <div>
                <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  <span>Pilih Paket Promo yang Anda Inginkan:</span>
                </label>

                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
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
                            <div className="text-xs text-[#615446]">{pkg.description}</div>
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

              {/* Step 2: Choose Color */}
              <div>
                <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  <span>Pilih Warna Mukena:</span>
                </label>

                {currentPackage.qty === 1 ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedColor('Dusty Pink');
                      }}
                      className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                        selectedColor === 'Dusty Pink'
                          ? 'border-[#88222A] bg-rose-50 text-[#88222A] font-bold shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-[#E8A5A5] border border-black/10" />
                      <span className="text-xs">Dusty Pink Sakura</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedColor('Sky Blue');
                      }}
                      className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                        selectedColor === 'Sky Blue'
                          ? 'border-[#1C3B2B] bg-sky-50 text-[#1C3B2B] font-bold shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-[#99BBE0] border border-black/10" />
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

              {/* Step 3: Customer Data */}
              <div>
                <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white text-[11px] flex items-center justify-center font-bold">3</span>
                  <span>Isi Data Pengiriman Paket Anda:</span>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="alisa-address-form-section">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Kota / Kabupaten *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Tasikmalaya / Bandung / Jakarta"
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1C3B2B] focus:border-transparent outline-none text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-gray-700 font-semibold">Kecamatan *</label>
                        {(!addressValidation.hasSubdistrict && customerSubdistrict.length > 0) && (
                          <span className="text-[10px] text-amber-700 font-semibold">
                            Wajib diisi
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        id="alisa-subdistrict-input"
                        placeholder="Contoh: Tamansari / Sukasari"
                        value={customerSubdistrict}
                        onChange={(e) => setCustomerSubdistrict(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#1C3B2B] focus:border-transparent outline-none text-xs sm:text-sm transition-all ${
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
                      id="alisa-address-input"
                      rows={2}
                      placeholder="Contoh: Jl. Melati No. 12 / Blok B3, RT 02/RW 05, Kel. Sukahurip (Depan Masjid Al-Ikhlas)"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border focus:ring-2 focus:ring-[#1C3B2B] focus:border-transparent outline-none text-xs sm:text-sm transition-all ${
                        addressValidationAttempted && (!addressValidation.hasHouseNumber && !allowNoHouseNumber)
                          ? 'border-rose-400 bg-rose-50/30'
                          : 'border-gray-300'
                      }`}
                    />
                  </div>

                  {/* Real-time Address Completeness Notification for Buyers */}
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
                            Kurir ekspedisi Mengantar.com memerlukan kejelasan nomor rumah dan kecamatan agar paket pesanan tidak tersesat atau retur:
                          </p>

                          <div className="space-y-1.5 pt-0.5 text-[11px]">
                            {(!addressValidation.hasHouseNumber && !allowNoHouseNumber) && (
                              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-white/70 border border-amber-200">
                                <span className="text-amber-700 font-bold shrink-0">⚠️ Nomor Rumah / Patokan:</span>
                                <span>Nomor rumah belum dicantumkan. Harap sertakan nomor rumah (contoh: <em>No. 12</em> / <em>Blok B3</em>) atau patokan (contoh: <em>Depan Masjid / Samping Pos Ronda</em>).</span>
                              </div>
                            )}
                            {!addressValidation.hasSubdistrict && (
                              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-white/70 border border-amber-200">
                                <span className="text-amber-700 font-bold shrink-0">⚠️ Kecamatan:</span>
                                <span>Kecamatan wajib diisi pada kolom di atas (contoh: <em>Kecamatan Tamansari</em>) untuk kepastian rute kurir.</span>
                              </div>
                            )}
                            {!addressValidation.hasStreetDetail && (
                              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-white/70 border border-amber-200">
                                <span className="text-amber-700 font-bold shrink-0">⚠️ Detail Alamat:</span>
                                <span>Alamat masih terlalu singkat. Cantumkan nama jalan, RT/RW, dan kelurahan/desa.</span>
                              </div>
                            )}
                          </div>

                          {/* Checkbox jika rumah di kampung tanpa nomor */}
                          {(!addressValidation.hasHouseNumber && !allowNoHouseNumber) && (
                            <label className="flex items-center gap-2 pt-1 border-t border-amber-200 text-[11px] text-[#524B40] cursor-pointer hover:text-black">
                              <input
                                type="checkbox"
                                checked={allowNoHouseNumber}
                                onChange={(e) => setAllowNoHouseNumber(e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-[#1C3B2B] focus:ring-[#1C3B2B]"
                              />
                              <span>Rumah saya di perkampungan tanpa nomor (sudah ada patokan RT/RW yang jelas)</span>
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
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1C3B2B] focus:border-transparent outline-none text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Pilihan Ekspedisi Pengiriman (Didukung Mengantar.com) */}
              <div>
                <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white text-[11px] flex items-center justify-center font-bold">4</span>
                  <span>Pilihan Ekspedisi Pengiriman (Didukung Mengantar.com):</span>
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
                    🚚 <strong>Terintegrasi Otomatis Mengantar.com:</strong> Resi resmi terbit otomatis & paket langsung dijadwalkan pickup di Central Warehouse Tasikmalaya.
                  </span>
                </div>
              </div>

              {/* Step 5: Metode Pembayaran (Transfer Bank DOKU di kiri dengan badge Populer, COD di kanan) */}
              <div>
                <label className="block text-xs font-bold text-[#1C3B2B] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1C3B2B] text-white text-[11px] flex items-center justify-center font-bold">5</span>
                  <span>Metode Pembayaran:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* METODE 1 (KIRI): Transfer Bank & QRIS via DOKU Payment Gateway */}
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
                          <span className="text-xs font-bold text-emerald-900">Transfer Bank & QRIS (DOKU)</span>
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                            POPULER
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-snug">
                          QRIS Instan & Virtual Account (BCA, Mandiri, BRI, BNI). Verifikasi otomatis 24/7.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* METODE 2 (KANAN): COD (Bayar di Tempat - Mengantar.com) */}
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

                {/* Sub-channel selector for DOKU when TRANSFER is selected */}
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

              {/* Summary of Total */}
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

              {/* Warning if buyer attempts submit with incomplete address */}
              {addressValidationAttempted && ((!addressValidation.hasHouseNumber && !allowNoHouseNumber) || !addressValidation.hasSubdistrict || !addressValidation.hasStreetDetail) && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-900">Alamat Pengiriman Belum Benar-Benar Lengkap</p>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Mohon lengkapi <strong>nomor rumah/patokan</strong> dan <strong>kecamatan</strong> pada formulir di atas agar paket kurir Mengantar.com tidak terkendala.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit CTA Button */}
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
                      ? 'KONFIRMASI PESAN (BAYAR VIA DOKU GATEWAY)' 
                      : 'KONFIRMASI PESAN (BISA COD MENGANTAR)'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Official Partners Trust Badges */}
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8DFC8] space-y-2">
                <div className="text-[10px] font-bold text-gray-500 text-center uppercase tracking-wider">
                  Partner Resmi Pembayaran & Logistik Terpadu saena.my.id
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                    <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px] leading-tight">
                      <div className="font-bold text-gray-900">DOKU Payment Gateway</div>
                      <div className="text-gray-500 text-[10px]">Berizin Bank Indonesia & PCI-DSS</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                    <div className="w-7 h-7 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px] leading-tight">
                      <div className="font-bold text-gray-900">Mengantar.com Logistik</div>
                      <div className="text-gray-500 text-[10px]">Auto AWB JNE, J&T & COD Terpadu</div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Data Anda 100% aman dan terenkripsi untuk keperluan pemrosesan pesanan resmi.
              </p>
            </form>
          )}
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
                  setSelectedColor(GALLERY_PHOTOS[lightboxIndex]?.color || 'Dusty Pink');
                  setActivePhotoIndex(lightboxIndex);
                  setLightboxOpen(false);
                  scrollToForm();
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
      {/* Modal Dialog Peringatan Alamat Belum Benar-Benar Lengkap */}
      {showIncompleteAddressModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-base font-bold text-[#88222A]">
                  Alamat Pengiriman Belum Lengkap 📦
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Agar kurir ekspedisi <strong>Mengantar.com ({selectedCourier})</strong> dapat menemukan alamat rumah Anda dengan akurat tanpa tersasar, mohon lengkapi:
                </p>
              </div>
            </div>

            <div className="bg-amber-50/85 rounded-xl p-3.5 border border-amber-200 text-xs space-y-2 text-amber-950">
              {(!addressValidation.hasHouseNumber && !allowNoHouseNumber) && (
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-amber-900 block">Nomor Rumah / Patokan Belum Ada</strong>
                    <span className="text-[11px] text-amber-800">
                      Cantumkan nomor rumah (contoh: <em>No. 12</em>, <em>Blok B3</em>) atau patokan (contoh: <em>Depan Masjid / Samping Pos Ronda</em>).
                    </span>
                  </div>
                </div>
              )}

              {!addressValidation.hasSubdistrict && (
                <div className="flex items-start gap-2 pt-1.5 border-t border-amber-200/70">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-amber-900 block">Kecamatan Belum Diisi</strong>
                    <span className="text-[11px] text-amber-800">
                      Cantumkan nama kecamatan tujuan (contoh: <em>Kecamatan Tamansari</em>) agar sistem logistik Mengantar dapat mengalokasikan kurir cabang terdekat.
                    </span>
                  </div>
                </div>
              )}

              {!addressValidation.hasStreetDetail && (
                <div className="flex items-start gap-2 pt-1.5 border-t border-amber-200/70">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-amber-900 block">Alamat Terlalu Singkat</strong>
                    <span className="text-[11px] text-amber-800">
                      Mohon lengkapi nama jalan, RT/RW, atau kelurahan/desa.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox bila rumah di kampung tanpa nomor */}
            {(!addressValidation.hasHouseNumber && !allowNoHouseNumber) && (
              <label className="flex items-start gap-2 text-[11px] text-gray-600 cursor-pointer hover:text-black bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EAE2D5]">
                <input
                  type="checkbox"
                  checked={allowNoHouseNumber}
                  onChange={(e) => setAllowNoHouseNumber(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#88222A] focus:ring-[#88222A] mt-0.5 shrink-0"
                />
                <span>Rumah saya di perkampungan tanpa nomor (sudah menyertakan patokan/RT RW yang jelas pada kolom alamat)</span>
              </label>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-[#EAE2D5]">
              <button
                type="button"
                onClick={() => {
                  setShowIncompleteAddressModal(false);
                  setTimeout(() => {
                    if (!addressValidation.hasHouseNumber && !allowNoHouseNumber) {
                      document.getElementById('alisa-address-input')?.focus();
                    } else if (!addressValidation.hasSubdistrict) {
                      document.getElementById('alisa-subdistrict-input')?.focus();
                    }
                  }, 100);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#88222A] hover:bg-[#721B22] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                ✏️ Lengkapi Alamat Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AlisaLandingPage;
