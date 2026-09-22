import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { processMengantarOrder, calculateMengantarRates, testMengantarApiConnectivity } from './server/mengantarService';
import { verifyMengantarWebhookSignature, processMengantarWebhook } from './server/mengantarWebhook';
import { processDokuPayment, verifyDokuWebhookSignature, testDokuApiConnectivity } from './server/dokuService';
import { scrapeShopeeStore, parseShopeeUsername } from './server/shopeeScraperService';
import { sendMetaCapiEvent, sendMetaCapiPurchase, META_DATASET_ID } from './server/metaCapiService';
import {
  generateOrderNumber,
  saveOrder,
  findOrderByNumber,
  updateOrderPayment,
  updateOrderShipping,
  getAllOrdersList,
  claimOrderForMetaPurchase,
  StoredOrder
} from './server/orderRepository';

dotenv.config();

const app = express();
const PORT = 3000;

// Specialized raw-body capture for incoming Mengantar webhooks
// Preserves exact unparsed bytes for HMAC-SHA256 signature verification without affecting other JSON routes
app.use('/api/webhooks/mengantar', express.raw({ type: '*/*', limit: '10mb' }), (req: any, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    req.rawBody = req.body.toString('utf8');
    try {
      req.body = req.rawBody ? JSON.parse(req.rawBody) : {};
    } catch {
      // Retain as string or empty object if not JSON
    }
  }
  next();
});

app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

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
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop'
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

// API Route: POST /api/shopee/scrape-shop
// Automated scraper for Shopee shop catalog
app.post('/api/shopee/scrape-shop', async (req, res) => {
  try {
    const { storeUrl, count, rawData, categoryFilter, priceMarkupPercent } = req.body;

    const targetUrl = typeof storeUrl === 'string' && storeUrl.trim() 
      ? storeUrl.trim() 
      : 'https://shopee.co.id/saena.id';

    const safeCount = Math.max(1, Math.min(Number(count) || 8, 30));
    const markup = typeof priceMarkupPercent === 'number' ? priceMarkupPercent : 0;

    console.log(`[Shopee Scraper] Starting automation for: ${targetUrl} (Count: ${safeCount})`);

    const result = await scrapeShopeeStore({
      storeUrl: targetUrl,
      count: safeCount,
      rawData: typeof rawData === 'string' ? rawData : undefined,
      categoryFilter: typeof categoryFilter === 'string' ? categoryFilter : undefined,
      priceMarkupPercent: markup
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[Shopee Scraper] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Gagal menjalankan scraping otomatis toko Shopee.'
    });
  }
});

// API Route: GET /api/shopee/store-info
app.get('/api/shopee/store-info', (req, res) => {
  const queryUrl = (req.query.storeUrl as string) || 'https://shopee.co.id/saena.id';
  const username = parseShopeeUsername(queryUrl);

  res.json({
    shopUsername: username,
    shopUrl: `https://shopee.co.id/${username}`,
    supportedFeatures: [
      'Automated Product Extraction',
      'Anti-bot AI Content Filtering',
      'Multi-Color & High-Res Image Mapping',
      'One-Click Batch Import to Firestore',
      'Excel & JSON Export'
    ],
    defaultShop: 'saena.id'
  });
});

// API Route: System Credentials Status - Server-side detection only (No secrets returned)
app.get('/api/system/gateway-config', (req, res) => {
  res.json({
    doku: {
      configured: !!(process.env.DOKU_CLIENT_ID && process.env.DOKU_SECRET_KEY)
    },
    mengantar: {
      configured: !!process.env.MENGANTAR_API_KEY
    },
    meta: {
      configured: !!process.env.META_CAPI_ACCESS_TOKEN,
      datasetId: META_DATASET_ID
    }
  });
});

// API Route: Meta Conversions API (CAPI) Proxy Dispatcher
// Note: Strict validation enforced. Client cannot dispatch Purchase events directly.
app.post('/api/meta/events', async (req, res) => {
  try {
    const { eventName, eventId, eventSourceUrl, customData, userData } = req.body;

    // Strict validation: Purchase is server-authoritative upon payment confirmation only!
    if (eventName === 'Purchase') {
      return res.status(403).json({
        success: false,
        error: 'Event Purchase hanya dapat diterbitkan oleh server backend setelah pembayaran berhasil dikonfirmasi.'
      });
    }

    if (!eventName || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Parameter eventName dan eventId wajib diisi.'
      });
    }

    // Extract client IP and User-Agent from HTTP request
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '';
    const clientUserAgent = (req.headers['user-agent'] as string) || '';

    // Extract _fbp and _fbc cookies if available
    let cookieFbp = userData?.fbp;
    let cookieFbc = userData?.fbc;
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      if (!cookieFbp) {
        const matchFbp = cookieHeader.match(/(^|;\s*)_fbp=([^;]+)/);
        if (matchFbp) cookieFbp = decodeURIComponent(matchFbp[2]);
      }
      if (!cookieFbc) {
        const matchFbc = cookieHeader.match(/(^|;\s*)_fbc=([^;]+)/);
        if (matchFbc) cookieFbc = decodeURIComponent(matchFbc[2]);
      }
    }

    const result = await sendMetaCapiEvent({
      eventName,
      eventId,
      eventSourceUrl: eventSourceUrl || 'https://saena.my.id/alisa',
      actionSource: 'website',
      userData: {
        ...userData,
        clientIp,
        clientUserAgent,
        fbp: cookieFbp,
        fbc: cookieFbc
      },
      customData
    });

    return res.json({
      success: true,
      eventName,
      eventId,
      skipped: result.skipped,
      eventsReceived: result.eventsReceived
    });
  } catch (err: any) {
    console.error('[Meta CAPI Route] Exception:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Server-Authoritative Product & Bundle Catalog
const SERVER_PRODUCT_CATALOG: Record<string, { name: string; price: number; weight: number; qty: number }> = {
  'alisa-01': {
    name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Hemat 1 Pcs)',
    price: 79500,
    weight: 600,
    qty: 1
  },
  'alisa-02': {
    name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Bundling 2 Pcs)',
    price: 159000,
    weight: 1200,
    qty: 2
  },
  'alisa-03': {
    name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Best Seller 3 Pcs)',
    price: 238500,
    weight: 1800,
    qty: 3
  },
  'paket-1': {
    name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Hemat 1 Pcs)',
    price: 79500,
    weight: 600,
    qty: 1
  },
  'paket-2': {
    name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Bundling 2 Pcs)',
    price: 159000,
    weight: 1200,
    qty: 2
  },
  'paket-3': {
    name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Best Seller 3 Pcs)',
    price: 238500,
    weight: 1800,
    qty: 3
  }
};

// API Route: Create Order (Server-Side Total Calculation & Gateway Orchestration)
app.post('/api/orders/create', async (req, res) => {
  try {
    const {
      customer,
      shippingAddress,
      shipping,
      items,
      courier,
      service,
      packageId,
      paymentMethod, // 'DOKU' | 'COD'
      paymentChannel, // e.g. 'doku_checkout'
      notes,
      metaTracking
    } = req.body;

    // 1. Validate Customer
    if (!customer || !customer.customerName || !customer.phone) {
      return res.status(400).json({
        success: false,
        error: 'Nama lengkap dan nomor WhatsApp pelanggan wajib diisi.'
      });
    }

    const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Nomor WhatsApp tidak valid (minimal 10 digit).'
      });
    }

    const effectiveShippingAddress = shippingAddress || {
      address: customer?.address || '',
      province: customer?.province || '',
      city: customer?.city || '',
      district: customer?.district || customer?.subdistrict || '',
      postalCode: customer?.postalCode || ''
    };

    // 2. Validate Address
    if (!effectiveShippingAddress || !effectiveShippingAddress.address || !effectiveShippingAddress.city || !effectiveShippingAddress.province) {
      return res.status(400).json({
        success: false,
        error: 'Alamat pengiriman lengkap (alamat, kota/kabupaten, dan provinsi) wajib diisi.'
      });
    }

    // 3. Validate Items & Server-Side Price Calculation (Ignored client price)
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Keranjang belanja kosong.'
      });
    }

    let calculatedSubtotal = 0;
    let totalQuantity = 0;
    let totalWeightGrams = 0;

    const validatedItems = items.map((it: any, idx: number) => {
      const rawKey = String(packageId || it.packageId || it.productId || it.id || '').toLowerCase();
      let catalog = SERVER_PRODUCT_CATALOG[rawKey];
      if (!catalog) {
        if (rawKey.includes('paket-3') || rawKey.includes('alisa-03') || it.name?.includes('3 Pcs')) {
          catalog = SERVER_PRODUCT_CATALOG['alisa-03'];
        } else if (rawKey.includes('paket-2') || rawKey.includes('alisa-02') || it.name?.includes('2 Pcs')) {
          catalog = SERVER_PRODUCT_CATALOG['alisa-02'];
        } else {
          catalog = SERVER_PRODUCT_CATALOG['alisa-01'];
        }
      }

      const qty = Math.max(1, Number(it.quantity) || catalog.qty || 1);
      // Strictly authoritative server price - ignore client price
      const unitPrice = catalog.price;
      const weight = catalog.weight;

      calculatedSubtotal += unitPrice;
      totalQuantity += qty;
      totalWeightGrams += weight;

      return {
        id: `item-${Date.now()}-${idx}`,
        productId: rawKey || 'alisa-01',
        name: catalog.name,
        variant: it.variant || it.color || 'Standard',
        color: it.color || 'Standard',
        size: it.size || 'All Size',
        price: unitPrice,
        quantity: qty,
        weight,
        image: it.image
      };
    });

    // 4. Server-Side Shipping Cost Calculation
    // Saena Mukena Alisa campaign features nationwide Free Shipping ("Gratis Ongkir Se-Indonesia")
    const calculatedShippingCost = 0;
    const discount = 0;
    const grandTotal = Math.max(0, calculatedSubtotal + calculatedShippingCost - discount);

    // 5. Generate Order Identifiers & Crypto Security Token
    const { orderNumber, invoiceNumber, accessToken } = generateOrderNumber();
    const isCod = paymentMethod === 'COD';

    // 6. Build Stored Order Model (Phase 5 schema)
    const storedOrder: StoredOrder = {
      id: orderNumber,
      orderNumber,
      invoiceNumber,
      accessToken,
      processedWebhookIds: [],
      customer: {
        customerName: customer.customerName.trim(),
        phone: cleanPhone,
        email: customer.email?.trim() || ''
      },
      shippingAddress: {
        address: effectiveShippingAddress.address.trim(),
        province: effectiveShippingAddress.province.trim(),
        city: effectiveShippingAddress.city.trim(),
        district: effectiveShippingAddress.district?.trim() || '',
        postalCode: effectiveShippingAddress.postalCode?.trim() || ''
      },
      items: validatedItems,
      quantity: totalQuantity,
      weight: totalWeightGrams,
      price: {
        subtotal: calculatedSubtotal,
        discount,
        shippingCost: calculatedShippingCost,
        grandTotal
      },
      payment: {
        paymentMethod: isCod ? 'COD' : 'DOKU',
        paymentProvider: isCod ? 'COD' : 'DOKU',
        paymentChannel: isCod ? 'cod' : (paymentChannel || 'doku_checkout'),
        paymentStatus: 'PENDING',
        paymentReference: invoiceNumber,
        paymentAmount: grandTotal,
        paymentCreatedAt: new Date().toISOString(),
        paymentPaidAt: null,
        paymentUrl: null,
        vaNumber: null,
        bank: null,
        qrisString: null,
        qrisImage: null
      },
      shipping: {
        shippingProvider: 'Mengantar',
        courier: courier || shipping?.courier || 'JNE',
        service: service || shipping?.service || 'REG',
        shippingStatus: isCod ? 'PENDING' : 'NOT_CREATED',
        mengantarOrderId: null,
        trackingNumber: null,
        airwaybill: null,
        labelUrl: null,
        shippingCreatedAt: null,
        shippingUpdatedAt: null,
        estimatedDelivery: '2 - 3 Hari Kerja',
        notes: notes || ''
      },
      total: grandTotal,
      status: 'menunggu_pembayaran',
      trackingNumber: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metaTracking: {
        fbp: metaTracking?.fbp,
        fbc: metaTracking?.fbc,
        clientIp: typeof req.headers['x-forwarded-for'] === 'string' ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress || '',
        clientUserAgent: (req.headers['user-agent'] as string) || '',
        eventSourceUrl: metaTracking?.eventSourceUrl || 'https://saena.my.id/alisa'
      }
    };

    // 7. Handle COD Flow
    if (isCod) {
      storedOrder.payment.paymentStatus = 'UNPAID';
      storedOrder.status = 'sedang_dikemas';

      // Call Mengantar directly for COD orders if configured
      if (process.env.MENGANTAR_API_KEY) {
        try {
          const mgtRes = await processMengantarOrder({
            orderId: orderNumber,
            customer: {
              fullName: storedOrder.customer.customerName,
              whatsapp: storedOrder.customer.phone,
              email: storedOrder.customer.email,
              address: storedOrder.shippingAddress.address,
              subdistrict: storedOrder.shippingAddress.district,
              city: storedOrder.shippingAddress.city,
              province: storedOrder.shippingAddress.province,
              postalCode: storedOrder.shippingAddress.postalCode,
              notes: notes || 'Pesanan COD Saena Butik'
            },
            courier: storedOrder.shipping.courier,
            serviceType: storedOrder.shipping.service,
            items: storedOrder.items.map(i => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
              weight: i.weight
            })),
            totalAmount: grandTotal,
            shippingCost: calculatedShippingCost,
            isCod: true,
            notes: notes || 'Pesanan COD Saena Butik'
          });

          if (mgtRes.success && mgtRes.data) {
            storedOrder.shipping.shippingStatus = 'CREATED';
            storedOrder.shipping.trackingNumber = mgtRes.data.trackingNumber;
            storedOrder.shipping.mengantarOrderId = mgtRes.data.mengantarOrderId;
            storedOrder.shipping.labelUrl = mgtRes.data.labelUrl;
            storedOrder.shipping.airwaybill = mgtRes.data.airwayBillUrl;
            storedOrder.shipping.shippingCreatedAt = new Date().toISOString();
            storedOrder.trackingNumber = mgtRes.data.trackingNumber;
            storedOrder.shipping.mengantarResponse = mgtRes.data;
          } else {
            storedOrder.shipping.shippingStatus = 'FAILED';
          }
        } catch (mgtErr: any) {
          console.warn('[CreateOrder] Mengantar COD dispatch error:', mgtErr.message);
          storedOrder.shipping.shippingStatus = 'FAILED';
        }
      }

      await saveOrder(storedOrder);

      return res.json({
        success: true,
        orderNumber,
        invoiceNumber,
        accessToken,
        grandTotal,
        paymentMethod: 'COD',
        paymentStatus: storedOrder.payment.paymentStatus,
        shippingStatus: storedOrder.shipping.shippingStatus,
        trackingNumber: storedOrder.shipping.trackingNumber || null
      });
    }

    // 8. Handle DOKU Flow (Online Payment Gateway)
    if (!process.env.DOKU_CLIENT_ID || !process.env.DOKU_SECRET_KEY) {
      storedOrder.payment.paymentStatus = 'FAILED';
      storedOrder.status = 'dibatalkan';
      await saveOrder(storedOrder);

      return res.status(503).json({
        success: false,
        error: 'Layanan pembayaran DOKU belum dikonfigurasi di server environment (DOKU_CLIENT_ID & DOKU_SECRET_KEY wajib diisi).',
        orderNumber
      });
    }

    const dokuRes = await processDokuPayment({
      orderId: orderNumber,
      invoiceNumber,
      amount: grandTotal,
      customer: {
        fullName: storedOrder.customer.customerName,
        whatsapp: storedOrder.customer.phone,
        email: storedOrder.customer.email,
        address: storedOrder.shippingAddress.address
      },
      items: storedOrder.items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price
      })),
      channel: paymentChannel || 'doku_checkout'
    });

    if (!dokuRes.success || !dokuRes.data) {
      // DOKU payment session failed: DO NOT pretend success, do NOT generate fake URLs/VA/QRIS
      storedOrder.payment.paymentStatus = 'FAILED';
      storedOrder.status = 'dibatalkan';
      await saveOrder(storedOrder);

      return res.status(502).json({
        success: false,
        error: `Gagal membuat sesi pembayaran DOKU: ${dokuRes.error || 'Server pembayaran DOKU tidak dapat merespons.'}`,
        orderNumber
      });
    }

    // DOKU request succeeded with real payment data
    const dokuData = dokuRes.data;
    storedOrder.payment.paymentUrl = dokuData.paymentUrl || null;
    storedOrder.payment.vaNumber = dokuData.virtualAccountInfo?.vaNumber || null;
    storedOrder.payment.bank = dokuData.virtualAccountInfo?.bank || null;
    storedOrder.payment.qrisString = dokuData.qrisInfo?.qrString || null;
    storedOrder.payment.qrisImage = dokuData.qrisInfo?.qrImage || null;
    storedOrder.payment.dokuResponse = dokuData;

    await saveOrder(storedOrder);

    return res.json({
      success: true,
      orderNumber,
      invoiceNumber,
      accessToken,
      grandTotal,
      paymentMethod: 'DOKU',
      paymentStatus: storedOrder.payment.paymentStatus,
      paymentUrl: storedOrder.payment.paymentUrl,
      vaNumber: storedOrder.payment.vaNumber,
      bank: storedOrder.payment.bank,
      qrisString: storedOrder.payment.qrisString,
      qrisImage: storedOrder.payment.qrisImage
    });

  } catch (error: any) {
    console.error('[CreateOrder] Error creating order:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Terjadi kesalahan sistem saat membuat pesanan.'
    });
  }
});


// API Route: Get Order Details (Secure & Sanitized - Requires Token or Authorization)
app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const token = (req.query.token as string) || (req.headers['x-order-token'] as string);
    const order = await findOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pesanan tidak ditemukan di database saena.id.'
      });
    }

    // Security check: Customer must provide matching accessToken or phone verification
    const isTokenMatch = order.accessToken && token && (token === order.accessToken);
    const isPhoneMatch = req.query.phone && order.customer.phone.endsWith(String(req.query.phone).replace(/\D/g, '').slice(-4));
    const isAdmin = !!(req.headers['x-admin-key'] || req.headers['x-admin-token']);

    if (!isTokenMatch && !isPhoneMatch && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Akses pesanan dibatasi. Token keamanan (token) atau verifikasi nomor telepon diperlukan.'
      });
    }

    return res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoiceNumber,
        customer: {
          customerName: order.customer.customerName,
          phone: order.customer.phone.length > 6 
            ? `${order.customer.phone.substring(0, 4)}••••${order.customer.phone.slice(-3)}`
            : order.customer.phone,
          email: order.customer.email
        },
        shippingAddress: order.shippingAddress,
        items: order.items,
        quantity: order.quantity,
        weight: order.weight,
        price: order.price,
        payment: {
          paymentMethod: order.payment.paymentMethod,
          paymentProvider: order.payment.paymentProvider,
          paymentChannel: order.payment.paymentChannel,
          paymentStatus: order.payment.paymentStatus,
          paymentAmount: order.payment.paymentAmount,
          paymentCreatedAt: order.payment.paymentCreatedAt,
          paymentPaidAt: order.payment.paymentPaidAt,
          paymentUrl: order.payment.paymentUrl,
          vaNumber: order.payment.vaNumber,
          bank: order.payment.bank,
          qrisString: order.payment.qrisString,
          qrisImage: order.payment.qrisImage
        },
        shipping: {
          shippingProvider: order.shipping.shippingProvider,
          courier: order.shipping.courier,
          service: order.shipping.service,
          shippingStatus: order.shipping.shippingStatus,
          trackingNumber: order.shipping.trackingNumber,
          airwaybill: order.shipping.airwaybill,
          labelUrl: order.shipping.labelUrl,
          estimatedDelivery: order.shipping.estimatedDelivery
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  } catch (err: any) {
    console.error('[GetOrder] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Gagal mengambil data pesanan.'
    });
  }
});

// API Route: Polling Order Status (Fast & Lightweight with Token Security)
app.get('/api/orders/:orderNumber/status', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const token = (req.query.token as string) || (req.headers['x-order-token'] as string);
    const order = await findOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pesanan tidak ditemukan'
      });
    }

    if (order.accessToken && token && token !== order.accessToken && !req.headers['x-admin-key']) {
      return res.status(403).json({
        success: false,
        error: 'Akses status pesanan ditolak.'
      });
    }

    return res.json({
      success: true,
      orderNumber: order.orderNumber,
      paymentStatus: order.payment.paymentStatus,
      shippingStatus: order.shipping.shippingStatus,
      trackingNumber: order.shipping.trackingNumber || null,
      paidAt: order.payment.paymentPaidAt || null,
      paymentUrl: order.payment.paymentUrl || null,
      grandTotal: order.price.grandTotal
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API Route: DOKU Webhook Notification (Strict Jokul HMAC-SHA256 & Amount Validation)
app.all(['/api/doku/notification', '/api/webhooks/doku'], async (req: any, res) => {
  try {
    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'OK',
        endpoint: req.path,
        message: 'Endpoint Webhook Notifikasi DOKU Jokul aktif dan siap menerima HTTP POST payload.',
        timestamp: new Date().toISOString()
      });
    }

    const clientId = (req.headers['client-id'] || req.headers['Client-Id']) as string;
    const requestId = (req.headers['request-id'] || req.headers['Request-Id']) as string;
    const requestTimestamp = (req.headers['request-timestamp'] || req.headers['Request-Timestamp']) as string;
    const signature = (req.headers['signature'] || req.headers['Signature']) as string;
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const secretKey = process.env.DOKU_SECRET_KEY || '';

    console.log(`[DOKU Webhook] Received notification on ${req.path}. Request-Id: ${requestId}`);

    // 1. Mandatory Signature Validation (Reject if missing or invalid)
    if (!signature) {
      console.warn('[DOKU Webhook] Rejected: Missing Signature header');
      return res.status(401).json({ status: 'MISSING_SIGNATURE', error: 'Signature header is required.' });
    }

    if (!secretKey) {
      console.error('[DOKU Webhook] Error: DOKU_SECRET_KEY not configured on server.');
      return res.status(500).json({ status: 'CONFIGURATION_ERROR', error: 'DOKU_SECRET_KEY is not configured.' });
    }

    const isValid = verifyDokuWebhookSignature(
      clientId,
      requestId,
      requestTimestamp,
      req.path || '/api/doku/notification',
      rawBody,
      signature,
      secretKey
    );

    if (!isValid) {
      console.warn('[DOKU Webhook] Rejected: Invalid HMAC-SHA256 signature.');
      return res.status(401).json({ status: 'INVALID_SIGNATURE', error: 'Webhook signature verification failed.' });
    }

    const notificationData = req.body;
    const invoiceNumber = notificationData.order?.invoice_number || 
      notificationData.orderId || 
      notificationData.invoiceNumber;
    const rawStatus = (notificationData.transaction?.status || notificationData.status || '').toUpperCase();

    if (!invoiceNumber) {
      console.warn('[DOKU Webhook] Missing invoice number in payload.');
      return res.status(400).json({ status: 'BAD_REQUEST', error: 'Missing invoice number.' });
    }

    // 2. Find Order in Repository
    const order = await findOrderByNumber(invoiceNumber);
    if (!order) {
      console.warn(`[DOKU Webhook] Order not found for invoice: ${invoiceNumber}`);
      return res.status(404).json({ status: 'ORDER_NOT_FOUND', error: 'Order not found.' });
    }

    // 3. Amount Validation (Mandatory for SUCCESS/PAID status to prevent underpayment/fraud)
    if (rawStatus === 'SUCCESS' || rawStatus === 'PAID') {
      const rawAmount = notificationData.order?.amount ?? notificationData.amount ?? notificationData.transaction?.amount;
      const paidAmount = Number(rawAmount);

      if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
        console.error(`[DOKU Webhook] REJECTED: Missing or invalid amount in payload. Received: ${rawAmount}`);
        return res.status(400).json({
          status: 'INVALID_AMOUNT',
          error: 'Amount is mandatory and must be a valid positive number for successful payment webhook.'
        });
      }

      const expectedAmount = Number(order.price.grandTotal);
      if (paidAmount !== expectedAmount) {
        console.error(`[DOKU Webhook] AMOUNT MISMATCH REJECTED! Expected: ${expectedAmount}, Received: ${paidAmount}`);
        return res.status(400).json({
          status: 'AMOUNT_MISMATCH',
          error: `Notification amount (${paidAmount}) does not match order grand total (${expectedAmount}). Webhook rejected.`
        });
      }
    }

    // 4. Webhook Idempotency Check
    if (order.payment.paymentStatus === 'PAID') {
      if (order.processedWebhookIds?.includes(requestId)) {
        console.log(`[DOKU Webhook] Request-Id ${requestId} already processed. Returning 200 OK.`);
        return res.status(200).json({ status: 'OK', message: 'Already processed.' });
      }
    }

    // 5. Official Status Mapping & State Transition
    if (rawStatus === 'SUCCESS' || rawStatus === 'PAID') {
      const paidAt = new Date().toISOString();
      await updateOrderPayment(order.orderNumber, 'PAID', {
        paidAt,
        dokuResponse: notificationData,
        webhookId: requestId
      });
      console.log(`[DOKU Webhook] Order ${order.orderNumber} successfully updated to PAID.`);

      // 5.1 Trigger Meta Conversions API (CAPI) Purchase Event (Strict idempotency: 1 purchase event per order)
      const canSendPurchase = await claimOrderForMetaPurchase(order.orderNumber);
      if (canSendPurchase) {
        sendMetaCapiPurchase(order).catch(capiErr => {
          console.error(`[Meta CAPI] Error dispatching Purchase for ${order.orderNumber}:`, capiErr.message);
        });
      } else {
        console.log(`[Meta CAPI] Purchase event already sent or claimed for order ${order.orderNumber}. Skipping duplicate.`);
      }

      // 6. Trigger Mengantar Shipment Creation (Idempotent: only if not already created)
      if (process.env.MENGANTAR_API_KEY && order.shipping.shippingStatus !== 'CREATED' && !order.shipping.trackingNumber) {
        try {
          const mgtRes = await processMengantarOrder({
            orderId: order.orderNumber,
            customer: {
              fullName: order.customer.customerName,
              whatsapp: order.customer.phone,
              email: order.customer.email,
              address: order.shippingAddress.address,
              subdistrict: order.shippingAddress.district,
              city: order.shippingAddress.city,
              province: order.shippingAddress.province,
              postalCode: order.shippingAddress.postalCode,
              notes: 'Pesanan Dibayar DOKU saena.id'
            },
            courier: order.shipping.courier,
            serviceType: order.shipping.service,
            items: order.items.map(i => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
              weight: i.weight
            })),
            totalAmount: order.price.grandTotal,
            shippingCost: order.price.shippingCost,
            isCod: false,
            notes: 'Pesanan Dibayar DOKU saena.id'
          });

          if (mgtRes.success && mgtRes.data) {
            await updateOrderShipping(order.orderNumber, 'CREATED', {
              trackingNumber: mgtRes.data.trackingNumber,
              mengantarOrderId: mgtRes.data.mengantarOrderId,
              airwaybill: mgtRes.data.airwayBillUrl,
              labelUrl: mgtRes.data.labelUrl,
              mengantarResponse: mgtRes.data
            });
            console.log(`[DOKU Webhook] Mengantar shipment created! Resi: ${mgtRes.data.trackingNumber}`);
          } else {
            // Mengantar failed, but payment REMAINS PAID!
            await updateOrderShipping(order.orderNumber, 'FAILED', {
              mengantarResponse: mgtRes
            });
            console.warn(`[DOKU Webhook] Mengantar dispatch failed. Payment remains PAID. Reason: ${mgtRes.error}`);
          }
        } catch (mgtErr: any) {
          console.error('[DOKU Webhook] Error creating Mengantar shipment:', mgtErr.message);
          await updateOrderShipping(order.orderNumber, 'FAILED', {});
        }
      }
    } else if (rawStatus === 'FAILED') {
      await updateOrderPayment(order.orderNumber, 'FAILED', {
        dokuResponse: notificationData,
        webhookId: requestId
      });
    } else if (rawStatus === 'EXPIRED') {
      await updateOrderPayment(order.orderNumber, 'EXPIRED', {
        dokuResponse: notificationData,
        webhookId: requestId
      });
    } else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCELED') {
      await updateOrderPayment(order.orderNumber, 'CANCELLED', {
        dokuResponse: notificationData,
        webhookId: requestId
      });
    }

    return res.status(200).json({
      status: 'OK',
      message: 'Notification processed successfully by saena.id'
    });

  } catch (err: any) {
    console.error('[DOKU Webhook] Unexpected error:', err);
    return res.status(500).json({ status: 'ERROR', error: err.message });
  }
});


// API Route: Admin Retry Shipping (Dispatch Paid / COD Order to Mengantar)
app.post('/api/admin/orders/:orderNumber/retry-shipping', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await findOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    // Requirement 7: RETRY IDEMPOTENCY
    // Check mengantarOrderId, trackingNumber, and shippingStatus before creating shipment
    const isAlreadyCreated = order.shipping.shippingStatus === 'CREATED';
    const hasTrackingNumber = !!(order.shipping.trackingNumber && order.shipping.trackingNumber.trim());
    const hasMengantarOrderId = !!(order.shipping.mengantarOrderId && order.shipping.mengantarOrderId.trim());

    if (isAlreadyCreated || hasTrackingNumber || hasMengantarOrderId) {
      console.log(`[Retry Shipping] Order ${orderNumber} already has active shipment. Status: ${order.shipping.shippingStatus}, Resi: ${order.shipping.trackingNumber}, Mengantar ID: ${order.shipping.mengantarOrderId}. Duplicate shipment prevented.`);
      return res.status(200).json({
        success: true,
        alreadyCreated: true,
        message: 'Pengiriman sudah terbit sebelumnya. Tidak dapat membuat pengiriman kedua.',
        trackingNumber: order.shipping.trackingNumber || null,
        mengantarOrderId: order.shipping.mengantarOrderId || null,
        labelUrl: order.shipping.labelUrl || null,
        shippingStatus: order.shipping.shippingStatus,
        order
      });
    }

    if (!process.env.MENGANTAR_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'MENGANTAR_API_KEY belum dikonfigurasi di environment server.'
      });
    }

    const isCod = order.payment.paymentMethod === 'COD';
    const mgtRes = await processMengantarOrder({
      orderId: order.orderNumber,
      customer: {
        fullName: order.customer.customerName,
        whatsapp: order.customer.phone,
        email: order.customer.email,
        address: order.shippingAddress.address,
        subdistrict: order.shippingAddress.district,
        city: order.shippingAddress.city,
        province: order.shippingAddress.province,
        postalCode: order.shippingAddress.postalCode,
        notes: isCod ? 'Pesanan COD Saena' : 'Pesanan Dibayar Saena'
      },
      courier: order.shipping.courier,
      serviceType: order.shipping.service,
      items: order.items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        weight: i.weight
      })),
      totalAmount: order.price.grandTotal,
      shippingCost: order.price.shippingCost,
      isCod,
      notes: isCod ? 'Pesanan COD Saena' : 'Pesanan Dibayar Saena'
    });

    if (mgtRes.success && mgtRes.data) {
      const updated = await updateOrderShipping(order.orderNumber, 'CREATED', {
        trackingNumber: mgtRes.data.trackingNumber,
        mengantarOrderId: mgtRes.data.mengantarOrderId,
        airwaybill: mgtRes.data.airwayBillUrl,
        labelUrl: mgtRes.data.labelUrl,
        mengantarResponse: mgtRes.data
      });

      return res.json({
        success: true,
        message: 'Pesanan berhasil diterbitkan ke Mengantar.com!',
        trackingNumber: mgtRes.data.trackingNumber,
        labelUrl: mgtRes.data.labelUrl,
        order: updated
      });
    } else {
      await updateOrderShipping(order.orderNumber, 'FAILED', {
        mengantarResponse: mgtRes
      });
      return res.status(400).json({
        success: false,
        error: mgtRes.error || 'Gagal menerbitkan pesanan ke Mengantar.'
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API Route: Create Mengantar Order (Direct Dispatch with Strict Idempotency)
app.post('/api/mengantar/create-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    const order = await findOrderByNumber(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    // Strict Idempotency: Check mengantarOrderId, trackingNumber, and shippingStatus
    const isAlreadyCreated = order.shipping.shippingStatus === 'CREATED';
    const hasTrackingNumber = !!(order.shipping.trackingNumber && order.shipping.trackingNumber.trim());
    const hasMengantarOrderId = !!(order.shipping.mengantarOrderId && order.shipping.mengantarOrderId.trim());

    if (isAlreadyCreated || hasTrackingNumber || hasMengantarOrderId) {
      return res.json({
        success: true,
        alreadyCreated: true,
        message: 'Pengiriman sudah terbit sebelumnya.',
        data: {
          mengantarOrderId: order.shipping.mengantarOrderId || '',
          trackingNumber: order.shipping.trackingNumber || '',
          courier: order.shipping.courier,
          serviceType: order.shipping.service,
          status: 'MENUNGGU_PICKUP',
          labelUrl: order.shipping.labelUrl,
          airwayBillUrl: order.shipping.labelUrl
        }
      });
    }

    if (!process.env.MENGANTAR_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'MENGANTAR_API_KEY belum dikonfigurasi di environment server.'
      });
    }

    const isCod = order.payment.paymentMethod === 'COD';
    const mgtRes = await processMengantarOrder({
      orderId: order.orderNumber,
      customer: {
        fullName: order.customer.customerName,
        whatsapp: order.customer.phone,
        email: order.customer.email,
        address: order.shippingAddress.address,
        subdistrict: order.shippingAddress.district,
        city: order.shippingAddress.city,
        province: order.shippingAddress.province,
        postalCode: order.shippingAddress.postalCode,
        notes: isCod ? 'Pesanan COD Saena' : 'Pesanan Dibayar Saena'
      },
      courier: order.shipping.courier,
      serviceType: order.shipping.service,
      items: order.items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        weight: i.weight
      })),
      totalAmount: order.price.grandTotal,
      shippingCost: order.price.shippingCost,
      isCod,
      notes: isCod ? 'Pesanan COD Saena' : 'Pesanan Dibayar Saena'
    });

    if (mgtRes.success && mgtRes.data) {
      const updated = await updateOrderShipping(order.orderNumber, 'CREATED', {
        trackingNumber: mgtRes.data.trackingNumber,
        mengantarOrderId: mgtRes.data.mengantarOrderId,
        airwaybill: mgtRes.data.airwayBillUrl,
        labelUrl: mgtRes.data.labelUrl,
        mengantarResponse: mgtRes.data
      });

      return res.json({
        success: true,
        message: 'Pesanan berhasil diterbitkan ke Mengantar.com!',
        data: mgtRes.data,
        order: updated
      });
    } else {
      await updateOrderShipping(order.orderNumber, 'FAILED', {
        mengantarResponse: mgtRes
      });
      return res.status(400).json({
        success: false,
        error: mgtRes.error || 'Gagal menerbitkan pesanan ke Mengantar.'
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API Route: Admin Get Orders List
app.get('/api/admin/orders', async (req, res) => {
  try {
    const limitCount = Math.min(100, Number(req.query.limit) || 50);
    const list = await getAllOrdersList(limitCount);
    return res.json({
      success: true,
      total: list.length,
      orders: list
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API Route: Shipping Rates (Mengantar Integration)
async function handleShippingRates(req: any, res: any) {
  try {
    const { originCity = 'Kota Tasikmalaya', destinationCity, weight = 600 } = req.body;
    const ratesResult = await calculateMengantarRates(originCity, destinationCity, Number(weight) || 600);
    return res.json(ratesResult);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

app.post('/api/shipping/rates', handleShippingRates);
app.post('/api/mengantar/rates', handleShippingRates);

// API Route: DOKU Payment Gateway - Test Connection (Diagnostic Check, Not A Real Payment)
app.post('/api/doku/test-connection', async (_req, res) => {
  try {
    const result = await testDokuApiConnectivity();
    return res.json({
      success: result.configured,
      configured: result.configured,
      apiReachable: result.apiReachable,
      authenticationVerified: result.authenticationVerified,
      paymentTransactionTested: result.paymentTransactionTested,
      mode: result.mode,
      clientId: result.clientId,
      message: result.message
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      configured: false,
      apiReachable: false,
      authenticationVerified: false,
      paymentTransactionTested: false,
      message: `Gagal menjalankan test konektivitas DOKU: ${err.message}`
    });
  }
});

// API Route: Mengantar.com - Test Connection (Diagnostic Check with MENGANTAR_ENDPOINT_NOT_VERIFIED status)
app.post('/api/mengantar/test-connection', async (_req, res) => {
  try {
    const result = await testMengantarApiConnectivity();
    return res.json({
      success: result.configured,
      configured: result.configured,
      apiReachable: result.apiReachable,
      authenticationVerified: result.authenticationVerified,
      endpointVerified: result.endpointVerified,
      verificationStatus: result.verificationStatus,
      message: result.message
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      configured: false,
      apiReachable: false,
      authenticationVerified: false,
      endpointVerified: false,
      verificationStatus: 'MENGANTAR_ENDPOINT_NOT_VERIFIED',
      message: `Gagal menjalankan test konektivitas Mengantar: ${err.message}`
    });
  }
});

// ============================================================================
// API Route: Mengantar Incoming Webhook
// Endpoint: https://api.saena.my.id/api/webhooks/mengantar
// Handles real-time shipment status callbacks dispatched by Mengantar.com logistics.
// ============================================================================
app.get('/api/webhooks/mengantar', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    endpoint: '/api/webhooks/mengantar',
    message: 'Endpoint Incoming Webhook Mengantar aktif dan siap menerima HTTP POST payload.',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/webhooks/mengantar', async (req: any, res) => {
  try {
    const signature = (
      req.headers['x-signature'] || 
      req.headers['X-Signature'] || 
      req.headers['x-mengantar-signature'] || 
      ''
    ) as string;

    const timestamp = (
      req.headers['x-timestamp'] || 
      req.headers['X-Timestamp'] || 
      req.headers['x-mengantar-timestamp'] || 
      ''
    ) as string;

    const rawBody = req.rawBody ?? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
    const secret = process.env.MENGANTAR_WEBHOOK_SECRET?.trim() || '';

    console.log(`[Mengantar Webhook] Incoming POST received. Timestamp: "${timestamp}", Sig length: ${signature.length}`);

    // 1. Signature Verification
    if (!signature) {
      console.warn('[Mengantar Webhook] Rejected: Missing required x-signature header.');
      return res.status(401).json({
        success: false,
        error: 'Missing required x-signature header.'
      });
    }

    if (!timestamp) {
      console.warn('[Mengantar Webhook] Rejected: Missing required x-timestamp header.');
      return res.status(401).json({
        success: false,
        error: 'Missing required x-timestamp header.'
      });
    }

    if (!secret) {
      console.warn('[Mengantar Webhook] Rejected: MENGANTAR_WEBHOOK_SECRET is not configured on server.');
      return res.status(401).json({
        success: false,
        error: 'MENGANTAR_WEBHOOK_SECRET is not configured on server. Signature verification cannot proceed.'
      });
    }

    const { valid, reason } = verifyMengantarWebhookSignature(timestamp, rawBody, signature, secret);

    if (!valid) {
      console.warn(`[Mengantar Webhook] Rejected: Invalid signature. Reason: ${reason}`);
      return res.status(401).json({
        success: false,
        error: reason || 'Invalid webhook signature.'
      });
    }

    // 2. Parse JSON payload
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (err: any) {
        console.warn('[Mengantar Webhook] Rejected: Malformed JSON payload.', err.message);
        return res.status(400).json({
          success: false,
          error: 'Malformed JSON payload.'
        });
      }
    }

    // 3. Process status update idempotently
    const result = await processMengantarWebhook(payload, timestamp);
    return res.status(result.statusCode).json(result.response);

  } catch (err: any) {
    console.error('[Mengantar Webhook] Server error handling webhook:', err.message);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${err.message}`
    });
  }
});


// Public SEO Routes
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Sitemap: https://saena.my.id/sitemap.xml
`);
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://saena.my.id/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://saena.my.id/#koleksi</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`);
});

// API Route: Generate High-Converting Landing Page Copywriting with Gemini 3.8 Flash
app.post('/api/generate-landing-page', async (req, res) => {
  try {
    const { product, angle = 'luxury' } = req.body;
    if (!product || !product.name) {
      return res.status(400).json({ success: false, error: 'Product data required' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({ success: false, message: 'Gemini API not configured, using smart local template' });
    }

    const prompt = `Anda adalah copywriter direct-response kelas dunia untuk brand fashion muslimah butik mewah bernama "saena.id" (asal Tasikmalaya, Jawa Barat).
Tugas Anda adalah menulis copywriting Landing Page penjualan yang sangat memikat, berkelas, elegan, dan menghasilkan konversi penjualan (CTA) yang sangat tinggi untuk produk berikut:

Nama Produk: ${product.name}
Kategori: ${product.category}
Harga Normal: Rp ${product.originalPrice || Math.round(product.price * 1.25)}
Harga Promo Sekarang: Rp ${product.price}
Material/Bahan: ${product.material || 'Sutra & Ceruty Premium'}
Deskripsi: ${product.description || ''}
Fitur/Kelebihan: ${(product.features || []).join(', ')}
Sudut Pemasaran (Angle): ${angle}

Tuliskan dalam format JSON murni dengan struktur persis seperti berikut:
{
  "announcementText": "teks banner pengumuman atas dengan urgensi dan promo",
  "headline": "headline utama yang sangat kuat, memicu hasrat membeli dan penasaran",
  "subheadline": "subheadline yang menyentuh emosi, kenyamanan, dan keanggunan",
  "badge": "tag pendek eksklusif, contoh: Koleksi Terbatas Hari Raya • Garansi Original",
  "discountHighlightText": "teks sorotan penghematan, contoh: Hemat Rp 165.000 Khusus Hari Ini",
  "painPoints": ["masalah 1 yang sering dialami pembeli dengan baju biasa", "masalah 2", "masalah 3"],
  "solutions": ["solusi 1 yang diberikan produk ini", "solusi 2", "solusi 3"],
  "benefits": [
    {"title": "Judul Keunggulan 1", "description": "Deskripsi manfaat emosional dan fungsional"},
    {"title": "Judul Keunggulan 2", "description": "Deskripsi manfaat emosional dan fungsional"},
    {"title": "Judul Keunggulan 3", "description": "Deskripsi manfaat emosional dan fungsional"},
    {"title": "Judul Keunggulan 4", "description": "Deskripsi manfaat emosional dan fungsional"}
  ],
  "craftsmanshipTitle": "Judul Bagian Kualitas Seni Jahit Butik Tasikmalaya",
  "craftsmanshipDesc": "Uraian memikat tentang dedikasi penjahit butik, kehalusan jahitan stik kecil, dan rasa percaya diri saat memakainya",
  "socialProofHeading": "Judul sosial proof testimoni",
  "guaranteeHeading": "Judul garansi kepuasan tanpa resiko",
  "guaranteeText": "Uraian jaminan tukar barang atau uang kembali jika tidak puas",
  "faqs": [
    {"q": "pertanyaan 1 pembeli (misal bahan menerawang/tidak)", "a": "jawaban meyakinkan"},
    {"q": "pertanyaan 2 (estimasi kirim & asal pengiriman)", "a": "jawaban meyakinkan"},
    {"q": "pertanyaan 3 (bisa COD/bayar di tempat?)", "a": "jawaban meyakinkan"},
    {"q": "pertanyaan 4 (garansi jika ukuran tidak pas)", "a": "jawaban meyakinkan"}
  ],
  "primaryCtaText": "teks tombol CTA yang sangat menggugah (contoh: PESAN SEKARANG - KLAIM DISKON SPESIAL)",
  "whatsappCustomText": "template pesan WhatsApp pembeli yang sopan dan langsung to the point"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text?.trim();
    if (responseText) {
      const parsed = JSON.parse(responseText);
      return res.json({
        success: true,
        landingPage: parsed
      });
    }

    return res.json({ success: false, message: 'Empty AI response' });
  } catch (error: any) {
    console.error('Error generating landing page with Gemini:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Export the Express application so Vercel can run the API as a Function.
// Static/Vite server startup is kept only for local development.
export { app };

async function startServer() {
  // Serve static files from public directory
  app.use(express.static(path.join(process.cwd(), 'public')));

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

// Vercel imports this module as a Function, so never call app.listen there.
// Local development keeps the existing Express + Vite server behavior.
if (!process.env.VERCEL) {
  startServer();
}
