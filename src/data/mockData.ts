import { Product, ShippingMethod, Order } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'saena-01',
    name: 'Madina Silk Abaya Set with French Khimar',
    slug: 'madina-silk-abaya-set',
    category: 'abaya-gamis',
    price: 685000,
    originalPrice: 850000,
    rating: 4.9,
    reviewCount: 142,
    description: 'Abaya eksklusif berbahan Mulberry Silk grade 6A dengan siluet loose fit yang anggun dan wudhu-friendly. Dilengkapi dengan French Khimar senada berdetail lace lembut pada bagian manset lengan.',
    material: 'Premium Mulberry Silk Blend & Babydoll Ceruty',
    careInstructions: [
      'Cuci menggunakan tangan dengan deterjen khusus sutra',
      'Hindari memeras terlalu kuat',
      'Setrika dengan suhu rendah atau steam iron',
      'Keringkan di tempat teduh terhindar dari sinar matahari langsung'
    ],
    features: [
      'Wudhu Friendly dengan ritsleting tersembunyi di pergelangan tangan',
      'Busui Friendly dengan resleting jepang di dada',
      'Termasuk French Khimar senada',
      'Kantong sisi kanan dalam yang aman'
    ],
    colors: [
      { name: 'Emerald Forest', hex: '#1C3B2B', stock: 12, image: 'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop' },
      { name: 'Champagne Taupe', hex: '#C9B195', stock: 8, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop' },
      { name: 'Midnight Onyx', hex: '#1C1B1F', stock: 4, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop' },
      { name: 'Dusty Mauve', hex: '#8F6873', stock: 3, image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: {
      'Emerald Forest': 12,
      'Champagne Taupe': 8,
      'Midnight Onyx': 4,
      'Dusty Mauve': 3
    },
    totalStock: 27,
    images: [
      'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop'
    ],
    isNewArrival: true,
    isBestSeller: true,
    reviews: [
      {
        id: 'rev-01',
        userName: 'Aisyah Nurul Hidayah',
        rating: 5,
        date: '2 hari lalu',
        comment: 'Masya Allah bahannya adem sekali dan jatuhnya mewah! Packaging box saena.id wangi parfum kasturi khas Madinah. Rekomendasi banget untuk Hari Raya.',
        variantInfo: 'Emerald Forest / Size M',
        verifiedBuyer: true
      },
      {
        id: 'rev-02',
        userName: 'Fatima Zahra',
        rating: 5,
        date: '5 hari lalu',
        comment: 'High quality finishing, jahitan butik sangat rapi. Khimar French-nya pas banget di wajah tidak geser. Pengiriman ke Kuala Lumpur juga sangat cepat.',
        variantInfo: 'Champagne Taupe / Size L',
        verifiedBuyer: true
      }
    ]
  },
  {
    id: 'saena-02',
    name: 'Zafira Pleated Kaftan Dress Silk Edition',
    slug: 'zafira-pleated-kaftan-dress',
    category: 'dress-kaftan',
    price: 549000,
    originalPrice: 699000,
    rating: 4.8,
    reviewCount: 98,
    description: 'Dress kaftan dengan aksen plisket mikro vertikal yang memberikan ilusi jenjang dan ramping. Dipercantik dengan taburan mutiara swarovski sintetis pada leher kerah shanghai.',
    material: 'Armani Silk Textured & Hand-sewn Pearl Detailing',
    careInstructions: [
      'Dry clean direkomendasikan untuk menjaga keawetan plisket',
      'Gunakan hanger berbusa saat menggantung',
      'Jangan disetrika panas langsung pada lipatan plisket'
    ],
    features: [
      'Tali serut pinggang adjustable di bagian dalam',
      'Bahan tidak menerawang dengan furing katun silky',
      'Detail kristal leher mewah',
      'Cocok untuk kondangan, silaturahmi formal & lebaran'
    ],
    colors: [
      { name: 'Rose Gold Shimmer', hex: '#D1A39E', stock: 7, image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop' },
      { name: 'Sage Mint', hex: '#879D89', stock: 5, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop' },
      { name: 'Royal Navy', hex: '#1B2A4A', stock: 3, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop' }
    ],
    sizes: ['All Size (Fit to XL)'],
    stock: {
      'Rose Gold Shimmer': 7,
      'Sage Mint': 5,
      'Royal Navy': 3
    },
    totalStock: 15,
    images: [
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop'
    ],
    isNewArrival: true,
    isBestSeller: true,
    reviews: [
      {
        id: 'rev-03',
        userName: 'Nadia Salsabila',
        rating: 5,
        date: '1 minggu lalu',
        comment: 'Warna Sage Mint aslinya cantik bangeet! Dipakai kondangan banyak yang nanya beli dimana. Terima kasih saena.id!',
        variantInfo: 'Sage Mint / All Size',
        verifiedBuyer: true
      }
    ]
  },
  {
    id: 'saena-03',
    name: 'Azkia Mulberry Silk Pashmina (200x75 cm)',
    slug: 'azkia-mulberry-silk-pashmina',
    category: 'hijab-pashmina',
    price: 189000,
    originalPrice: 240000,
    rating: 5.0,
    reviewCount: 310,
    description: 'Pashmina sutra mulberry mewah dengan kilau satin doff elegan (matte sheen). Tidak licin, mudah dibentuk tegak paripurna di dahi tanpa perlu jarum pentul berlebih.',
    material: '100% Pure Mulberry Silk Touch Weave',
    careInstructions: [
      'Cuci lembut dengan sampo bayi',
      'Keringkan diangin-anginkan',
      'Gunakan jarum pentul anti-karat atau klip magnet hijab'
    ],
    features: [
      'Ukuran jumbo 200 x 75 cm menutup dada sempurna',
      'Jahitan tepi baby hem super rapat',
      'Dilengkapi plat logo saena.id emas antik eksklusif',
      'Breathable dan sejuk di cuaca tropis'
    ],
    colors: [
      { name: 'Pearl Almond', hex: '#E6D7C3', stock: 12, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop' },
      { name: 'Olive Bronze', hex: '#635B43', stock: 8, image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=800&auto=format&fit=crop' },
      { name: 'Mauve Whisper', hex: '#A89297', stock: 7, image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop' },
      { name: 'Charcoal Mist', hex: '#3E4145', stock: 6, image: 'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop' },
      { name: 'Terracotta Earth', hex: '#B85D43', stock: 5, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop' }
    ],
    sizes: ['Standard 200x75'],
    stock: {
      'Pearl Almond': 12,
      'Olive Bronze': 8,
      'Mauve Whisper': 7,
      'Charcoal Mist': 6,
      'Terracotta Earth': 5
    },
    totalStock: 38,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=800&auto=format&fit=crop'
    ],
    isNewArrival: false,
    isBestSeller: true,
    reviews: [
      {
        id: 'rev-04',
        userName: 'Siti Sarah Al-Habsyi',
        rating: 5,
        date: '3 hari lalu',
        comment: 'Sudah order 4 warna berbeda. Pashmina paling nyaman sedunia, tegak di dahi dan tidak bikin pekak telinga!',
        variantInfo: 'Pearl Almond / Standard 200x75',
        verifiedBuyer: true
      }
    ]
  },
  {
    id: 'saena-04',
    name: 'Safiyya Royale Prayer Set (Mukena Sutra Silk)',
    slug: 'safiyya-royale-prayer-set',
    category: 'mukena-silk',
    price: 795000,
    originalPrice: 950000,
    rating: 4.9,
    reviewCount: 84,
    description: 'Set mukena ibadah premium berbahan silk bertekstur lembut dan adem dingin di kulit. Dikelilingi renda bordir prada motif flora eksklusif. Dilengkapi sajadah muka berbusa dan pouch tas jinjing mewah beraksen rantai emas.',
    material: 'Royale Silk Jacquard & French Floral Lace',
    careInstructions: [
      'Cuci manual rendam lembut',
      'Gunakan pelembut pakaian islami',
      'Gantung dengan rapi pada pouch saat dibawa safar'
    ],
    features: [
      'Termasuk tas pouch travelling berantai gold & sajadah mini',
      'Dagu fleksibel antitembem syari menutup aurat sempurna',
      'Tali kepala ikat anti pusing',
      'Cocok untuk mahar pernikahan, seserahan, & kado istimewa'
    ],
    colors: [
      { name: 'Pure White Silk', hex: '#FDFBF7', stock: 3, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop' },
      { name: 'Dusty Lavender', hex: '#A294A6', stock: 3, image: 'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop' },
      { name: 'Soft Sage', hex: '#9EAD9F', stock: 2, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop' }
    ],
    sizes: ['All Size Jumbo'],
    stock: {
      'Pure White Silk': 3,
      'Dusty Lavender': 3,
      'Soft Sage': 2
    },
    totalStock: 8,
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop'
    ],
    isNewArrival: true,
    isBestSeller: false,
    reviews: [
      {
        id: 'rev-05',
        userName: 'Ratu Bilqis',
        rating: 5,
        date: 'Kemarin',
        comment: 'Mukena ini dijadikan seserahan pernikahan saya. Sangat berkelas, adem, dan renda bordirnya mewah sekali.',
        variantInfo: 'Pure White Silk / Jumbo',
        verifiedBuyer: true
      }
    ]
  },
  {
    id: 'saena-05',
    name: 'Rayyan Premium Linen Kurta Shirt for Men',
    slug: 'rayyan-premium-linen-kurta-shirt',
    category: 'koko-kurta',
    price: 345000,
    originalPrice: 420000,
    rating: 4.8,
    reviewCount: 76,
    description: 'Kemeja kurta pria muslim modern dengan kerah band collar mandarin, potongan modern relaxed fit yang nyaman untuk shalat berjamaah maupun aktivitas kantor sehari-hari.',
    material: '100% Belgian Organic Pure Linen',
    careInstructions: [
      'Cuci terpisah saat pertama kali cuci',
      'Setrika saat kain sedikit lembap untuk hasil maksimal',
      'Gantung di hanger kayu'
    ],
    features: [
      'Saku dada minimalis tersembunyi',
      'Kancing alami batok kelapa polish halus',
      'Lengan bisa dilipat dengan kancing penahan (roll-up strap)',
      'Breathable, menyerap keringat maksimal'
    ],
    colors: [
      { name: 'Sand Beige', hex: '#D2BFA9', stock: 8, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop' },
      { name: 'Deep Forest', hex: '#263B2F', stock: 6, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop' },
      { name: 'Off White', hex: '#F5F5F0', stock: 4, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop' },
      { name: 'Navy Stone', hex: '#2B3542', stock: 4, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop' }
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: {
      'Sand Beige': 8,
      'Deep Forest': 6,
      'Off White': 4,
      'Navy Stone': 4
    },
    totalStock: 22,
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop'
    ],
    isNewArrival: true,
    isBestSeller: true,
    reviews: [
      {
        id: 'rev-06',
        userName: 'Muhammad Farhan',
        rating: 5,
        date: '4 hari lalu',
        comment: 'Cuttingan kurta sangat pas, bahannya adem dan look-nya santai tapi tetap formal rapi untuk sholat Jumat.',
        variantInfo: 'Deep Forest / Size L',
        verifiedBuyer: true
      }
    ]
  },
  {
    id: 'saena-06',
    name: 'Nura Textured Tiered Gamis Dress',
    slug: 'nura-textured-tiered-gamis',
    category: 'abaya-gamis',
    price: 475000,
    originalPrice: 590000,
    rating: 4.7,
    reviewCount: 65,
    description: 'Gamis berjenjang (tiered dress) dengan tekstur crinkle airflow premium yang anti kusut dan tanpa perlu disetrika (ironless). Sangat praktis untuk wanita muslimah aktif.',
    material: 'Korean Crinkle Airflow Cotton-Silk',
    careInstructions: [
      'Bisa dicuci mesin putaran lembut',
      'Ironless (tidak perlu setrika)',
      'Jangan gunakan pemutih pakaian'
    ],
    features: [
      'Bahan Ironless Anti Kusut',
      'Manset karet elastis smok wudhu friendly',
      'Ritsleting depan busui friendly',
      'Lebar rok bawah 2.8 meter jatuh flowy'
    ],
    colors: [
      { name: 'Caramel Macchiato', hex: '#A5734C', stock: 8, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop' },
      { name: 'Olive Moss', hex: '#585E47', stock: 7, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop' },
      { name: 'Jet Black', hex: '#111111', stock: 6, image: 'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop' }
    ],
    sizes: ['S', 'M', 'L'],
    stock: {
      'Caramel Macchiato': 8,
      'Olive Moss': 7,
      'Jet Black': 6
    },
    totalStock: 21,
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop'
    ],
    isNewArrival: false,
    isBestSeller: false,
    reviews: [
      {
        id: 'rev-07',
        userName: 'Dinda Wardani',
        rating: 5,
        date: '1 minggu lalu',
        comment: 'Beneran ironless! Habis dicuci kering langsung pakai tetap rapi dan tidak kusut sama sekali. Juara!',
        variantInfo: 'Caramel Macchiato / Size M',
        verifiedBuyer: true
      }
    ]
  },
  {
    id: 'saena-07',
    name: 'Saena Royal Ottoman Brooch & Magnetic Hijab Pin Set',
    slug: 'saena-royal-ottoman-brooch-set',
    category: 'aksesoris',
    price: 135000,
    originalPrice: 175000,
    rating: 4.9,
    reviewCount: 119,
    description: 'Set bros kerudung eksklusif terinspirasi seni ornamen Ottoman Istanbul, disepuh emas 18K tahan karat. Termasuk 2 pasang klip magnet hijab ultra-kuat yang tidak merusak serat kain sutra.',
    material: '18K Gold Plated Brass & Zirconia Crystals',
    careInstructions: [
      'Simpan dalam kotak beludru saena.id setelah digunakan',
      'Hindari kontak langsung dengan parfum atau lotion',
      'Bersihkan dengan kain micro-fiber kering'
    ],
    features: [
      'Klip magnet Neodymium ultra-kuat anti merusak sutra',
      'Lapisan pelindung anti alergi & anti karat',
      'Termasuk gift box beludru mewah'
    ],
    colors: [
      { name: 'Vintage Gold', hex: '#D4AF37', stock: 25, image: 'https://images.unsplash.com/photo-1611591475819-20f78c857731?q=80&w=800&auto=format&fit=crop' },
      { name: 'Silver Platinum', hex: '#C0C0C0', stock: 20, image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop' }
    ],
    sizes: ['One Size Set'],
    stock: {
      'Vintage Gold': 25,
      'Silver Platinum': 20
    },
    totalStock: 45,
    images: [
      'https://images.unsplash.com/photo-1611591475819-20f78c857731?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop'
    ],
    isNewArrival: false,
    isBestSeller: true,
    reviews: [
      {
        id: 'rev-08',
        userName: 'dr. Hilya Annisa',
        rating: 5,
        date: '6 hari lalu',
        comment: 'Magnetnya kencang banget dan gak bikin bolong pashmina sutra mahal. Brosnya juga terlihat sangat mewah.',
        variantInfo: 'Vintage Gold / One Size',
        verifiedBuyer: true
      }
    ]
  },
  {
    id: 'saena-08',
    name: 'Layla Organza Embroidered Kaftan Dress',
    slug: 'layla-organza-embroidered-kaftan',
    category: 'dress-kaftan',
    price: 620000,
    originalPrice: 750000,
    rating: 4.8,
    reviewCount: 52,
    description: 'Kaftan outer organza kaca kristal dengan sulaman bordir floral timbul bernuansa emas tembaga. Dilengkapi inner gamis bahan satin maxmara silk lembut sejuk.',
    material: 'Crystal Glass Organza + Maxmara Silk Inner',
    careInstructions: [
      'Dry clean only',
      'Hindari gesekan dengan perhiasan tajam'
    ],
    features: [
      'Sudah 1 set inner dress + outer organza',
      'Potongan oversize elegan menjuntai anggun',
      'Bordir benang emas premium'
    ],
    colors: [
      { name: 'Opal Beige', hex: '#E2D5C7', stock: 4, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop' },
      { name: 'Dusty Pink Lilac', hex: '#CCA5B0', stock: 3, image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop' }
    ],
    sizes: ['All Size Fit to XL'],
    stock: {
      'Opal Beige': 4,
      'Dusty Pink Lilac': 3
    },
    totalStock: 7,
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop'
    ],
    isNewArrival: true,
    isBestSeller: false,
    reviews: [
      {
        id: 'rev-09',
        userName: 'Annisa Tri Wardani',
        rating: 5,
        date: '3 hari lalu',
        comment: 'Look-nya mewah polll! Dipakai untuk foto keluarga lebaran hasilnya luar biasa anggun.',
        variantInfo: 'Opal Beige / All Size',
        verifiedBuyer: true
      }
    ]
  }
];

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
        product: INITIAL_PRODUCTS[0],
        selectedSize: 'M',
        selectedColor: { name: 'Emerald Forest', hex: '#1C3B2B' },
        quantity: 1,
        price: 685000
      },
      {
        id: 'saena-03-Azkia-Almond',
        productId: 'saena-03',
        product: INITIAL_PRODUCTS[2],
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
        product: INITIAL_PRODUCTS[3],
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
