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

// Curated high quality fallback photos for modest fashion
export const CURATED_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop'
];

// Color name to HEX dictionary covering common Indonesian & English modest fashion colors
export const COLOR_HEX_MAP: Record<string, string> = {
  emerald: '#1C3B2B',
  hijau: '#2D5A3F',
  forest: '#1E382B',
  sage: '#9CAF88',
  'soft sage': '#B5C4A6',
  wardah: '#88BDB8',
  mint: '#98D7C2',
  army: '#4B5320',
  olive: '#556B2F',
  tosca: '#2A7B76',
  champagne: '#9E866C',
  mocca: '#8B7355',
  moka: '#8B7355',
  milo: '#A07855',
  taupe: '#7D6B58',
  cokelat: '#5C4033',
  coklat: '#5C4033',
  brown: '#5C4033',
  caramel: '#A66E38',
  hazelnut: '#B38B6D',
  cappuccino: '#9B7D64',
  khaki: '#C3B091',
  nude: '#E3C8B4',
  krem: '#F5F2EB',
  cream: '#F5F2EB',
  beige: '#E8DEC8',
  sand: '#D8CBB5',
  ivory: '#FFFFF0',
  pearl: '#F8F6F0',
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
  'dusty purple': '#8F6885',
  'dusty mauve': '#967180',
  pink: '#E8A598',
  'baby pink': '#F4C2C2',
  rose: '#C97A7E',
  'rose gold': '#B76E79',
  mauve: '#A37081',
  navy: '#1B263B',
  'midnight blue': '#191970',
  biru: '#254E70',
  denim: '#4B6584',
  'baby blue': '#89CFF0',
  sky: '#87CEEB',
  marun: '#6A1A24',
  maroon: '#6A1A24',
  burgundy: '#581845',
  merah: '#8A1C24',
  red: '#8A1C24',
  bata: '#BD5338',
  terracotta: '#C26D53',
  terrakota: '#C26D53',
  mustard: '#D4A373',
  kuning: '#E1AD01',
  lemon: '#E4D00A',
  abu: '#8D99AE',
  'abu-abu': '#8D99AE',
  grey: '#8D99AE',
  gray: '#8D99AE',
  silver: '#C0C0C0',
  ash: '#A9A9A9',
  lilac: '#BDB2FF',
  lavender: '#9D8189',
  ungu: '#6B4C70',
  purple: '#6B4C70',
  taro: '#8A6D88',
  plum: '#4E2E4B',
  magenta: '#8B008B',
  fuchsia: '#C154C1',
  salem: '#E9967A',
  peach: '#F4A460',
  coral: '#E07A5F',
  gold: '#D4AF37',
  emas: '#D4AF37',
  tembaga: '#B87333',
  bronze: '#CD7F32'
};

export function detectColorHex(colorName: string, index = 0): string {
  const lower = (colorName || '').toLowerCase().trim();
  // Exact or contains match
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key)) {
      return hex;
    }
  }
  // Default stylish fallbacks
  const fallbacks = ['#1C3B2B', '#9E866C', '#1A1A1A', '#A37081', '#9CAF88', '#1B263B', '#FAF8F5', '#8B7355'];
  return fallbacks[index % fallbacks.length];
}

export function detectCategoryFromText(text: string): Category {
  const lower = (text || '').toLowerCase();
  if (lower.includes('hijab') || lower.includes('pashmina') || lower.includes('khimar') || lower.includes('bergo') || lower.includes('segi empat') || lower.includes('jilbab') || lower.includes('shawl') || lower.includes('kerudung') || lower.includes('paris')) {
    return 'hijab-pashmina';
  }
  if (lower.includes('mukena') || lower.includes('rukuh') || lower.includes('telekung') || lower.includes('prayer') || lower.includes('alat sholat')) {
    return 'mukena-silk';
  }
  if (lower.includes('koko') || lower.includes('kurta') || lower.includes('kemko') || lower.includes('pria') || lower.includes('gamis pria') || lower.includes('baju muslim pria') || lower.includes('sirwal')) {
    return 'koko-kurta';
  }
  if (lower.includes('kaftan') || lower.includes('dress') || lower.includes('tunik') || lower.includes('maxi') || lower.includes('midi dress') || lower.includes('one set') || lower.includes('oneset')) {
    return 'dress-kaftan';
  }
  if (lower.includes('bros') || lower.includes('brooch') || lower.includes('pin') || lower.includes('manset') || lower.includes('inner') || lower.includes('ciput') || lower.includes('tuspin') || lower.includes('aksesoris') || lower.includes('scrunchie') || lower.includes('konektor')) {
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
    'Foto Produk 1': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
    'Foto Produk 2': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
    'Foto Produk 3': '',
    'Foto Produk 4': '',
    'Foto Produk 5': '',
    'Foto Produk 6': '',
    'Foto Produk 7': '',
    'Foto Produk 8': '',
    'Foto Produk 9': '',
    'Gambar Variasi 1': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
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

/**
 * Clean currency and numbers (handles Indonesian formatting like Rp 250.000, 250,000.00, etc.)
 */
function cleanNumericValue(raw: any, defaultVal = 0): number {
  if (raw === undefined || raw === null || raw === '') return defaultVal;
  if (typeof raw === 'number') return isNaN(raw) ? defaultVal : raw;
  
  let str = String(raw).trim();
  // Strip currency prefixes and letters
  str = str.replace(/^(rp|idr|rm|sgd|usd|\$)\s*/i, '').trim();

  // If format is like 250.000,00 (Indonesian standard with comma decimal)
  if (/\.\d{3},\d{1,2}$/.test(str)) {
    str = str.replace(/\./g, '').replace(',', '.');
  } 
  // If format is like 250,000.00 (US standard with comma thousands)
  else if (/,\d{3}\.\d{1,2}$/.test(str)) {
    str = str.replace(/,/g, '');
  }
  // If format is pure integer with dots as thousands (250.000)
  else if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    str = str.replace(/\./g, '');
  }
  // If format is pure integer with commas as thousands (250,000)
  else if (/^\d{1,3}(,\d{3})+$/.test(str)) {
    str = str.replace(/,/g, '');
  }
  // Otherwise strip all non-digit and non-dot characters
  else {
    str = str.replace(/[^0-9.]/g, '');
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? defaultVal : parsed;
}

/**
 * Extract clean HTTP/HTTPS image URLs from a cell (can be single URL, comma/semicolon/newline/pipe separated, or JSON array)
 */
function extractImageUrls(cellValue: any): string[] {
  if (!cellValue) return [];
  const raw = String(cellValue).trim();
  if (!raw) return [];

  // Try parsing JSON array if formatted as ["http..."]
  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map(u => String(u).trim())
          .filter(u => /^https?:\/\//i.test(u));
      }
    } catch {}
  }

  // Split by common delimiters: newline, semicolon, pipe, comma (ensuring not splitting inside query params when possible)
  const tokens = raw.split(/[\n\r;|\t]+/).flatMap(t => {
    // If token has commas and multiple http occurrences, split by comma
    if (t.includes(',') && (t.match(/https?:\/\//gi) || []).length > 1) {
      return t.split(',');
    }
    return [t];
  });

  const urls: string[] = [];
  for (let token of tokens) {
    token = token.trim().replace(/^['"]|['"]$/g, '');
    if (/^https?:\/\//i.test(token)) {
      if (!urls.includes(token)) {
        urls.push(token);
      }
    }
  }

  return urls;
}

/**
 * Comprehensive BigSeller Column Mapper Dictionary
 * Maps all variations of BigSeller export column names (Indonesian, English, with/without asterisks, Shopee/TikTok templates)
 */
const CANONICAL_FIELD_ALIASES: Record<string, string[]> = {
  name: [
    'nama produk', 'nama produk *', 'product name', 'product title', 'judul produk',
    'nama barang', 'nama item', 'item name', 'product_name', 'title', 'nama'
  ],
  description: [
    'deskripsi produk', 'deskripsi produk *', 'deskripsi panjang', 'deskripsi',
    'product description', 'description', 'keterangan', 'rincian produk', 'detail produk',
    'detail', 'product_desc', 'desc'
  ],
  shortDescription: [
    'deskripsi pendek', 'deskripsi singkat', 'short description', 'ringkasan', 'summary'
  ],
  parentSku: [
    'sku induk', 'parent sku', 'parentsku', 'sku master', 'master sku', 'kode sku induk',
    'sku toko', 'kode barang induk', 'parent_sku', 'main sku', 'main_sku'
  ],
  variantSku: [
    'kode variasi', 'sku variasi', 'variant sku', 'sub sku', 'variation sku', 'sku',
    'sku produk', 'kode barang', 'item sku', 'variant_sku'
  ],
  price: [
    'harga', 'harga *', 'price', 'harga jual', 'retail price', 'harga satuan',
    'harga variasi', 'variant price', 'harga produk', 'harga promo', 'selling price'
  ],
  originalPrice: [
    'harga asli', 'harga coret', 'original price', 'harga normal', 'harga sebelum diskon',
    'harga coret shopee', 'normal price', 'regular price'
  ],
  discount: [
    'diskon', 'discount', 'potongan', 'potongan harga', 'diskon nominal', 'diskon (%)'
  ],
  stock: [
    'stok', 'stok *', 'stock', 'total stok', 'jumlah stok', 'stok variasi',
    'variant stock', 'quantity', 'qty', 'stok tersedia', 'stock quantity'
  ],
  weight: [
    'berat', 'berat paket', 'berat (kg)', 'berat(kg)', 'berat (g)', 'berat (gram)',
    'berat(g)', 'weight', 'weight (kg)', 'weight (g)', 'package weight', 'berat produk'
  ],
  length: [
    'panjang paket', 'panjang (cm)', 'panjang(cm)', 'panjang', 'length', 'length (cm)', 'package length'
  ],
  width: [
    'lebar paket', 'lebar (cm)', 'lebar(cm)', 'lebar', 'width', 'width (cm)', 'package width'
  ],
  height: [
    'tinggi paket', 'tinggi (cm)', 'tinggi(cm)', 'tinggi', 'height', 'height (cm)', 'package height'
  ],
  coverImage: [
    'foto sampul', 'gambar sampul', 'foto utama', 'gambar utama', 'cover image',
    'main image', 'foto produk 1', 'foto 1', 'gambar 1', 'image 1', 'main_image'
  ],
  imagesAll: [
    'images', 'gambar', 'foto', 'foto produk', 'daftar foto', 'image list', 'product images'
  ],
  variation1Name: [
    'nama variasi 1', 'nama variasi', 'variation 1 name', 'tier 1 name', 'variasi 1',
    'tipe variasi 1', 'nama varian 1', 'variasi warna', 'variation 1'
  ],
  variation1Option: [
    'opsi untuk variasi 1', 'opsi variasi 1', 'opsi variasi', 'variation 1 option',
    'tier 1 option', 'nilai variasi 1', 'pilihan variasi 1', 'pilihan variasi',
    'warna', 'color', 'variation 1 value', 'opsi varian 1'
  ],
  variation1Image: [
    'gambar variasi', 'gambar variasi 1', 'foto variasi 1', 'foto variasi',
    'variation image', 'variation 1 image', 'foto varian', 'gambar varian',
    'variation_image', 'variant image'
  ],
  variation2Name: [
    'nama variasi 2', 'variation 2 name', 'tier 2 name', 'variasi 2',
    'tipe variasi 2', 'nama varian 2', 'variasi ukuran', 'variation 2'
  ],
  variation2Option: [
    'opsi untuk variasi 2', 'opsi variasi 2', 'variation 2 option', 'tier 2 option',
    'nilai variasi 2', 'pilihan variasi 2', 'ukuran', 'size', 'variation 2 value', 'opsi varian 2'
  ],
  sourceUrl: [
    'link sumber produk', 'tautan produk', 'link sumber', 'link shopee', 'link tiktok',
    'source url', 'product url', 'url produk', 'url sumber', 'link', 'url'
  ],
  category: [
    'kategori', 'kategori produk', 'category', 'category name', 'nama kategori', 'kategori shopee'
  ],
  material: [
    'bahan material', 'bahan', 'material', 'fabric', 'jenis bahan'
  ]
};

/**
 * Detect the optimal header row in a raw 2D sheet array.
 * Scans rows 0 through 15 to find the row with the highest concentration of product column keywords.
 * Essential for BigSeller / Shopee export files that often contain banner/tips/category notes in row 1-3.
 */
function findOptimalHeaderRow(matrix: any[][]): { headerRowIndex: number; score: number } {
  const KEYWORDS = [
    'nama', 'produk', 'product', 'title', 'sku', 'harga', 'price', 'stok',
    'stock', 'variasi', 'variation', 'deskripsi', 'description', 'foto',
    'gambar', 'image', 'berat', 'weight', 'opsi', 'option', 'kategori'
  ];

  let bestIndex = 0;
  let maxScore = 0;

  const maxScanRows = Math.min(matrix.length, 16);
  for (let r = 0; r < maxScanRows; r++) {
    const row = matrix[r];
    if (!Array.isArray(row)) continue;

    let score = 0;
    for (const cell of row) {
      if (!cell) continue;
      const cellLower = String(cell).toLowerCase().trim();
      for (const kw of KEYWORDS) {
        if (cellLower.includes(kw)) {
          score++;
          break; // Count each cell once
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestIndex = r;
    }
  }

  // If score >= 2, we found a genuine header row
  return {
    headerRowIndex: maxScore >= 2 ? bestIndex : 0,
    score: maxScore
  };
}

/**
 * Normalizes a raw string key by stripping asterisks, brackets, and extra spaces
 */
function normalizeColumnKey(rawKey: string): string {
  return (rawKey || '')
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/\(wajib\)/g, '')
    .replace(/\(opsional\)/g, '')
    .replace(/\(optional\)/g, '')
    .replace(/[:_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * BigSeller-Accurate Excel Workbook Parser
 * 100% precision support for:
 * 1. BigSeller Shopee Draft / Mass Upload Template (Multi-row variant rows grouped by SKU Induk or blank Product Name)
 * 2. BigSeller Scraped Products Export (Single-row with comma/semicolon variations)
 * 3. BigSeller Master Product List (Produk Master ERP)
 * 4. saena.id Native Boutique Template (.xlsx / .xls / .csv)
 */
export function parseExcelWorkbook(data: ArrayBuffer): {
  products: ParsedExcelProduct[];
  totalRows: number;
  validCount: number;
  errorCount: number;
} {
  const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
  
  // Find best worksheet: prioritize sheets named 'Produk', 'Product', 'Shopee', 'Katalog', or fallback to first
  let selectedSheetName = workbook.SheetNames[0];
  for (const name of workbook.SheetNames) {
    const lower = name.toLowerCase();
    if (lower.includes('produk') || lower.includes('product') || lower.includes('shopee') || lower.includes('daftar') || lower.includes('katalog') || lower.includes('draft')) {
      selectedSheetName = name;
      break;
    }
  }

  if (!selectedSheetName) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
  }

  const worksheet = workbook.Sheets[selectedSheetName];
  
  // Convert worksheet to raw 2D array of rows
  const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false
  });

  if (!rawMatrix || rawMatrix.length === 0) {
    throw new Error('File Excel tidak berisi data.');
  }

  // Detect header row index
  const { headerRowIndex } = findOptimalHeaderRow(rawMatrix);
  const rawHeaders: string[] = (rawMatrix[headerRowIndex] || []).map(h => String(h ?? '').trim());

  if (rawHeaders.filter(Boolean).length === 0) {
    throw new Error('Header kolom tidak ditemukan pada file Excel.');
  }

  // Build mapping from Column Index -> Canonical Field
  const colIndexToCanonical: Record<number, string> = {};
  const colIndexToRawHeader: Record<number, string> = {};

  rawHeaders.forEach((rawCol, idx) => {
    colIndexToRawHeader[idx] = rawCol;
    const norm = normalizeColumnKey(rawCol);
    if (!norm) return;

    // Check specific numbered images like "foto produk 1", "image 1", "gambar 2"
    const photoNumMatch = norm.match(/(?:foto|gambar|image)\s*(?:produk)?\s*(\d+)/);
    if (photoNumMatch) {
      colIndexToCanonical[idx] = `galleryPhoto_${photoNumMatch[1]}`;
      return;
    }

    // Check specific numbered variant images like "gambar variasi 1", "foto variasi 2"
    const varImgMatch = norm.match(/(?:gambar|foto)\s*variasi\s*(\d+)/);
    if (varImgMatch) {
      colIndexToCanonical[idx] = `variantImage_${varImgMatch[1]}`;
      return;
    }

    // Match against known canonical dictionary
    let matched = false;
    for (const [canonicalField, aliases] of Object.entries(CANONICAL_FIELD_ALIASES)) {
      if (aliases.some(alias => norm === alias || norm.replace(/\s+/g, '') === alias.replace(/\s+/g, ''))) {
        colIndexToCanonical[idx] = canonicalField;
        matched = true;
        break;
      }
    }

    // Fuzzy partial match if not exact
    if (!matched) {
      for (const [canonicalField, aliases] of Object.entries(CANONICAL_FIELD_ALIASES)) {
        if (aliases.some(alias => norm.includes(alias) || alias.includes(norm))) {
          colIndexToCanonical[idx] = canonicalField;
          break;
        }
      }
    }
  });

  // Extract data rows (starting right after headerRowIndex)
  const dataRows = rawMatrix.slice(headerRowIndex + 1);

  // Filter out any instructional rows that some BigSeller templates insert directly below headers
  // (e.g. rows containing "Contoh: ", "Maksimal ", "Wajib diisi", etc.)
  const cleanDataRows = dataRows.filter(row => {
    if (!Array.isArray(row) || row.every(c => String(c ?? '').trim() === '')) return false;
    const firstFewCells = row.slice(0, 4).map(c => String(c ?? '').toLowerCase().trim()).join(' ');
    if (firstFewCells.includes('contoh:') || firstFewCells.includes('wajib diisi') || firstFewCells.includes('opsional') || firstFewCells.includes('maksimal')) {
      return false;
    }
    return true;
  });

  if (cleanDataRows.length === 0) {
    throw new Error('Tidak ada baris data produk yang ditemukan setelah baris header.');
  }

  // Row helper: extracts field values from a raw row array
  const extractRowFields = (row: any[]) => {
    const fields: Record<string, string> = {};
    const galleryPhotos: string[] = [];
    const numberedVariantImages: Record<number, string> = {};

    row.forEach((cellVal, idx) => {
      const valStr = String(cellVal ?? '').trim();
      if (!valStr) return;

      const canonical = colIndexToCanonical[idx];
      if (!canonical) {
        // Unmapped column, check if it contains HTTP URLs
        if (/^https?:\/\//i.test(valStr)) {
          galleryPhotos.push(...extractImageUrls(valStr));
        }
        return;
      }

      if (canonical.startsWith('galleryPhoto_')) {
        const num = parseInt(canonical.replace('galleryPhoto_', ''), 10);
        galleryPhotos[num - 1] = valStr;
      } else if (canonical.startsWith('variantImage_')) {
        const num = parseInt(canonical.replace('variantImage_', ''), 10);
        numberedVariantImages[num] = valStr;
      } else if (canonical === 'imagesAll') {
        galleryPhotos.push(...extractImageUrls(valStr));
      } else {
        // If not already set, assign
        if (!fields[canonical]) {
          fields[canonical] = valStr;
        }
      }
    });

    return {
      fields,
      galleryPhotos: galleryPhotos.filter(Boolean),
      numberedVariantImages
    };
  };

  /**
   * Temporary Accumulator for products.
   * Enables seamless grouping of BigSeller multi-row products (where 1 product with 3 colors = 3 consecutive rows).
   */
  interface ProductAccumulator {
    rowIndex: number;
    parentSku: string;
    name: string;
    description: string;
    shortDescription?: string;
    sourceUrl?: string;
    categoryText: string;
    materialText: string;
    price: number;
    originalPrice: number;
    discount?: number;
    currency: string;
    weight: number;
    dimensions: { length: number; width: number; height: number };
    sku: string;
    images: string[];
    // Variations accumulated
    variantRows: Array<{
      colorName: string;
      sizeName: string;
      price: number;
      stock: number;
      sku: string;
      imageUrl?: string;
    }>;
  }

  const accumulators: ProductAccumulator[] = [];
  let currentAcc: ProductAccumulator | null = null;

  cleanDataRows.forEach((row, rowIdx) => {
    const { fields, galleryPhotos, numberedVariantImages } = extractRowFields(row);

    const rowName = fields.name || '';
    const rowParentSku = fields.parentSku || '';
    const rowVariantSku = fields.variantSku || '';
    const rowVar1Option = fields.variation1Option || '';
    const rowVar2Option = fields.variation2Option || '';
    const rowVar1Name = fields.variation1Name || '';
    const rowVar2Name = fields.variation2Name || '';
    const rowVar1Img = fields.variation1Image || '';

    // Check if this row is a continuation / child variant of the current product
    const isChildRow = currentAcc !== null && (
      // 1. Same non-empty Parent SKU
      (rowParentSku && currentAcc.parentSku && rowParentSku === currentAcc.parentSku) ||
      // 2. Empty product name, but has variant option or SKU or price
      (!rowName && (rowVar1Option || rowVar2Option || rowVariantSku || fields.price)) ||
      // 3. Exactly identical product name with different variation options
      (rowName && rowName.toLowerCase() === currentAcc.name.toLowerCase() && (rowVar1Option || rowVar2Option))
    );

    if (isChildRow && currentAcc) {
      // Accumulate into existing product
      // Collect new gallery photos
      galleryPhotos.forEach(img => {
        if (!currentAcc!.images.includes(img)) currentAcc!.images.push(img);
      });

      // Price & stock for this variant
      const vPrice = cleanNumericValue(fields.price, currentAcc.price);
      const vStock = Math.max(1, Math.round(cleanNumericValue(fields.stock, 10)));

      // Determine which variation is Color and which is Size
      let colorOpt = rowVar1Option;
      let sizeOpt = rowVar2Option;
      if (rowVar1Name.toLowerCase().includes('size') || rowVar1Name.toLowerCase().includes('ukuran')) {
        colorOpt = rowVar2Option;
        sizeOpt = rowVar1Option;
      }

      currentAcc.variantRows.push({
        colorName: colorOpt || '',
        sizeName: sizeOpt || '',
        price: vPrice,
        stock: vStock,
        sku: rowVariantSku,
        imageUrl: rowVar1Img || undefined
      });
    } else {
      // Start a NEW product accumulator
      if (currentAcc) {
        accumulators.push(currentAcc);
      }

      const price = cleanNumericValue(fields.price, 0);
      const originalPriceVal = cleanNumericValue(fields.originalPrice, 0);
      const discountVal = cleanNumericValue(fields.discount, 0);
      
      let calculatedOriginal = price;
      if (originalPriceVal > price) {
        calculatedOriginal = originalPriceVal;
      } else if (discountVal > 0) {
        if (discountVal < 100) {
          calculatedOriginal = Math.round(price / (1 - discountVal / 100) / 5000) * 5000;
        } else {
          calculatedOriginal = price + discountVal;
        }
      } else {
        calculatedOriginal = Math.round(price * 1.15 / 5000) * 5000;
      }

      // Weight conversion: If weight < 10 (e.g. 0.45 or 1.2), it's in KG, convert to Grams (450g / 1200g)
      let rawWeight = cleanNumericValue(fields.weight, 450);
      if (rawWeight > 0 && rawWeight < 10) {
        rawWeight = Math.round(rawWeight * 1000);
      }

      const initialImages: string[] = [];
      if (fields.coverImage && /^https?:\/\//i.test(fields.coverImage)) {
        initialImages.push(fields.coverImage);
      }
      galleryPhotos.forEach(img => {
        if (!initialImages.includes(img)) initialImages.push(img);
      });

      // Initial variant
      let colorOpt = rowVar1Option;
      let sizeOpt = rowVar2Option;
      if (rowVar1Name.toLowerCase().includes('size') || rowVar1Name.toLowerCase().includes('ukuran')) {
        colorOpt = rowVar2Option;
        sizeOpt = rowVar1Option;
      }

      const initialStock = Math.max(1, Math.round(cleanNumericValue(fields.stock, 20)));

      currentAcc = {
        rowIndex: headerRowIndex + 2 + rowIdx,
        parentSku: rowParentSku,
        name: rowName,
        description: fields.description || '',
        shortDescription: fields.shortDescription || undefined,
        sourceUrl: fields.sourceUrl || undefined,
        categoryText: fields.category || '',
        materialText: fields.material || '',
        price,
        originalPrice: calculatedOriginal,
        discount: discountVal > 0 ? discountVal : undefined,
        currency: 'IDR',
        weight: rawWeight || 450,
        dimensions: {
          length: cleanNumericValue(fields.length, 25),
          width: cleanNumericValue(fields.width, 20),
          height: cleanNumericValue(fields.height, 4)
        },
        sku: rowParentSku || rowVariantSku || `SAENA-${Date.now().toString().slice(-4)}-${rowIdx + 1}`,
        images: initialImages,
        variantRows: [
          {
            colorName: colorOpt || '',
            sizeName: sizeOpt || '',
            price,
            stock: initialStock,
            sku: rowVariantSku,
            imageUrl: rowVar1Img || numberedVariantImages[1] || undefined
          }
        ]
      };
    }
  });

  // Push final accumulator
  if (currentAcc) {
    accumulators.push(currentAcc);
  }

  // Convert ProductAccumulators to standard ParsedExcelProduct array
  const parsedProducts: ParsedExcelProduct[] = accumulators.map((acc, idx) => {
    const errors: string[] = [];

    // Validation
    const productName = acc.name.trim();
    if (!productName) {
      errors.push('Nama Produk tidak boleh kosong.');
    }
    if (acc.price <= 0) {
      errors.push('Harga produk harus berupa angka valid lebih dari 0.');
    }

    const description = acc.description || acc.shortDescription || 'Koleksi busana muslimah eksklusif saena.id dengan cutting premium berkelas.';
    const category = detectCategoryFromText(productName + ' ' + acc.categoryText + ' ' + description);

    // Process Variants
    // Check if variations are single-row comma/semicolon delimited vs multi-row accumulated
    let colorNames: string[] = [];
    let sizeNames: string[] = [];
    const colorImagesMap: Record<string, string> = {};
    const stockMap: Record<string, number> = {};

    const splitOps = (val: string) => val.split(/[,;\n\/|]+/).map(s => s.trim()).filter(Boolean);

    // If there is only 1 variantRow and its colorName has commas/semicolons, split it
    if (acc.variantRows.length === 1 && /[,;\n\/|]/.test(acc.variantRows[0].colorName)) {
      colorNames = splitOps(acc.variantRows[0].colorName);
      if (acc.variantRows[0].sizeName) {
        sizeNames = splitOps(acc.variantRows[0].sizeName);
      }
      const stockPerColor = Math.max(1, Math.floor(acc.variantRows[0].stock / Math.max(1, colorNames.length)));
      colorNames.forEach((cName) => {
        stockMap[cName] = stockPerColor;
      });
    } else {
      // Multiple variant rows (BigSeller multi-row format)
      acc.variantRows.forEach(vr => {
        if (vr.colorName) {
          if (!colorNames.includes(vr.colorName)) {
            colorNames.push(vr.colorName);
          }
          if (vr.imageUrl && !colorImagesMap[vr.colorName]) {
            colorImagesMap[vr.colorName] = vr.imageUrl;
          }
          stockMap[vr.colorName] = (stockMap[vr.colorName] || 0) + vr.stock;
        }

        if (vr.sizeName) {
          const sSplits = splitOps(vr.sizeName);
          sSplits.forEach(sz => {
            if (!sizeNames.includes(sz)) sizeNames.push(sz);
          });
        }
      });
    }

    // Fallbacks if no color or size specified
    if (colorNames.length === 0) {
      colorNames = ['Emerald Forest', 'Champagne Taupe'];
      stockMap['Emerald Forest'] = Math.max(5, Math.floor(acc.variantRows[0]?.stock || 20) / 2);
      stockMap['Champagne Taupe'] = Math.max(5, Math.floor(acc.variantRows[0]?.stock || 20) / 2);
    }
    if (sizeNames.length === 0) {
      sizeNames = ['All Size', 'M', 'L', 'XL'];
    }

    // Build ProductColor array
    const colors: ProductColor[] = colorNames.map((cName, cIdx) => {
      const hex = detectColorHex(cName, cIdx);
      const boundVariantImg = colorImagesMap[cName];
      const galleryImg = acc.images[cIdx] || CURATED_FALLBACK_IMAGES[cIdx % CURATED_FALLBACK_IMAGES.length];
      const finalImg = boundVariantImg || galleryImg;

      return {
        name: cName,
        hex,
        stock: stockMap[cName] || 10,
        image: finalImg
      };
    });

    // Ensure images has at least 1 image
    const finalImages = [...acc.images];
    colors.forEach(c => {
      if (c.image && !finalImages.includes(c.image)) {
        finalImages.push(c.image);
      }
    });
    if (finalImages.length === 0) {
      finalImages.push(CURATED_FALLBACK_IMAGES[idx % CURATED_FALLBACK_IMAGES.length]);
    }

    const totalStock = Object.values(stockMap).reduce((sum, val) => sum + val, 0);

    return {
      rowIndex: acc.rowIndex,
      name: productName,
      category,
      price: acc.price,
      originalPrice: acc.originalPrice,
      discount: acc.discount,
      currency: acc.currency,
      description,
      shortDescription: acc.shortDescription,
      sourceUrl: acc.sourceUrl,
      sku: acc.sku,
      weight: acc.weight,
      dimensions: acc.dimensions,
      material: acc.materialText || 'Mulberry Silk & Ceruty Babydoll Premium',
      careInstructions: [
        'Cuci dengan tangan suhu air normal',
        'Gunakan deterjen cair lembut khusus kain sutra/abaya',
        'Keringkan di tempat teduh tanpa paparan terik matahari langsung',
        'Setrika suhu rendah atau gunakan garment steamer'
      ],
      features: [
        'Busui Friendly (Aksen bukaan zipper depan rapi)',
        'Wudhu Friendly (Manset elastis nyaman)',
        'Bahan adem, drape jatuh mewah, dan tidak terawang',
        'Jahitan rapi standar butik halus tasikmalaya'
      ],
      sizes: sizeNames,
      colors,
      stock: stockMap,
      totalStock: totalStock > 0 ? totalStock : 20,
      images: finalImages,
      isValid: errors.length === 0,
      errors
    };
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

/**
 * Export products to Excel .xlsx file format compatible with BigSeller and the boutique catalog
 */
export function exportProductsToExcel(products: any[], filename = 'katalog-saena-bigseller.xlsx') {
  try {
    const rows = products.map((p, idx) => {
      const colors = p.colors || [];
      const images = p.images || [];

      const row: Record<string, any> = {
        'Nama Produk': p.name || '',
        'Kategori': p.category || 'abaya-gamis',
        'Harga': p.price || 0,
        'Harga Coret': p.originalPrice || 0,
        'Bahan Material': p.material || '',
        'Deskripsi Panjang': p.description || '',
        'SKU Induk': p.sku || `SAENA-${idx + 1}`,
        'Link Sumber Produk': p.sourceUrl || '',
        'Ukuran': (p.sizes || []).join(', '),
        'Total Stok': p.totalStock || (colors.reduce((sum: number, c: any) => sum + (Number(c.stock) || 10), 0)),
        'Nama Variasi 1': 'Warna',
        'Opsi Variasi 1': colors.map((c: any) => c.name).join(', '),
        'Foto Sampul': images[0] || (colors[0]?.image || ''),
        'Foto Produk 1': images[0] || '',
        'Foto Produk 2': images[1] || '',
        'Foto Produk 3': images[2] || '',
        'Berat (g)': p.weight || 450
      };

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Katalog Produk');
    XLSX.writeFile(workbook, filename);
    return true;
  } catch (err) {
    console.error('Error exporting products to Excel:', err);
    return false;
  }
}
