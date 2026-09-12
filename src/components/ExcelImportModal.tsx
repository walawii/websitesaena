import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  X, 
  Loader2, 
  Layers, 
  DollarSign, 
  Package, 
  Sparkles,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Category, Product } from '../types';
import { 
  downloadExcelTemplate, 
  parseExcelWorkbook, 
  ParsedExcelProduct,
  EXCEL_IMPORT_COLUMNS 
} from '../utils/excelHelper';
import confetti from 'canvas-confetti';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<Category, string> = {
  'all': 'Semua Kategori',
  'abaya-gamis': 'Abaya & Gamis',
  'hijab-pashmina': 'Hijab & Pashmina',
  'dress-kaftan': 'Dress & Kaftan',
  'koko-kurta': 'Koko & Kurta',
  'mukena-silk': 'Mukena Silk',
  'aksesoris': 'Aksesoris'
};

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { addMultipleProducts, formatPrice } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedExcelProduct[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [showColumnGuide, setShowColumnGuide] = useState(false);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file) return;
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setParseError('Format file tidak didukung. Harap unggah file dengan format .xlsx, .xls, atau .csv');
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setParseError(null);
    setIsParsing(true);
    setIsSuccess(false);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelWorkbook(buffer);
      setParsedItems(result.products);
      if (result.products.length === 0) {
        setParseError('File Excel kosong atau tidak memiliki baris data produk.');
      }
    } catch (err: any) {
      console.error('Error parsing Excel file:', err);
      setParseError(err.message || 'Gagal membaca isi file Excel. Pastikan format kolom sesuai template.');
      setParsedItems([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemoveRow = (indexToRemove: number) => {
    setParsedItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateCategory = (index: number, newCategory: Category) => {
    setParsedItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, category: newCategory };
      }
      return item;
    }));
  };

  const handleImportSubmit = async () => {
    const validItems = parsedItems.filter(item => item.isValid);
    if (validItems.length === 0) {
      alert('Tidak ada produk valid yang dapat diimpor.');
      return;
    }

    setIsSaving(true);
    setImportProgress(10);

    try {
      // Map parsed excel items to Partial<Product>
      const newProductsPayload: Partial<Product>[] = validItems.map(item => ({
        name: item.name,
        category: item.category,
        price: item.price,
        originalPrice: item.originalPrice,
        description: item.description,
        shortDescription: item.shortDescription,
        sourceUrl: item.sourceUrl,
        sku: item.sku,
        weight: item.weight,
        dimensions: item.dimensions,
        discount: item.discount,
        currency: item.currency,
        material: item.material,
        careInstructions: item.careInstructions,
        features: item.features,
        sizes: item.sizes,
        colors: item.colors,
        stock: item.stock,
        totalStock: item.totalStock,
        images: item.images
      }));

      setImportProgress(40);
      const created = await addMultipleProducts(newProductsPayload);
      setImportProgress(100);
      setImportedCount(created.length);
      setIsSuccess(true);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {}

    } catch (err: any) {
      console.error('Failed importing excel products:', err);
      alert('Gagal mengimpor produk: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = parsedItems.filter(i => i.isValid).length;
  const invalidCount = parsedItems.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-stone-900 border border-[#C5A880]/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-stone-100">
                  Impor Massal Produk via Excel (.xlsx / .xls)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#1C3B2B] text-[#C5A880] text-[10px] font-semibold border border-[#C5A880]/30">
                  Format Resmi saena.id
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Unggah berkas spreadsheet dengan 37 kolom terstandar (nama, variasi warna, gambar, stok, dan deskripsi).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Action Bar: Download Templates */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-stone-950 to-stone-900 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#C5A880]/10 text-[#C5A880] border border-[#C5A880]/30 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-200">
                  Belum punya template format Excel?
                </h4>
                <p className="text-[11px] text-stone-400">
                  Unduh template resmi yang sudah terisi contoh produk busana muslim, varian warna, foto, dan harga.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                id="download-excel-xlsx-template-btn"
                onClick={() => downloadExcelTemplate('xlsx')}
                className="px-3 py-1.5 rounded-lg bg-[#1C3B2B] hover:bg-[#28523C] text-[#C5A880] border border-[#C5A880]/40 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Unduh Template .xlsx</span>
              </button>
              <button
                type="button"
                id="download-excel-csv-template-btn"
                onClick={() => downloadExcelTemplate('csv')}
                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-all"
                title="Unduh versi CSV"
              >
                .CSV
              </button>
            </div>
          </div>

          {/* Collapsible Column Guide */}
          <div className="rounded-xl border border-stone-800 bg-stone-950/60 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowColumnGuide(!showColumnGuide)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-stone-300 hover:text-stone-100 hover:bg-stone-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-stone-200">
                  Rincian 37 Format Kolom yang Didukung (Sesuai Format Lampiran)
                </span>
              </div>
              {showColumnGuide ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>

            {showColumnGuide && (
              <div className="p-4 border-t border-stone-800/60 bg-stone-950 space-y-3">
                <p className="text-stone-400 leading-relaxed text-[11px]">
                  Sistem otomatis memetakan kolom dari tabel Anda ke struktur etalase butik <b>saena.id</b>:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {EXCEL_IMPORT_COLUMNS.map((col, cIdx) => (
                    <span 
                      key={cIdx} 
                      className="px-2 py-0.5 rounded bg-stone-800/80 border border-stone-700/60 text-stone-300 text-[10px] font-mono"
                    >
                      {col}
                    </span>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 text-[11px] text-stone-300 space-y-1">
                  <p><b className="text-[#C5A880]">Tips Variasi Warna:</b> Tuliskan nama warna di <i>Opsi Variasi 1</i> (contoh: <code className="text-amber-300">Emerald Forest, Champagne Taupe, Midnight Onyx</code>). Sistem otomatis mendeteksi kode warna hex dan memasangkannya dengan <i>Gambar Variasi 1 s/d 9</i>.</p>
                  <p><b className="text-[#C5A880]">Tips Foto Produk:</b> Cukup tempel link URL foto langsung (misal Unsplash, CDN Shopee/TikTok/Imgur) di <i>Foto Produk 1 s/d 9</i>.</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Dropzone */}
          {parsedItems.length === 0 && !isSuccess && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-emerald-400 bg-emerald-950/20 shadow-lg scale-[1.01]' 
                  : 'border-stone-700 hover:border-[#C5A880] bg-stone-950/50 hover:bg-stone-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="max-w-md mx-auto space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1C3B2B]/60 border border-[#C5A880]/30 flex items-center justify-center text-[#C5A880] shadow-md">
                  {isParsing ? (
                    <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                  ) : (
                    <Upload className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <h4 className="text-base font-semibold text-stone-100">
                    {isParsing ? 'Membaca data spreadsheet...' : 'Klik atau seret file Excel ke sini'}
                  </h4>
                  <p className="text-xs text-stone-400 mt-1">
                    Mendukung berkas <b>.xlsx</b>, <b>.xls</b>, atau <b>.csv</b>
                  </p>
                </div>

                <div className="pt-2">
                  <span className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold inline-flex items-center gap-2 border border-stone-700 transition-colors">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    Pilih File Excel dari Perangkat
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {parseError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal memproses berkas Excel:</p>
                <p className="mt-0.5 text-red-300">{parseError}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs underline font-semibold text-red-200 hover:text-white"
                >
                  Coba unggah file lain
                </button>
              </div>
            </div>
          )}

          {/* Success State */}
          {isSuccess && (
            <div className="p-8 rounded-2xl bg-[#1C3B2B]/40 border border-[#C5A880]/40 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-100">
                  {importedCount} Busana Berhasil Diimpor!
                </h3>
                <p className="text-xs text-stone-300 mt-1 max-w-lg mx-auto">
                  Semua data produk, variasi warna, foto galeri, dan rincian harga telah tersimpan di katalog toko dan tersinkronisasi ke Cloud Firestore.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setParsedItems([]);
                    setFileName('');
                    setIsSuccess(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
                >
                  Impor File Excel Lainnya
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#d8bc94] text-stone-950 font-bold text-xs shadow-md transition-all"
                >
                  Tutup & Lihat Katalog
                </button>
              </div>
            </div>
          )}

          {/* Parsed Products Preview Table */}
          {parsedItems.length > 0 && !isSuccess && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-200">{fileName}</span>
                      <span className="text-[10px] text-stone-400">({fileSize})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] mt-0.5">
                      <span className="text-emerald-400 font-medium">✓ {validCount} produk valid</span>
                      {invalidCount > 0 && (
                        <span className="text-red-400 font-medium">✗ {invalidCount} perlu perbaikan</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedItems([]);
                      setFileName('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
                  >
                    Ganti File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950/80">
                <div className="max-h-[380px] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900/90 sticky top-0 z-10 text-stone-400 font-medium border-b border-stone-800">
                      <tr>
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3 min-w-[200px]">Produk & Foto</th>
                        <th className="p-3 min-w-[140px]">Kategori</th>
                        <th className="p-3 min-w-[140px]">Harga (IDR)</th>
                        <th className="p-3 min-w-[180px]">Variasi Warna & Gambar</th>
                        <th className="p-3 min-w-[90px]">Stok</th>
                        <th className="p-3 min-w-[100px]">SKU</th>
                        <th className="p-3 w-12 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60">
                      {parsedItems.map((item, idx) => (
                        <tr 
                          key={idx} 
                          className={`hover:bg-stone-800/30 transition-colors ${
                            !item.isValid ? 'bg-red-950/10' : ''
                          }`}
                        >
                          {/* Row Number & Status */}
                          <td className="p-3 text-center">
                            {item.isValid ? (
                              <span className="text-emerald-400 font-mono text-[11px] font-bold">
                                {item.rowIndex}
                              </span>
                            ) : (
                              <div className="group relative inline-block">
                                <AlertCircle className="w-4 h-4 text-red-400 mx-auto cursor-help" />
                                <div className="hidden group-hover:block absolute left-full top-0 ml-2 z-20 w-48 p-2 rounded bg-stone-900 text-red-300 text-[10px] border border-red-500/40 shadow-xl">
                                  {item.errors.join(', ')}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Product Name & Photo */}
                          <td className="p-3">
                            <div className="flex items-start gap-2.5">
                              <img
                                src={item.images[0] || 'https://images.unsplash.com/photo-1585250004680-753f50549c4b?q=80&w=800&auto=format&fit=crop'}
                                alt={item.name}
                                className="w-11 h-13 object-cover rounded-lg border border-stone-800 shrink-0 bg-stone-900"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-stone-200 line-clamp-2 leading-snug">
                                  {item.name || <span className="text-red-400 italic">Nama belum diisi</span>}
                                </p>
                                {item.shortDescription && (
                                  <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                                    {item.shortDescription}
                                  </p>
                                )}
                                {item.sourceUrl && (
                                  <a 
                                    href={item.sourceUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-[10px] text-[#C5A880] hover:underline flex items-center gap-1 mt-0.5"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    <span>Sumber Marketplace</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category Selector */}
                          <td className="p-3">
                            <select
                              value={item.category}
                              onChange={(e) => handleUpdateCategory(idx, e.target.value as Category)}
                              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-stone-200 text-xs focus:outline-none focus:border-[#C5A880]"
                            >
                              <option value="abaya-gamis">Abaya & Gamis</option>
                              <option value="hijab-pashmina">Hijab & Pashmina</option>
                              <option value="dress-kaftan">Dress & Kaftan</option>
                              <option value="koko-kurta">Koko & Kurta</option>
                              <option value="mukena-silk">Mukena Silk</option>
                              <option value="aksesoris">Aksesoris</option>
                            </select>
                          </td>

                          {/* Price */}
                          <td className="p-3">
                            <div className="font-semibold text-stone-100">
                              {formatPrice(item.price)}
                            </div>
                            {item.originalPrice > item.price && (
                              <div className="text-[10px] text-stone-500 line-through">
                                {formatPrice(item.originalPrice)}
                              </div>
                            )}
                          </td>

                          {/* Colors & Variant images */}
                          <td className="p-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.colors.map((c, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-stone-900 border border-stone-700/80 text-[10px] text-stone-300"
                                >
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full border border-stone-600 shrink-0" 
                                    style={{ backgroundColor: c.hex }} 
                                  />
                                  <span>{c.name}</span>
                                </span>
                              ))}
                            </div>
                            <span className="text-[10px] text-stone-400 block mt-1">
                              Ukuran: {item.sizes.join(', ')}
                            </span>
                          </td>

                          {/* Total Stock */}
                          <td className="p-3">
                            <span className="font-mono font-medium text-stone-300">
                              {item.totalStock} pcs
                            </span>
                          </td>

                          {/* SKU */}
                          <td className="p-3">
                            <span className="font-mono text-[11px] text-stone-400">
                              {item.sku || '-'}
                            </span>
                          </td>

                          {/* Delete Button */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1 rounded text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Hapus baris ini dari impor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-400">
            {parsedItems.length > 0 && !isSuccess && (
              <span>
                Siap mengimpor <b className="text-stone-200">{validCount}</b> dari {parsedItems.length} produk ke katalog.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Batal
            </button>

            {parsedItems.length > 0 && !isSuccess && (
              <button
                type="button"
                id="submit-excel-import-btn"
                onClick={handleImportSubmit}
                disabled={isSaving || validCount === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-bold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Menyimpan ({importProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-stone-950" />
                    <span>Impor {validCount} Produk ke Katalog</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
