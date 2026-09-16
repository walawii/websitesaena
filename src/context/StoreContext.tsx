import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  Order, 
  OrderStatus, 
  PushNotification, 
  LanguageCode, 
  CurrencyCode, 
  CurrencyConfig,
  CustomerDetails,
  ShippingMethod,
  PaymentChannel,
  ProductReview,
  MengantarStoreConfig,
  MengantarOrderData,
  DokuStoreConfig,
  DokuPaymentData,
  LandingPageConfig
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, SHIPPING_SERVICES, AVAILABLE_COUPONS } from '../data/mockData';
import { translations } from '../translations';
import confetti from 'canvas-confetti';
import { DEFAULT_MENGANTAR_CONFIG, createMengantarOrderApi } from '../utils/mengantarClient';
import { DEFAULT_DOKU_CONFIG, createDokuPaymentApi } from '../utils/dokuClient';
import { 
  db, 
  testConnection, 
  initializeDatabaseIfNeeded, 
  forceReseedAllDatabase, 
  syncOrderToFirestore, 
  syncProductToFirestore, 
  updateProductStockInFirestore, 
  deleteProductFromFirestore,
  deleteAllProductsFromFirestore,
  syncOrderStatusInFirestore,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { isBannedDummyImage, sanitizeProductImageList, FALLBACK_PRODUCT_IMAGE } from '../utils/imageHelper';

const cleanProductFromBannedImages = (p: Product): Product => {
  const cleanedImages = sanitizeProductImageList(p.images || []);
  const cleanedColors = (p.colors || []).map(col => {
    if (col.image && isBannedDummyImage(col.image)) {
      return { ...col, image: undefined };
    }
    return col;
  });
  const isBannedMaterial = 
    p.material && p.material.trim().toLowerCase() === 'mulberry silk & ceruty babydoll premium';
  const cleanedMaterial = isBannedMaterial ? '' : p.material;
  return {
    ...p,
    material: cleanedMaterial,
    images: cleanedImages,
    colors: cleanedColors
  };
};

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    rateFromIDR: 1,
    prefix: 'Rp '
  },
  USD: {
    code: 'USD',
    symbol: '$',
    rateFromIDR: 0.000062,
    prefix: '$'
  },
  SAR: {
    code: 'SAR',
    symbol: '﷼',
    rateFromIDR: 0.00023,
    prefix: '﷼ '
  },
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    rateFromIDR: 0.00027,
    prefix: 'RM '
  }
};

interface StoreContextType {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  wishlist: string[];
  notifications: PushNotification[];
  unreadNotifCount: number;
  language: LanguageCode;
  currency: CurrencyCode;
  t: typeof translations.id;
  activeOrder: Order | null;
  
  // UI State Modals
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  isOrderTrackingOpen: boolean;
  isWhatsAppModalOpen: boolean;
  isPushPromptOpen: boolean;
  isAdminMode: boolean;
  isAuthenticatedAdmin: boolean;
  isAdminLoginModalOpen: boolean;
  selectedProductForDetail: Product | null;
  activeWhatsAppOrder: Order | null;
  
  // Mengantar.com Integration
  mengantarConfig: MengantarStoreConfig;
  updateMengantarConfig: (cfg: Partial<MengantarStoreConfig>) => void;
  dispatchOrderToMengantar: (orderId: string) => Promise<{ success: boolean; message: string; trackingNumber?: string; mengantarOrderId?: string }>;
  activeMengantarLabelOrder: Order | null;
  setActiveMengantarLabelOrder: (o: Order | null) => void;
  isMengantarLabelModalOpen: boolean;
  setIsMengantarLabelModalOpen: (open: boolean) => void;
  isMengantarConfigModalOpen: boolean;
  setIsMengantarConfigModalOpen: (open: boolean) => void;
  
  // DOKU Payment Gateway Integration
  dokuConfig: DokuStoreConfig;
  updateDokuConfig: (cfg: Partial<DokuStoreConfig>) => void;
  isDokuConfigModalOpen: boolean;
  setIsDokuConfigModalOpen: (open: boolean) => void;
  
  // Search & Filter
  searchQuery: string;
  selectedCategory: string;
  sortBy: string;
  priceRange: [number, number];
  
  // Coupon
  appliedCoupon: string | null;
  couponDiscount: number;
  
  // Handlers
  setLanguage: (lang: LanguageCode) => void;
  setCurrency: (cur: CurrencyCode) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  setIsOrderTrackingOpen: (open: boolean) => void;
  setIsWhatsAppModalOpen: (open: boolean) => void;
  setIsPushPromptOpen: (open: boolean) => void;
  setIsAdminMode: (admin: boolean) => void;
  setIsAdminLoginModalOpen: (open: boolean) => void;
  loginAsAdmin: (secret: string) => { success: boolean; message: string };
  logoutAdmin: () => void;
  setSelectedProductForDetail: (p: Product | null) => void;
  setActiveWhatsAppOrder: (o: Order | null) => void;
  setActiveOrder: (o: Order | null) => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: string) => void;
  setSortBy: (s: string) => void;
  setPriceRange: (r: [number, number]) => void;
  
  // Cart Actions
  addToCart: (product: Product, size: string, color: { name: string; hex: string }, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  
  // Wishlist
  toggleWishlist: (productId: string) => void;
  
  // Checkout & Orders
  placeOrder: (customer: CustomerDetails, shipping: ShippingMethod, paymentChannel: PaymentChannel) => Promise<Order>;
  simulatePaymentSuccess: (orderId: string) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, trackingNumber?: string) => void;
  
  // Inventory
  updateStock: (productId: string, sizeOrColor: string, newStock: number) => void;
  updateColorStock: (productId: string, colorName: string, newStock: number) => Promise<void>;
  updateProduct: (updatedProduct: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  deleteAllProducts: () => Promise<number>;
  quickRestock: (productId: string, amount: number) => void;
  updateProductPrice: (productId: string, newPrice: number) => void;
  addNewProduct: (newProd: Partial<Product>) => Promise<Product>;
  addMultipleProducts: (newProds: Partial<Product>[]) => Promise<Product[]>;
  
  // Reviews
  addProductReview: (productId: string, review: Omit<ProductReview, 'id' | 'date'>) => void;
  
  // Push Notifications
  sendPushNotification: (title: string, message: string, type?: 'order' | 'promo' | 'system', link?: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  requestBrowserPushPermission: () => Promise<boolean>;
  
  // Currency helpers
  formatPrice: (amountInIDR: number) => string;
  convertPrice: (amountInIDR: number) => number;

  // Cloud Database (Firestore)
  isFirebaseConnected: boolean;
  firebaseSyncStatus: 'connected' | 'syncing' | 'offline';
  reseedDatabase: () => Promise<void>;

  // Landing Pages (Direct-Response Promo)
  landingPages: Record<string, LandingPageConfig>;
  saveLandingPage: (config: LandingPageConfig) => Promise<void>;
  deleteLandingPage: (productId: string) => Promise<void>;
  activeLandingProductId: string | null;
  setActiveLandingProductId: (id: string | null) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('saena_products_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(cleanProductFromBannedImages);
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_PRODUCTS.map(cleanProductFromBannedImages);
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('saena_orders_v1');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('saena_cart_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('saena_wishlist_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // Cloud Database state
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  const [notifications, setNotifications] = useState<PushNotification[]>(() => [
    {
      id: 'notif-1',
      title: 'Selamat Datang di saena.id! 🌙',
      message: 'Gunakan kode voucher promo SAENARAMADHAN untuk menikmati potongan 15% untuk koleksi Hari Raya.',
      timestamp: 'Baru saja',
      read: false,
      type: 'promo'
    },
    {
      id: 'notif-2',
      title: 'Update Pengiriman Pesanan SAENA-98214 📦',
      message: 'Paket Anda telah diserahkan ke kurir SiCepat dengan nomor resi SCP-88291048201.',
      timestamp: '2 jam lalu',
      read: false,
      type: 'order',
      linkTarget: 'SAENA-98214'
    }
  ]);

  const [language, setLanguage] = useState<LanguageCode>('id');
  const [currency, setCurrency] = useState<CurrencyCode>('IDR');
  
  // Modals & Active UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isPushPromptOpen, setIsPushPromptOpen] = useState(false);
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('saena_admin_auth_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isAdminMode, setIsAdminModeState] = useState(false);

  const setIsAdminMode = (mode: boolean) => {
    if (mode && !isAuthenticatedAdmin) {
      setIsAdminLoginModalOpen(true);
      return;
    }
    setIsAdminModeState(mode);
  };

  // URL parameter check for admin access: ?admin=login or ?admin=true
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'login' || params.get('admin') === 'true') {
        if (isAuthenticatedAdmin) {
          setIsAdminModeState(true);
        } else {
          setIsAdminLoginModalOpen(true);
        }
      }
    } catch {
      // Ignore
    }
  }, [isAuthenticatedAdmin]);

  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [activeWhatsAppOrder, setActiveWhatsAppOrder] = useState<Order | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => orders[0] || null);

  // Mengantar.com Integration State
  const [mengantarConfig, setMengantarConfig] = useState<MengantarStoreConfig>(() => {
    try {
      const saved = localStorage.getItem('saena_mengantar_config_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_MENGANTAR_CONFIG;
  });
  const [activeMengantarLabelOrder, setActiveMengantarLabelOrder] = useState<Order | null>(null);
  const [isMengantarLabelModalOpen, setIsMengantarLabelModalOpen] = useState(false);
  const [isMengantarConfigModalOpen, setIsMengantarConfigModalOpen] = useState(false);

  // DOKU Payment Gateway Integration State
  const [dokuConfig, setDokuConfig] = useState<DokuStoreConfig>(() => {
    try {
      const saved = localStorage.getItem('saena_doku_config_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_DOKU_CONFIG;
  });
  const [isDokuConfigModalOpen, setIsDokuConfigModalOpen] = useState(false);

  // Landing Pages (Direct-Response Promos)
  const [landingPages, setLandingPages] = useState<Record<string, LandingPageConfig>>(() => {
    try {
      const saved = localStorage.getItem('saena_landing_pages_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  const [activeLandingProductId, setActiveLandingProductId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('landing') || params.get('lp') || null;
    } catch {
      return null;
    }
  });

  const saveLandingPage = async (config: LandingPageConfig) => {
    setLandingPages(prev => {
      const next = { ...prev, [config.productId]: config };
      try {
        localStorage.setItem('saena_landing_pages_v1', JSON.stringify(next));
      } catch (e) {
        console.warn('Local storage write error for landing page:', e);
      }
      return next;
    });

    try {
      const docRef = doc(db, 'landing_pages', config.productId);
      await setDoc(docRef, config);
    } catch (err) {
      console.warn('Firestore write notice for landing page:', err);
    }
  };

  const deleteLandingPage = async (productId: string) => {
    setLandingPages(prev => {
      const next = { ...prev };
      delete next[productId];
      try {
        localStorage.setItem('saena_landing_pages_v1', JSON.stringify(next));
      } catch (e) {
        console.warn('Local storage write error:', e);
      }
      return next;
    });

    try {
      const docRef = doc(db, 'landing_pages', productId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore delete notice for landing page:', err);
    }
  };

  const updateDokuConfig = (cfg: Partial<DokuStoreConfig>) => {
    setDokuConfig(prev => {
      const updated = { ...prev, ...cfg };
      try {
        localStorage.setItem('saena_doku_config_v1', JSON.stringify(updated));
      } catch (err) {
        console.warn('Save Doku config error:', err);
      }
      return updated;
    });
  };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1500000]);

  // Coupon
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('saena_products_v1', JSON.stringify(products));
  }, [products]);

  // Automatically sync API credentials configured in server environment
  useEffect(() => {
    fetch('/api/system/gateway-config')
      .then(res => res.json())
      .then(data => {
        if (data?.mengantar?.apiKey) {
          setMengantarConfig(prev => {
            if (!prev?.apiKey || prev.apiKey !== data.mengantar.apiKey) {
              const updated = { ...prev, apiKey: data.mengantar.apiKey, environment: data.mengantar.environment || 'production' };
              try {
                localStorage.setItem('saena_mengantar_config_v1', JSON.stringify(updated));
              } catch {
                // ignore
              }
              return updated;
            }
            return prev;
          });
        }
        if (data?.doku?.clientId) {
          setDokuConfig(prev => {
            if (!prev?.clientId || prev.clientId !== data.doku.clientId) {
              const updated = { ...prev, clientId: data.doku.clientId, environment: data.doku.environment || 'sandbox' };
              try {
                localStorage.setItem('saena_doku_config_v1', JSON.stringify(updated));
              } catch {
                // ignore
              }
              return updated;
            }
            return prev;
          });
        }
      })
      .catch(err => {
        console.warn('Failed to auto-detect gateway config:', err);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('saena_orders_v1', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('saena_cart_v1', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('saena_wishlist_v1', JSON.stringify(wishlist));
  }, [wishlist]);

  // Firestore Database Real-time Synchronization & Bootstrap
  useEffect(() => {
    let isMounted = true;

    async function initFirestore() {
      try {
        setFirebaseSyncStatus('syncing');
        await testConnection();
        await initializeDatabaseIfNeeded();
        if (isMounted) {
          setIsFirebaseConnected(true);
          setFirebaseSyncStatus('connected');
        }
      } catch (err) {
        console.warn('Firestore initialization notice:', err);
        if (isMounted) {
          setFirebaseSyncStatus('offline');
        }
      }
    }

    initFirestore();

    // 1. Products Real-time Listener
    const productsPath = 'products';
    const unsubProducts = onSnapshot(
      collection(db, productsPath),
      (snapshot) => {
        const remoteProducts: Product[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Product;
          remoteProducts.push(cleanProductFromBannedImages(data));
        });
        if (isMounted) {
          if (remoteProducts.length > 0) {
            setProducts(remoteProducts);
          } else if (INITIAL_PRODUCTS.length > 0) {
            setProducts(INITIAL_PRODUCTS);
            // Auto seed to Firestore if remote collection is empty
            INITIAL_PRODUCTS.forEach(p => syncProductToFirestore(p).catch(() => {}));
          }
          setIsFirebaseConnected(true);
          setFirebaseSyncStatus('connected');
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, productsPath);
        if (isMounted) {
          setProducts(prev => prev.length > 0 ? prev : INITIAL_PRODUCTS);
        }
      }
    );

    // 2. Orders Real-time Listener
    const ordersPath = 'orders';
    const unsubOrders = onSnapshot(
      collection(db, ordersPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteOrders: Order[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Order;
            remoteOrders.push(data);
          });
          // Keep newest orders at top
          remoteOrders.sort((a, b) => {
            return (b.id || '').localeCompare(a.id || '');
          });
          if (isMounted) {
            setOrders(remoteOrders);
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('connected');
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, ordersPath);
      }
    );

    // 3. Landing Pages Real-time Listener
    const landingPagesPath = 'landing_pages';
    const unsubLandingPages = onSnapshot(
      collection(db, landingPagesPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteLPs: Record<string, LandingPageConfig> = {};
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as LandingPageConfig;
            if (data && data.productId) {
              remoteLPs[data.productId] = data;
            }
          });
          if (isMounted) {
            setLandingPages(prev => {
              const merged = { ...prev, ...remoteLPs };
              try {
                localStorage.setItem('saena_landing_pages_v1', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }
      },
      (error) => {
        console.warn('Firestore landing_pages listener notice:', error);
      }
    );

    return () => {
      isMounted = false;
      unsubProducts();
      unsubOrders();
      unsubLandingPages();
    };
  }, []);

  const reseedDatabase = async () => {
    try {
      setFirebaseSyncStatus('syncing');
      await forceReseedAllDatabase();
      setIsFirebaseConnected(true);
      setFirebaseSyncStatus('connected');
      sendPushNotification(
        'Database Berhasil Direset & Diisi Ulang! 🔄',
        'Data produk, pesanan, dan konfigurasi gudang Tamansari Tasikmalaya tersinkronisasi ke Cloud Firestore.',
        'system'
      );
    } catch (err) {
      console.error('Failed to reseed database:', err);
      sendPushNotification(
        'Gagal Sinkronisasi Database ⚠️',
        'Terjadi kendala saat menyinkronkan data ke Cloud Firestore.',
        'system'
      );
    }
  };

  const t = translations[language] || translations.id;

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  // Currency Converter Helpers
  const convertPrice = (amountInIDR: number): number => {
    const config = CURRENCY_CONFIGS[currency];
    return amountInIDR * config.rateFromIDR;
  };

  const formatPrice = (amountInIDR: number): string => {
    const config = CURRENCY_CONFIGS[currency];
    const converted = convertPrice(amountInIDR);
    if (currency === 'IDR') {
      return `Rp ${amountInIDR.toLocaleString('id-ID')}`;
    }
    if (currency === 'USD') {
      return `$${converted.toFixed(2)}`;
    }
    if (currency === 'SAR') {
      return `﷼ ${converted.toFixed(2)}`;
    }
    if (currency === 'MYR') {
      return `RM ${converted.toFixed(2)}`;
    }
    return `${config.symbol} ${converted.toFixed(2)}`;
  };

  // Push Notifications
  const sendPushNotification = (
    title: string, 
    message: string, 
    type: 'order' | 'promo' | 'system' = 'system',
    linkTarget?: string
  ) => {
    const newNotif: PushNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Baru saja',
      read: false,
      type,
      linkTarget
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Native Browser Notification if allowed
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      } catch (err) {
        console.warn('Native notification suppressed:', err);
      }
    }
  };

  const requestBrowserPushPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        sendPushNotification(
          'Notifikasi Berhasil Diaktifkan! ✨',
          'Anda akan menerima kabar tercepat untuk update nomor resi pengiriman dan flash sale promo saena.id.',
          'system'
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Cart Actions
  const addToCart = (product: Product, size: string, color: { name: string; hex: string }, quantity = 1) => {
    const cartItemId = `${product.id}-${size}-${color.name}`;
    
    // Check available stock specifically per color variant, fallback to size or total
    const availableStock = (color?.name && product.stock[color.name] !== undefined)
      ? product.stock[color.name]
      : (product.stock[size] ?? product.totalStock);
    
    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, availableStock);
        return prev.map(item => item.id === cartItemId ? { ...item, quantity: newQty } : item);
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          product,
          selectedSize: size,
          selectedColor: color,
          quantity: Math.min(quantity, availableStock),
          price: product.price
        }
      ];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const availableStock = (item.selectedColor?.name && item.product.stock[item.selectedColor.name] !== undefined)
          ? item.product.stock[item.selectedColor.name]
          : (item.product.stock[item.selectedSize] ?? item.product.totalStock);
        return {
          ...item,
          quantity: Math.min(quantity, availableStock)
        };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = AVAILABLE_COUPONS[cleanCode];

    if (!coupon) {
      return { success: false, message: 'Kode voucher promo tidak ditemukan atau telah kedaluwarsa.' };
    }

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let calculatedDiscount = (subtotal * coupon.discountPercent) / 100;
    if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
      calculatedDiscount = coupon.maxDiscount;
    }

    setAppliedCoupon(cleanCode);
    setCouponDiscount(calculatedDiscount);

    return { 
      success: true, 
      message: `Voucher ${cleanCode} berhasil digunakan! Anda hemat Rp ${calculatedDiscount.toLocaleString('id-ID')}` 
    };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Stock updates & inventory
  const updateColorStock = async (productId: string, colorName: string, newStock: number) => {
    let targetProduct: Product | null = null;
    const safeStock = Math.max(0, newStock);
    
    setProducts(prev => {
      const updatedList = prev.map(p => {
        if (p.id === productId) {
          const updatedStock = { ...p.stock, [colorName]: safeStock };
          const updatedColors = p.colors.map(c => c.name === colorName ? { ...c, stock: safeStock } : c);
          const updatedTotal = (Object.values(updatedStock) as number[]).reduce((a, b) => a + (Number(b) || 0), 0);
          targetProduct = {
            ...p,
            colors: updatedColors,
            stock: updatedStock,
            totalStock: updatedTotal
          };
          return targetProduct;
        }
        return p;
      });
      return updatedList;
    });

    if (targetProduct) {
      try {
        await syncProductToFirestore(targetProduct);
      } catch (err) {
        console.warn('Sync color stock in Firestore warning:', err);
      }
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    const calculatedTotal = (Object.values(updatedProduct.stock) as number[]).reduce((a, b) => a + (Number(b) || 0), 0);
    const finalProduct: Product = {
      ...updatedProduct,
      totalStock: calculatedTotal
    };

    setProducts(prev => prev.map(p => p.id === finalProduct.id ? finalProduct : p));

    try {
      setFirebaseSyncStatus('syncing');
      await syncProductToFirestore(finalProduct);
      setIsFirebaseConnected(true);
      setFirebaseSyncStatus('connected');
      sendPushNotification(
        `Koleksi & Stok Diperbarui ✅`,
        `Perubahan produk "${finalProduct.name}" berhasil disimpan ke database Firestore.`,
        'system'
      );
    } catch (err) {
      console.warn('Sync updated product to Firestore error:', err);
    }
  };

  const deleteProduct = async (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    try {
      await deleteProductFromFirestore(productId);
      sendPushNotification(
        'Produk Dihapus 🗑️',
        'Produk telah dihapus dari katalog dan database.',
        'system'
      );
    } catch (err) {
      console.warn('Delete product from Firestore error:', err);
    }
  };

  const deleteAllProducts = async (): Promise<number> => {
    setProducts([]);
    setCart([]);
    setWishlist([]);
    setSelectedProductForDetail(null);
    try {
      localStorage.removeItem('saena_products_v1');
      localStorage.removeItem('saena_cart_v1');
      localStorage.removeItem('saena_wishlist_v1');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    try {
      setFirebaseSyncStatus('syncing');
      const count = await deleteAllProductsFromFirestore();
      setFirebaseSyncStatus('connected');
      setIsFirebaseConnected(true);
      sendPushNotification(
        'Katalog Toko Dikosongkan 🗑️',
        'Semua produk dan foto varian telah berhasil dihapus dari toko dan database Firestore.',
        'system'
      );
      return count;
    } catch (err) {
      console.warn('Delete all products from Firestore error:', err);
      return 0;
    }
  };

  const updateStock = (productId: string, key: string, newStock: number) => {
    updateColorStock(productId, key, newStock);
  };

  const quickRestock = (productId: string, amount: number) => {
    setProducts(prev => {
      let targetProduct: Product | null = null;
      const updatedList = prev.map(p => {
        if (p.id === productId) {
          const firstColor = p.colors[0]?.name || Object.keys(p.stock)[0] || 'Default';
          const current = p.stock[firstColor] || 0;
          const updatedStock = { ...p.stock, [firstColor]: current + amount };
          const updatedColors = p.colors.map(c => c.name === firstColor ? { ...c, stock: (c.stock || 0) + amount } : c);
          const updatedTotal = (Object.values(updatedStock) as number[]).reduce((a, b) => a + (Number(b) || 0), 0);
          targetProduct = {
            ...p,
            colors: updatedColors,
            stock: updatedStock,
            totalStock: updatedTotal
          };
          return targetProduct;
        }
        return p;
      });

      if (targetProduct) {
        syncProductToFirestore(targetProduct as Product).catch(err => {
          console.warn('Quick restock in Firestore error:', err);
        });
      }

      return updatedList;
    });
  };

  const updateProductPrice = (productId: string, newPrice: number) => {
    setProducts(prev => {
      const updatedList = prev.map(p => {
        if (p.id === productId) {
          const updated = { ...p, price: newPrice };
          syncProductToFirestore(updated).catch(err => console.warn('Update price in Firestore error:', err));
          return updated;
        }
        return p;
      });
      return updatedList;
    });
  };

  const addNewProduct = async (newProd: Partial<Product>): Promise<Product> => {
    const id = `saena-${Date.now().toString().slice(-4)}`;
    const initialColors = newProd.colors?.length ? newProd.colors : [
      { name: 'Emerald Forest', hex: '#1C3B2B', stock: 10, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop' }
    ];
    const initialStock: Record<string, number> = {};
    initialColors.forEach(col => {
      initialStock[col.name] = col.stock ?? 10;
    });
    const total = Object.values(initialStock).reduce((a, b) => a + b, 0);

    const colorImages = initialColors.map(c => c.image).filter(Boolean) as string[];
    const combinedImages = Array.from(new Set([...(newProd.images || []), ...colorImages])).filter(Boolean);

    const fullProduct: Product = {
      id,
      name: newProd.name || 'Koleksi Baru saena.id',
      slug: (newProd.name || 'koleksi-baru').toLowerCase().replace(/\s+/g, '-'),
      category: newProd.category || 'abaya-gamis',
      price: newProd.price || 499000,
      originalPrice: newProd.originalPrice || 599000,
      rating: 5.0,
      reviewCount: 0,
      description: newProd.description || 'Busana muslim eksklusif potongan rapi dan material lembut berkelas.',
      material: newProd.material || 'Premium Silk Chiffon',
      careInstructions: ['Dry clean atau cuci tangan lembut'],
      features: ['Jahitan butik rapi', 'Wudhu & Busui friendly'],
      colors: initialColors,
      sizes: newProd.sizes || ['S', 'M', 'L'],
      stock: initialStock,
      totalStock: total,
      images: combinedImages.length ? combinedImages : [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop'
      ],
      isNewArrival: true,
      reviews: []
    };

    setProducts(prev => [fullProduct, ...prev]);

    // Save to Firestore database
    try {
      await syncProductToFirestore(fullProduct);
    } catch (err) {
      console.warn('Sync new product to Firestore error:', err);
    }

    return fullProduct;
  };

  const addMultipleProducts = async (newProds: Partial<Product>[]): Promise<Product[]> => {
    if (!newProds.length) return [];

    const now = Date.now();
    const createdProducts: Product[] = newProds.map((newProd, idx) => {
      const id = newProd.id || `saena-${now.toString().slice(-4)}-${idx + 1}`;
      const initialColors = newProd.colors?.length ? newProd.colors : [
        { name: 'Emerald Forest', hex: '#1C3B2B', stock: 15, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop' }
      ];

      const initialStock: Record<string, number> = {};
      initialColors.forEach(col => {
        initialStock[col.name] = typeof col.stock === 'number' ? col.stock : 10;
      });
      const total = Object.values(initialStock).reduce((a, b) => a + b, 0);

      const colorImages = initialColors.map(c => c.image).filter(Boolean) as string[];
      const combinedImages = Array.from(new Set([...(newProd.images || []), ...colorImages])).filter(Boolean);

      const fullProduct: Product = {
        id,
        name: newProd.name || `Koleksi Baru saena.id #${idx + 1}`,
        slug: (newProd.name || `koleksi-baru-${idx + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: newProd.category || 'abaya-gamis',
        price: newProd.price || 499000,
        originalPrice: newProd.originalPrice || (newProd.price ? Math.round(newProd.price * 1.15 / 5000) * 5000 : 599000),
        rating: 5.0,
        reviewCount: 0,
        description: newProd.description || 'Busana muslimah eksklusif saena.id dengan cutting rapi, bahan jatuh berkelas, dan jahitan standar butik.',
        shortDescription: newProd.shortDescription,
        sourceUrl: newProd.sourceUrl,
        sku: newProd.sku || `SKU-${now.toString().slice(-4)}-${idx + 1}`,
        weight: newProd.weight || 450,
        dimensions: newProd.dimensions || { length: 25, width: 20, height: 4 },
        discount: newProd.discount,
        currency: newProd.currency || 'IDR',
        material: newProd.material || '',
        careInstructions: newProd.careInstructions?.length ? newProd.careInstructions : [
          'Cuci dengan tangan suhu air normal',
          'Gunakan deterjen cair lembut',
          'Keringkan di tempat teduh',
          'Setrika suhu rendah atau gunakan garment steamer'
        ],
        features: newProd.features?.length ? newProd.features : [
          'Busui Friendly (Aksen zipper depan)',
          'Wudhu Friendly (Manset lengan rapi)',
          'Bahan adem, jatuh, dan tidak terawang',
          'Jahitan halus standar butik'
        ],
        colors: initialColors,
        sizes: newProd.sizes?.length ? newProd.sizes : ['All Size', 'M', 'L', 'XL'],
        stock: initialStock,
        totalStock: total,
        images: combinedImages.length ? combinedImages : [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop'
        ],
        isNewArrival: true,
        reviews: []
      };

      return fullProduct;
    });

    setProducts(prev => [...createdProducts, ...prev]);

    // Save batch concurrently to Firestore
    try {
      setFirebaseSyncStatus('syncing');
      await Promise.allSettled(
        createdProducts.map(prod => syncProductToFirestore(prod))
      );
      setFirebaseSyncStatus('connected');
      setIsFirebaseConnected(true);
      sendPushNotification(
        'Impor Excel Berhasil 📊',
        `${createdProducts.length} produk baru berhasil dimasukkan ke katalog dan disinkronkan ke database Firestore.`,
        'system'
      );
    } catch (err) {
      console.warn('Batch Firestore sync notice:', err);
    }

    return createdProducts;
  };

  // Reviews
  const addProductReview = (productId: string, review: Omit<ProductReview, 'id' | 'date'>) => {
    const newReview: ProductReview = {
      id: `rev-${Date.now()}`,
      date: 'Baru saja',
      ...review
    };

    setProducts(prev => prev.map(prod => {
      if (prod.id === productId) {
        const updatedReviews = [newReview, ...prod.reviews];
        const newAvgRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
        return {
          ...prod,
          reviews: updatedReviews,
          rating: Number(newAvgRating.toFixed(1)),
          reviewCount: updatedReviews.length
        };
      }
      return prod;
    }));

    sendPushNotification(
      'Ulasan Baru Diterima! ⭐',
      `${review.userName} baru saja memberikan ulasan bintang ${review.rating} untuk produk kami.`,
      'system'
    );
  };

  // Checkout & Order Placement
  const placeOrder = async (
    customer: CustomerDetails, 
    shipping: ShippingMethod, 
    paymentChannel: PaymentChannel
  ): Promise<Order> => {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = shipping.cost;
    const finalTotal = Math.max(0, subtotal - couponDiscount + shippingCost);
    const orderId = `SAENA-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Generate authentic tracking number based on selected courier
    let trackingNo = `SAENA-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    if (shipping.courier.includes('JNE')) {
      trackingNo = `TJNE0${Math.floor(100000000 + Math.random() * 900000000)}`;
    } else if (shipping.courier.includes('J&T')) {
      trackingNo = `JP${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    } else if (shipping.courier.includes('SiCepat')) {
      trackingNo = `SCP-${Math.floor(10000000000 + Math.random() * 90000000000)}`;
    } else if (shipping.courier.includes('DHL')) {
      trackingNo = `DHL-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    }

    const channelNames: Record<PaymentChannel, string> = {
      qris: 'QRIS Realtime Dynamic (DOKU Gateway)',
      va_bca: 'BCA Virtual Account (DOKU)',
      va_mandiri: 'Mandiri Virtual Account (DOKU)',
      va_bni: 'BNI Virtual Account (DOKU)',
      va_bri: 'BRI Virtual Account (DOKU)',
      va_bsi: 'BSI Virtual Account Syariah (DOKU)',
      va_permata: 'Permata Virtual Account (DOKU)',
      doku_checkout: 'DOKU All-in-One Checkout',
      doku_qris: 'DOKU QRIS Realtime Instant',
      doku_va_bca: 'BCA Virtual Account (DOKU)',
      doku_va_mandiri: 'Mandiri Virtual Account (DOKU)',
      doku_va_bni: 'BNI Virtual Account (DOKU)',
      doku_va_bri: 'BRI Virtual Account (DOKU)',
      doku_va_bsi: 'BSI Virtual Account Syariah (DOKU)',
      doku_ewallet_ovo: 'OVO (DOKU Jokul)',
      doku_ewallet_dana: 'DANA (DOKU Jokul)',
      doku_ewallet_shopeepay: 'ShopeePay (DOKU Jokul)',
      doku_cc: 'Kartu Kredit / Debit (DOKU 3D Secure)',
      doku_indomaret: 'Indomaret / Ceriamart (DOKU Retail)',
      doku_alfamart: 'Alfamart / Alfamidi (DOKU Retail)',
      gopay: 'GoPay Instant Checkout (DOKU)',
      shopeepay: 'ShopeePay Indonesia (DOKU)',
      ovo: 'OVO Digital Wallet (DOKU)',
      dana: 'DANA Dompet Digital (DOKU)',
      cc: 'Credit Card / Visa / Mastercard (DOKU)',
      cod: 'Cash on Delivery (Bayar di Tempat)'
    };

    // Prepare DOKU transaction session if electronic payment
    let dokuPaymentData: DokuPaymentData | undefined = undefined;
    if (paymentChannel !== 'cod') {
      try {
        const dokuRes = await createDokuPaymentApi({
          orderId,
          invoiceNumber: `INV-DOKU-${orderId.replace('SAENA-', '')}`,
          amount: finalTotal,
          customer: {
            fullName: customer.fullName,
            email: customer.email,
            whatsapp: customer.whatsapp,
            address: `${customer.address}, ${customer.subdistrict}, ${customer.city}, ${customer.province} ${customer.postalCode}`
          },
          items: cart.map(item => ({
            name: `${item.product.name} (${item.selectedSize} - ${item.selectedColor.name})`,
            quantity: item.quantity,
            price: item.price
          })),
          channel: paymentChannel
        }, dokuConfig);

        if (dokuRes.success && dokuRes.data) {
          dokuPaymentData = dokuRes.data;
        }
      } catch (err) {
        console.warn('DOKU payment session generation note:', err);
      }
    }

    const newOrder: Order = {
      id: orderId,
      createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      customer,
      items: [...cart],
      shipping,
      payment: {
        channel: paymentChannel,
        channelName: channelNames[paymentChannel] || 'DOKU Payment Gateway',
        virtualAccount: dokuPaymentData?.virtualAccountInfo?.vaNumber || (paymentChannel.includes('va_') ? `88888${Math.floor(1000000000 + Math.random() * 9000000000)}` : undefined),
        qrCodeUrl: dokuPaymentData?.qrisInfo?.qrImage || (paymentChannel.includes('qris') ? 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=00020101021226580016ID.CO.QRIS.WWW011893600002011000000005204581253033605802ID5915SAENA_ID_OFFIC6011TASIKMALAYA62070703A016304' : undefined),
        expiryMinutes: 60,
        paidAt: undefined,
        doku: dokuPaymentData
      },
      subtotal,
      discount: couponDiscount,
      couponCode: appliedCoupon || undefined,
      shippingCost,
      total: finalTotal,
      currency,
      currencyRate: CURRENCY_CONFIGS[currency].rateFromIDR,
      status: 'menunggu_pembayaran',
      trackingNumber: trackingNo,
      trackingHistory: [
        {
          time: 'Baru saja',
          location: 'Sistem Pembayaran Terpadu saena.id',
          description: `Pesanan ${orderId} berhasil dibuat dan menunggu pembayaran via ${channelNames[paymentChannel]}.`
        },
        {
          time: 'Estimasi Pengiriman',
          location: 'Central Warehouse saena.id, Kec. Tamansari, Kota Tasikmalaya (46196)',
          description: `Paket disiapkan di Butik saena.id Tamansari Tasikmalaya untuk di-pickup oleh kurir ${shipping.courier} (${shipping.service}).`
        }
      ],
      notes: customer.notes
    };

    // Decrement inventory stock automatically per color variant
    setProducts(prev => prev.map(p => {
      const cartItemsForProduct = cart.filter(ci => ci.productId === p.id);
      if (cartItemsForProduct.length === 0) return p;

      const updatedStock = { ...p.stock };
      const updatedColors = p.colors.map(c => ({ ...c }));

      cartItemsForProduct.forEach(ci => {
        const colorName = ci.selectedColor?.name;
        if (colorName && updatedStock[colorName] !== undefined) {
          updatedStock[colorName] = Math.max(0, updatedStock[colorName] - ci.quantity);
        } else if (ci.selectedSize && updatedStock[ci.selectedSize] !== undefined) {
          updatedStock[ci.selectedSize] = Math.max(0, updatedStock[ci.selectedSize] - ci.quantity);
        }

        const colorIdx = updatedColors.findIndex(c => c.name === colorName);
        if (colorIdx >= 0) {
          updatedColors[colorIdx].stock = Math.max(0, (updatedColors[colorIdx].stock || 0) - ci.quantity);
        }
      });

      const updatedTotal = (Object.values(updatedStock) as number[]).reduce((a, b) => a + b, 0);
      const updatedProduct: Product = {
        ...p,
        colors: updatedColors,
        stock: updatedStock,
        totalStock: updatedTotal
      };

      // Sync updated stock to Firestore
      syncProductToFirestore(updatedProduct).catch(err => {
        console.warn('Update stock post-order in Firestore error:', err);
      });

      return updatedProduct;
    }));

    // Add to orders
    setOrders(prev => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    setActiveWhatsAppOrder(newOrder);

    // Clear cart
    clearCart();

    // Persist order to Cloud Firestore
    syncOrderToFirestore(newOrder).catch(err => {
      console.warn('Sync order to Firestore warning:', err);
    });

    // Send push notification about order creation
    sendPushNotification(
      `Pesanan ${newOrder.id} Dibuat! 🛍️`,
      `Total ${formatPrice(newOrder.total)} via ${newOrder.payment.channelName}. Selesaikan transaksi Anda.`,
      'order',
      newOrder.id
    );

    // Auto-dispatch COD orders to Mengantar.com if enabled
    if (paymentChannel === 'cod' && mengantarConfig.autoCreateOnPaid) {
      setTimeout(() => {
        dispatchOrderToMengantar(newOrder.id).catch(err => {
          console.warn('Auto dispatch COD to Mengantar error:', err);
        });
      }, 700);
    }

    return newOrder;
  };

  // Simulate instant payment callback / webhook
  const simulatePaymentSuccess = (orderId: string) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const paidOrder: Order = {
          ...ord,
          status: 'dibayar',
          payment: {
            ...ord.payment,
            paidAt: new Date().toLocaleTimeString('id-ID'),
            doku: ord.payment.doku ? {
              ...ord.payment.doku,
              status: 'SUCCESS',
              paidAt: new Date().toISOString()
            } : undefined
          },
          trackingHistory: [
            ...ord.trackingHistory,
            {
              time: 'Baru saja',
              location: 'DOKU Payment Gateway (doku.com)',
              description: `Pembayaran ${formatPrice(ord.total)} berhasil diverifikasi LUNAS otomatis melalui DOKU. Tim warehouse Tamansari Tasikmalaya bersiap mengemas paket.`
            }
          ]
        };
        setActiveOrder(paidOrder);
        setActiveWhatsAppOrder(paidOrder);

        // Sync payment status to Cloud Firestore
        syncOrderStatusInFirestore(orderId, 'dibayar', paidOrder.trackingHistory).catch(err => {
          console.warn('Sync payment status to Firestore error:', err);
        });

        return paidOrder;
      }
      return ord;
    }));

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1C3B2B', '#C5A880', '#F3EFEA', '#D4AF37']
      });
    } catch {
      // Confetti fallback
    }

    sendPushNotification(
      `Pembayaran Pesanan ${orderId} LUNAS! ✅`,
      `Terima kasih atas kepercayaan Anda di saena.id. Pesanan Anda segera disiapkan.`,
      'order',
      orderId
    );

    // Automatically trigger WhatsApp notification modal
    setIsWhatsAppModalOpen(true);

    // Automatically dispatch paid order to Mengantar.com to generate resi
    if (mengantarConfig.autoCreateOnPaid) {
      setTimeout(() => {
        dispatchOrderToMengantar(orderId).catch(err => {
          console.warn('Auto dispatch paid order to Mengantar error:', err);
        });
      }, 700);
    }
  };

  // Admin or system update order status
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, customTrackingNo?: string) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const trackingHistory = [...ord.trackingHistory];
        const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

        if (newStatus === 'sedang_dikemas') {
          trackingHistory.push({
            time: nowStr,
            location: 'Central Boutique Warehouse saena.id, Kec. Tamansari, Kota Tasikmalaya (46196)',
            description: 'Pesanan sedang dalam proses quality inspection, packing kardus premium & disemprot wewangian musk di butik Tamansari Tasikmalaya.'
          });
        } else if (newStatus === 'dikirim') {
          trackingHistory.push({
            time: nowStr,
            location: `Pusat Drop Point & Sortir ${ord.shipping.courier} Tasikmalaya`,
            description: `Paket telah di-pickup dari warehouse Tamansari dan diberangkatkan oleh kurir ${ord.shipping.courier} dengan nomor resi ${customTrackingNo || ord.trackingNumber}.`
          });
        } else if (newStatus === 'tiba_di_tujuan') {
          trackingHistory.push({
            time: nowStr,
            location: `Kota Tujuan (${ord.customer.city})`,
            description: 'Paket telah sampai di kota penerima dan dibawa kurir delivery menuju alamat Anda.'
          });
        } else if (newStatus === 'selesai') {
          trackingHistory.push({
            time: nowStr,
            location: ord.customer.address,
            description: 'Paket telah diterima dengan baik oleh penerima / penghuni rumah. Terima kasih!'
          });
        }

        const updated: Order = {
          ...ord,
          status: newStatus,
          trackingNumber: customTrackingNo || ord.trackingNumber,
          trackingHistory
        };

        if (activeOrder?.id === orderId) {
          setActiveOrder(updated);
        }

        // Sync order status and tracking to Cloud Firestore
        syncOrderStatusInFirestore(orderId, newStatus, trackingHistory, customTrackingNo || ord.trackingNumber).catch(err => {
          console.warn('Sync order status to Firestore error:', err);
        });

        // Send Push Notification
        const statusMessages: Record<OrderStatus, string> = {
          menunggu_pembayaran: 'Menunggu proses pembayaran.',
          dibayar: 'Pembayaran telah kami terima.',
          sedang_dikemas: 'Paket sedang dikemas di warehouse saena.id dengan standar butik.',
          dikirim: `Paket telah diberangkatkan oleh ${ord.shipping.courier}! Resi: ${customTrackingNo || ord.trackingNumber}`,
          tiba_di_tujuan: 'Kurir sedang dalam perjalanan mengantarkan paket ke rumah Anda hari ini!',
          selesai: 'Pesanan selesai. Jangan lupa bagikan ulasan dan rating busana Anda!',
          dibatalkan: 'Pesanan telah dibatalkan.'
        };

        sendPushNotification(
          `Status Pesanan ${orderId}: ${newStatus.toUpperCase()}`,
          statusMessages[newStatus],
          'order',
          orderId
        );

        return updated;
      }
      return ord;
    }));
  };

  const updateMengantarConfig = (newCfg: Partial<MengantarStoreConfig>) => {
    setMengantarConfig(prev => {
      const updated = { ...prev, ...newCfg };
      try {
        localStorage.setItem('saena_mengantar_config_v1', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const dispatchOrderToMengantar = async (
    orderId: string
  ): Promise<{ success: boolean; message: string; trackingNumber?: string; mengantarOrderId?: string }> => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) {
      return { success: false, message: 'Pesanan tidak ditemukan di sistem' };
    }

    const apiRes = await createMengantarOrderApi(targetOrder, mengantarConfig);
    if (!apiRes.success || !apiRes.data) {
      return { success: false, message: apiRes.message || 'Gagal menerbitkan pesanan ke Mengantar.com' };
    }

    const mengantarData = apiRes.data;
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

    let updatedOrderObj: Order | null = null;
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const trackingHistory = [
          ...ord.trackingHistory,
          {
            time: nowStr,
            location: 'Central Warehouse Tamansari Tasikmalaya (Mengantar.com Hub)',
            description: `Pesanan berhasil diterbitkan di Mengantar.com (${mengantarData.mengantarOrderId}). Nomor resi ${mengantarData.courier}: ${mengantarData.trackingNumber}. Jadwal pickup kurir: ${mengantarData.pickupTime}.`
          }
        ];

        updatedOrderObj = {
          ...ord,
          trackingNumber: mengantarData.trackingNumber,
          status: ord.status === 'menunggu_pembayaran' ? ord.status : 'sedang_dikemas',
          mengantar: mengantarData,
          trackingHistory
        };
        return updatedOrderObj;
      }
      return ord;
    }));

    if (updatedOrderObj) {
      if (activeOrder?.id === orderId) {
        setActiveOrder(updatedOrderObj);
      }
      setActiveMengantarLabelOrder(updatedOrderObj);

      // Sync updated order with Mengantar resi to Firestore
      syncOrderToFirestore(updatedOrderObj).catch(err => {
        console.warn('Sync Mengantar order to Firestore error:', err);
      });

      sendPushNotification(
        `Mengantar.com: Resi Terbit! 📦`,
        `Pesanan ${orderId} terdaftar di Mengantar (${mengantarData.courier} - ${mengantarData.trackingNumber}).`,
        'order',
        orderId
      );
    }

    return {
      success: true,
      message: apiRes.message || 'Pesanan berhasil terhubung ke Mengantar.com!',
      trackingNumber: mengantarData.trackingNumber,
      mengantarOrderId: mengantarData.mengantarOrderId
    };
  };

  const loginAsAdmin = (secret: string): { success: boolean; message: string } => {
    const trimmed = secret.trim();
    // Valid admin credentials:
    // PIN: saena2026, 8899, 46196 (kode pos Tamansari Tasikmalaya), admin123
    // Email: isrofi999@gmail.com
    const validCodes = ['saena2026', '8899', '46196', 'admin123', 'isrofi999@gmail.com'];
    const isMatched = validCodes.includes(trimmed.toLowerCase()) || 
                      trimmed.toLowerCase().startsWith('isrofi999@gmail.com');

    if (isMatched) {
      setIsAuthenticatedAdmin(true);
      setIsAdminModeState(true);
      setIsAdminLoginModalOpen(false);
      try {
        localStorage.setItem('saena_admin_auth_v1', 'true');
      } catch (err) {
        console.warn('LocalStorage admin auth warning:', err);
      }
      sendPushNotification(
        'Akses Pengelola Terbuka 👑',
        'Selamat datang di Panel Kontrol Butik & Gudang saena.id Tamansari Tasikmalaya.',
        'system'
      );
      return { success: true, message: 'Autentikasi berhasil! Mengalihkan ke Dashboard Pengelola...' };
    }

    return { 
      success: false, 
      message: 'Kode akses salah. Masukkan PIN pengelola (default: saena2026) atau email terdaftar.' 
    };
  };

  const logoutAdmin = () => {
    setIsAuthenticatedAdmin(false);
    setIsAdminModeState(false);
    try {
      localStorage.removeItem('saena_admin_auth_v1');
    } catch (err) {
      console.warn('LocalStorage admin auth removal warning:', err);
    }
    sendPushNotification(
      'Sesi Admin Ditutup 🔒',
      'Mode pengelola telah dimatikan. Halaman butik publik aktif.',
      'system'
    );
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        cart,
        wishlist,
        notifications,
        unreadNotifCount,
        language,
        currency,
        t,
        activeOrder,
        isCartOpen,
        isCheckoutOpen,
        isOrderTrackingOpen,
        isWhatsAppModalOpen,
        isPushPromptOpen,
        isAdminMode,
        isAuthenticatedAdmin,
        isAdminLoginModalOpen,
        setIsAdminLoginModalOpen,
        loginAsAdmin,
        logoutAdmin,
        selectedProductForDetail,
        activeWhatsAppOrder,
        mengantarConfig,
        updateMengantarConfig,
        dispatchOrderToMengantar,
        activeMengantarLabelOrder,
        setActiveMengantarLabelOrder,
        isMengantarLabelModalOpen,
        setIsMengantarLabelModalOpen,
        isMengantarConfigModalOpen,
        setIsMengantarConfigModalOpen,
        dokuConfig,
        updateDokuConfig,
        isDokuConfigModalOpen,
        setIsDokuConfigModalOpen,
        searchQuery,
        selectedCategory,
        sortBy,
        priceRange,
        appliedCoupon,
        couponDiscount,
        setLanguage,
        setCurrency,
        setIsCartOpen,
        setIsCheckoutOpen,
        setIsOrderTrackingOpen,
        setIsWhatsAppModalOpen,
        setIsPushPromptOpen,
        setIsAdminMode,
        setSelectedProductForDetail,
        setActiveWhatsAppOrder,
        setActiveOrder,
        setSearchQuery,
        setSelectedCategory,
        setSortBy,
        setPriceRange,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        toggleWishlist,
        placeOrder,
        simulatePaymentSuccess,
        updateOrderStatus,
        updateStock,
        updateColorStock,
        updateProduct,
        deleteProduct,
        deleteAllProducts,
        quickRestock,
        updateProductPrice,
        addNewProduct,
        addMultipleProducts,
        addProductReview,
        sendPushNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        requestBrowserPushPermission,
        formatPrice,
        convertPrice,
        isFirebaseConnected,
        firebaseSyncStatus,
        reseedDatabase,
        landingPages,
        saveLandingPage,
        deleteLandingPage,
        activeLandingProductId,
        setActiveLandingProductId
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
