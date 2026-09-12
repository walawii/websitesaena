import { Product, ShippingMethod, Order } from '../types';

export const INITIAL_PRODUCTS: Product[] = [];

export const SHIPPING_ORIGIN = {
  subdistrict: 'Kecamatan Tamansari',
  city: 'Kota Tasikmalaya',
  province: 'Jawa Barat',
  postalCode: '46196',
  warehouseName: 'Central Warehouse & Butik saena.id Tasikmalaya',
  address: 'Jl. Tamansari No. 108, Kec. Tamansari, Kota Tasikmalaya, Jawa Barat 46196'
};

export const SHIPPING_SERVICES: ShippingMethod[] = [
  {
    id: 'jne-reg',
    courier: 'JNE Express',
    service: 'REG (Reguler)',
    name: 'JNE Reguler',
    cost: 10000,
    estimatedDays: '1 - 2 Hari Kerja',
    logo: '📦'
  },
  {
    id: 'jne-yes',
    courier: 'JNE Express',
    service: 'YES (Yakin Esok Sampai)',
    name: 'JNE YES (Garansi 1 Hari)',
    cost: 18000,
    estimatedDays: '1 Hari (Besok Sampai)',
    logo: '🌟'
  },
  {
    id: 'jne-oke',
    courier: 'JNE Express',
    service: 'OKE (Ongkos Kirim Ekonomis)',
    name: 'JNE OKE Ekonomis',
    cost: 8000,
    estimatedDays: '2 - 3 Hari Kerja',
    logo: '🏷️'
  },
  {
    id: 'jnt-ez',
    courier: 'J&T Express',
    service: 'EZ (Reguler)',
    name: 'J&T Express EZ',
    cost: 10000,
    estimatedDays: '1 - 2 Hari',
    logo: '🚛'
  },
  {
    id: 'jnt-super',
    courier: 'J&T Express',
    service: 'Super (Next Day)',
    name: 'J&T Express Super',
    cost: 19000,
    estimatedDays: '1 Hari Garansi Tepat Waktu',
    logo: '⚡'
  },
  {
    id: 'sicepat-reg',
    courier: 'SiCepat Ekspres',
    service: 'REG (Reguler)',
    name: 'SiCepat Reguler (1-2 Hari)',
    cost: 11000,
    estimatedDays: '1 - 2 Hari Kerja',
    logo: '💨'
  },
  {
    id: 'dhl-intl',
    courier: 'DHL Express Worldwide',
    service: 'Express Worldwide',
    name: 'DHL Global Express (Internasional)',
    cost: 175000,
    estimatedDays: '3 - 5 Hari Kerja (Global)',
    logo: '✈️'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'SAENA-98214',
    createdAt: '2026-09-11 14:32',
    customer: {
      fullName: 'Nurul Kamilah S.Ked',
      whatsapp: '081234567890',
      email: 'nurul.kamilah@example.com',
      address: 'Jl. Menteng Asri Raya No. 42, RT 03 / RW 05',
      province: 'DKI Jakarta',
      city: 'Jakarta Pusat',
      subdistrict: 'Menteng',
      postalCode: '10310',
      country: 'Indonesia',
      notes: 'Tolong packing ekstra rapi untuk kado Hari Raya'
    },
    items: [
      {
        id: 'saena-01-M-Emerald',
        productId: 'saena-01',
        product: {
          id: 'saena-01',
          name: 'Madina Silk Abaya Set with French Khimar',
          slug: 'madina-silk-abaya-set',
          category: 'abaya-gamis',
          price: 685000,
          originalPrice: 850000,
          rating: 5,
          reviewCount: 1,
          reviews: [],
          description: 'Abaya eksklusif',
          material: 'Mulberry Silk',
          careInstructions: [],
          features: [],
          colors: [{ name: 'Emerald Forest', hex: '#1C3B2B', stock: 12, image: '' }],
          sizes: ['M'],
          stock: { 'Emerald Forest': 12 },
          totalStock: 12,
          images: []
        },
        selectedSize: 'M',
        selectedColor: { name: 'Emerald Forest', hex: '#1C3B2B' },
        quantity: 1,
        price: 685000
      },
      {
        id: 'saena-03-Azkia-Almond',
        productId: 'saena-03',
        product: {
          id: 'saena-03',
          name: 'Azkia Premium Pashmina Silk Gradasi Ceruty',
          slug: 'azkia-pashmina-silk-gradasi',
          category: 'hijab-pashmina',
          price: 189000,
          originalPrice: 245000,
          rating: 5,
          reviewCount: 1,
          reviews: [],
          description: 'Pashmina sutra',
          material: 'Silk Ceruty',
          careInstructions: [],
          features: [],
          colors: [{ name: 'Pearl Almond', hex: '#E6D7C3', stock: 25, image: '' }],
          sizes: ['Standard 200x75'],
          stock: { 'Pearl Almond': 25 },
          totalStock: 25,
          images: []
        },
        selectedSize: 'Standard 200x75',
        selectedColor: { name: 'Pearl Almond', hex: '#E6D7C3' },
        quantity: 1,
        price: 189000
      }
    ],
    shipping: SHIPPING_SERVICES[0], // JNE Reguler
    payment: {
      channel: 'qris',
      channelName: 'QRIS Realtime Dynamic',
      expiryMinutes: 15,
      paidAt: '2026-09-11 14:35'
    },
    subtotal: 874000,
    discount: 87400,
    couponCode: 'WELCOME10',
    shippingCost: 12000,
    total: 798600,
    currency: 'IDR',
    currencyRate: 1,
    status: 'dikirim',
    trackingNumber: 'TJNE08291048201',
    trackingHistory: [
      {
        time: '11 Sep 2026 14:35',
        location: 'Sistem Pembayaran saena.id',
        description: 'Pembayaran QRIS telah diverifikasi lunas otomatis.'
      },
      {
        time: '11 Sep 2026 15:10',
        location: 'Central Warehouse saena.id, Kec. Tamansari, Kota Tasikmalaya (46196)',
        description: 'Pesanan telah dipacking rapi dengan safety seal & parfum kasturi eksklusif di Butik saena.id Tamansari Tasikmalaya.'
      },
      {
        time: '11 Sep 2026 17:45',
        location: 'Hub Agen Utama JNE Express Kota Tasikmalaya',
        description: 'Paket telah diserahkan dan dipindai di Hub JNE Express Tasikmalaya [Resi: TJNE08291048201].'
      },
      {
        time: '11 Sep 2026 21:30',
        location: 'Gateway Logistik JNE Jakarta DC',
        description: 'Paket tiba di hub transit Jakarta dan sedang disortir ke kurir delivery.'
      }
    ]
  },
  {
    id: 'SAENA-98205',
    createdAt: '2026-09-11 09:15',
    customer: {
      fullName: 'Dewi Anggraini',
      whatsapp: '085712398472',
      email: 'dewi.ang@gmail.com',
      address: 'Jl. Rungkut Asri Timur IV No. 12',
      province: 'Jawa Timur',
      city: 'Surabaya',
      subdistrict: 'Rungkut',
      postalCode: '60293',
      country: 'Indonesia'
    },
    items: [
      {
        id: 'saena-04-Safiyya',
        productId: 'saena-04',
        product: {
          id: 'saena-04',
          name: 'Safiyya Royal Prayer Set Mukena Silk Jacquard',
          slug: 'safiyya-prayer-set-silk-jacquard',
          category: 'mukena-silk',
          price: 795000,
          originalPrice: 990000,
          rating: 5,
          reviewCount: 1,
          reviews: [],
          description: 'Set mukena ibadah exclusive',
          material: 'Silk Jacquard',
          careInstructions: [],
          features: [],
          colors: [{ name: 'Pure White Silk', hex: '#FDFBF7', stock: 15, image: '' }],
          sizes: ['All Size Jumbo'],
          stock: { 'Pure White Silk': 15 },
          totalStock: 15,
          images: []
        },
        selectedSize: 'All Size Jumbo',
        selectedColor: { name: 'Pure White Silk', hex: '#FDFBF7' },
        quantity: 1,
        price: 795000
      }
    ],
    shipping: SHIPPING_SERVICES[3], // J&T Express EZ
    payment: {
      channel: 'va_bca',
      channelName: 'BCA Virtual Account',
      virtualAccount: '8077712398472910',
      expiryMinutes: 120,
      paidAt: '2026-09-11 09:20'
    },
    subtotal: 795000,
    discount: 0,
    shippingCost: 20000,
    total: 815000,
    currency: 'IDR',
    currencyRate: 1,
    status: 'sedang_dikemas',
    trackingNumber: 'JP88392019482',
    trackingHistory: [
      {
        time: '11 Sep 2026 09:20',
        location: 'Gateway BCA VA',
        description: 'Pembayaran Virtual Account BCA Rp 815.000 terverifikasi otomatis.'
      },
      {
        time: '11 Sep 2026 10:00',
        location: 'Central Warehouse saena.id, Kec. Tamansari, Kota Tasikmalaya (46196)',
        description: 'Staff warehouse sedang menyiapkan dan memeriksa quality control produk di gudang Tamansari, Tasikmalaya.'
      }
    ]
  }
];

export const AVAILABLE_COUPONS: Record<string, { discountPercent: number; maxDiscount?: number; description: string }> = {
  'SAENARAMADHAN': {
    discountPercent: 15,
    maxDiscount: 150000,
    description: 'Diskon Spesial Ramadhan & Eid 15% (Maks. Rp 150.000)'
  },
  'WELCOME10': {
    discountPercent: 10,
    description: 'Potongan Diskon 10% untuk Member Baru saena.id'
  },
  'ELEGANT20': {
    discountPercent: 20,
    maxDiscount: 200000,
    description: 'Potongan Eksklusif 20% Koleksi Abaya & Silk'
  }
};
