export type Category = 
  | 'all'
  | 'abaya-gamis'
  | 'hijab-pashmina'
  | 'dress-kaftan'
  | 'koko-kurta'
  | 'mukena-silk'
  | 'aksesoris';

export interface ProductReview {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  variantInfo: string;
  verifiedBuyer: boolean;
  avatarUrl?: string;
}

export interface ProductColor {
  name: string;
  hex: string;
  stock: number;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: Category;
  price: number; // in IDR
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  description: string;
  shortDescription?: string;
  sourceUrl?: string;
  sku?: string;
  weight?: number; // Berat Paket (gram)
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  discount?: number;
  currency?: string;
  material: string;
  careInstructions: string[];
  features: string[];
  colors: ProductColor[];
  sizes: string[];
  stock: Record<string, number>; // rincian stok per warna: { [colorName]: number }
  totalStock: number;
  images: string[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  reviews: ProductReview[];
}

export interface CartItem {
  id: string; // unique cart item id (productId + size + color)
  productId: string;
  product: Product;
  selectedSize: string;
  selectedColor: { name: string; hex: string };
  quantity: number;
  price: number;
}

export type OrderStatus = 
  | 'menunggu_pembayaran' 
  | 'dibayar' 
  | 'sedang_dikemas' 
  | 'dikirim' 
  | 'tiba_di_tujuan'
  | 'selesai'
  | 'dibatalkan';

export interface ShippingMethod {
  id: string;
  courier: string;
  service: string;
  name: string;
  cost: number;
  estimatedDays: string;
  logo: string;
}

export interface TrackingStep {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current: boolean;
}

export interface CustomerDetails {
  fullName: string;
  whatsapp: string;
  email: string;
  address: string;
  province: string;
  city: string;
  subdistrict: string;
  postalCode: string;
  notes?: string;
  country: string;
}

export type PaymentChannel = 
  | 'qris' 
  | 'va_bca' 
  | 'va_mandiri' 
  | 'va_bni' 
  | 'va_bri' 
  | 'va_bsi'
  | 'va_permata'
  | 'doku_checkout'
  | 'doku_qris'
  | 'doku_va_bca'
  | 'doku_va_mandiri'
  | 'doku_va_bni'
  | 'doku_va_bri'
  | 'doku_va_bsi'
  | 'doku_ewallet_ovo'
  | 'doku_ewallet_dana'
  | 'doku_ewallet_shopeepay'
  | 'doku_cc'
  | 'doku_indomaret'
  | 'doku_alfamart'
  | 'gopay' 
  | 'shopeepay' 
  | 'ovo' 
  | 'dana' 
  | 'cc' 
  | 'cod';

export interface DokuPaymentData {
  invoiceNumber: string;
  paymentUrl?: string;
  paymentMethodType: string;
  virtualAccountInfo?: {
    vaNumber: string;
    bank: string;
    expiredDate?: string;
    howToPayUrl?: string;
  };
  qrisInfo?: {
    qrString: string;
    qrImage?: string;
    expiredDate?: string;
  };
  creditCardInfo?: {
    url?: string;
  };
  retailInfo?: {
    paymentCode: string;
    merchant: string;
    expiredDate?: string;
  };
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'FAILED';
  paidAt?: string;
  amount: number;
}

export interface PaymentDetails {
  channel: PaymentChannel;
  channelName: string;
  virtualAccount?: string;
  qrCodeUrl?: string;
  expiryMinutes: number;
  paidAt?: string;
  doku?: DokuPaymentData;
}

export interface DokuStoreConfig {
  clientId: string;
  secretKey: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
  autoRedirectToPaymentUrl: boolean;
  activeChannels: {
    qris: boolean;
    virtualAccounts: boolean;
    eWallet: boolean;
    creditCard: boolean;
    convenienceStore: boolean;
  };
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt?: string;
  customer: CustomerDetails;
  items: CartItem[];
  shipping: ShippingMethod;
  payment: PaymentDetails;
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingCost: number;
  total: number;
  currency: string;
  currencyRate: number;
  status: OrderStatus;
  trackingNumber: string;
  trackingHistory: {
    time: string;
    location: string;
    description: string;
  }[];
  mengantar?: MengantarOrderData;
  bigseller?: BigSellerOrderData;
  notes?: string;
}

export interface BigSellerOrderData {
  bigsellerOrderId: string;
  syncedAt: string;
  status: string;
}

export interface MengantarOrderData {
  mengantarOrderId: string;
  trackingNumber: string;
  courier: string;
  serviceType: string;
  status: 'MENUNGGU_PICKUP' | 'PICKUP' | 'DIKIRIM' | 'TIBA_DI_TUJUAN' | 'SELESAI' | 'BATAL';
  pickupTime?: string;
  labelUrl?: string;
  shippingFee: number;
  syncedAt: string;
  isCod: boolean;
  codAmount?: number;
  airwayBillUrl?: string;
  barcodeNumber?: string;
  estimatedDelivery?: string;
}

export interface MengantarStoreConfig {
  apiKey: string;
  environment: 'production' | 'sandbox';
  autoCreateOnPaid: boolean;
  defaultCourier: string;
  pickupTimeSlot: string;
}

export interface AvailableCoupon {
  code: string;
  discountPercent: number;
  maxDiscount?: number;
  description: string;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'order' | 'promo' | 'system';
  linkTarget?: string;
}

export type LanguageCode = 'id' | 'en' | 'ar';
export type CurrencyCode = 'IDR' | 'USD' | 'SAR' | 'MYR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rateFromIDR: number;
  prefix: string;
}

export interface StoreWarehouseInfo {
  id: string;
  storeName: string;
  originSubdistrict: string;
  originCity: string;
  originProvince: string;
  originPostalCode: string;
  warehouseName: string;
  address: string;
  contactWhatsApp: string;
}

export interface LandingPageConfig {
  id: string; // `lp-${productId}`
  productId: string;
  slug: string;
  isActive: boolean;
  theme: 'emerald' | 'gold' | 'rose' | 'midnight';
  announcementText: string;
  showCountdown: boolean;
  countdownMinutes: number;
  headline: string;
  subheadline: string;
  badge: string;
  discountHighlightText?: string;
  painPoints: string[];
  solutions: string[];
  benefits: Array<{
    title: string;
    description: string;
  }>;
  craftsmanshipTitle: string;
  craftsmanshipDesc: string;
  socialProofHeading: string;
  guaranteeHeading: string;
  guaranteeText: string;
  faqs: Array<{
    q: string;
    a: string;
  }>;
  primaryCtaText: string;
  primaryCtaAction: 'checkout' | 'whatsapp';
  whatsappCustomText?: string;
  urgencyStockRemaining: number;
  showStickyBar: boolean;
  createdAt: string;
  updatedAt: string;
}
