import * as XLSX from 'xlsx';
import { Category, Product, ProductColor } from '../types';

export const EXCEL_IMPORT_COLUMNS = [
  'Nama Produk',
  'Deskripsi Panjang',
  'Deskripsi Pendek',
  'Link Sumber Produk',
  'Nama Variasi 1',
  'Opsi Variasi 1',
  'Nama Variasi 2',
  'Opsi Variasi 2',
  'Nama Variasi 3',
  'Opsi Variasi 3',
  'Harga',
  'Diskon',
  'Mata Uang',
  'Stok',
  'SKU',
  'Berat Paket',
  'Panjang Paket',
  'Lebar Paket',
  'Tinggi Paket',
  'Foto Produk 1',
  'Foto Produk 2',
  'Foto Produk 3',
  'Foto Produk 4',
  'Foto Produk 5',
  'Foto Produk 6',
  'Foto Produk 7',
  'Foto Produk 8',
  'Foto Produk 9',
  'Gambar Variasi 1',
  'Gambar Variasi 2',
  'Gambar Variasi 3',
  'Gambar Variasi 4',
  'Gambar Variasi 5',
  'Gambar Variasi 6',
  'Gambar Variasi 7',
  'Gambar Variasi 8',
  'Gambar Variasi 9'
] as const;

// Curated high quality fallback photos
export const CURATED_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop'
];

// Color name to HEX dictionary
const COLOR_HEX_MAP: Record<string, string> = {
  emerald: '#1C3B2B',
  hijau: '#2D5A3F',
  forest: '#1E382B',
  sage: '#9CAF88',
  olive: '#556B2F',
  champagne: '#9E866C',
  mocca: '#8B7355',
  moka: '#8B7355',
  taupe: '#7D6B58',
  cokelat: '#5C4033',
  brown: '#5C4033',
  khaki: '#C3B091',
  nude: '#E3C8B4',
  krem: '#F5F2EB',
  cream: '#F5F2EB',
  hitam: '#1A1A1A',
  black: '#1A1A1A',
  onyx: '#121212',
  charcoal: '#2B2B2B',
  putih: '#FFFFFF',
  white: '#FFFFFF',
  bw: '#FAF8F5',
  'broken white': '#FAF8F5',
  dusty: '#A37081',
  'dusty pink': '#D8A47F',
  pink: '#E8A598',
  rose: '#C97A7E',
  mauve: '#A37081',
  navy: '#1B263B',
  biru: '#254E70',
  denim: '#4B6584',
  marun: '#6A1A24',
  maroon: '#6A1A24',
  burgundy: '#581845',
  merah: '#8A1C24',
  terracotta: '#C26D53',
  bata: '#BD5338',
  mustard: '#D4A373',
  kuning: '#E1AD01',
  abu: '#8D99AE',
  grey: '#8D99AE',
  gray: '#8D99AE',
  silver: '#C0C0C0',
  lilac: '#BDB2FF',
  lavender: '#9D8189',
  ungu: '#6B4C70'
};

export function detectColorHex(colorName: string, index = 0): string {
  const lower = colorName.toLowerCase().trim();
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key)) {
      return hex;
    }
  }
  // Default stylish fallbacks
  const fallbacks = ['#1C3B2B', '#9E866C', '#1A1A1A', '#A37081', '#9CAF88', '#1B263B', '#FAF8F5'];
  return fallbacks[index % fallbacks.length];
}

export function detectCategoryFromText(text: string): Category {
  const lower = text.toLowerCase();
  if (lower.includes('hijab') || lower.includes('pashmina') || lower.includes('khimar') || lower.includes('bergo') || lower.includes('segi empat') || lower.includes('jilbab') || lower.includes('shawl')) {
    return 'hijab-pashmina';
  }
  if (lower.includes('mukena') || lower.includes('rukuh') || lower.includes('telekung') || lower.includes('prayer')) {
    return 'mukena-silk';
  }
  if (lower.includes('koko') || lower.includes('kurta') || lower.includes('kemko') || lower.includes('pria') || lower.includes('gamis pria')) {
    return 'koko-kurta';
  }
  if (lower.includes('kaftan') || lower.includes('dress') || lower.includes('tunik') || lower.includes('maxi')) {
    return 'dress-kaftan';
  }
  if (lower.includes('bros') || lower.includes('brooch') || lower.includes('pin') || lower.includes('manset') || lower.includes('inner') || lower.includes('ciput') || lower.includes('tuspin') || lower.includes('aksesoris')) {
    return 'aksesoris';
  }
  return 'abaya-gamis';
}

// Sample Rows provided in the downloadable template
export const SAMPLE_EXCEL_ROWS = [
  {
    'Nama Produk': 'Zafira Mulberry Silk Abaya Bordir Emas',
    'Deskripsi Panjang': "Koleksi abaya eksklusif saena.id dengan material Mulberry Silk premium. Siluet anggun jatuh mewah, dilengkapi bordiran motif floral benang emas, zipper depan (busui friendly), dan manset wudhu friendly.",
    'Deskripsi Pendek': 'Abaya mulberry silk mewah dengan aksen bordir emas anggun.',
    'Link Sumber Produk': 'https://shopee.co.id/saena-zafira-abaya-silk',
    'Nama Variasi 1': 'Warna',
    'Opsi Variasi 1': 'Emerald Forest, Champagne Taupe, Midnight Onyx',
    'Nama Variasi 2': 'Ukuran',
    'Opsi Variasi 2': 'All Size, M, L, XL',
    'Nama Variasi 3': '',
    'Opsi Variasi 3': '',
    'Harga': 495000,
    'Diskon': 50000,
    'Mata Uang': 'IDR',
    'Stok': 30,
    'SKU': 'SAENA-ZAF-01',
    'Berat Paket': 500,
    'Panjang Paket': 30,
    'Lebar Paket': 22,
    'Tinggi Paket': 4,
    'Foto Produk 1': 'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop',
    'Foto Produk 2': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
    'Foto Produk 3': '',
    'Foto Produk 4': '',
    'Foto Produk 5': '',
    'Foto Produk 6': '',
    'Foto Produk 7': '',
    'Foto Produk 8': '',
    'Foto Produk 9': '',
    'Gambar Variasi 1': 'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop',
    'Gambar Variasi 2': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
    'Gambar Variasi 3': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop',
    'Gambar Variasi 4': '',
    'Gambar Variasi 5': '',
    'Gambar Variasi 6': '',
    'Gambar Variasi 7': '',
    'Gambar Variasi 8': '',
    'Gambar Variasi 9': ''
  },
  {
    'Nama Produk': 'Madina Pleated Silk Pashmina Shawl',
    'Deskripsi Panjang': 'Pashmina silk bertekstur pleats halus dengan drape jatuh mewah. Bahan adem, breathable, tegak di dahi dan tidak mudah kusut.',
    'Deskripsi Pendek': 'Pashmina silk pleated bertekstur anggun dan elegan.',
    'Link Sumber Produk': 'https://vt.tiktok.com/ZS8yH3Qap/',
    'Nama Variasi 1': 'Warna',
    'Opsi Variasi 1': 'Dusty Mauve, Soft Sage, Champagne Taupe',
    'Nama Variasi 2': 'Ukuran',
    'Opsi Variasi 2': '180x75 cm',
    'Nama Variasi 3': '',
    'Opsi Variasi 3': '',
    'Harga': 129000,
    'Diskon': 15000,
    'Mata Uang': 'IDR',
    'Stok': 45,
    'SKU': 'SAENA-MAD-02',
    'Berat Paket': 200,
    'Panjang Paket': 20,
    'Lebar Paket': 15,
    'Tinggi Paket': 2,
    'Foto Produk 1': 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop',
    'Foto Produk 2': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
    'Foto Produk 3': '',
    'Foto Produk 4': '',
    'Foto Produk 5': '',
    'Foto Produk 6': '',
    'Foto Produk 7': '',
    'Foto Produk 8': '',
    'Foto Produk 9': '',
    'Gambar Variasi 1': 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop',
    'Gambar Variasi 2': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
    'Gambar Variasi 3': 'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop',
    'Gambar Variasi 4': '',
    'Gambar Variasi 5': '',
    'Gambar Variasi 6': '',
    'Gambar Variasi 7': '',
    'Gambar Variasi 8': '',
    'Gambar Variasi 9': ''
  },
  {
    'Nama Produk': 'Aisyah Silk Swarovski Mukena Set 2in1',
    'Deskripsi Panjang': 'Mukena silk 2in1 dengan kilau dove elegan berhias renda kristal swarovski. Dilengkapi resleting leher fleksibel, sajadah mini, dan pouch mewah.',
    'Deskripsi Pendek': 'Mukena silk premium berenda swarovski dengan sajadah mini dan pouch.',
    'Link Sumber Produk': 'https://shopee.co.id/saena-aisyah-mukena-silk',
    'Nama Variasi 1': 'Warna',
    'Opsi Variasi 1': 'Pure White, Dusty Mauve, Midnight Onyx',
    'Nama Variasi 2': 'Ukuran',
    'Opsi Variasi 2': 'Jumbo Dewasa',
    'Nama Variasi 3': '',
    'Opsi Variasi 3': '',
    'Harga': 385000,
    'Diskon': 30000,
    'Mata Uang': 'IDR',
    'Stok': 25,
    'SKU': 'SAENA-ASY-03',
    'Berat Paket': 600,
    'Panjang Paket': 25,
    'Lebar Paket': 20,
    'Tinggi Paket': 6,
    'Foto Produk 1': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
    'Foto Produk 2': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop',
    'Foto Produk 3': '',
    'Foto Produk 4': '',
    'Foto Produk 5': '',
    'Foto Produk 6': '',
    'Foto Produk 7': '',
    'Foto Produk 8': '',
    'Foto Produk 9': '',
    'Gambar Variasi 1': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
    'Gambar Variasi 2': 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop',
    'Gambar Variasi 3': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop',
    'Gambar Variasi 4': '',
    'Gambar Variasi 5': '',
    'Gambar Variasi 6': '',
    'Gambar Variasi 7': '',
    'Gambar Variasi 8': '',
    'Gambar Variasi 9': ''
  }
];

// Helper to trigger download of pre-formatted .xlsx template file
export function downloadExcelTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_EXCEL_ROWS, { 
    header: [...EXCEL_IMPORT_COLUMNS] 
  });

  // Set optimal column widths
  ws['!cols'] = EXCEL_IMPORT_COLUMNS.map(col => {
    if (col.includes('Deskripsi')) return { wch: 35 };
    if (col.includes('Foto') || col.includes('Gambar') || col.includes('Link')) return { wch: 28 };
    return { wch: Math.max(col.length + 3, 14) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Produk');

  if (format === 'csv') {
    XLSX.writeFile(wb, 'Format_Import_Produk_saena_id.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, 'Format_Import_Produk_saena_id.xlsx', { bookType: 'xlsx' });
  }
}

export interface ParsedExcelProduct {
  rowIndex: number;
  name: string;
  category: Category;
  price: number;
  originalPrice: number;
  discount?: number;
  currency: string;
  description: string;
  shortDescription?: string;
  sourceUrl?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  material: string;
  careInstructions: string[];
  features: string[];
  sizes: string[];
  colors: ProductColor[];
  stock: Record<string, number>;
  totalStock: number;
  images: string[];
  isValid: boolean;
  errors: string[];
}

export function parseExcelWorkbook(data: ArrayBuffer): {
  products: ParsedExcelProduct[];
  totalRows: number;
  validCount: number;
  errorCount: number;
} {
  const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { 
    defval: '',
    raw: false // treat as strings to parse clean numbers
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('File Excel tidak berisi data produk.');
  }

  const parsedProducts: ParsedExcelProduct[] = [];

  rawRows.forEach((row, idx) => {
    // Flexible case-insensitive and trimmed column lookup
    const normalizedRow: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      normalizedRow[key.trim().toLowerCase()] = String(row[key] ?? '').trim();
    }

    const getCol = (name: string): string => {
      const lower = name.toLowerCase();
      if (normalizedRow[lower] !== undefined) return normalizedRow[lower];
      // Try fuzzy match
      for (const k of Object.keys(normalizedRow)) {
        if (k.replace(/\s+/g, '') === lower.replace(/\s+/g, '')) {
          return normalizedRow[k];
        }
      }
      return '';
    };

    const errors: string[] = [];

    // 1. Nama Produk
    const name = getCol('Nama Produk');
    if (!name) {
      errors.push('Nama Produk tidak boleh kosong.');
    }

    // 2. Deskripsi
    const longDesc = getCol('Deskripsi Panjang');
    const shortDesc = getCol('Deskripsi Pendek');
    const description = longDesc || shortDesc || 'Koleksi busana muslimah eksklusif saena.id dengan cutting rapi dan material berkelas.';

    // 3. Link Sumber
    const sourceUrl = getCol('Link Sumber Produk');

    // 4. Harga & Diskon
    const rawPrice = getCol('Harga').replace(/[^0-9]/g, '');
    const price = parseInt(rawPrice, 10) || 0;
    if (price <= 0) {
      errors.push('Harga produk harus angka valid lebih dari 0.');
    }

    const rawDiscount = getCol('Diskon').replace(/[^0-9]/g, '');
    const discountVal = parseInt(rawDiscount, 10) || 0;
    let originalPrice = price;
    if (discountVal > 0) {
      if (discountVal < 100) {
        // Diskon persen (misal 15%)
        originalPrice = Math.round(price / (1 - discountVal / 100) / 5000) * 5000;
      } else {
        // Diskon nominal (misal 50.000)
        originalPrice = price + discountVal;
      }
    } else {
      originalPrice = Math.round(price * 1.15 / 5000) * 5000;
    }

    // 5. Mata Uang
    const currency = getCol('Mata Uang') || 'IDR';

    // 6. Stok & SKU
    const rawStok = getCol('Stok').replace(/[^0-9]/g, '');
    const totalStokInput = parseInt(rawStok, 10) || 20;
    const sku = getCol('SKU') || `SAENA-${Date.now().toString().slice(-4)}-${idx + 1}`;

    // 7. Berat & Dimensi Paket
    const rawWeight = getCol('Berat Paket').replace(/[^0-9.]/g, '');
    const weight = parseFloat(rawWeight) || 450;

    const rawL = getCol('Panjang Paket').replace(/[^0-9.]/g, '');
    const rawW = getCol('Lebar Paket').replace(/[^0-9.]/g, '');
    const rawH = getCol('Tinggi Paket').replace(/[^0-9.]/g, '');
    const dimensions = {
      length: parseFloat(rawL) || 25,
      width: parseFloat(rawW) || 20,
      height: parseFloat(rawH) || 4
    };

    // 8. Foto Produk 1 s/d 9
    const productImages: string[] = [];
    for (let i = 1; i <= 9; i++) {
      const imgUrl = getCol(`Foto Produk ${i}`);
      if (imgUrl && imgUrl.startsWith('http')) {
        productImages.push(imgUrl);
      }
    }

    // 9. Gambar Variasi 1 s/d 9
    const variantImages: string[] = [];
    for (let i = 1; i <= 9; i++) {
      const imgUrl = getCol(`Gambar Variasi ${i}`);
      if (imgUrl && imgUrl.startsWith('http')) {
        variantImages.push(imgUrl);
      }
    }

    // 10. Variasi
    const var1Name = getCol('Nama Variasi 1');
    const var1Ops = getCol('Opsi Variasi 1');
    const var2Name = getCol('Nama Variasi 2');
    const var2Ops = getCol('Opsi Variasi 2');
    const var3Name = getCol('Nama Variasi 3');
    const var3Ops = getCol('Opsi Variasi 3');

    // Parse Colors from variations (usually Variation 1 or any variation with color names)
    let colorListRaw: string[] = [];
    let sizeListRaw: string[] = [];

    // Helper to split comma, semicolon, slash, or newline
    const splitOps = (val: string) => val.split(/[,;\n\/|]+/).map(s => s.trim()).filter(Boolean);

    if (var1Name.toLowerCase().includes('warna') || var1Name.toLowerCase().includes('color')) {
      colorListRaw = splitOps(var1Ops);
      if (var2Name.toLowerCase().includes('ukuran') || var2Name.toLowerCase().includes('size')) {
        sizeListRaw = splitOps(var2Ops);
      }
    } else if (var2Name.toLowerCase().includes('warna') || var2Name.toLowerCase().includes('color')) {
      colorListRaw = splitOps(var2Ops);
      sizeListRaw = splitOps(var1Ops);
    } else {
      // Default: check if var1Ops has values
      if (var1Ops) {
        colorListRaw = splitOps(var1Ops);
      }
      if (var2Ops) {
        sizeListRaw = splitOps(var2Ops);
      }
    }

    // Fallback if no colors extracted
    if (colorListRaw.length === 0) {
      colorListRaw = ['Emerald Forest', 'Champagne Taupe'];
    }

    // Fallback if no sizes extracted
    if (sizeListRaw.length === 0) {
      sizeListRaw = ['All Size', 'M', 'L', 'XL'];
    }

    // Stock per color calculation
    const stockPerColor = Math.max(1, Math.floor(totalStokInput / colorListRaw.length));
    const stockMap: Record<string, number> = {};

    const colors: ProductColor[] = colorListRaw.map((colorName, cIdx) => {
      const hex = detectColorHex(colorName, cIdx);
      const specificVariantImg = variantImages[cIdx];
      const fallbackImg = productImages[cIdx] || CURATED_FALLBACK_IMAGES[cIdx % CURATED_FALLBACK_IMAGES.length];
      const assignedImg = specificVariantImg || fallbackImg;

      stockMap[colorName] = stockPerColor;

      return {
        name: colorName,
        hex,
        stock: stockPerColor,
        image: assignedImg
      };
    });

    // Make sure productImages has at least 1 image
    if (productImages.length === 0) {
      const colorImgs = colors.map(c => c.image).filter(Boolean) as string[];
      if (colorImgs.length > 0) {
        productImages.push(...colorImgs);
      } else {
        productImages.push(CURATED_FALLBACK_IMAGES[idx % CURATED_FALLBACK_IMAGES.length]);
      }
    }

    // Category detection
    const category = detectCategoryFromText(name + ' ' + description);

    parsedProducts.push({
      rowIndex: idx + 2, // 1-indexed, +1 for header row
      name,
      category,
      price,
      originalPrice,
      discount: discountVal > 0 ? discountVal : undefined,
      currency,
      description,
      shortDescription: shortDesc || undefined,
      sourceUrl: sourceUrl || undefined,
      sku,
      weight,
      dimensions,
      material: 'Mulberry Silk & Ceruty Babydoll Premium',
      careInstructions: [
        'Cuci dengan tangan suhu air normal',
        'Gunakan deterjen cair lembut khusus kain sutra',
        'Keringkan di tempat teduh tanpa paparan terik matahari',
        'Setrika suhu rendah atau gunakan garment steamer'
      ],
      features: [
        'Busui Friendly (Aksen bukaan zipper depan)',
        'Wudhu Friendly (Manset elastis fleksibel)',
        'Bahan adem, jatuh anggun, dan tidak terawang',
        'Jahitan rapi standar butik halus'
      ],
      sizes: sizeListRaw,
      colors,
      stock: stockMap,
      totalStock: Object.values(stockMap).reduce((a, b) => a + b, 0),
      images: productImages,
      isValid: errors.length === 0,
      errors
    });
  });

  const validCount = parsedProducts.filter(p => p.isValid).length;
  const errorCount = parsedProducts.length - validCount;

  return {
    products: parsedProducts,
    totalRows: parsedProducts.length,
    validCount,
    errorCount
  };
}
