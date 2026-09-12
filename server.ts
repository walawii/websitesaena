import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Curated high quality presets for fallback images & colors
const DEFAULT_PRESET_COLORS = [
  {
    name: 'Emerald Forest',
    hex: '#1C3B2B',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Champagne Taupe',
    hex: '#9E866C',
    stock: 12,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Midnight Onyx',
    hex: '#1A1A1A',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Dusty Mauve',
    hex: '#A37081',
    stock: 8,
    image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop'
  }
];

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Helper to determine platform
function detectPlatform(urlStr: string): 'shopee' | 'tiktok' | 'other' {
  const lower = urlStr.toLowerCase();
  if (lower.includes('shopee') || lower.includes('shope.ee')) {
    return 'shopee';
  }
  if (lower.includes('tiktok') || lower.includes('douyin')) {
    return 'tiktok';
  }
  return 'other';
}

// Clean and extract basic info from HTML
function extractMetadataFromHtml(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  const priceMatch = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i);

  // Extract all img tags with http/https src
  const imgMatches = Array.from(html.matchAll(/<img[^>]*src=["'](https?:\/\/[^"'\s>]+)["']/gi))
    .map(m => m[1])
    .filter(url => !url.includes('svg') && !url.includes('icon') && !url.includes('avatar') && !url.includes('logo'))
    .slice(0, 8);

  return {
    title: (ogTitleMatch?.[1] || titleMatch?.[1] || '').trim(),
    description: (ogDescMatch?.[1] || metaDescMatch?.[1] || '').trim(),
    image: ogImageMatch?.[1] || imgMatches[0] || '',
    images: imgMatches,
    priceStr: priceMatch?.[1] || ''
  };
}

// Helper to sanitize title extracted from Shopee / TikTok
function cleanMarketplaceTitle(rawTitle: string): string {
  let clean = rawTitle
    .replace(/^Jual\s+/i, '')
    .replace(/\|\s*Shopee\s*Indonesia/gi, '')
    .replace(/\|\s*TikTok/gi, '')
    .replace(/\|\s*Tokopedia/gi, '')
    .replace(/Shopee\s*Indonesia/gi, '')
    .replace(/TikTok\s*Shop/gi, '')
    .replace(/\[COD\]/gi, '')
    .replace(/\[TERLARIS\]/gi, '')
    .replace(/\[ORIGINAL\]/gi, '')
    .replace(/\[PROMO\]/gi, '')
    .replace(/TERMURAH/gi, '')
    .replace(/GROSIR/gi, '')
    .replace(/TERBARU\s*\d{4}/gi, '')
    .replace(/\b(MURAH|ORI|BEST SELLER|REAL PICT|GARANSI|DISKON)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If title still has trailing dash or pipe
  clean = clean.replace(/[-|–]\s*$/, '').trim();
  return clean || 'Busana Muslimah Saena Premium';
}

// Fallback heuristic categorizer
function categorizeFromText(text: string): 'abaya-gamis' | 'hijab-pashmina' | 'dress-kaftan' | 'koko-kurta' | 'mukena-silk' | 'aksesoris' {
  const lower = text.toLowerCase();
  if (lower.includes('hijab') || lower.includes('pashmina') || lower.includes('khimar') || lower.includes('bergo') || lower.includes('segi empat') || lower.includes('jilbab')) {
    return 'hijab-pashmina';
  }
  if (lower.includes('mukena') || lower.includes('rukuh') || lower.includes('telekung')) {
    return 'mukena-silk';
  }
  if (lower.includes('koko') || lower.includes('kurta') || lower.includes('pria') || lower.includes('kemko')) {
    return 'koko-kurta';
  }
  if (lower.includes('kaftan') || lower.includes('dress') || lower.includes('tunik')) {
    return 'dress-kaftan';
  }
  if (lower.includes('bros') || lower.includes('brooch') || lower.includes('pin') || lower.includes('manset') || lower.includes('inner') || lower.includes('ciput') || lower.includes('tuspin')) {
    return 'aksesoris';
  }
  return 'abaya-gamis';
}

// Fallback price estimator based on category
function estimatePrice(category: string): number {
  switch (category) {
    case 'hijab-pashmina':
      return 89000;
    case 'mukena-silk':
      return 349000;
    case 'koko-kurta':
      return 275000;
    case 'dress-kaftan':
      return 389000;
    case 'aksesoris':
      return 65000;
    case 'abaya-gamis':
    default:
      return 465000;
  }
}

// API Route: POST /api/import-marketplace
app.post('/api/import-marketplace', async (req, res) => {
  const { url, rawText } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL produk marketplace wajib diisi.' });
  }

  const trimmedUrl = url.trim();
  const platform = detectPlatform(trimmedUrl);

  try {
    let fetchedHtml = '';
    let finalUrl = trimmedUrl;
    let extractedMeta = {
      title: '',
      description: '',
      image: '',
      images: [] as string[],
      priceStr: ''
    };

    // Attempt to fetch URL with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(trimmedUrl, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });

      clearTimeout(timeoutId);
      finalUrl = response.url || trimmedUrl;

      if (response.ok) {
        fetchedHtml = await response.text();
        extractedMeta = extractMetadataFromHtml(fetchedHtml);
      }
    } catch (fetchErr) {
      console.warn('Marketplace fetch notice (proceeding with URL analysis):', fetchErr);
    }

    // Try URL slug parsing if title not found in HTML
    if (!extractedMeta.title) {
      try {
        const parsedUrl = new URL(finalUrl);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
        const lastSegment = pathSegments[pathSegments.length - 1] || '';
        const decodedSlug = decodeURIComponent(lastSegment)
          .replace(/[-_]+/g, ' ')
          .replace(/\.html?$/i, '')
          .replace(/i\.\d+\.\d+/gi, '')
          .replace(/[?#].*$/, '')
          .trim();
        if (decodedSlug.length > 5) {
          extractedMeta.title = decodedSlug;
        }
      } catch {
        // Ignore URL parsing errors
      }
    }

    // Gather available text context for AI or fallback
    const combinedContext = [
      `Source URL: ${finalUrl}`,
      `Platform: ${platform}`,
      extractedMeta.title ? `Page Title: ${extractedMeta.title}` : '',
      extractedMeta.description ? `Meta Description: ${extractedMeta.description}` : '',
      rawText ? `Additional Notes / Raw Text: ${rawText}` : '',
      extractedMeta.priceStr ? `Price Tag: ${extractedMeta.priceStr}` : ''
    ].filter(Boolean).join('\n');

    const ai = getGenAI();

    if (ai) {
      try {
        const prompt = `
Anda adalah kurator busana muslimah butik mewah dan elegan untuk brand 'saena.id'.
Analisis data produk dari tautan marketplace (${platform.toUpperCase()}) berikut, lalu ekstrak dan ubah menjadi data katalog busana muslimah eksklusif saena.id dalam format JSON terstruktur.

Konteks Produk:
${combinedContext}

Aturan Penyesuaian Busana:
1. 'name': Bersihkan dari kata-kata spam marketplace (seperti "TERMURAH", "ORIGINAL 100%", "COD", "GROSIR", "MURAH MERIAH"). Buat nama busana yang anggun, indah, dan berkelas butik (contoh: "Zafira Silk Abaya Bordir Emas", "Madina Crinkle Gamis Set Hijab", "Aisha Pashmina Silk Shawl").
2. 'category': Pilih salah satu dari: 'abaya-gamis', 'hijab-pashmina', 'dress-kaftan', 'koko-kurta', 'mukena-silk', 'aksesoris'.
3. 'price': Harga dalam format angka integer Rupiah (IDR). Jika di marketplace ada harga (misal Rp 350.000), gunakan angka tersebut (350000). Jika tidak tercantum, perkirakan harga butik yang wajar.
4. 'originalPrice': Harga coret promo wajar (sedikit lebih tinggi dari price, misal price + 50000 s/d 100000).
5. 'material': Nama bahan mewah (contoh: 'Arabian Mulberry Silk', 'Ceruty Babydoll Premium', 'Crinkle Airflow Import', 'Armani Silk', 'Linen Rami').
6. 'description': Deskripsi produk yang mendalam, santun, dan puitis khas busana muslim saena.id, menjelaskan kelembutan kain, cutting siluet jatuh mewah, busui friendly (zipper depan), dan wudhu friendly (manset berkancing/karet).
7. 'careInstructions': Array 3-4 tips perawatan pakaian (contoh: ["Cuci dengan tangan suhu air normal", "Gunakan deterjen cair lembut", "Setrika dengan suhu rendah atau gunakan steamer"]).
8. 'features': Array 3-4 keunggulan fitur busana (contoh: ["Busui Friendly (Zipper Depan)", "Wudhu Friendly (Manset Lengan)", "Bahan Adem & Tidak Menerawang", "Jahitan Butik Halus & Rapi"]).
9. 'sizes': Array ukuran yang sesuai (misal: ["All Size", "M", "L", "XL"]).
10. 'colors': Ekstrak varian warna yang terdeteksi dari judul/deskripsi (minimal 2 varian). Tiap varian memiliki 'name' (nama warna anggun seperti 'Emerald Forest', 'Champagne Mocca', 'Midnight Onyx', 'Dusty Mauve', 'Soft Sage', 'Pure White'), 'hex' (kode warna hex CSS yang tepat seperti '#1C3B2B'), 'stock' (jumlah stok awal default antara 10-25 pcs), dan 'image' (URL gambar relevan).
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { 
                  type: Type.STRING,
                  enum: ['abaya-gamis', 'hijab-pashmina', 'dress-kaftan', 'koko-kurta', 'mukena-silk', 'aksesoris']
                },
                price: { type: Type.INTEGER },
                originalPrice: { type: Type.INTEGER },
                material: { type: Type.STRING },
                description: { type: Type.STRING },
                careInstructions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                features: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                sizes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                colors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      hex: { type: Type.STRING },
                      stock: { type: Type.INTEGER },
                      image: { type: Type.STRING }
                    },
                    required: ['name', 'hex', 'stock']
                  }
                }
              },
              required: ['name', 'category', 'price', 'material', 'description', 'colors']
            }
          }
        });

        const jsonText = response.text?.trim();
        if (jsonText) {
          const parsed = JSON.parse(jsonText);

          // Fill in color images with extracted image or presets if missing
          const primaryImage = extractedMeta.image || DEFAULT_PRESET_COLORS[0].image;
          const mappedColors = (parsed.colors || []).map((col: any, idx: number) => {
            const fallbackPreset = DEFAULT_PRESET_COLORS[idx % DEFAULT_PRESET_COLORS.length];
            return {
              name: col.name || fallbackPreset.name,
              hex: col.hex || fallbackPreset.hex,
              stock: Number(col.stock) || 12,
              image: (col.image && col.image.startsWith('http')) 
                ? col.image 
                : (extractedMeta.images[idx] || fallbackPreset.image)
            };
          });

          const productImages = mappedColors.map((c: any) => c.image).filter(Boolean);
          if (primaryImage && !productImages.includes(primaryImage)) {
            productImages.unshift(primaryImage);
          }

          return res.json({
            success: true,
            sourcePlatform: platform,
            sourceUrl: finalUrl,
            extracted: {
              name: parsed.name,
              category: parsed.category || 'abaya-gamis',
              price: Number(parsed.price) || 395000,
              originalPrice: Number(parsed.originalPrice) || (Number(parsed.price) ? Number(parsed.price) + 75000 : 470000),
              material: parsed.material || 'Mulberry Silk & Ceruty Premium',
              description: parsed.description || 'Busana muslimah eksklusif saena.id dengan cutting anggun dan jahitan butik presisi.',
              careInstructions: parsed.careInstructions || [
                'Cuci dengan tangan menggunakan air dingin',
                'Gunakan deterjen khusus pakaian berbahan halus',
                'Keringkan di tempat teduh tanpa sinar matahari langsung',
                'Setrika suhu rendah atau gunakan garment steamer'
              ],
              features: parsed.features || [
                'Busui Friendly (Aksen zipper depan)',
                'Wudhu Friendly (Manset elastis fleksibel)',
                'Bahan jatuh mewah & tidak terawang',
                'Jahitan standar butik halus'
              ],
              sizes: parsed.sizes && parsed.sizes.length > 0 ? parsed.sizes : ['All Size', 'M', 'L', 'XL'],
              colors: mappedColors.length > 0 ? mappedColors : DEFAULT_PRESET_COLORS.slice(0, 2),
              images: productImages.length > 0 ? productImages : [DEFAULT_PRESET_COLORS[0].image]
            }
          });
        }
      } catch (geminiError) {
        console.warn('Gemini extraction failed, using heuristic fallback:', geminiError);
      }
    }

    // Heuristic Fallback (Runs if Gemini is absent or encountered an error)
    const cleanedTitle = cleanMarketplaceTitle(extractedMeta.title || rawText || 'Koleksi Busana Muslimah Elegan');
    const category = categorizeFromText(cleanedTitle + ' ' + (rawText || ''));
    const estimatedPrice = estimatePrice(category);
    const primaryImg = extractedMeta.image || DEFAULT_PRESET_COLORS[0].image;

    const fallbackColors = DEFAULT_PRESET_COLORS.slice(0, 3).map((preset, idx) => ({
      name: preset.name,
      hex: preset.hex,
      stock: 15,
      image: extractedMeta.images[idx] || preset.image
    }));

    const allImages = fallbackColors.map(c => c.image);
    if (primaryImg && !allImages.includes(primaryImg)) {
      allImages.unshift(primaryImg);
    }

    return res.json({
      success: true,
      sourcePlatform: platform,
      sourceUrl: finalUrl,
      extracted: {
        name: cleanedTitle,
        category,
        price: estimatedPrice,
        originalPrice: Math.round(estimatedPrice * 1.2 / 5000) * 5000,
        material: 'Premium Ceruty & Silk Touch',
        description: `Koleksi busana syar'i butik saena.id "${cleanedTitle}". Dibuat dengan material premium pilihan yang jatuh anggun, adem, dan sangat nyaman untuk berbagai aktivitas formal maupun silaturahmi keluarga. Dilengkapi fitur bukaan depan (busui friendly) dan pergelangan wudhu friendly.`,
        careInstructions: [
          'Cuci terpisah dengan tangan dan air dingin',
          'Hindari pemutih atau pengering mesin berkecepatan tinggi',
          'Jemur di area teduh berangin',
          'Gunakan setrika uap atau panas rendah'
        ],
        features: [
          'Busui Friendly (Bukaan Zipper Depan)',
          'Wudhu Friendly (Manset Lengan Praktis)',
          'Serat kain halus, flowy, dan breathable',
          'Jahitan rapi standar butik'
        ],
        sizes: ['All Size', 'M', 'L', 'XL'],
        colors: fallbackColors,
        images: allImages
      }
    });

  } catch (error: any) {
    console.error('Marketplace import controller error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Terjadi kesalahan saat memproses tautan marketplace.'
    });
  }
});

// Start Express + Vite Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
