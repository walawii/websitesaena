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
  ChevronDown
} from 'lucide-react';
import { Product, ProductColor } from '../types';
import { useStore } from '../context/StoreContext';
import { compressAndEncodeImage, CURATED_COLOR_PRESETS, sanitizeProductImageList } from '../utils/imageHelper';
import { cleanHtmlDescription } from '../utils/textHelper';

interface ProductEditModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ product, isOpen, onClose }) => {
  const { updateProduct, deleteProduct, formatPrice } = useStore();

  // Form State (auto-cleaned from Excel HTML artifacts)
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(product.price);
  const [originalPrice, setOriginalPrice] = useState(product.originalPrice || product.price);
  const [description, setDescription] = useState(() => cleanHtmlDescription(product.description || ''));
  const [material, setMaterial] = useState(() => cleanHtmlDescription(product.material || ''));
  
  // Colors state (deep clone)
  const [colors, setColors] = useState<ProductColor[]>(() => {
    return product.colors.map(c => ({
      name: c.name,
      hex: c.hex,
      stock: (c.stock !== undefined) ? c.stock : (product.stock[c.name] ?? 10),
      image: c.image || product.images[0] || ''
    }));
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeColorPresetIndex, setActiveColorPresetIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  if (!isOpen) return null;

  // Calculate total stock live
  const totalStockCalculated = colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0);

  // Handle color field updates
  const handleColorChange = (index: number, field: keyof ProductColor, value: any) => {
    setColors(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Add new color variant
  const handleAddColor = () => {
    const newColor: ProductColor = {
      name: `Varian Warna ${colors.length + 1}`,
      hex: '#2E3D30',
      stock: 10,
      image: product.images[0] || ''
    };
    setColors(prev => [...prev, newColor]);
  };

  // Remove color variant
  const handleRemoveColor = (index: number) => {
    if (colors.length <= 1) {
      alert('Minimal produk harus memiliki 1 varian warna.');
      return;
    }
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  // Handle file upload for a specific color
  const handleFileUpload = async (index: number, file: File) => {
    try {
      setUploadingIndex(index);
      setErrorMessage(null);
      // Compress image client-side to standard Base64 Data URL (stored directly in Firestore doc)
      const base64Url = await compressAndEncodeImage(file, 850, 0.82);
      handleColorChange(index, 'image', base64Url);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memproses gambar');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Apply curated preset image
  const handleSelectPreset = (index: number, presetUrl: string) => {
    handleColorChange(index, 'image', presetUrl);
    setActiveColorPresetIndex(null);
  };

  // Save all changes to StoreContext & Firestore
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama produk tidak boleh kosong');
      return;
    }
    if (colors.length === 0) {
      setErrorMessage('Harus ada minimal satu varian warna');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Build stock dictionary
      const newStockMap: Record<string, number> = {};
      colors.forEach(c => {
        newStockMap[c.name] = Math.max(0, Number(c.stock) || 0);
      });

      // Collect all unique images
      const allImages = colors.map(c => c.image).filter(Boolean) as string[];
      const uniqueImages = sanitizeProductImageList(Array.from(new Set([...allImages, ...product.images])));

      const updatedProductData: Product = {
        ...product,
        name: name.trim(),
        category,
        price: Number(price) || product.price,
        originalPrice: Number(originalPrice) || Number(price),
        description: cleanHtmlDescription(description),
        material: cleanHtmlDescription(material),
        colors: colors.map(c => ({
          name: c.name.trim(),
          hex: c.hex,
          stock: Math.max(0, Number(c.stock) || 0),
          image: c.image
        })),
        stock: newStockMap,
        totalStock: totalStockCalculated,
        images: uniqueImages
      };

      await updateProduct(updatedProductData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error updating product:', err);
      setErrorMessage(err?.message || 'Gagal menyimpan perubahan ke database Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      id="product-edit-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <motion.div
        id="product-edit-modal-card"
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-stone-900 border border-amber-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-stone-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-amber-200">
                  Edit Produk & Rincian Stok Warna
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-semibold">
                  Database Firestore
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Atur deskripsi, varian warna, stok per warna, dan unggah foto per warna (tersimpan di database).
              </p>
            </div>
          </div>
          <button
            id="close-product-edit-btn"
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
              <span>Perubahan produk & gambar per warna berhasil disimpan ke database Firestore!</span>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Nama Produk
              </label>
              <input
                id="edit-product-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-stone-950/90 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 text-sm font-medium"
                placeholder="Contoh: Safiyya Silk French Khimar Set"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Kategori
              </label>
              <select
                id="edit-product-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                Material / Kain
              </label>
              <input
                id="edit-product-material-input"
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-950/90 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 text-sm"
                placeholder="Contoh: Premium Arabian Silk Crinkle"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Harga Jual (IDR)
              </label>
              <input
                id="edit-product-price-input"
                type="number"
                min="0"
                step="1000"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-stone-950/90 border border-stone-800 rounded-xl text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-500/60"
              />
              <span className="text-[11px] text-stone-400">
                Harga tampil: {formatPrice(price)}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Harga Coret / Normal (IDR)
              </label>
              <input
                id="edit-product-original-price-input"
                type="number"
                min="0"
                step="1000"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-stone-950/90 border border-stone-800 rounded-xl text-stone-400 font-mono text-sm focus:outline-none focus:border-amber-500/60"
              />
              <span className="text-[11px] text-stone-500">
                Kosongkan atau samakan jika tidak sedang diskon.
              </span>
            </div>
          </div>

          {/* Section 2: Deskripsi Produk (Permintaan Khusus User) */}
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
              id="edit-product-description-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan deskripsi busana, detail jahitan, kelebihan bahan, kenyamanan wudhu/busui, dan spesifikasi ukuran..."
              className="w-full px-4 py-3 bg-stone-950/90 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 text-sm leading-relaxed"
            />
          </div>

          {/* Section 3: Rincian Stok & Gambar per Warna (Permintaan Khusus User) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div>
                <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  Rincian Stok & Gambar per Warna
                </h3>
                <p className="text-xs text-stone-400">
                  Setiap varian warna memiliki stok independen dan gambar representatif yang disimpan di database.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Stok</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">{totalStockCalculated} pcs</span>
                </div>
                <button
                  type="button"
                  id="add-color-variant-btn"
                  onClick={handleAddColor}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Warna
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {colors.map((colorItem, idx) => (
                <div
                  key={`color-edit-${idx}`}
                  id={`color-row-${idx}`}
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
                        <label className="text-[10px] uppercase text-stone-400 block mb-0.5">Nama Warna</label>
                        <input
                          type="text"
                          value={colorItem.name}
                          onChange={(e) => handleColorChange(idx, 'name', e.target.value)}
                          placeholder="Nama Warna (misal: Emerald Green)"
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
                          onClick={() => setActiveColorPresetIndex(activeColorPresetIndex === idx ? null : idx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          Pilih dari Preset Foto
                          <ChevronDown className="w-3 h-3 text-stone-400" />
                        </button>

                        {/* Presets dropdown */}
                        <AnimatePresence>
                          {activeColorPresetIndex === idx && (
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

                      {/* Clear photo button */}
                      {Boolean(colorItem.image) && (
                        <button
                          type="button"
                          onClick={() => handleColorChange(idx, 'image', '')}
                          title="Hapus foto dari varian ini"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/50 text-xs transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus Foto</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-stone-800 bg-stone-950/90">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-xs text-stone-400">
              <span className="text-amber-400 font-semibold">{colors.length} Varian</span> &middot; Total Stok:{' '}
              <span className="font-mono text-emerald-400 font-bold">{totalStockCalculated} pcs</span>
            </div>

            <button
              type="button"
              id="delete-product-from-edit-modal-btn"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 text-xs font-semibold transition-colors"
              title="Hapus produk busana ini secara permanen"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Produk</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="px-4 py-2 rounded-xl text-stone-300 hover:text-stone-100 hover:bg-stone-800 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              id="save-product-edit-btn"
              type="button"
              onClick={handleSave}
              disabled={isSaving || isDeleting}
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
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Inner Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-stone-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 rounded-full bg-rose-950/80 border border-rose-800/60">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-100">Hapus Produk Ini?</h4>
                  <p className="text-xs text-stone-400">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>

              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center gap-3">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-14 object-cover rounded-lg bg-stone-900 border border-stone-800"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-200 truncate">{product.name}</p>
                  <p className="text-[11px] text-stone-400 font-mono">ID: {product.id}</p>
                  <p className="text-[11px] text-amber-400/90">{formatPrice(product.price)} &middot; {totalStockCalculated} pcs</p>
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                Produk ini beserta seluruh varian warna dan riwayat stoknya akan dihapus secara permanen dari etalase toko dan database Cloud Firestore.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-stone-300 hover:bg-stone-800 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  id="confirm-delete-product-edit-btn"
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await deleteProduct(product.id);
                      setShowDeleteConfirm(false);
                      onClose();
                    } catch (err) {
                      setErrorMessage('Gagal menghapus produk dari database.');
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/30 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Ya, Hapus Produk
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
