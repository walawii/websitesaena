import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Bot,
  Layers,
  Store,
  Sliders,
  DollarSign,
  Download,
  Info
} from 'lucide-react';
import { Category, ProductColor, Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ShopeeLogo, SHOPEE_STORE_URL } from './MarketplaceOrderLinks';
import { exportProductsToExcel } from '../utils/excelHelper';
import confetti from 'canvas-confetti';

interface ScrapedProduct {
  id: string;
  name: string;
  category: Category;
  price: number;
  originalPrice: number;
  material: string;
  description: string;
  careInstructions: string[];
  features: string[];
  sizes: string[];
  colors: ProductColor[];
  images: string[];
  sku: string;
  sourceUrl: string;
  rating?: number;
  soldCount?: number;
  selected?: boolean;
}

interface ShopeeStoreScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (count: number) => void;
}

export const ShopeeStoreScraperModal: React.FC<ShopeeStoreScraperModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { addMultipleProducts, formatPrice, sendPushNotification } = useStore();

  // Scraper inputs
  const [storeUrl, setStoreUrl] = useState(SHOPEE_STORE_URL);
  const [productCount, setProductCount] = useState<number>(8);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priceMarkup, setPriceMarkup] = useState<number>(0);
  const [rawText, setRawText] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Scraping process states
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapingStep, setScrapingStep] = useState<number>(0);
  const [scrapingStepText, setScrapingStepText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scraped results
  const [scrapedResults, setScrapedResults] = useState<ScrapedProduct[]>([]);
  const [storeMeta, setStoreMeta] = useState<{
    shopName: string;
    shopUsername: string;
    shopUrl: string;
    methodUsed: string;
    totalScraped: number;
  } | null>(null);

  // Importing states
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [importedCount, setImportedCount] = useState<number>(0);

  if (!isOpen) return null;

  // Execute Shopee Store Scraping
  const handleStartScrape = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!storeUrl.trim()) {
      setErrorMessage('Silakan masukkan link toko atau username Shopee terlebih dahulu.');
      return;
    }

    setIsScraping(true);
    setErrorMessage(null);
    setScrapedResults([]);
    setStoreMeta(null);
    setImportSuccess(false);

    // Step 1
    setScrapingStep(1);
    setScrapingStepText('Menghubungi server toko Shopee & memeriksa profil toko...');

    const timer1 = setTimeout(() => {
      setScrapingStep(2);
      setScrapingStepText('Mengekstrak katalog produk, foto HD, & variasi warna...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setScrapingStep(3);
      setScrapingStepText('AI Curation: Membersihkan spam keyword & standardisasi spesifikasi butik...');
    }, 2800);

    try {
      const response = await fetch('/api/shopee/scrape-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeUrl: storeUrl.trim(),
          count: productCount,
          rawData: rawText.trim() || undefined,
          categoryFilter: categoryFilter !== 'all' ? categoryFilter : undefined,
          priceMarkupPercent: priceMarkup
        })
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal menjalankan scraping otomatis toko Shopee.');
      }

      setScrapingStep(4);
      setScrapingStepText('Menyiapkan pratinjau produk...');

      // Mark all scraped items as selected by default
      const productsWithSelection: ScrapedProduct[] = (data.products || []).map((p: any) => ({
        ...p,
        selected: true
      }));

      setScrapedResults(productsWithSelection);
      setStoreMeta({
        shopName: data.shopName,
        shopUsername: data.shopUsername,
        shopUrl: data.shopUrl,
        methodUsed: data.methodUsed,
        totalScraped: data.totalScraped
      });
    } catch (err: any) {
      console.error('Shopee scrape error:', err);
      setErrorMessage(err.message || 'Terjadi gangguan saat mengambil data dari toko Shopee.');
    } finally {
      setIsScraping(false);
      setScrapingStep(0);
      setScrapingStepText('');
    }
  };

  // Toggle selection for all products
  const handleToggleSelectAll = () => {
    const allSelected = scrapedResults.every(p => p.selected);
    setScrapedResults(prev => prev.map(p => ({ ...p, selected: !allSelected })));
  };

  // Toggle single product selection
  const handleToggleSelectProduct = (id: string) => {
    setScrapedResults(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  // Batch import selected products to catalog & Firestore
  const handleBatchImport = async () => {
    const selectedItems = scrapedResults.filter(p => p.selected);
    if (selectedItems.length === 0) {
      setErrorMessage('Pilih minimal 1 produk yang ingin diimpor ke katalog.');
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const formattedForStore: Partial<Product>[] = selectedItems.map(item => {
        const stockMap: Record<string, number> = {};
        (item.colors || []).forEach(col => {
          stockMap[col.name] = Number(col.stock) || 12;
        });

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          originalPrice: item.originalPrice,
          material: item.material,
          description: item.description,
          careInstructions: item.careInstructions,
          features: item.features,
          sizes: item.sizes,
          colors: item.colors,
          images: item.images,
          sku: item.sku,
          sourceUrl: item.sourceUrl,
          stock: stockMap,
          totalStock: Object.values(stockMap).reduce((a, b) => a + b, 0),
          isNewArrival: true
        };
      });

      const added = await addMultipleProducts(formattedForStore);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setImportedCount(added.length);
      setImportSuccess(true);
      sendPushNotification(
        'Scrape Shopee Berhasil ✨',
        `${added.length} produk dari toko Shopee @${storeMeta?.shopUsername || 'saena.id'} berhasil diimpor otomatis ke katalog butik.`,
        'system'
      );

      if (onImportComplete) {
        onImportComplete(added.length);
      }
    } catch (err: any) {
      console.error('Batch import error:', err);
      setErrorMessage('Gagal mengimpor produk ke database: ' + (err.message || 'Kesalahan sistem.'));
    } finally {
      setIsImporting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const selected = scrapedResults.filter(p => p.selected);
    const toExport = selected.length > 0 ? selected : scrapedResults;
    if (!toExport.length) return;

    exportProductsToExcel(
      toExport, 
      `shopee-${storeMeta?.shopUsername || 'saena'}-${Date.now().toString().slice(-4)}.xlsx`
    );
  };

  const selectedCount = scrapedResults.filter(p => p.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-[#FAF8F5] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DDD0] overflow-hidden"
      >
        {/* Header with Shopee Signature Orange & Saena.id Theme */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#EE4D2D] via-[#F05537] to-[#1C3B2B] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-inner">
              <ShopeeLogo className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold tracking-wide">
                  Automatisasi Scrape Toko Shopee
                </h2>
                <span className="text-[10px] uppercase font-sans font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-2xs">
                  AI Auto Bot
                </span>
              </div>
              <p className="text-xs text-white/90">
                Tarik katalog produk dari toko resmi Shopee, bersihkan format dengan AI, & impor 1-klik ke database
              </p>
            </div>
          </div>
          <button
            id="close-shopee-scraper-modal-btn"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Form Step: Input Parameters */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#EAE2D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1C3B2B] uppercase tracking-wider">
                <Store className="w-4 h-4 text-[#EE4D2D]" />
                <span>Target Toko Shopee</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#7A7266]">
                <Bot className="w-3.5 h-3.5 text-emerald-600" />
                <span>Didukung Gemini 3.8 Flash Scraper</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    id="shopee-store-url-input"
                    type="text"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder="https://shopee.co.id/saena.id atau username toko"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D5C9B8] rounded-xl text-xs sm:text-sm text-[#2D2823] focus:outline-hidden focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] font-mono"
                    disabled={isScraping}
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] text-[#A0988A] hidden sm:inline">
                    Shopee URL / Username
                  </span>
                </div>

                <button
                  id="start-shopee-scrape-btn"
                  onClick={handleStartScrape}
                  disabled={isScraping || !storeUrl.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#EE4D2D] to-[#F05537] hover:from-[#d94121] hover:to-[#e04527] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
                >
                  {isScraping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Scrape...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Mulai Scrape Otomatis</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-[#7A7266]">Toko Resmi:</span>
                <button
                  type="button"
                  onClick={() => {
                    setStoreUrl('https://shopee.co.id/saena.id');
                    setRawText('');
                  }}
                  className="px-2.5 py-1 bg-[#EE4D2D]/10 hover:bg-[#EE4D2D]/20 text-[#EE4D2D] rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 border border-[#EE4D2D]/30"
                >
                  <ShopeeLogo className="w-3 h-3" />
                  <span>@saena.id (Mukena Dewasa Resmi Shopee)</span>
                </button>
              </div>

              {/* Informational Banner about Shopee Anti-Bot & Verified Catalog */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-[11px]">
                    Katalog Resmi Toko Shopee saena.id:
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Sistem otomatis mengekstrak koleksi asli toko Shopee <strong>saena.id</strong> (seperti <em>Mukena Santorini 2in1 Lasercut Tas Rantai, Mukena Hanum Sutra Velvet, Mukena 3in1 Crinkle Lesti, Mukena Terusan Armani Motif</em>). Jika ingin scrape produk custom lain dari Shopee tanpa terhalang proteksi anti-bot Shopee, gunakan <strong>Opsi Ekstraksi Lanjutan</strong> di bawah.
                  </p>
                </div>
              </div>
            </div>

            {/* Scraping Settings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#F0EAE1]">
              {/* Product Count Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-[#524B42] mb-1.5 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#7A7266]" />
                  <span>Jumlah Produk:</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 8, 12, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setProductCount(num)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        productCount === num 
                          ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' 
                          : 'bg-[#FAF8F5] text-[#524B42] border-[#E5DDD0] hover:bg-stone-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-[#524B42] mb-1.5 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-[#7A7266]" />
                  <span>Filter Kategori:</span>
                </label>
                <select
                  id="shopee-category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E5DDD0] rounded-lg text-xs text-[#2D2823] focus:outline-hidden focus:ring-1 focus:ring-[#EE4D2D]"
                >
                  <option value="all">Semua Kategori Busana</option>
                  <option value="abaya-gamis">Abaya & Gamis</option>
                  <option value="hijab-pashmina">Hijab & Pashmina</option>
                  <option value="mukena-silk">Mukena Sutra Mewah</option>
                  <option value="dress-kaftan">Dress & Kaftan Pesta</option>
                  <option value="koko-kurta">Baju Koko & Kurta Pria</option>
                  <option value="aksesoris">Aksesoris Hijab</option>
                </select>
              </div>

              {/* Price Markup */}
              <div>
                <label className="block text-[11px] font-semibold text-[#524B42] mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-[#7A7266]" />
                  <span>Penyesuaian Harga:</span>
                </label>
                <select
                  id="shopee-price-markup"
                  value={priceMarkup}
                  onChange={(e) => setPriceMarkup(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E5DDD0] rounded-lg text-xs text-[#2D2823] focus:outline-hidden focus:ring-1 focus:ring-[#EE4D2D]"
                >
                  <option value={0}>Sama dengan Shopee (+0%)</option>
                  <option value={5}>Markup +5%</option>
                  <option value={10}>Markup +10%</option>
                  <option value={15}>Markup +15%</option>
                </select>
              </div>
            </div>

            {/* Advanced Raw Data Accordion */}
            <div className="pt-2 border-t border-[#F0EAE1]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] font-medium text-[#7A7266] hover:text-[#EE4D2D] flex items-center gap-1 transition-colors"
              >
                <span>Opsi Ekstraksi Lanjutan (Salin Teks Halaman Toko Shopee)</span>
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAdvanced && (
                <div className="mt-2 space-y-2 animate-in fade-in">
                  <p className="text-[11px] text-[#7A7266]">
                    Jika ingin mengekstrak data dari halaman toko yang sedang Anda buka di browser, salin seluruh teks/HTML halaman toko Shopee lalu tempelkan di bawah:
                  </p>
                  <textarea
                    rows={3}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Tempel teks daftar produk toko Shopee di sini..."
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#D5C9B8] rounded-xl text-xs text-[#2D2823] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#EE4D2D]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Progress Bar during Scraping */}
          {isScraping && (
            <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#EE4D2D] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#EE4D2D]" />
                  <span>Menjalankan Automatisasi Scraper...</span>
                </span>
                <span className="text-[#7A7266]">Langkah {scrapingStep} dari 4</span>
              </div>

              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#EE4D2D] to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${(scrapingStep / 4) * 100}%` }}
                />
              </div>

              <p className="text-xs text-[#524B42] font-medium">
                {scrapingStepText}
              </p>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Perhatian:</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Banner after Batch Import */}
          {importSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm">Alhamdulillah, Impor Berhasil!</p>
                  <p className="text-emerald-700">
                    {importedCount} produk dari toko Shopee berhasil disimpan ke katalog dan database Firestore.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                Lihat di Katalog
              </button>
            </div>
          )}

          {/* Scraped Results Section */}
          {scrapedResults.length > 0 && (
            <div className="space-y-4 animate-in fade-in">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E5DDD0]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1C3B2B] hover:text-[#EE4D2D] transition-colors"
                  >
                    {scrapedResults.every(p => p.selected) ? (
                      <CheckSquare className="w-4 h-4 text-[#1C3B2B]" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                    <span>Pilih Semua ({scrapedResults.length})</span>
                  </button>

                  <span className="text-[#D5C9B8]">|</span>

                  <span className="text-xs text-[#7A7266]">
                    <strong className="text-[#1C3B2B] font-bold">{selectedCount}</strong> produk dipilih
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    title="Unduh data produk hasil scrape dalam format Excel .xlsx"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Export Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchImport}
                    disabled={isImporting || selectedCount === 0}
                    className="px-4 py-1.5 bg-gradient-to-r from-[#1C3B2B] to-[#2E5A42] hover:from-[#152e22] hover:to-[#224432] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan ke Database...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Impor ({selectedCount}) ke Database</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scrapedResults.map((product) => {
                  const isChecked = !!product.selected;
                  const firstImage = product.images[0] || product.colors[0]?.image;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleToggleSelectProduct(product.id)}
                      className={`relative flex gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked 
                          ? 'bg-white border-[#1C3B2B] shadow-xs ring-1 ring-[#1C3B2B]/20' 
                          : 'bg-white/60 border-[#EAE2D5] opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="pt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-4 h-4 rounded bg-[#1C3B2B] text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded border border-stone-300 bg-white" />
                        )}
                      </div>

                      {/* Thumbnail */}
                      <div className="w-16 h-20 rounded-lg overflow-hidden bg-stone-100 shrink-0 relative border border-[#EAE2D5]">
                        <img
                          src={firstImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1 rounded-sm font-mono">
                          {product.colors.length} col
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8EFEA] text-[#1C3B2B]">
                              {product.category}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {product.sku}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-[#2D2823] line-clamp-1">
                            {product.name}
                          </h4>

                          <p className="text-[11px] text-[#7A7266] line-clamp-1 mt-0.5">
                            {product.material}
                          </p>
                        </div>

                        {/* Price & Colors Swatch */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#F0EAE1]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-bold text-[#1C3B2B]">
                              {formatPrice(product.price)}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-[10px] text-stone-400 line-through">
                                {formatPrice(product.originalPrice)}
                              </span>
                            )}
                          </div>

                          {/* Color dots */}
                          <div className="flex items-center gap-1">
                            {product.colors.slice(0, 4).map((c, i) => (
                              <div
                                key={i}
                                className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            ))}
                            {product.colors.length > 4 && (
                              <span className="text-[9px] text-stone-500">+{product.colors.length - 4}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guide & Value Proposition Info Card */}
          <div className="bg-[#FAF0E6]/50 rounded-xl p-4 border border-[#EADAC5] text-xs text-[#524B42] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#8C6D46]">
              <Info className="w-4 h-4" />
              <span>Keunggulan Automatisasi Scraper Shopee saena.id</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#7A6B5D]">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Pembersih Spam Otomatis</strong>: Kata seperti "COD", "Termurah", "Grosir" dihapus dan diubah menjadi nama butik elegan.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Ekstraksi Varian Lengkap</strong>: Mendeteksi warna, hex kode CSS, dan foto varian resolusi tinggi.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Sinkronisasi Cloud</strong>: Langsung tersimpan ke Firestore dan terhubung dengan sistem WhatsApp & Payment Gateway.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Dukungan Export Excel</strong>: Bisa diexport ke .xlsx kapan saja untuk kebutuhan laporan atau integrasi marketplace lain.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-t border-[#EAE2D5] text-xs shrink-0">
          <div className="text-[#7A7266]">
            Target: <span className="font-mono font-semibold text-[#1C3B2B]">{storeUrl}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl transition-colors"
            >
              Tutup
            </button>

            {scrapedResults.length > 0 && (
              <button
                type="button"
                onClick={handleBatchImport}
                disabled={isImporting || selectedCount === 0}
                className="px-5 py-2 bg-[#1C3B2B] hover:bg-[#2A4D3B] text-white font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Impor {selectedCount} Produk Terpilih</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
