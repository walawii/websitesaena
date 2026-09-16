import { Product, LandingPageConfig } from '../types';
import { cleanHtmlDescription } from './textHelper';

/**
 * Generate high-converting direct-response copywriting for a product
 */
export function generateDefaultLandingPageConfig(product: Product): LandingPageConfig {
  const discountAmount = product.originalPrice && product.originalPrice > product.price 
    ? product.originalPrice - product.price 
    : 100000;
  
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round((discountAmount / product.originalPrice) * 100)
    : 20;

  const categoryName = product.category === 'mukena-silk' 
    ? 'Mukena Sutra Eksklusif' 
    : product.category === 'abaya-gamis'
    ? 'Abaya Gamis Anggun'
    : product.category === 'hijab-pashmina'
    ? 'Pashmina & Hijab Butik'
    : 'Busana Muslimah Butik';

  const materialText = product.material || 'Bahan Sutra & Ceruty Premium Berkualitas Butik';
  const cleanDesc = cleanHtmlDescription(product.description || '');

  return {
    id: `lp-${product.id}`,
    productId: product.id,
    slug: product.slug || `lp-${product.id}`,
    isActive: true,
    theme: 'emerald',
    announcementText: `🔥 PROMO SPESIAL HARI INI: Diskon ${discountPercent}% + Gratis Ongkir Seluruh Indonesia & Garansi Tukar Ukuran!`,
    showCountdown: true,
    countdownMinutes: 180, // 3 hours countdown
    headline: `Tampil Menawan & Berkelas Tanpa Gerah dengan ${product.name}`,
    subheadline: `Didesain dengan sentuhan butik khas Tasikmalaya menggunakan ${materialText}. Siluet anggun, jatuh sempurna, dan nyaman dikenakan sepanjang hari.`,
    badge: 'Koleksi Eksklusif Terlaris • Garansi 100% Original',
    discountHighlightText: `Hemat ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(discountAmount)} Hari Ini`,
    painPoints: [
      'Sering merasa gerah, panas, dan tidak percaya diri saat mengenakan busana muslim seharian?',
      'Kecewa dengan jahitan pasaran yang mudah lepas, benang berantakan, dan potongan tidak proporsional?',
      'Khawatir bahan terawang dan repot saat harus berwudhu atau menyusui di acara keluarga?'
    ],
    solutions: [
      `Serat alami ${materialText} yang sejuk berpori, menyerap keringat dan memberi rasa adem seketika.`,
      'Jahitan butik Tasikmalaya berstandar ekspor dengan kerapian jahitan stik kecil dan obras halus.',
      'Potongan syar\'i yang anggun, dilengkapi resleting dada (Busui) dan manset elastis (Wudhu Friendly).'
    ],
    benefits: [
      {
        title: 'Material Premium Anti Gerah',
        description: `Menggunakan ${materialText} dengan teknologi breathable yang lembut di kulit dan tidak mudah kusut.`
      },
      {
        title: 'Standar Jahitan Butik Halus',
        description: 'Dikerjakan langsung oleh penjahit berpengalaman Tasikmalaya dengan standar quality control ketat 2 lapis.'
      },
      {
        title: 'Desain Busui & Wudhu Friendly',
        description: 'Detail kancing/zipper tersembunyi yang praktis tanpa mengurangi kesan mewah dan kesopanan busana.'
      },
      {
        title: 'Kemasan Eksklusif & Wangi Mewah',
        description: 'Setiap paket dikemas rapi dalam hardbox/pouch eksklusif saena.id dengan aroma kasturi khas butik.'
      }
    ],
    craftsmanshipTitle: 'Mahakarya Seni Jahit Butik Tasikmalaya',
    craftsmanshipDesc: cleanDesc.length > 20 ? cleanDesc : `${product.name} adalah perpaduan elegansi modern dengan tradisi ketelitian busana muslim Indonesia. Setiap helai kain dipilih khusus untuk menjamin rasa percaya diri Anda di setiap momen berharga.`,
    socialProofHeading: 'Telah Dipercaya & Dicintai Ribuan Muslimah di Seluruh Indonesia',
    guaranteeHeading: '100% Garansi Kepuasan & Kenyamanan Belanja',
    guaranteeText: 'Kami memberikan jaminan 100% penggantian baru atau pengembalian uang apabila pesanan Anda cacat jahitan, salah kirim warna/ukuran, atau tidak sesuai foto katalog. Belanja nyaman, aman, dan tanpa rasa cemas.',
    faqs: [
      {
        q: 'Apakah bahannya menerawang saat dipakai di luar ruangan?',
        a: 'Sama sekali tidak menerawang! Material dipilih dengan gramasi kain yang tepat, serat rapat, namun tetap jatuh lembut dan sejuk di kulit.'
      },
      {
        q: 'Berapa lama estimasi pengiriman paket sampai ke rumah saya?',
        a: 'Pengiriman langsung dari Warehouse Tasikmalaya via JNE/J&T/SiCepat. Estimasi Jabodetabek & Jawa Barat 1-2 hari kerja, Pulau Jawa 2-3 hari, dan Luar Jawa 3-5 hari kerja.'
      },
      {
        q: 'Apakah bisa bayar di tempat (COD) atau transfer Bank?',
        a: 'Bisa! Kami mendukung metode pembayaran COD (Bayar di Tempat saat kurir datang), Virtual Account BCA/Mandiri/BRI, dan QRIS instan.'
      },
      {
        q: 'Bagaimana jika ukuran tidak pas setelah dicoba?',
        a: 'Tenang, saena.id menyediakan layanan Garansi Tukar Ukuran dalam 3 hari setelah paket diterima. Tim CS kami siap membantu dengan ramah.'
      }
    ],
    primaryCtaText: 'PESAN SEKARANG - KLAIM DISKON SPESIAL',
    primaryCtaAction: 'checkout',
    whatsappCustomText: `Halo Admin saena.id, saya ingin memesan *${product.name}* melalui promo Landing Page. Apakah promo diskon dan gratis ongkir masih tersedia?`,
    urgencyStockRemaining: Math.min(Math.max(product.totalStock, 3), 9),
    showStickyBar: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Call AI service to generate personalized copywriting for landing page
 */
export async function requestAILandingPageCopy(
  product: Product, 
  angle: 'luxury' | 'urgency' | 'modest' | 'ramadan' = 'luxury'
): Promise<Partial<LandingPageConfig>> {
  try {
    const res = await fetch('/api/generate-landing-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, angle })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.landingPage) {
        return data.landingPage;
      }
    }
  } catch (err) {
    console.warn('AI Landing page generation API unavailable, using local generator:', err);
  }

  // Fallback local generator
  return generateDefaultLandingPageConfig(product);
}
