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
      { name: 'Emerald Forest', hex: '#1C3B2B', stock: 15, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop' },
      { name: 'Champagne Taupe', hex: '#C5A880', stock: 12, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop' },
      { name: 'Midnight Onyx', hex: '#1E1F22', stock: 18, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop' }
    ],
    sizes: ['All Size', 'M', 'L', 'XL'],
    stock: { 'Emerald Forest': 15, 'Champagne Taupe': 12, 'Midnight Onyx': 18 },
    totalStock: 45,
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop'
    ],
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
      { name: 'Deep Onyx', hex: '#1A1A1A', stock: 14, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop' },
      { name: 'Champagne Gold', hex: '#D4AF37', stock: 10, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop' },
      { name: 'Royal Navy', hex: '#1B263B', stock: 11, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop' }
    ],
    sizes: ['M', 'L', 'XL'],
    stock: { 'Deep Onyx': 14, 'Champagne Gold': 10, 'Royal Navy': 11 },
    totalStock: 35,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop'
    ],
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
      { name: 'Dusty Mauve', hex: '#8B687F', stock: 20, image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=900&auto=format&fit=crop' },
      { name: 'Soft Sage', hex: '#9CAF88', stock: 25, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop' },
      { name: 'Champagne Taupe', hex: '#C5A880', stock: 22, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop' },
      { name: 'Silver Grey', hex: '#A8A9AD', stock: 18, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop' }
    ],
    sizes: ['200 x 75 cm'],
    stock: { 'Dusty Mauve': 20, 'Soft Sage': 25, 'Champagne Taupe': 22, 'Silver Grey': 18 },
    totalStock: 85,
    images: [
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop'
    ],
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
      { name: 'Rose Nude', hex: '#C99A97', stock: 16, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop' },
      { name: 'Olive Drab', hex: '#6B8E23', stock: 14, image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=900&auto=format&fit=crop' },
      { name: 'Ash Rose', hex: '#B76E79', stock: 19, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop' }
    ],
    sizes: ['130 x 130 cm (Syar\'i)'],
    stock: { 'Rose Nude': 16, 'Olive Drab': 14, 'Ash Rose': 19 },
    totalStock: 49,
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=900&auto=format&fit=crop'
    ],
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
      { name: 'Royal Emerald', hex: '#0F4D32', stock: 8, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=900&auto=format&fit=crop' },
      { name: 'Maroon Velvet', hex: '#660018', stock: 10, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop' },
      { name: 'Golden Mocca', hex: '#8C6D4F', stock: 7, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop' }
    ],
    sizes: ['All Size Fit to XXL'],
    stock: { 'Royal Emerald': 8, 'Maroon Velvet': 10, 'Golden Mocca': 7 },
    totalStock: 25,
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop'
    ],
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
      { name: 'Lilac Breeze', hex: '#C8A2C8', stock: 12, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=900&auto=format&fit=crop' },
      { name: 'Peach Blossom', hex: '#FFDAB9', stock: 15, image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=900&auto=format&fit=crop' },
      { name: 'Mint Green', hex: '#98FF98', stock: 11, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop' }
    ],
    sizes: ['S/M', 'L/XL'],
    stock: { 'Lilac Breeze': 12, 'Peach Blossom': 15, 'Mint Green': 11 },
    totalStock: 38,
    images: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=900&auto=format&fit=crop'
    ],
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
      { name: 'Pure White', hex: '#FFFFFF', stock: 20, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop' },
      { name: 'Dusty Mauve', hex: '#8B687F', stock: 18, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop' },
      { name: 'Midnight Onyx', hex: '#1E1F22', stock: 15, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop' }
    ],
    sizes: ['Jumbo Dewasa'],
    stock: { 'Pure White': 20, 'Dusty Mauve': 18, 'Midnight Onyx': 15 },
    totalStock: 53,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop'
    ],
    isNewArrival: true,
    isBestSeller: true,
    reviews: []
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
      { name: 'Sage Blossom', hex: '#9CAF88', stock: 25, image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=900&auto=format&fit=crop' },
      { name: 'Soft Pink', hex: '#F4C2C2', stock: 20, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop' },
      { name: 'Baby Blue', hex: '#89CFF0', stock: 15, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop' }
    ],
    sizes: ['All Size Travel'],
    stock: { 'Sage Blossom': 25, 'Soft Pink': 20, 'Baby Blue': 15 },
    totalStock: 60,
    images: [
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop'
    ],
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
      { name: 'White Cloud', hex: '#F8F9FA', stock: 16, image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=900&auto=format&fit=crop' },
      { name: 'Sage Grey', hex: '#8E9A8E', stock: 14, image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=900&auto=format&fit=crop' },
      { name: 'Navy Bold', hex: '#1B2A47', stock: 15, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop' }
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: { 'White Cloud': 16, 'Sage Grey': 14, 'Navy Bold': 15 },
    totalStock: 45,
    images: [
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=900&auto=format&fit=crop'
    ],
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
      { name: 'Classic White Pearl', hex: '#FDFBF7', stock: 30, image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=900&auto=format&fit=crop' },
      { name: 'Peach Champagne Pearl', hex: '#F5D6C6', stock: 20, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop' }
    ],
    sizes: ['One Size (Diameter 4.5 cm)'],
    stock: { 'Classic White Pearl': 30, 'Peach Champagne Pearl': 20 },
    totalStock: 50,
    images: [
      'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop'
    ],
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
      whatsapp: DEFAULT_WHATSAPP_LOCAL,
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
    mengantar: {
      mengantarOrderId: 'MGT-98204-101',
      trackingNumber: 'TJNE08291048201',
      courier: 'JNE Express',
      serviceType: 'REG',
      status: 'DIKIRIM',
      pickupTime: '11 Sep 2026 14:00 - 17:00 WIB',
      shippingFee: 12000,
      isCod: false,
      codAmount: 0,
      labelUrl: 'https://storage.mengantar.com/labels/MGT-98204-101.pdf',
      airwayBillUrl: 'https://storage.mengantar.com/labels/MGT-98204-101.pdf',
      barcodeNumber: 'TJNE08291048201',
      estimatedDelivery: '2 - 3 Hari Kerja',
      syncedAt: '2026-09-11T07:35:00.000Z'
    },
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
