import { Product, ShippingMethod, Order } from '../types';

export const DEFAULT_WHATSAPP_NUMBER = '+6285724023064';
export const DEFAULT_WHATSAPP_CLEAN = '6285724023064';
export const DEFAULT_WHATSAPP_LOCAL = '085724023064';
export const DEFAULT_WHATSAPP_DISPLAY = '+62 857-2402-3064';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'saena-01',
    name: 'Madina Silk Abaya Set with French Khimar',
    slug: 'madina-silk-abaya-set-french-khimar',
    category: 'abaya-gamis',
    price: 685000,
    originalPrice: 850000,
    rating: 5.0,
    reviewCount: 38,
    description: 'Koleksi Signature terbaru saena.id menghadirkan perpaduan kemewahan Sutra Mulberry 6A dengan siluet French Khimar syari nan anggun. Didesain dengan potongan loose fit berkelas, jatuh sempurna mengikuti lekuk langkah tanpa membentuk tubuh, serta dilengkapi risleting tersembunyi untuk busui dan manset wudhu-friendly dengan kancing eksklusif berlogo saena.id.',
    shortDescription: 'Signature Mulberry Silk 6A dengan French Khimar Syari, busui & wudhu friendly.',
    sku: 'SAENA-MDN-01',
    weight: 550,
    dimensions: { length: 30, width: 22, height: 4 },
    material: 'Sutra Mulberry Grade 6A & Soft Ceruty Babydoll',
    careInstructions: [
      'Cuci kering (dry clean) atau cuci tangan lembut suhu normal',
      'Gunakan deterjen cair khusus bahan sutra',
      'Jangan diperas kencang, cukup angin-anginkan di tempat teduh',
      'Setrika suhu rendah atau gunakan garment steamer'
    ],
    features: [
      'Busui Friendly (Zipper tersembunyi di bagian dada)',
      'Wudhu Friendly (Manset kancing logo saena.id)',
      'Saku tersembunyi fungsional di sisi kanan',
      'French Khimar fleksibel 2 gaya (bisa cadar / non-cadar)'
    ],
    colors: [
      { name: 'Emerald Forest', hex: '#1C3B2B', stock: 15 },
      { name: 'Champagne Taupe', hex: '#C5A880', stock: 12 },
      { name: 'Midnight Onyx', hex: '#1E1F22', stock: 18 }
    ],
    sizes: ['All Size', 'M', 'L', 'XL'],
    stock: { 'Emerald Forest': 15, 'Champagne Taupe': 12, 'Midnight Onyx': 18 },
    totalStock: 45,
    images: [],
    isNewArrival: true,
    isBestSeller: true,
    reviews: [
      {
        id: 'rev-01',
        userName: 'Hj. Siti Rahmah',
        rating: 5,
        date: '12 September 2026',
        comment: 'Masya Allah, jahitan butik Tasikmalaya memang tidak pernah mengecewakan. Bahannya adem sekali, jatuh dan tidak menerawang saat dipakai shalat maupun umroh.',
        variantInfo: 'Emerald Forest / All Size',
        verifiedBuyer: true
      }
    ]
  },
  {
    id: 'saena-02',
    name: 'Zafira Mulberry Silk Abaya Bordir Emas',
    slug: 'zafira-mulberry-silk-abaya-bordir-emas',
    category: 'abaya-gamis',
    price: 545000,
    originalPrice: 675000,
    rating: 4.9,
    reviewCount: 24,
    description: 'Koleksi abaya bordir tangan termewah saena.id dengan ornamen benang emas premium khas tasikmalaya. Menggunakan material Arabian Mulberry Silk yang dingin di kulit, tidak menerawang, dan memberikan efek kilau dove yang berkelas untuk perayaan istimewa dan hari raya.',
    shortDescription: 'Abaya Mulberry Silk dengan aksen bordir handmade benang emas mewah.',
    sku: 'SAENA-ZAF-02',
    weight: 500,
    dimensions: { length: 30, width: 22, height: 4 },
    material: 'Arabian Mulberry Silk & Aksen Bordir Benang Emas',
    careInstructions: [
      'Cuci dengan tangan air dingin',
      'Gunakan sabun khusus kain sutra',
      'Hindari menyikat area bordir emas',
      'Setrika bagian dalam (reverse iron)'
    ],
    features: [
      'Bordir benang emas rapat dan rapi khas pengrajin Tasik',
      'Cutting A-Line anggun melangsingkan siluet',
      'Resleting depan support ibu menyusui (busui friendly)',
      'Ujung pergelangan manset kancing wudhu friendly'
    ],
    colors: [
      { name: 'Deep Onyx', hex: '#1A1A1A', stock: 14 },
      { name: 'Champagne Gold', hex: '#D4AF37', stock: 10 },
      { name: 'Royal Navy', hex: '#1B263B', stock: 11 }
    ],
    sizes: ['M', 'L', 'XL'],
    stock: { 'Deep Onyx': 14, 'Champagne Gold': 10, 'Royal Navy': 11 },
    totalStock: 35,
    images: [],
    isNewArrival: true,
    isBestSeller: true,
    reviews: []
  },
  {
    id: 'saena-03',
    name: 'Madina Pleated Silk Pashmina Shawl',
    slug: 'madina-pleated-silk-pashmina-shawl',
    category: 'hijab-pashmina',
    price: 129000,
    originalPrice: 165000,
    rating: 5.0,
    reviewCount: 52,
    description: 'Pashmina silk bertekstur pleats halus dengan drape jatuh mewah. Bahan adem, breathable, tegak di dahi dan tidak licin saat dikenakan. Cocok dipadukan dengan gaya formal maupun kasual harian.',
    shortDescription: 'Pashmina pleated silk bertekstur lembut, tegak di dahi, tidak terawang.',
    sku: 'SAENA-MAD-03',
    weight: 180,
    dimensions: { length: 20, width: 15, height: 2 },
    material: 'Armani Silk Pleated Premium',
    careInstructions: [
      'Cuci celup manual menggunakan air dingin',
      'Jangan disetrika agar tekstur plisket abadi terjaga'
    ],
    features: [
      'Tekstur pleats mikro rapat anti kusut',
      'Mudah dibentuk dan tegak di dahi',
      'Finishing jahit tepi rapi kualitas ekspor'
    ],
    colors: [
      { name: 'Dusty Mauve', hex: '#8B687F', stock: 20 },
      { name: 'Soft Sage', hex: '#9CAF88', stock: 25 },
      { name: 'Champagne Taupe', hex: '#C5A880', stock: 22 },
      { name: 'Silver Grey', hex: '#A8A9AD', stock: 18 }
    ],
    sizes: ['200 x 75 cm'],
    stock: { 'Dusty Mauve': 20, 'Soft Sage': 25, 'Champagne Taupe': 22, 'Silver Grey': 18 },
    totalStock: 85,
    images: [],
    isNewArrival: true,
    isBestSeller: true,
    reviews: []
  },
  {
    id: 'saena-04',
    name: 'Voal Syar\'i Silk Laser Cut Exclusive',
    slug: 'voal-syari-silk-laser-cut-exclusive',
    category: 'hijab-pashmina',
    price: 115000,
    originalPrice: 145000,
    rating: 4.9,
    reviewCount: 31,
    description: 'Hijab segiempat ukuran syari (130x130 cm) dengan teknologi laser cut gelombang presisi di seluruh tepi. Bahan Voal Ultrafine Silk saena.id tidak mudah lepek walau beraktivitas seharian.',
    shortDescription: 'Hijab voal silk syar\'i 130x130 cm dengan tepi laser cut rapi.',
    sku: 'SAENA-VOL-04',
    weight: 160,
    dimensions: { length: 20, width: 15, height: 2 },
    material: 'Voal Ultrafine Silk Premium',
    careInstructions: [
      'Cuci tangan lembut tanpa pemutih',
      'Setrika suhu sedang'
    ],
    features: [
      'Ukuran syar\'i menutup dada sempurna (130x130 cm)',
      'Tepi laser cut presisi motif riak awan',
      'Lembut, tidak pekak di telinga, dan wangi alami'
    ],
    colors: [
      { name: 'Rose Nude', hex: '#C99A97', stock: 16 },
      { name: 'Olive Drab', hex: '#6B8E23', stock: 14 },
      { name: 'Ash Rose', hex: '#B76E79', stock: 19 }
    ],
    sizes: ['130 x 130 cm (Syar\'i)'],
    stock: { 'Rose Nude': 16, 'Olive Drab': 14, 'Ash Rose': 19 },
    totalStock: 49,
    images: [],
    isNewArrival: true,
    reviews: []
  },
  {
    id: 'saena-05',
    name: 'Kaftan Silk Jacquard Royal Brunei Edition',
    slug: 'kaftan-silk-jacquard-royal-brunei',
    category: 'dress-kaftan',
    price: 750000,
    originalPrice: 920000,
    rating: 5.0,
    reviewCount: 19,
    description: 'Kaftan edisi royal istimewa berbahan jacquard sutra impor dengan motif embossed elegan berhias taburan mutiara dan swarovski di area leher v-neck. Potongan drape jatuh memesona, memberikan siluet ramping nan ningrat.',
    shortDescription: 'Kaftan mewah bermotif jacquard timbul dengan ornamen kristal swarovski leher.',
    sku: 'SAENA-KFT-05',
    weight: 650,
    dimensions: { length: 32, width: 24, height: 5 },
    material: 'Silk Jacquard Embossed & Swarovski Crystal',
    careInstructions: [
      'Khusus Dry Clean untuk menjaga kilau jacquard dan swarovski',
      'Simpan dengan digantung rapi'
    ],
    features: [
      'Motif tenun jacquard timbul bertekstur emas dove',
      'Aksen kerah payet kristal swarovski austria',
      'Potongan drape melayang anggun',
      'Tali serut pinggang fleksibel di bagian dalam'
    ],
    colors: [
      { name: 'Royal Emerald', hex: '#0F4D32', stock: 8 },
      { name: 'Maroon Velvet', hex: '#660018', stock: 10 },
      { name: 'Golden Mocca', hex: '#8C6D4F', stock: 7 }
    ],
    sizes: ['All Size Fit to XXL'],
    stock: { 'Royal Emerald': 8, 'Maroon Velvet': 10, 'Golden Mocca': 7 },
    totalStock: 25,
    images: [],
    isNewArrival: true,
    isBestSeller: true,
    reviews: []
  },
  {
    id: 'saena-06',
    name: 'Alya Maxi Silk Tiered Dress Kondangan',
    slug: 'alya-maxi-silk-tiered-dress-kondangan',
    category: 'dress-kaftan',
    price: 565000,
    originalPrice: 695000,
    rating: 4.9,
    reviewCount: 27,
    description: 'Maxi dress bertingkat (tiered) dengan lengan balon elastis dan tali obi pinggang lepas-pasang. Sempurna untuk menghadiri resepsi pernikahan, wisuda, atau jamuan makan malam bernuansa islami modern.',
    shortDescription: 'Dress maxi berjenjang anggun dengan lengan puff dan obi belt pemanis siluet.',
    sku: 'SAENA-ALY-06',
    weight: 520,
    dimensions: { length: 30, width: 22, height: 4 },
    material: 'Premium Satin Silk & Furing Katun Silky',
    careInstructions: [
      'Cuci tangan dengan deterjen lembut',
      'Setrika suhu rendah atau steam'
    ],
    features: [
      'Furing katun silky adem di seluruh badan',
      'Lengan kerut karet wudhu friendly',
      'Obi belt serbaguna untuk variasi gaya',
      'Potongan flowy bertingkat 3 layer'
    ],
    colors: [
      { name: 'Lilac Breeze', hex: '#C8A2C8', stock: 12 },
      { name: 'Peach Blossom', hex: '#FFDAB9', stock: 15 },
      { name: 'Mint Green', hex: '#98FF98', stock: 11 }
    ],
    sizes: ['S/M', 'L/XL'],
    stock: { 'Lilac Breeze': 12, 'Peach Blossom': 15, 'Mint Green': 11 },
    totalStock: 38,
    images: [],
    isNewArrival: true,
    reviews: []
  },
  {
    id: 'saena-07',
    name: 'Aisyah Silk Swarovski Mukena Set 2in1',
    slug: 'aisyah-silk-swarovski-mukena-set-2in1',
    category: 'mukena-silk',
    price: 385000,
    originalPrice: 480000,
    rating: 5.0,
    reviewCount: 44,
    description: 'Mukena silk 2in1 dengan kilau dove elegan berhias renda kristal swarovski. Dilengkapi resleting leher fleksibel (bisa dipakai ponco tanpa merusak tatanan hijab), sajadah muka eksklusif, dan pouch berantai mutiara.',
    shortDescription: 'Mukena silk 2in1 berenda swarovski lengkap sajadah muka dan pouch mewah.',
    sku: 'SAENA-ASY-07',
    weight: 600,
    dimensions: { length: 25, width: 20, height: 6 },
    material: 'Royal Silk Armani & Renda Guipure Swarovski',
    careInstructions: [
      'Cuci tangan lembut tanpa sikat',
      'Jangan dimasukkan ke mesin pengering'
    ],
    features: [
      'Model 2in1 resleting dagu fleksibel untuk hijabers',
      'Aksen renda guipure import bertabur kristal swarovski',
      'Bonus sajadah mini travel-friendly berenda',
      'Pouch dompet kulit sintetis beraksen rantai mutiara'
    ],
    colors: [
      { name: 'Pure White', hex: '#FFFFFF', stock: 20 },
      { name: 'Dusty Mauve', hex: '#8B687F', stock: 18 },
      { name: 'Midnight Onyx', hex: '#1E1F22', stock: 15 }
    ],
    sizes: ['Jumbo Dewasa'],
    stock: { 'Pure White': 20, 'Dusty Mauve': 18, 'Midnight Onyx': 15 },
    totalStock: 53,
    images: [],
    isNewArrival: true,
    isBestSeller: true,
    reviews: []
  },
  {
    id: 'alisa-01',
    name: 'Mukena Traveling Terbaru Mini Pouch 2in1 Laser Cut Motif Katun Micro Alisa Premium',
    slug: 'mukena-traveling-mini-pouch-2in1-laser-cut-alisa-premium',
    category: 'mukena-silk',
    price: 79500,
    originalPrice: 159000,
    rating: 4.9,
    reviewCount: 148,
    description: 'Mukena traveling 2in1 laser cut motif Alisa Premium berbahan katun mikro grade A yang adem, lembut, tidak menerawang, dan nyaman dipakai di semua musim. Dilengkapi resleting jepang di bawah dagu sehingga bisa dipakai reguler atau model ponco tanpa merusak tatanan hijab. Pinggiran dipotong teknologi laser cut presisi bergelombang mewah tanpa benang rontok, lengkap dengan mini pouch traveling ringkas.',
    shortDescription: 'Mukena traveling 2in1 katun micro premium adem, laser cut presisi + mini pouch cantik.',
    sku: 'SAENA-ALS-01',
    weight: 600,
    dimensions: { length: 18, width: 15, height: 4 },
    material: 'Katun Mikro Grade A Premium',
    careInstructions: [
      'Cuci dengan tangan atau mesin putaran lembut',
      'Hindari penggunaan pemutih pakaian berlebih',
      'Setrika dengan suhu sedang'
    ],
    features: [
      'Bahan katun mikro premium: adem, lembut saat dikenakan, dan nyaman di semua musim',
      'Desain 2in1 dengan resleting: praktis untuk digunakan dan disimpan tanpa merusak hijab',
      'Motif print shabby chic yang elegan dan berkelas',
      'Finishing laser cut bergelombang mewah presisi anti-berudul',
      'Dilengkapi tas pouch praktis (18 x 15 cm) untuk dibawa bepergian',
      'Ukuran standar dewasa: Panjang depan 117 cm, belakang 120 cm, rok 110 x 73 cm'
    ],
    colors: [
      { name: 'Dusty Pink', hex: '#E8A5A5', stock: 28, image: '/assets/alisa/alisa-pink-model.webp' },
      { name: 'Sky Blue', hex: '#99BBE0', stock: 24, image: '/assets/alisa/alisa-blue-model.webp' }
    ],
    sizes: ['All Size Dewasa Jumbo'],
    stock: { 'Dusty Pink': 28, 'Sky Blue': 24 },
    totalStock: 52,
    images: [
      '/assets/alisa/alisa-pink-model.webp',
      '/assets/alisa/alisa-pink-close.webp',
      '/assets/alisa/alisa-blue-model.webp',
      '/assets/alisa/alisa-blue-detail.webp',
      '/assets/alisa/alisa-blue-full.webp'
    ],
    isNewArrival: true,
    isBestSeller: true,
    reviews: [
      {
        id: 'rev-als-1',
        userName: 'dr. Annisa Larasati',
        rating: 5,
        date: '15 September 2026',
        comment: 'Bagus banget Masya Allah! Katun mikronya beneran adem semriwing, resleting 2in1 nya penyelamat pas lagi buru-buru sholat tanpa lepas jilbab.',
        variantInfo: 'Dusty Pink / All Size',
        verifiedBuyer: true
      },
      {
        id: 'rev-als-2',
        userName: 'Riana Nurul Hidayah',
        rating: 5,
        date: '14 September 2026',
        comment: 'Laser cut-nya rapi banget gak ada benang rontok. Pouch-nya imut muat di sling bag kerja. Warna Sky Blue sangat sejuk!',
        variantInfo: 'Sky Blue / All Size',
        verifiedBuyer: true
      }
    ]
  },
  {
    id: 'saena-08',
    name: 'Humaira Travelling Mini Silk Mukena',
    slug: 'humaira-travelling-mini-silk-mukena',
    category: 'mukena-silk',
    price: 295000,
    originalPrice: 360000,
    rating: 4.8,
    reviewCount: 18,
    description: 'Mukena travelling berukuran super ringkas seukuran genggaman tangan (pouch 12x10 cm). Dibuat dari parasut sutra premium korea water repellent, ringan, sejuk, dan tidak menerawang saat dipakai shalat.',
    shortDescription: 'Mukena travelling parasut sutra ultra ringan dengan pouch mini travel-friendly.',
    sku: 'SAENA-HMR-08',
    weight: 220,
    dimensions: { length: 15, width: 12, height: 4 },
    material: 'Korea Silk Parasut Water Repellent',
    careInstructions: [
      'Bisa dicuci tangan kilat dan cepat kering dalam hitungan menit'
    ],
    features: [
      'Bobot sangat ringan hanya 220 gram',
      'Bahan water repellent anti cipratan air',
      'Mudah dilipat masuk tas kerja maupun koper bepergian'
    ],
    colors: [
      { name: 'Sage Blossom', hex: '#9CAF88', stock: 25 },
      { name: 'Soft Pink', hex: '#F4C2C2', stock: 20 },
      { name: 'Baby Blue', hex: '#89CFF0', stock: 15 }
    ],
    sizes: ['All Size Travel'],
    stock: { 'Sage Blossom': 25, 'Soft Pink': 20, 'Baby Blue': 15 },
    totalStock: 60,
    images: [],
    isNewArrival: true,
    reviews: []
  },
  {
    id: 'saena-09',
    name: 'Rayyan Kurta Kemeja Pria Toyobo Silk',
    slug: 'rayyan-kurta-kemeja-pria-toyobo-silk',
    category: 'koko-kurta',
    price: 275000,
    originalPrice: 345000,
    rating: 4.9,
    reviewCount: 22,
    description: 'Baju koko kurta lengan panjang pria dengan kerah shanghai minimalis dan saku sembunyi di dada. Berbahan Toyobo Silk Jepang asli yang menyerap keringat, tidak mudah kusut, dan sejuk untuk beribadah dan silaturahmi.',
    shortDescription: 'Kurta koko pria Toyobo Silk Jepang berkerah mandarin rapi dan bersahaja.',
    sku: 'SAENA-RYN-09',
    weight: 350,
    dimensions: { length: 25, width: 20, height: 3 },
    material: 'Japan Toyobo Silk Fodu Cotton',
    careInstructions: [
      'Cuci dengan mesin putaran normal atau cuci tangan',
      'Setrika suhu katun'
    ],
    features: [
      'Kerah shanghai tegak dan presisi',
      'Kancing snap sembunyi (hidden button placket)',
      'Saku aktif di dada kiri berlogo emblem saena.id'
    ],
    colors: [
      { name: 'White Cloud', hex: '#F8F9FA', stock: 16 },
      { name: 'Sage Grey', hex: '#8E9A8E', stock: 14 },
      { name: 'Navy Bold', hex: '#1B2A47', stock: 15 }
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: { 'White Cloud': 16, 'Sage Grey': 14, 'Navy Bold': 15 },
    totalStock: 45,
    images: [],
    isNewArrival: true,
    reviews: []
  },
  {
    id: 'saena-10',
    name: 'Bros Mutiara Air Tawar Lombok Gold 18K Edition',
    slug: 'bros-mutiara-air-tawar-lombok-gold-18k',
    category: 'aksesoris',
    price: 165000,
    originalPrice: 220000,
    rating: 5.0,
    reviewCount: 35,
    description: 'Bros pin hijab eksklusif bertatahkan butiran mutiara air tawar asli dari perairan Lombok, dipadukan rangka kuningan lapis emas 18 karat tahan karat. Dilengkapi jarum tajam anti merusak serat kain jilbab silk.',
    shortDescription: 'Bros hijab mutiara air tawar lombok asli lapis emas 18K anti karat.',
    sku: 'SAENA-BRS-10',
    weight: 80,
    dimensions: { length: 10, width: 10, height: 3 },
    material: 'Mutiara Air Tawar Lombok Asli & Brass Gold Plated 18K',
    careInstructions: [
      'Hindari terkena parfum atau cairan kimia langsung',
      'Simpan dalam kotak beludru yang disertakan'
    ],
    features: [
      '100% Mutiara Air Tawar Lombok bersertifikat',
      'Lapisan emas asli 18 karat tahan luntur',
      'Jarum pin stainless tajam anti tarik serat sutra'
    ],
    colors: [
      { name: 'Classic White Pearl', hex: '#FDFBF7', stock: 30 },
      { name: 'Peach Champagne Pearl', hex: '#F5D6C6', stock: 20 }
    ],
    sizes: ['One Size (Diameter 4.5 cm)'],
    stock: { 'Classic White Pearl': 30, 'Peach Champagne Pearl': 20 },
    totalStock: 50,
    images: [],
    isNewArrival: true,
    reviews: []
  }
];

export const SHIPPING_ORIGIN = {
  subdistrict: 'Kecamatan Tamansari',
  city: 'Kota Tasikmalaya',
  province: 'Jawa Barat',
  postalCode: '46196',
  warehouseName: 'Central Warehouse & Butik saena.id (Perum Graha Tresna, Tasikmalaya)',
  address: 'Perum Graha Tresna, Kota Tasikmalaya, Jawa Barat 46196',
  contactWhatsApp: DEFAULT_WHATSAPP_NUMBER
};

export const SHIPPING_SERVICES: ShippingMethod[] = [
  {
    id: 'jne-reg',
    courier: 'JNE Express',
    service: 'REG (Reguler)',
    name: 'JNE Reguler',
    cost: 0,
    estimatedDays: '1 - 2 Hari Kerja',
    logo: '📦'
  },
  {
    id: 'jne-yes',
    courier: 'JNE Express',
    service: 'YES (Yakin Esok Sampai)',
    name: 'JNE YES (Garansi 1 Hari)',
    cost: 0,
    estimatedDays: '1 Hari (Besok Sampai)',
    logo: '🌟'
  },
  {
    id: 'jne-oke',
    courier: 'JNE Express',
    service: 'OKE (Ongkos Kirim Ekonomis)',
    name: 'JNE OKE Ekonomis',
    cost: 0,
    estimatedDays: '2 - 3 Hari Kerja',
    logo: '🏷️'
  },
  {
    id: 'jnt-ez',
    courier: 'J&T Express',
    service: 'EZ (Reguler)',
    name: 'J&T Express EZ',
    cost: 0,
    estimatedDays: '1 - 2 Hari',
    logo: '🚛'
  },
  {
    id: 'jnt-super',
    courier: 'J&T Express',
    service: 'Super (Next Day)',
    name: 'J&T Express Super',
    cost: 0,
    estimatedDays: '1 Hari Garansi Tepat Waktu',
    logo: '⚡'
  },
  {
    id: 'sicepat-reg',
    courier: 'SiCepat Ekspres',
    service: 'REG (Reguler)',
    name: 'SiCepat Reguler (1-2 Hari)',
    cost: 0,
    estimatedDays: '1 - 2 Hari Kerja',
    logo: '💨'
  },
  {
    id: 'dhl-intl',
    courier: 'DHL Express Worldwide',
    service: 'Express Worldwide',
    name: 'DHL Global Express (Internasional)',
    cost: 0,
    estimatedDays: '3 - 5 Hari Kerja (Global)',
    logo: '✈️'
  }
];

export const INITIAL_ORDERS: Order[] = [];

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
