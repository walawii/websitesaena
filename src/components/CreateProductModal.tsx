import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Save, 
  Upload, 
  Image as ImageIcon, 
  Palette, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  RefreshCw, 
  AlertCircle,
  Link,
  ChevronDown,
  FileSpreadsheet
} from 'lucide-react';
import { Category, ProductColor } from '../types';
import { useStore } from '../context/StoreContext';
import { compressAndEncodeImage, CURATED_COLOR_PRESETS } from '../utils/imageHelper';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<{
    name: string;
    category: Category;
    price: number;
    originalPrice: number;
    material: string;
    description: string;
    colors: ProductColor[];
    images: string[];
    careInstructions: string[];
    features: string[];
    sizes: string[];
  }> | null;
  onOpenMarketplaceImport?: () => void;
  onOpenExcelImport?: () => void;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({ 
  isOpen, 
  onClose,
  initialData,
  onOpenMarketplaceImport,
  onOpenExcelImport
}) => {
  const { addNewProduct, formatPrice, sendPushNotification } = useStore();

  // Basic info states
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<Category>(initialData?.category || 'abaya-gamis');
  const [price, setPrice] = useState<number>(initialData?.price || 495000);
  const [originalPrice, setOriginalPrice] = useState<number>(initialData?.originalPrice || 595000);
  const [material, setMaterial] = useState(initialData?.material || 'Arabian Mulberry Silk Premium');
  const [description, setDescription] = useState(
    initialData?.description ||
    'Koleksi busana syar\'i eksklusif dengan siluet anggun, jahitan butik presisi, ramah wudhu (zipper manset), dan bukaan depan (busui friendly). Nyaman dipakai sepanjang hari dengan drape kain jatuh mewah.'
  );

  // Colors state
  const [colors, setColors] = useState<ProductColor[]>(
    initialData?.colors && initialData.colors.length > 0
      ? initialData.colors
      : [
          {
            name: 'Emerald Forest',
            hex: '#1C3B2B',
            stock: 15,
            image: CURATED_COLOR_PRESETS[0].url
          },
          {
            name: 'Champagne Mocca',
            hex: '#9E866C',
            stock: 12,
            image: CURATED_COLOR_PRESETS[1].url
          }
        ]
  );

  // Sync when initialData changes
  React.useEffect(() => {
    if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.category) setCategory(initialData.category);
      if (typeof initialData.price === 'number') setPrice(initialData.price);
      if (typeof initialData.originalPrice === 'number') setOriginalPrice(initialData.originalPrice);
      if (initialData.material) setMaterial(initialData.material);
      if (initialData.description) setDescription(initialData.description);
      if (initialData.colors && initialData.colors.length > 0) setColors(initialData.colors);
    }
  }, [initialData]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  if (!isOpen) return null;

  // Calculate total stock live
  const totalStockCalculated = colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0);

  // Field updates
  const handleColorChange = (index: number, field: keyof ProductColor, value: any) => {
    setColors(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Add new color variant
  const handleAddColor = () => {
    const presetItem = CURATED_COLOR_PRESETS[colors.length % CURATED_COLOR_PRESETS.length];
    const newColor: ProductColor = {
      name: `Varian Warna ${colors.length + 1}`,
      hex: presetItem.hex,
      stock: 10,
      image: presetItem.url
    };
    setColors(prev => [...prev, newColor]);
  };

  // Remove color variant
  const handleRemoveColor = (index: number) => {
    if (colors.length <= 1) {
      alert('Minimal harus ada 1 varian warna.');
      return;
    }
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  // File upload with Canvas Base64 compression
  const handleFileUpload = async (index: number, file: File) => {
    try {
      setUploadingIndex(index);
      setErrorMessage(null);
      const base64Url = await compressAndEncodeImage(file, 850, 0.82);
      handleColorChange(index, 'image', base64Url);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memproses gambar');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Preset selection
  const handleSelectPreset = (index: number, presetUrl: string) => {
    handleColorChange(index, 'image', presetUrl);
    setActivePresetIndex(null);
  };

  // Form submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama koleksi busana tidak boleh kosong.');
      return;
    }
    if (colors.length === 0) {
      setErrorMessage('Harap tentukan minimal satu varian warna.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Build stock map per color
      const stockMap: Record<string, number> = {};
      colors.forEach(c => {
        stockMap[c.name] = Math.max(0, Number(c.stock) || 0);
      });

      // Collect all images
      const allImages = colors.map(c => c.image).filter(Boolean) as string[];
      const uniqueImages = Array.from(new Set(allImages));

      await addNewProduct({
        name: name.trim(),
        category,
        price: Number(price) || 495000,
        originalPrice: Number(originalPrice) || Number(price),
        material: material.trim(),
        description: description.trim(),
        colors: colors.map(c => ({
          name: c.name.trim(),
          hex: c.hex,
          stock: Math.max(0, Number(c.stock) || 0),
          image: c.image
        })),
        stock: stockMap,
        totalStock: totalStockCalculated,
        images: uniqueImages.length > 0 ? uniqueImages : [CURATED_COLOR_PRESETS[0].url]
      });

      sendPushNotification(
        'Busana Baru Ditambahkan ke Database 👗',
        `${name.trim()} dengan ${colors.length} varian warna kini aktif di katalog.`,
        'system'
      );

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error adding product:', err);
      setErrorMessage(err?.message || 'Gagal menyimpan busana baru ke database Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      id="create-product-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <motion.div
        id="create-product-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-stone-900 border border-amber-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-stone-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-amber-200">
                  Tambah Busana Baru & Rincian Stok Warna
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-semibold">
                  Tersimpan di Database
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Atur informasi busana, deskripsi lengkap, rincian stok per warna, dan unggah foto per warna.
              </p>
            </div>
          </div>
          <button
            id="close-create-product-btn"
            onClick={onClose}
            disabled={isSaving}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Koleksi busana baru & foto varian berhasil disimpan ke database Firestore!</span>
            </div>
          )}

          {/* Quick Marketplace & Excel Import Shortcut Banner */}
          {(onOpenMarketplaceImport || onOpenExcelImport) && (
            <div className="p-4 rounded-xl bg-stone-950 border border-amber-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-200">
                    Otomatisasi Input Produk
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Gunakan file Excel (.xlsx / .xls) untuk impor massal atau tempel link Shopee/TikTok.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                {onOpenExcelImport && (
                  <button
                    type="button"
                    id="open-excel-from-create-modal-btn"
                    onClick={onOpenExcelImport}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Impor Excel (.xlsx)</span>
                  </button>
                )}
                {onOpenMarketplaceImport && (
                  <button
                    type="button"
                    id="open-marketplace-from-create-modal-btn"
                    onClick={onOpenMarketplaceImport}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>Impor via Link</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Nama Koleksi Busana *
              </label>
              <input
                id="create-product-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-stone-950/90 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 text-sm font-medium"
                placeholder="Contoh: Medina Pearl Silk French Khimar Set"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Kategori
              </label>
              <select
                id="create-product-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3.5 py-2.5 bg-stone-950/90 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500/60 text-sm"
              >
                <option value="abaya-gamis">Abaya & Gamis Syar'i</option>
                <option value="pashmina-khimar">Pashmina & French Khimar</option>
                <option value="kurta-sarimbit">Kurta & Sarimbit Keluarga</option>
                <option value="mukena-prayer">Mukena & Perlengkapan Shalat</option>
                <option value="aksesoris-bros">Aksesoris & Bros Butik</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Material / Jenis Kain
              </label>
              <input
                id="create-product-material-input"
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-950/90 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 text-sm"
                placeholder="Contoh: Mulberry Silk & Soft Crinkle"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Harga Jual (IDR) *
              </label>
              <input
                id="create-product-price-input"
                type="number"
                min="0"
                step="1000"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-stone-950/90 border border-stone-800 rounded-xl text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-500/60"
              />
              <span className="text-[11px] text-stone-400">
                Format tampil: {formatPrice(price)}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Harga Coret / Normal (IDR)
              </label>
              <input
                id="create-product-original-price-input"
                type="number"
                min="0"
                step="1000"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-stone-950/90 border border-stone-800 rounded-xl text-stone-400 font-mono text-sm focus:outline-none focus:border-amber-500/60"
              />
              <span className="text-[11px] text-stone-500">
                Gunakan harga lebih tinggi jika ingin menampilkan label diskon (hemat).
              </span>
            </div>
          </div>

          {/* Section 2: Deskripsi Produk (Sesuai Aturan yang Sama) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Deskripsi Lengkap Produk
              </label>
              <span className="text-[11px] text-stone-400">
                {description.length} karakter
              </span>
            </div>
            <textarea
              id="create-product-description-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsikan keistimewaan busana, tekstur bahan, kepatutan syariat, jahitan butik, serta kenyamanan wudhu/busui..."
              className="w-full px-4 py-3 bg-stone-950/90 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 text-sm leading-relaxed"
            />
          </div>

          {/* Section 3: Rincian Stok & Gambar per Warna (Aturan Sama Seperti Edit Produk) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div>
                <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  Rincian Stok & Gambar per Warna
                </h3>
                <p className="text-xs text-stone-400">
                  Setiap warna memiliki stok tersendiri dan foto varian yang disimpan ke database Firestore.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Stok</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">{totalStockCalculated} pcs</span>
                </div>
                <button
                  type="button"
                  id="create-add-color-variant-btn"
                  onClick={handleAddColor}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Varian Warna
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {colors.map((colorItem, idx) => (
                <div
                  key={`new-color-row-${idx}`}
                  id={`create-color-row-${idx}`}
                  className="p-4 rounded-xl bg-stone-950/60 border border-stone-800/80 hover:border-stone-700 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Color Name and Color Picker */}
                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                      <div className="relative">
                        <input
                          type="color"
                          value={colorItem.hex}
                          onChange={(e) => handleColorChange(idx, 'hex', e.target.value)}
                          className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-stone-700 p-0.5"
                          title="Pilih kode warna hex"
                        />
                        <span 
                          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-stone-950" 
                          style={{ backgroundColor: colorItem.hex }}
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] uppercase text-stone-400 block mb-0.5">Nama Varian Warna</label>
                        <input
                          type="text"
                          value={colorItem.name}
                          onChange={(e) => handleColorChange(idx, 'name', e.target.value)}
                          placeholder="Contoh: Midnight Onyx, Olive Sage"
                          className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500/60"
                        />
                      </div>
                    </div>

                    {/* Stock Input */}
                    <div className="w-32">
                      <label className="text-[10px] uppercase text-stone-400 block mb-0.5">
                        Stok Warna Ini
                      </label>
                      <div className="flex items-center rounded-lg bg-stone-900 border border-stone-800 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleColorChange(idx, 'stock', Math.max(0, (colorItem.stock || 0) - 1))}
                          className="px-2.5 py-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 text-xs transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={colorItem.stock ?? 0}
                          onChange={(e) => handleColorChange(idx, 'stock', Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="w-full text-center py-1 bg-transparent text-xs font-mono font-bold text-amber-300 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleColorChange(idx, 'stock', (colorItem.stock || 0) + 1)}
                          className="px-2.5 py-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 text-xs transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Delete Color button */}
                    {colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(idx)}
                        className="p-2 text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors mt-3"
                        title="Hapus varian warna ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Image for this color variant */}
                  <div className="pt-2 border-t border-stone-800/60 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Thumbnail preview */}
                    <div className="md:col-span-3 flex items-center gap-3">
                      <div className="relative w-16 h-20 rounded-lg bg-stone-900 border border-stone-800 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                        {colorItem.image ? (
                          <img
                            src={colorItem.image}
                            alt={colorItem.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-stone-600" />
                        )}
                        {uploadingIndex === idx && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-stone-300 block">Foto Varian</span>
                        <span className="text-[10px] text-stone-400">
                          {colorItem.image?.startsWith('data:') ? 'Disimpan lokal (Base64)' : 'Tersimpan via URL'}
                        </span>
                      </div>
                    </div>

                    {/* Image source actions */}
                    <div className="md:col-span-9 flex flex-wrap items-center gap-2">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        ref={(el) => (fileInputRefs.current[idx] = el)}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(idx, file);
                        }}
                      />

                      {/* Upload Device Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        disabled={uploadingIndex === idx}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        Unggah dari Perangkat
                      </button>

                      {/* Preset Catalog Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActivePresetIndex(activePresetIndex === idx ? null : idx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          Pilih dari Preset Foto
                          <ChevronDown className="w-3 h-3 text-stone-400" />
                        </button>

                        {/* Presets dropdown */}
                        <AnimatePresence>
                          {activePresetIndex === idx && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 mt-1.5 w-72 p-2 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl z-30 grid grid-cols-3 gap-2 max-h-56 overflow-y-auto"
                            >
                              {CURATED_COLOR_PRESETS.map((preset) => (
                                <button
                                  type="button"
                                  key={preset.id}
                                  onClick={() => handleSelectPreset(idx, preset.url)}
                                  className="group relative rounded-lg overflow-hidden border border-stone-800 hover:border-amber-400 aspect-[3/4] text-left transition-all"
                                >
                                  <img
                                    src={preset.url}
                                    alt={preset.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <span className="absolute inset-x-0 bottom-0 p-1 bg-black/80 text-[9px] leading-tight text-stone-200 truncate block">
                                    {preset.colorTone}
                                  </span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Direct URL input */}
                      <div className="flex-1 min-w-[180px] flex items-center bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1">
                        <Link className="w-3 h-3 text-stone-500 mr-1.5 shrink-0" />
                        <input
                          type="text"
                          value={colorItem.image || ''}
                          onChange={(e) => handleColorChange(idx, 'image', e.target.value)}
                          placeholder="Atau tempel URL gambar..."
                          className="w-full bg-transparent text-xs text-stone-300 placeholder-stone-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-800 bg-stone-950/90">
          <div className="text-xs text-stone-400">
            <span className="text-amber-400 font-semibold">{colors.length} Varian Warna</span> &middot; Total Stok:{' '}
            <span className="font-mono text-emerald-400 font-bold">{totalStockCalculated} pcs</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-stone-300 hover:text-stone-100 hover:bg-stone-800 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              id="submit-create-product-btn"
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menyimpan ke Database...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Produk Baru ke Database
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
