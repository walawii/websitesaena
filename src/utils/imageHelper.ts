/**
 * Utilities for image handling, compression, and curated Muslimah fashion presets
 */

export interface ColorPresetImage {
  id: string;
  name: string;
  colorTone: string;
  hex: string;
  url: string;
}

export const CURATED_COLOR_PRESETS: ColorPresetImage[] = [
  {
    id: 'preset-emerald',
    name: 'Emerald Forest Silk Abaya',
    colorTone: 'Emerald / Hijau Botol',
    hex: '#1C3B2B',
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'preset-taupe',
    name: 'Champagne Taupe Mocca Pashmina',
    colorTone: 'Champagne / Taupe / Mocca',
    hex: '#9E866C',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'preset-onyx',
    name: 'Midnight Onyx Black Gamis',
    colorTone: 'Midnight Onyx / Jet Black',
    hex: '#1A1A1A',
    url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'preset-mauve',
    name: 'Dusty Mauve Lilac Kaftan',
    colorTone: 'Dusty Mauve / Lilac Pink',
    hex: '#A37081',
    url: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'preset-sage',
    name: 'Soft Sage Mint Floral',
    colorTone: 'Sage Mint / Hijau Lembut',
    hex: '#7A8B7B',
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'preset-white',
    name: 'Pure White Silk Mukena',
    colorTone: 'Pure White / Off White',
    hex: '#F5F5F0',
    url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'preset-sand',
    name: 'Sand Beige Kurta Linen',
    colorTone: 'Sand Beige / Cream Nude',
    hex: '#D2B48C',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'preset-navy',
    name: 'Royal Navy Stone Kurta',
    colorTone: 'Navy Blue / Biru Dongker',
    hex: '#1B2A4A',
    url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'preset-caramel',
    name: 'Caramel Macchiato Tiered Dress',
    colorTone: 'Caramel / Terakota / Brown',
    hex: '#A0522D',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'preset-olive',
    name: 'Olive Moss Textured Crinkle',
    colorTone: 'Olive Moss / Hijau Lumut',
    hex: '#556B2F',
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'preset-gold',
    name: 'Ottoman Vintage Gold Brooch Set',
    colorTone: 'Gold / Emas Antik',
    hex: '#C5A059',
    url: 'https://images.unsplash.com/photo-1611591475819-20f78c857731?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'preset-platinum',
    name: 'Silver Platinum Brooch Pin',
    colorTone: 'Silver / Perak',
    hex: '#E5E5E5',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop'
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
