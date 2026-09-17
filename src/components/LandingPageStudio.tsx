import React, { useState, useEffect } from 'react';
import { Product, LandingPageConfig } from '../types';
import { useStore } from '../context/StoreContext';
import { generateDefaultLandingPageConfig, requestAILandingPageCopy } from '../utils/landingPageHelper';
import { ProductLandingPage } from './ProductLandingPage';
import { 
  Sparkles, 
  Eye, 
  Save, 
  Share2, 
  Copy, 
  Check, 
  RefreshCw, 
  Globe, 
  Smartphone, 
  Monitor, 
  Layers, 
  MessageSquare, 
  Sliders, 
  Flame, 
  HelpCircle, 
  ShieldCheck, 
  ShoppingBag, 
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Search,
  Tag
} from 'lucide-react';

interface LandingPageStudioProps {
  initialProductId?: string | null;
  onViewLiveLanding?: (productId: string) => void;
}

export const LandingPageStudio: React.FC<LandingPageStudioProps> = ({
  initialProductId,
  onViewLiveLanding
}) => {
  const { 
    products, 
    landingPages, 
    saveLandingPage, 
    deleteLandingPage, 
    formatPrice,
    sendPushNotification,
    setActiveLandingProductId
  } = useStore();

  // Selected product to build landing page for
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    if (initialProductId && products.some(p => p.id === initialProductId)) {
      return initialProductId;
    }
    return products[0]?.id || '';
  });

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  // Current working configuration state
  const [config, setConfig] = useState<LandingPageConfig>(() => {
    if (selectedProduct && landingPages[selectedProduct.id]) {
      return { ...landingPages[selectedProduct.id] };
    }
    return selectedProduct ? generateDefaultLandingPageConfig(selectedProduct) : ({} as LandingPageConfig);
  });

  // When selected product changes, load its existing config or generate default
  useEffect(() => {
    if (!selectedProduct) return;
    if (landingPages[selectedProduct.id]) {
      setConfig({ ...landingPages[selectedProduct.id] });
    } else {
      setConfig(generateDefaultLandingPageConfig(selectedProduct));
    }
  }, [selectedProductId, landingPages, selectedProduct]);

  // UI state
  const [activeTab, setActiveTab] = useState<'copy' | 'pain-solution' | 'benefits' | 'cta' | 'faq'>('copy');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiAngle, setAiAngle] = useState<'luxury' | 'urgency' | 'modest' | 'ramadan'>('luxury');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Filter products for dropdown/list
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  // AI Copywriting Generator Trigger
  const handleGenerateAi = async () => {
    if (!selectedProduct) return;
    setIsGeneratingAi(true);
    try {
      const generated = await requestAILandingPageCopy(selectedProduct, aiAngle);
      setConfig(prev => ({
        ...prev,
        ...generated,
        updatedAt: new Date().toISOString()
      }));
      sendPushNotification(
        'AI Copywriting Berhasil Dibuat! ✨',
        `Landing page untuk ${selectedProduct.name} telah dioptimalkan dengan sudut penjualan ${aiAngle}.`,
        'system'
      );
    } catch (err) {
      console.error('Error generating AI copy:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Save changes to Firestore and localStorage
  const handleSave = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      const toSave = {
        ...config,
        productId: selectedProduct.id,
        slug: selectedProduct.slug || `lp-${selectedProduct.id}`,
        updatedAt: new Date().toISOString()
      };
      await saveLandingPage(toSave);
      setSavedSuccess(true);
      sendPushNotification(
        'Landing Page Berhasil Dipublikasikan! 🚀',
        `Halaman promosi penjualan untuk "${selectedProduct.name}" aktif dan siap diiklankan.`,
        'system'
      );
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving landing page:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy shareable link
  const handleCopyLink = () => {
    if (!selectedProduct) return;
    const url = `${window.location.origin}${window.location.pathname}?landing=${selectedProduct.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    sendPushNotification(
      'Tautan Landing Page Disalin! 📋',
      'Gunakan link ini untuk iklan Facebook Ads, Instagram, TikTok, atau pesan broadcast.',
      'system'
    );
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (!selectedProduct) return;
    if (window.confirm('Kembalikan seluruh teks landing page ke template standar berkualitas tinggi?')) {
      setConfig(generateDefaultLandingPageConfig(selectedProduct));
    }
  };

  if (!selectedProduct) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#E5DDD2]">
        <p className="text-sm text-[#7A7266]">Belum ada produk yang tersedia untuk dibuatkan Landing Page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & PRODUCT SELECTOR BAR */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#1C3B2B] flex items-center justify-center text-[#C5A880]">
                <Globe className="w-4 h-4" />
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#1C3B2B]">
                Landing Page Builder & Direct-Response Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                PRO FITUR
              </span>
            </div>
            <p className="text-xs text-[#7A7266] mt-1">
              Buat halaman penawaran khusus satu produk dengan foto katalog beresolusi tinggi, copywriting persuasif, dan tombol Call-To-Action (CTA) berkonversi tinggi.
            </p>
          </div>

          {/* Quick Actions (Save, Copy Link, Fullscreen Preview) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF6F0] hover:bg-[#EFE9E0] text-[#1C3B2B] border border-[#DCD2C3] transition-colors"
              title="Salin URL publik Landing Page"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link Iklan'}</span>
            </button>

            <button
              onClick={() => setShowLiveModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#FAF6F0] hover:bg-[#EFE9E0] text-[#1C3B2B] border border-[#DCD2C3] transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[#1C3B2B]" />
              <span>Preview Penuh</span>
            </button>

            <button
              id="save-landing-page-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#1C3B2B] hover:bg-[#28523C] text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : savedSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Save className="w-3.5 h-3.5 text-[#C5A880]" />
              )}
              <span>{savedSuccess ? 'Tersimpan!' : 'Simpan & Publikasikan'}</span>
            </button>
          </div>
        </div>

        {/* Product Picker Dropdown & Quick Stats */}
        <div className="pt-3 border-t border-[#F2ECE4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <label className="text-xs font-bold text-[#1C3B2B] whitespace-nowrap">
              Pilih Produk:
            </label>
            <div className="relative flex-1 max-w-md">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl text-xs font-semibold text-[#1C3B2B] focus:outline-none focus:ring-1 focus:ring-[#1C3B2B] cursor-pointer"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatPrice(p.price)}) {landingPages[p.id] ? '✓ Sudah Ada LP' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Product Badge */}
          <div className="flex items-center gap-3 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#E8DFC0] text-xs">
            <img 
              src={selectedProduct.images[0]} 
              alt={selectedProduct.name} 
              className="w-7 h-9 rounded-md object-cover bg-[#EFE9E0]"
            />
            <div>
              <span className="font-bold text-[#1C3B2B] block">{selectedProduct.name}</span>
              <span className="text-[10px] text-[#7A7266]">
                Harga: <strong>{formatPrice(selectedProduct.price)}</strong> • Stok: {selectedProduct.totalStock}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. AI GENERATOR TOOLBAR */}
      <div className="bg-linear-to-r from-[#1C3B2B] to-[#254F3A] text-white p-5 rounded-2xl border border-[#3E6B53] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <h3 className="font-display text-sm font-bold text-[#E6CBA6]">
                AI Copywriter Otomatis (Gemini 3.8 Flash)
              </h3>
            </div>
            <p className="text-xs text-white/80">
              Hasilkan teks penawaran memikat secara otomatis berdasarkan gambar, bahan kain ({selectedProduct.material || 'sutra butik'}), dan deskripsi produk ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={aiAngle}
              onChange={(e) => setAiAngle(e.target.value as any)}
              className="bg-black/30 border border-white/20 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="luxury">Sudut: Kemewahan & Butik Eksklusif</option>
              <option value="urgency">Sudut: Flash Sale & Stok Terbatas</option>
              <option value="modest">Sudut: Anggun, Adem & Syar'i</option>
              <option value="ramadan">Sudut: Edisi Hari Raya & Ramadhan</option>
            </select>

            <button
              onClick={handleGenerateAi}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC98] text-[#1C3B2B] font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingAi ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Meracik Copywriting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate dengan AI</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetToDefault}
              className="text-[11px] text-white/70 hover:text-white px-2 py-1 underline transition-colors"
            >
              Reset Standar
            </button>
          </div>
        </div>
      </div>

      {/* 3. SPLIT VIEW: STUDIO EDITOR & LIVE PREVIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* 3A. EDITOR CONTROLS (LEFT - 6 COLS) */}
        <div className="xl:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-5">
          
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#F2ECE4] text-xs font-semibold scrollbar-none">
            <button
              onClick={() => setActiveTab('copy')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'copy' 
                  ? 'bg-[#1C3B2B] text-white shadow-xs' 
                  : 'text-[#7A7266] hover:text-[#1C3B2B] hover:bg-[#FAF8F5]'
              }`}
            >
              Headline & Promo
            </button>

            <button
              onClick={() => setActiveTab('pain-solution')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'pain-solution' 
                  ? 'bg-[#1C3B2B] text-white shadow-xs' 
                  : 'text-[#7A7266] hover:text-[#1C3B2B] hover:bg-[#FAF8F5]'
              }`}
            >
              Masalah vs Solusi
            </button>

            <button
              onClick={() => setActiveTab('benefits')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'benefits' 
                  ? 'bg-[#1C3B2B] text-white shadow-xs' 
                  : 'text-[#7A7266] hover:text-[#1C3B2B] hover:bg-[#FAF8F5]'
              }`}
            >
              Keunggulan Butik
            </button>

            <button
              onClick={() => setActiveTab('cta')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'cta' 
                  ? 'bg-[#1C3B2B] text-white shadow-xs' 
                  : 'text-[#7A7266] hover:text-[#1C3B2B] hover:bg-[#FAF8F5]'
              }`}
            >
              Pengaturan CTA & WA
            </button>

            <button
              onClick={() => setActiveTab('faq')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'faq' 
                  ? 'bg-[#1C3B2B] text-white shadow-xs' 
                  : 'text-[#7A7266] hover:text-[#1C3B2B] hover:bg-[#FAF8F5]'
              }`}
            >
              Garansi & FAQ
            </button>
          </div>

          {/* TAB CONTENT 1: HEADLINE & PROMO */}
          {activeTab === 'copy' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                  Banner Pengumuman Atas (Top Announcement Bar)
                </label>
                <input
                  type="text"
                  value={config.announcementText}
                  onChange={(e) => setConfig({ ...config, announcementText: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C3B2B]"
                  placeholder="Contoh: 🔥 PROMO SPESIAL HARI INI: Diskon 25% + Gratis Ongkir..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                    Badge / Tag Promosi
                  </label>
                  <input
                    type="text"
                    value={config.badge}
                    onChange={(e) => setConfig({ ...config, badge: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none"
                    placeholder="Contoh: Koleksi Eksklusif Butik • 100% Original"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                    Teks Sorotan Penghematan
                  </label>
                  <input
                    type="text"
                    value={config.discountHighlightText || ''}
                    onChange={(e) => setConfig({ ...config, discountHighlightText: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none"
                    placeholder="Contoh: Hemat Rp 150.000 Hari Ini"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                  Headline Utama (Judul yang Sangat Memikat) *
                </label>
                <textarea
                  rows={2}
                  value={config.headline}
                  onChange={(e) => setConfig({ ...config, headline: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none font-bold text-[#1C3B2B]"
                  placeholder="Tuliskan headline kuat yang menggugah keinginan memiliki..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                  Subheadline (Emosional & Kenyamanan Bahan) *
                </label>
                <textarea
                  rows={3}
                  value={config.subheadline}
                  onChange={(e) => setConfig({ ...config, subheadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none leading-relaxed"
                  placeholder="Tuliskan penjelasan mengenai kenyamanan, kelembutan bahan, dan siluet anggun..."
                />
              </div>

              {/* Countdown timer toggle */}
              <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E8DFC0]">
                <div>
                  <span className="text-xs font-bold text-[#1C3B2B] block">Tampilkan Countdown Timer Urgensi</span>
                  <span className="text-[10px] text-[#7A7266]">Memberikan efek scarcity psikologis agar pengunjung segera checkout</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.showCountdown}
                  onChange={(e) => setConfig({ ...config, showCountdown: e.target.checked })}
                  className="w-4 h-4 text-[#1C3B2B] rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: PAIN POINTS & SOLUTIONS */}
          {activeTab === 'pain-solution' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <span className="text-xs font-bold text-rose-800 block">
                  3 Masalah yang Sering Dihadapi Pembeli (Pain Points):
                </span>
                {config.painPoints.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => {
                        const next = [...config.painPoints];
                        next[idx] = e.target.value;
                        setConfig({ ...config, painPoints: next });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-rose-200 rounded-lg focus:outline-none text-rose-900"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#F2ECE4] space-y-3">
                <span className="text-xs font-bold text-emerald-800 block">
                  3 Solusi Nyata yang Diberikan saena.id:
                </span>
                {config.solutions.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={s}
                      onChange={(e) => {
                        const next = [...config.solutions];
                        next[idx] = e.target.value;
                        setConfig({ ...config, solutions: next });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-emerald-200 rounded-lg focus:outline-none text-emerald-900"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: CRAFTSMANSHIP & 4 BENEFITS */}
          {activeTab === 'benefits' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                  Judul Bagian Seni Jahit Butik Tasikmalaya
                </label>
                <input
                  type="text"
                  value={config.craftsmanshipTitle}
                  onChange={(e) => setConfig({ ...config, craftsmanshipTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                  Uraian Kualitas & Dedikasi Penjahit Butik
                </label>
                <textarea
                  rows={2}
                  value={config.craftsmanshipDesc}
                  onChange={(e) => setConfig({ ...config, craftsmanshipDesc: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2 space-y-3">
                <span className="text-xs font-bold text-[#1C3B2B] block">
                  4 Keunggulan Eksklusif:
                </span>
                {config.benefits.map((b, idx) => (
                  <div key={idx} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8DFC0] space-y-1.5">
                    <input
                      type="text"
                      value={b.title}
                      onChange={(e) => {
                        const next = [...config.benefits];
                        next[idx] = { ...next[idx], title: e.target.value };
                        setConfig({ ...config, benefits: next });
                      }}
                      className="w-full px-2 py-1 text-xs font-bold bg-white border border-[#DCD2C3] rounded-md"
                      placeholder="Judul Keunggulan"
                    />
                    <textarea
                      rows={2}
                      value={b.description}
                      onChange={(e) => {
                        const next = [...config.benefits];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setConfig({ ...config, benefits: next });
                      }}
                      className="w-full px-2 py-1 text-[11px] bg-white border border-[#DCD2C3] rounded-md"
                      placeholder="Deskripsi keunggulan..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT 4: CTA & WHATSAPP CONFIG */}
          {activeTab === 'cta' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                  Teks Tombol CTA Utama *
                </label>
                <input
                  type="text"
                  value={config.primaryCtaText}
                  onChange={(e) => setConfig({ ...config, primaryCtaText: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none font-bold text-[#1C3B2B]"
                  placeholder="Contoh: PESAN SEKARANG - KLAIM DISKON SPESIAL"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                    Aksi Tombol Utama
                  </label>
                  <select
                    value={config.primaryCtaAction}
                    onChange={(e) => setConfig({ ...config, primaryCtaAction: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="checkout">Langsung Form Checkout (Bisa COD / DOKU)</option>
                    <option value="whatsapp">Langsung Chat WhatsApp CS</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                    Sisa Stok Urgensi (Scarcity)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={config.urgencyStockRemaining}
                    onChange={(e) => setConfig({ ...config, urgencyStockRemaining: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                  Template Pesan WhatsApp Otomatis
                </label>
                <textarea
                  rows={3}
                  value={config.whatsappCustomText || ''}
                  onChange={(e) => setConfig({ ...config, whatsappCustomText: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none leading-relaxed"
                  placeholder="Halo Admin saena.id, saya ingin memesan..."
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E8DFC0]">
                <div>
                  <span className="text-xs font-bold text-[#1C3B2B] block">Tampilkan Sticky Floating Bar di Bawah</span>
                  <span className="text-[10px] text-[#7A7266]">Tombol beli mengambang saat halaman di-scroll (Tingkat konversi +35%)</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.showStickyBar}
                  onChange={(e) => setConfig({ ...config, showStickyBar: e.target.checked })}
                  className="w-4 h-4 text-[#1C3B2B] rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB CONTENT 5: GUARANTEE & FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                  Judul Garansi Kepuasan
                </label>
                <input
                  type="text"
                  value={config.guaranteeHeading}
                  onChange={(e) => setConfig({ ...config, guaranteeHeading: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C3B2B] block mb-1">
                  Uraian Jaminan Uang Kembali / Tukar Ukuran
                </label>
                <textarea
                  rows={2}
                  value={config.guaranteeText}
                  onChange={(e) => setConfig({ ...config, guaranteeText: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD2C3] rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2 space-y-3">
                <span className="text-xs font-bold text-[#1C3B2B] block">
                  Daftar Pertanyaan & Jawaban (FAQ):
                </span>
                {config.faqs.map((f, idx) => (
                  <div key={idx} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8DFC0] space-y-1.5">
                    <input
                      type="text"
                      value={f.q}
                      onChange={(e) => {
                        const next = [...config.faqs];
                        next[idx] = { ...next[idx], q: e.target.value };
                        setConfig({ ...config, faqs: next });
                      }}
                      className="w-full px-2 py-1 text-xs font-bold bg-white border border-[#DCD2C3] rounded-md"
                      placeholder="Pertanyaan..."
                    />
                    <textarea
                      rows={2}
                      value={f.a}
                      onChange={(e) => {
                        const next = [...config.faqs];
                        next[idx] = { ...next[idx], a: e.target.value };
                        setConfig({ ...config, faqs: next });
                      }}
                      className="w-full px-2 py-1 text-[11px] bg-white border border-[#DCD2C3] rounded-md"
                      placeholder="Jawaban meyakinkan..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* 3B. LIVE INTERACTIVE PREVIEW (RIGHT - 6 COLS) */}
        <div className="xl:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#1C3B2B]" />
              <span className="text-xs font-bold text-[#1C3B2B]">
                Live Preview Halaman Produk
              </span>
            </div>

            {/* Device Switcher (Desktop vs Mobile) */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5DDD2] shadow-2xs">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  previewDevice === 'desktop'
                    ? 'bg-[#1C3B2B] text-white'
                    : 'text-[#7A7266] hover:text-[#1C3B2B]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  previewDevice === 'mobile'
                    ? 'bg-[#1C3B2B] text-white'
                    : 'text-[#7A7266] hover:text-[#1C3B2B]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Preview Frame */}
          <div className="bg-[#EFE9E0] p-3 sm:p-4 rounded-3xl border border-[#DCD2C3] flex justify-center shadow-inner overflow-hidden">
            <div 
              className={`bg-[#FAF8F5] transition-all duration-300 rounded-2xl overflow-y-auto shadow-2xl border border-[#D5C9B8] max-h-[820px] ${
                previewDevice === 'mobile' ? 'w-[375px]' : 'w-full'
              }`}
            >
              <ProductLandingPage 
                product={selectedProduct} 
                config={config} 
                isPreview={true}
              />
            </div>
          </div>
        </div>

      </div>

      {/* 4. FULLSCREEN PREVIEW MODAL */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col">
          <div className="bg-[#1C3B2B] text-white px-5 py-3 flex items-center justify-between border-b border-[#2D543F]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-[#E6CBA6]">
                Preview Langsung: {selectedProduct.name}
              </span>
              <span className="text-xs text-white/60 hidden sm:inline">
                (Tampilan persis seperti yang akan dilihat pengunjung iklan Anda)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Tersalin!' : 'Salin URL'}</span>
              </button>

              <button
                onClick={() => setShowLiveModal(false)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#B34033] hover:bg-red-700 text-white"
              >
                Tutup Preview
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#FAF8F5]">
            <ProductLandingPage 
              product={selectedProduct} 
              config={config} 
              isPreview={true}
              onClosePreview={() => setShowLiveModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
