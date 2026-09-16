/**
 * Utilities for image handling, compression, and clean product image sanitization
 */

export interface ColorPresetImage {
  id: string;
  name: string;
  colorTone: string;
  hex: string;
  url: string;
}

export const FALLBACK_PRODUCT_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none"><rect width="600" height="800" fill="%23F7F3EE"/><rect x="24" y="24" width="552" height="752" rx="16" stroke="%23E5DDD0" stroke-width="2" stroke-dasharray="8 8"/><circle cx="300" cy="360" r="54" fill="%23EFE9E0"/><path d="M300 325c-8 0-14 6-14 13 0 5 3 9 7 11l-38 26c-3 2-4 5-3 8 1 3 4 5 7 5h92c3 0 6-2 7-5 1-3 0-6-3-8l-38-26c4-2 7-6 7-11 0-7-6-13-14-13z" fill="%231C3B2B"/><text x="300" y="450" font-family="serif" font-size="22" font-weight="bold" fill="%231C3B2B" text-anchor="middle" letter-spacing="2">SAENA.ID</text><text x="300" y="475" font-family="sans-serif" font-size="12" fill="%238C8275" text-anchor="middle" letter-spacing="1">BUSANA MUSLIMAH EKSKLUSIF</text><text x="300" y="510" font-family="sans-serif" font-size="11" fill="%23B5A998" text-anchor="middle">Foto Produk Belum Diunggah</text></svg>`;

export const BANNED_DUMMY_IMAGE_PATTERNS = [
  'photo-1567401893414', // clothes rack
  'photo-1620799140408', // dark shirt
  'photo-1610030469983', // sari
  'photo-1596755094514', // woman in white outdoors
  'photo-1584917865442', // red handbag
  'photo-1594938298603', // man in blue suit
  'photo-1583391733956', // generic model
  'photo-1515886657613',
  'photo-1490481651871',
  'photo-1611591475819',
  'photo-1535632066927',
  'photo-1602810318383',
  'photo-1618354691373',
  'photo-1539109136881',
  'photo-1518895949257',
  'photo-1496747611176',
  'photo-1572804013309'
];

export function isBannedDummyImage(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return BANNED_DUMMY_IMAGE_PATTERNS.some(pat => url.includes(pat));
}

export function sanitizeProductImageList(images: (string | undefined | null)[] | undefined): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images
    .filter((img): img is string => typeof img === 'string' && img.trim().length > 0 && !isBannedDummyImage(img));
}

export const CURATED_COLOR_PRESETS: ColorPresetImage[] = [
  {
    id: 'preset-emerald',
    name: 'Emerald Forest Silk',
    colorTone: 'Emerald / Hijau Botol',
    hex: '#1C3B2B',
    url: FALLBACK_PRODUCT_IMAGE
  },
  {
    id: 'preset-taupe',
    name: 'Champagne Taupe Mocca',
    colorTone: 'Champagne / Taupe / Mocca',
    hex: '#9E866C',
    url: FALLBACK_PRODUCT_IMAGE
  },
  {
    id: 'preset-onyx',
    name: 'Midnight Onyx Black',
    colorTone: 'Midnight Onyx / Jet Black',
    hex: '#1A1A1A',
    url: FALLBACK_PRODUCT_IMAGE
  },
  {
    id: 'preset-mauve',
    name: 'Dusty Mauve Lilac',
    colorTone: 'Dusty Mauve / Lilac Pink',
    hex: '#A37081',
    url: FALLBACK_PRODUCT_IMAGE
  },
  {
    id: 'preset-sage',
    name: 'Soft Sage Mint',
    colorTone: 'Sage Mint / Hijau Lembut',
    hex: '#7A8B7B',
    url: FALLBACK_PRODUCT_IMAGE
  },
  {
    id: 'preset-white',
    name: 'Pure White Silk',
    colorTone: 'Pure White / Off White',
    hex: '#F5F5F0',
    url: FALLBACK_PRODUCT_IMAGE
  }
];

/**
 * Compresses an uploaded image file on the client using HTML5 Canvas
 * and returns a standard Base64 Data URL string suitable for direct Firestore storage.
 */
export async function compressAndEncodeImage(file: File, maxWidth = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar (JPG, PNG, WEBP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memproses data gambar.'));
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Scale down if larger than maxWidth
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to original raw base64
            resolve(event.target?.result as string);
            return;
          }

          // Use smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Output as standard JPEG base64 Data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('Canvas compression error, falling back to raw data URL:', err);
          resolve(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
