import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Link2, 
  Sparkles, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ShoppingBag, 
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Category, ProductColor, Product } from '../types';
import { useStore } from '../context/StoreContext';
import confetti from 'canvas-confetti';

interface ExtractedData {
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
}

interface ImportMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (product: Product) => void;
  onOpenManualWithData?: (data: Partial<ExtractedData>) => void;
  onOpenShopeeStoreScraper?: () => void;
}

export const ImportMarketplaceModal: React.FC<ImportMarketplaceModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  onOpenManualWithData,
  onOpenShopeeStoreScraper
}) => {
  const { addNewProduct, formatPrice } = useStore();

  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [showAdvancedText, setShowAdvancedText] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<ExtractedData | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<'shopee' | 'tiktok' | 'other'>('other');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle URL change & auto-detect platform
  const handleUrlChange = (value: string) => {
    setUrl(value);
    setErrorMessage(null);
    const lower = value.toLowerCase();
    if (lower.includes('shopee') || lower.includes('shope.ee')) {
      setDetectedPlatform('shopee');
    } else if (lower.includes('tiktok') || lower.includes('douyin')) {
      setDetectedPlatform('tiktok');
    } else {
      setDetectedPlatform('other');
    }
  };

  // Sample URLs for quick testing by admin
  const applySampleUrl = (type: 'shopee' | 'tiktok') => {
    if (type === 'shopee') {
      handleUrlChange('https://shopee.co.id/Gamis-Abaya-Silk-Mulberry-Busui-Friendly-Mewah-i.2847192.93817294');
    } else {
      handleUrlChange('https://vt.tiktok.com/ZS8yH3Qap/');
    }
  };

  // Perform AI & automated extraction
  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setErrorMessage('Silakan tempelkan link produk Shopee atau TikTok terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setExtractedResult(null);
    setLoadingStep('Menghubungi tautan marketplace & membaca halaman produk...');

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep('Menganalisis varian warna, foto produk, dan detail busana...');
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep('Menyusun spesifikasi butik saena.id dengan format terstruktur...');
      }, 2400);

      const response = await fetch('/api/import-marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url.trim(),
          rawText: rawText.trim() || undefined
        })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengekstrak informasi dari tautan marketplace.');
      }

      setDetectedPlatform(data.sourcePlatform || 'other');
      setExtractedResult(data.extracted);
    } catch (err: any) {
      console.error('Import extraction error:', err);
      setErrorMessage(err.message || 'Gagal memproses tautan. Pastikan link dapat diakses atau tambahkan teks rincian produk.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Save directly to catalog & Firestore
  const handleSaveDirectly = async () => {
    if (!extractedResult) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Build stock map per color
      const stockMap: Record<string, number> = {};
      extractedResult.colors.forEach(c => {
        stockMap[c.name] = Number(c.stock) || 10;
      });

      const newProd = await addNewProduct({
        name: extractedResult.name,
        category: extractedResult.category,
        price: extractedResult.price,
        originalPrice: extractedResult.originalPrice,
        material: extractedResult.material,
        description: extractedResult.description,
        careInstructions: extractedResult.careInstructions,
        features: extractedResult.features,
        sizes: extractedResult.sizes,
        colors: extractedResult.colors,
        stock: stockMap,
        images: extractedResult.images
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}

      setSaveSuccess(true);
      if (onImportComplete) {
        onImportComplete(newProd);
      }

      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving imported product:', err);
      setErrorMessage('Gagal menyimpan produk ke database: ' + (err.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Transfer extracted info to manual editor
  const handleTransferToManual = () => {
    if (!extractedResult) return;
    if (onOpenManualWithData) {
      onOpenManualWithData(extractedResult);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E5DDD2] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1C3B2B] to-[#2A4D3B] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300 backdrop-blur-xs border border-white/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold tracking-wide flex items-center gap-2">
                Otomatisasi Impor Produk
                <span className="text-[10px] uppercase font-sans font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-stone-950">
                  Shopee &amp; TikTok
                </span>
              </h2>
              <p className="text-xs text-white/80">
                Tambahkan busana baru cukup dengan menempelkan link produk
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#2D2926]">
          {/* Direct link to Store-Wide Scraper */}
          {onOpenShopeeStoreScraper && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-gradient-to-r from-orange-50 via-amber-50 to-emerald-50 border border-orange-200/80 rounded-xl text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EE4D2D] animate-ping shrink-0" />
                <span className="text-stone-800 font-medium">
                  Ingin scrape otomatis seluruh katalog toko Shopee <strong>saena.id</strong> sekaligus?
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShopeeStoreScraper();
                }}
                className="self-end sm:self-auto px-3 py-1.5 bg-gradient-to-r from-[#EE4D2D] to-[#F05537] hover:from-[#d94121] hover:to-[#e04527] text-white font-bold rounded-lg text-[11px] shadow-2xs flex items-center gap-1.5 transition-all shrink-0"
              >
                <span>Buka Scraper Toko</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Status Platform Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#FDFBF7] rounded-xl border border-[#EBE3D5] text-xs">
            <span className="text-[#685F53] font-medium">Mendukung Tautan:</span>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                detectedPlatform === 'shopee' 
                  ? 'bg-orange-500 text-white shadow-xs' 
                  : 'bg-orange-100 text-orange-700 border border-orange-200'
              }`}>
                <span>Shopee</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                detectedPlatform === 'tiktok' 
                  ? 'bg-black text-white shadow-xs' 
                  : 'bg-stone-100 text-stone-700 border border-stone-300'
              }`}>
                <span>TikTok Shop</span>
              </span>
              <span className="text-[11px] text-[#8C8377]">&bull; Tokopedia / Web</span>
            </div>
          </div>

          {/* Form Input URL */}
          <form onSubmit={handleExtract} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C3B2B] flex items-center justify-between">
                <span>Link Produk Marketplace:</span>
                <div className="flex items-center gap-1.5 text-[11px] font-normal text-[#8C8377]">
                  <span>Coba contoh:</span>
                  <button
                    type="button"
                    onClick={() => applySampleUrl('shopee')}
                    className="text-orange-600 hover:underline font-medium"
                  >
                    Shopee
                  </button>
                  <span>&bull;</span>
                  <button
                    type="button"
                    onClick={() => applySampleUrl('tiktok')}
                    className="text-stone-800 hover:underline font-medium"
                  >
                    TikTok
                  </button>
                </div>
              </label>

              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#8C8377]">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  id="marketplace-url-input"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://shopee.co.id/... atau https://vt.tiktok.com/..."
                  disabled={isLoading || isSaving}
                  required
                  className="w-full pl-10 pr-24 py-3 bg-[#FBF9F5] border border-[#D5C9B7] rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-[#1C3B2B] focus:border-transparent placeholder:text-[#A89F91]"
                />
                <button
                  type="submit"
                  id="extract-marketplace-btn"
                  disabled={isLoading || !url.trim()}
                  className="absolute right-1.5 px-3 py-2 bg-[#1C3B2B] hover:bg-[#2A4D3B] text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analisis...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Ekstrak</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Optional Raw Text / Caption Accordion */}
            <div className="border border-[#E5DDD2] rounded-xl overflow-hidden bg-[#FAF8F5]">
              <button
                type="button"
                onClick={() => setShowAdvancedText(!showAdvancedText)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-[#524B40] hover:bg-[#F3EFEA] transition-colors"
              >
                <span className="font-medium flex items-center gap-1.5">
                  <span>Catatan / Teks Deskripsi Tambahan (Opsional)</span>
                  <span className="text-[10px] text-[#8C8377] bg-white px-1.5 py-0.5 rounded border border-[#E5DDD2]">
                    Bila link diproteksi
                  </span>
                </span>
                {showAdvancedText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvancedText && (
                <div className="p-3 border-t border-[#E5DDD2] space-y-2 bg-white">
                  <p className="text-[11px] text-[#7A7266]">
                    Jika tautan marketplace memerlukan login khusus aplikasi, Anda dapat menempelkan teks judul produk atau rincian varian warna di sini agar AI memprosesnya secara akurat:
                  </p>
                  <textarea
                    rows={3}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Contoh: Gamis Silk Abaya Premium. Varian warna: Emerald (stok 20), Champagne Mocca (stok 15), Onyx Black (stok 10). Bahan Mulberry Silk, busui friendly."
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#D5C9B7] rounded-lg text-xs focus:ring-1 focus:ring-[#1C3B2B] focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </form>

          {/* Loading Animation Indicator */}
          {isLoading && (
            <div className="p-6 bg-[#F9F7F3] rounded-2xl border border-[#E2D8C9] text-center space-y-3 animate-pulse">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#1C3B2B]/10 flex items-center justify-center text-[#1C3B2B]">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1C3B2B]">Mengekstrak Data Produk...</p>
                <p className="text-xs text-[#7A7266] mt-1 font-mono">{loadingStep}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Perhatian</p>
                <p className="text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {saveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Berhasil Ditambahkan!</p>
                <p className="text-emerald-700">Produk telah dimasukkan ke etalase dan disinkronkan ke Firestore.</p>
              </div>
            </div>
          )}

          {/* Extracted Result Preview Card */}
          {extractedResult && !isLoading && (
            <div className="border border-[#D5C9B7] rounded-2xl overflow-hidden bg-[#FBF9F5] shadow-sm space-y-4">
              <div className="p-4 bg-gradient-to-r from-[#EFEAE2] to-[#FAF8F5] border-b border-[#E5DDD2] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1C3B2B]">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Hasil Analisis Otomatis Siap Diimpor</span>
                </div>
                <span className="text-[11px] font-semibold text-[#8C8377] uppercase px-2 py-0.5 rounded-md bg-white border border-[#E5DDD2]">
                  Kategori: {extractedResult.category.replace('-', ' ')}
                </span>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* Product Summary Header */}
                <div className="flex items-start gap-4">
                  <img
                    src={extractedResult.images[0] || (extractedResult.colors[0]?.image)}
                    alt={extractedResult.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-24 object-cover rounded-xl border border-[#D5C9B7] bg-white shrink-0 shadow-xs"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#1C3B2B] leading-snug">
                      {extractedResult.name}
                    </h3>
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-sm font-bold text-[#B38F5B]">
                        {formatPrice(extractedResult.price)}
                      </span>
                      {extractedResult.originalPrice > extractedResult.price && (
                        <span className="text-xs text-[#8C8377] line-through">
                          {formatPrice(extractedResult.originalPrice)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#685F53] font-medium">
                      Bahan: <span className="text-[#1C3B2B]">{extractedResult.material}</span>
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {extractedResult.sizes.map((s, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 bg-white border border-[#E5DDD2] rounded-md text-[#524B40] font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description Preview */}
                <div className="p-3 bg-white rounded-xl border border-[#E5DDD2] text-xs text-[#524B40] leading-relaxed">
                  <p className="font-semibold text-[#1C3B2B] mb-1">Deskripsi Busana:</p>
                  <p className="line-clamp-3">{extractedResult.description}</p>
                </div>

                {/* Color Variants with Photos & Stock */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1C3B2B]">
                    <span>Varian Warna &amp; Stok Terdeteksi ({extractedResult.colors.length} Varian):</span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Total Stok: {extractedResult.colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0)} pcs
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {extractedResult.colors.map((color, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-[#E5DDD2] shadow-2xs"
                      >
                        {color.image ? (
                          <img
                            src={color.image}
                            alt={color.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-12 object-cover rounded-lg border border-[#E5DDD2] shrink-0"
                          />
                        ) : (
                          <div 
                            className="w-10 h-12 rounded-lg border border-[#E5DDD2] shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: color.hex }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-3 h-3 rounded-full border border-black/10 shrink-0" 
                              style={{ backgroundColor: color.hex }} 
                            />
                            <p className="text-xs font-bold text-[#1C3B2B] truncate">{color.name}</p>
                          </div>
                          <p className="text-[11px] text-[#7A7266] font-mono mt-0.5">
                            Stok: <span className="font-semibold text-[#1C3B2B]">{color.stock} pcs</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E5DDD2] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#524B40] hover:bg-[#EAE2D5] transition-colors w-full sm:w-auto"
          >
            Tutup
          </button>

          {extractedResult && (
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                id="transfer-to-manual-btn"
                onClick={handleTransferToManual}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl border border-[#D5C9B7] hover:bg-white text-xs font-bold text-[#1C3B2B] transition-colors"
                title="Buka form manual lengkap dengan data terisi"
              >
                Kustomisasi Lebih Lanjut
              </button>

              <button
                type="button"
                id="save-imported-product-btn"
                onClick={handleSaveDirectly}
                disabled={isSaving || saveSuccess}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1C3B2B] hover:bg-[#2A4D3B] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                    <span>Simpan Langsung ke Katalog</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
