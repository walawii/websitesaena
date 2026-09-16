import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  Star, 
  ShoppingBag, 
  Check, 
  Heart, 
  Truck, 
  ShieldCheck, 
  Sparkles,
  MessageSquare,
  ThumbsUp,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { MarketplaceOrderOptions } from './MarketplaceOrderLinks';
import { cleanHtmlDescription } from '../utils/textHelper';
import { FALLBACK_PRODUCT_IMAGE } from '../utils/imageHelper';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { 
    formatPrice, 
    addToCart, 
    wishlist, 
    toggleWishlist, 
    setIsCheckoutOpen,
    addProductReview,
    t
  } = useStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'All Size');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || { name: 'Standard', hex: '#000000' });
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'care' | 'reviews'>('desc');

  // Lightbox / Tampilan Besar Modal State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Review Form State
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);

  const isWishlisted = wishlist.includes(product.id);
  
  // Stock calculation specifically per selected color variant
  const stockForSelectedVariant = (selectedColor?.name && product.stock[selectedColor.name] !== undefined)
    ? product.stock[selectedColor.name]
    : (selectedColor?.stock ?? (product.stock[selectedSize] ?? product.totalStock));
  const isOutOfStock = stockForSelectedVariant <= 0;

  // Active displayed image (color-specific image takes precedence when selected)
  const displayedImage = selectedColor?.image || (product.images && product.images[activeImageIndex]) || (product.images && product.images[0]) || FALLBACK_PRODUCT_IMAGE;

  // Helper to open lightbox at specific image
  const openLightboxAtIndex = (idx: number) => {
    const validIdx = Math.max(0, Math.min(idx, Math.max(0, product.images.length - 1)));
    setLightboxIndex(validIdx);
    setActiveImageIndex(validIdx);
    setIsZoomed(false);
    setIsLightboxOpen(true);
  };

  // Keyboard navigation listener for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setIsZoomed(false);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, product.images.length - 1)));
        setIsZoomed(false);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
        setIsZoomed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, product.images.length]);

  const handleSelectColor = (col: typeof product.colors[0]) => {
    setSelectedColor(col);
    if (col.image) {
      const idx = product.images.indexOf(col.image);
      if (idx >= 0) setActiveImageIndex(idx);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    onClose();
    setIsCheckoutOpen(true);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    setIsSubmittingReview(true);
    addProductReview(product.id, {
      userName: reviewName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      variantInfo: `${selectedColor.name} / ${selectedSize}`,
      verifiedBuyer: true
    });

    setIsSubmittingReview(false);
    setReviewSuccessMsg(true);
    setReviewName('');
    setReviewComment('');
    setTimeout(() => setReviewSuccessMsg(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E5DDD2] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#4A453E] hover:text-black flex items-center justify-center shadow-md transition-all"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[90vh] overflow-y-auto">
          
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-6 bg-[#F6F1EA] p-4 sm:p-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Main Image with Zoom Hint and Click to View Large */}
              <div 
                onClick={() => {
                  const imgIdx = product.images.indexOf(displayedImage);
                  openLightboxAtIndex(imgIdx >= 0 ? imgIdx : activeImageIndex);
                }}
                className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white shadow-inner cursor-zoom-in group"
                title="Klik atau tap untuk melihat dalam tampilan besar"
              >
                <img
                  src={displayedImage}
                  alt={`${product.name} - ${selectedColor.name}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                  }}
                  className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                />

                {/* Floating Zoom Badge */}
                <div className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-black/65 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 opacity-90 group-hover:opacity-100 group-hover:bg-black/85 transition-all shadow-md pointer-events-none">
                  <Maximize2 className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Perbesar Foto</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-[#4A453E] hover:text-[#B34033] shadow transition-transform hover:scale-105"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#B34033] text-[#B34033]' : ''}`} />
                </button>
              </div>

              {/* Thumbnails (Tap / Click to view in large modal as requested) */}
              {product.images.length > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#7A7266]">
                    <span className="font-medium">Galeri Foto ({product.images.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        const imgIdx = product.images.indexOf(displayedImage);
                        openLightboxAtIndex(imgIdx >= 0 ? imgIdx : activeImageIndex);
                      }}
                      className="text-[#1C3B2B] hover:text-[#2A563F] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      title="Buka galeri foto dalam tampilan besar"
                    >
                      <Maximize2 className="w-3 h-3 text-[#1C3B2B]" />
                      <span>Buka Tampilan Besar</span>
                    </button>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActiveImageIndex(idx);
                          openLightboxAtIndex(idx);
                        }}
                        className={`relative group w-16 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          activeImageIndex === idx 
                            ? 'border-[#1C3B2B] ring-2 ring-[#1C3B2B]/20 scale-105' 
                            : 'border-transparent opacity-75 hover:opacity-100 hover:border-[#C5A880]'
                        }`}
                        title={`Klik atau tap foto ${idx + 1} untuk melihat di tampilan besar`}
                      >
                        <img 
                          src={img} 
                          alt={`Foto ${idx + 1}`} 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                          }}
                          className="w-full h-full object-cover" 
                        />
                        {/* Hover/Touch zoom overlay */}
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-4 h-4 drop-shadow" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Guarantees */}
            <div className="mt-4 pt-4 border-t border-[#E3DACD] grid grid-cols-2 gap-2 text-[11px] text-[#5A5348]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#1C3B2B]" />
                <span>100% Produk Halal & Original</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#1C3B2B]" />
                <span>Pengiriman Seluruh Dunia</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details, Options, & Review Tabs */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              {/* Category & Ratings */}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest font-semibold text-[#B38F5B]">
                  {product.category.replace('-', ' ')}
                </span>
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-[#1C3B2B]">{product.rating}</span>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className="text-xs text-[#7A7266] underline hover:text-[#1C3B2B] ml-1"
                  >
                    ({product.reviewCount} Ulasan)
                  </button>
                </div>
              </div>

              {/* Title & Price */}
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#1F2421] leading-snug">
                  {product.name}
                </h2>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-xl sm:text-2xl font-bold text-[#1C3B2B]">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-[#968E82] line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {product.originalPrice && (
                    <span className="text-xs font-bold text-[#B34033] bg-[#B34033]/10 px-2 py-0.5 rounded-full">
                      Hemat Rp {(product.originalPrice - product.price).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#3B362F]">
                    Warna: <span className="font-bold text-[#1C3B2B]">{selectedColor.name}</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#7A7266]">
                    Stok warna ini: <strong className="text-[#1C3B2B]">{stockForSelectedVariant} pcs</strong>
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map(col => {
                    const colStock = (col.name && product.stock[col.name] !== undefined)
                      ? product.stock[col.name]
                      : (col.stock ?? 10);
                    const isColSelected = selectedColor.name === col.name;

                    return (
                      <button
                        key={col.name}
                        onClick={() => handleSelectColor(col)}
                        className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border-2 transition-all active:scale-95 ${
                          isColSelected 
                            ? 'border-[#1C3B2B] bg-[#FAF8F5] shadow-xs ring-2 ring-[#1C3B2B]/20' 
                            : 'border-[#E5DDD2] bg-white hover:border-[#C5A880]'
                        }`}
                        title={`${col.name} (Stok: ${colStock})`}
                      >
                        {col.image ? (
                          <img
                            src={col.image}
                            alt={col.name}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-md object-cover border border-black/10 shrink-0"
                          />
                        ) : (
                          <span
                            className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                            style={{ backgroundColor: col.hex }}
                          />
                        )}
                        <span className="text-xs font-medium text-[#3B362F]">
                          {col.name}
                        </span>
                        {isColSelected && (
                          <Check className="w-3.5 h-3.5 text-[#1C3B2B] ml-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Stock status for variant */}
                <div className="mt-2 text-xs">
                  {isOutOfStock ? (
                    <span className="text-[#B34033] font-semibold">⚠️ Stok warna {selectedColor.name} sedang habis</span>
                  ) : stockForSelectedVariant <= 5 ? (
                    <span className="text-amber-700 font-medium">
                      ⚠️ Stok tersisa {stockForSelectedVariant} unit untuk warna {selectedColor.name}!
                    </span>
                  ) : (
                    <span className="text-[#2E7D32] font-medium">
                      ✓ Tersedia {stockForSelectedVariant} unit untuk warna {selectedColor.name} siap kirim
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#3B362F]">Jumlah:</span>
                <div className="flex items-center border border-[#D5C9B8] rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-xs text-[#4A453E] hover:bg-[#F5EFE6] transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-xs font-semibold text-[#1C3B2B] min-w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(stockForSelectedVariant, quantity + 1))}
                    disabled={quantity >= stockForSelectedVariant}
                    className="px-3 py-1.5 text-xs text-[#4A453E] hover:bg-[#F5EFE6] transition-colors disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-[#1C3B2B] text-[#1C3B2B] hover:bg-[#1C3B2B] hover:text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t.product.addToCart}</span>
                </button>

                <button
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1C3B2B] text-white hover:bg-[#2A563F] text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 text-[#C5A880]" />
                  <span>{t.product.buyNow}</span>
                </button>
              </div>

              {/* Official Marketplace Alternative: Shopee & TikTok (TikTok Mobile Only) */}
              <MarketplaceOrderOptions 
                productTitle={product.name} 
                variant="modal"
                className="mt-1"
              />

              {/* Information Tabs */}
              <div className="pt-4 border-t border-[#EAE2D5]">
                <div className="flex border-b border-[#EAE2D5] gap-4 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('desc')}
                    className={`pb-2 transition-colors border-b-2 ${
                      activeTab === 'desc' ? 'border-[#1C3B2B] text-[#1C3B2B]' : 'border-transparent text-[#787063]'
                    }`}
                  >
                    Deskripsi & Bahan
                  </button>
                  <button
                    onClick={() => setActiveTab('care')}
                    className={`pb-2 transition-colors border-b-2 ${
                      activeTab === 'care' ? 'border-[#1C3B2B] text-[#1C3B2B]' : 'border-transparent text-[#787063]'
                    }`}
                  >
                    Perawatan
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-2 transition-colors border-b-2 ${
                      activeTab === 'reviews' ? 'border-[#1C3B2B] text-[#1C3B2B]' : 'border-transparent text-[#787063]'
                    }`}
                  >
                    Ulasan ({product.reviews.length})
                  </button>
                </div>

                {/* Tab 1: Description */}
                {activeTab === 'desc' && (
                  <div className="pt-3 text-xs text-[#524B40] space-y-3">
                    <div className="leading-relaxed whitespace-pre-line text-[#4A453E] space-y-2 font-normal">
                      {cleanHtmlDescription(product.description) || 'Koleksi busana muslimah istimewa dengan bahan berkualitas tinggi dan potongan elegan.'}
                    </div>
                    {product.material && (
                      <div className="pt-2 border-t border-[#EAE2D5]/70">
                        <strong className="text-[#1C3B2B] font-semibold">Komposisi Material:</strong> {cleanHtmlDescription(product.material)}
                      </div>
                    )}
                    {product.features && product.features.length > 0 && (
                      <div className="pt-1">
                        <strong className="text-[#1C3B2B] font-semibold block mb-1">Keunggulan & Detail:</strong>
                        <ul className="list-disc pl-4 space-y-1 text-[#665D4F]">
                          {product.features.map((f, i) => (
                            <li key={i}>{cleanHtmlDescription(f)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Care Instructions */}
                {activeTab === 'care' && (
                  <div className="pt-3 text-xs text-[#524B40] space-y-1.5">
                    {product.careInstructions.map((inst, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#1C3B2B] shrink-0 mt-0.5" />
                        <span>{cleanHtmlDescription(inst)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 3: Customer Reviews */}
                {activeTab === 'reviews' && (
                  <div className="pt-3 space-y-4">
                    {/* Write Review Form */}
                    <form onSubmit={handleSubmitReview} className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EBE3D7] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#1C3B2B] flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[#B38F5B]" />
                          <span>Tulis Ulasan & Rating Anda</span>
                        </h4>
                        {/* Rating stars selector */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className="text-amber-500 hover:scale-110 transition-transform"
                            >
                              <Star className={`w-4 h-4 ${star <= reviewRating ? 'fill-current' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Nama Anda"
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          className="px-3 py-1.5 text-xs bg-white border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                        />
                        <div className="text-xs text-[#7A7266] flex items-center px-1">
                          Varian: {selectedColor.name}, {selectedSize}
                        </div>
                      </div>

                      <textarea
                        required
                        rows={2}
                        placeholder="Bagaimana kualitas bahan, jahitan, dan kenyamanan busana ini?"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                      />

                      <div className="flex items-center justify-between pt-1">
                        {reviewSuccessMsg ? (
                          <span className="text-xs text-[#2E7D32] font-semibold">
                            ✓ Terima kasih! Ulasan Anda telah tayang.
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8C8377]">Badge 'Verified Buyer' otomatis disematkan</span>
                        )}
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="px-4 py-1.5 bg-[#1C3B2B] text-white text-xs font-semibold rounded-lg hover:bg-[#28523C] transition-colors"
                        >
                          Kirim Ulasan
                        </button>
                      </div>
                    </form>

                    {/* Reviews List */}
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {product.reviews.map(rev => (
                        <div key={rev.id} className="p-3 bg-white rounded-xl border border-[#F0EAE1] space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#1C3B2B]">{rev.userName}</span>
                              {rev.verifiedBuyer && (
                                <span className="text-[10px] bg-[#2E7D32]/10 text-[#2E7D32] font-semibold px-1.5 py-0.2 rounded-full">
                                  Verified Buyer
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#9A9184]">{rev.date}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <div className="flex text-amber-500">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </div>
                            <span className="text-[10px] text-[#8C8377] ml-2">
                              {rev.variantInfo}
                            </span>
                          </div>

                          <p className="text-xs text-[#4A453E] leading-relaxed pt-0.5">
                            "{rev.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Fullscreen Lightbox / Tampilan Besar Modal */}
      {isLightboxOpen && (
        <div 
          id="product-image-lightbox"
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200"
          onClick={() => {
            setIsLightboxOpen(false);
            setIsZoomed(false);
          }}
        >
          {/* Lightbox Header Bar */}
          <div 
            className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 bg-black/80 border-b border-stone-800/80 text-white z-10 select-none shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0 pr-3">
              <span className="font-serif text-sm sm:text-base font-bold text-amber-200 truncate">
                {product.name}
              </span>
              <span className="shrink-0 text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
                Foto {lightboxIndex + 1} / {product.images.length || 1}
              </span>
              {selectedColor?.name && (
                <span className="hidden sm:inline-flex text-xs text-stone-400 items-center gap-1">
                  • Varian: <strong className="text-white">{selectedColor.name}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom In / Out Toggle Button */}
              <button
                type="button"
                onClick={() => setIsZoomed(!isZoomed)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title={isZoomed ? "Perkecil (Fit)" : "Perbesar (150%)"}
              >
                {isZoomed ? <ZoomOut className="w-4 h-4 text-amber-400" /> : <ZoomIn className="w-4 h-4 text-amber-400" />}
                <span className="hidden sm:inline">{isZoomed ? 'Perkecil' : 'Perbesar'}</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setIsZoomed(false);
                }}
                className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-stone-700 hover:text-red-400 text-stone-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Tampilan Besar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Stage (Interactive Center) */}
          <div 
            className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden select-none"
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return;
              const touchEndX = e.changedTouches[0].clientX;
              const diff = touchStartX - touchEndX;
              if (diff > 50) {
                // Swipe left -> Next
                setLightboxIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
                setIsZoomed(false);
              } else if (diff < -50) {
                // Swipe right -> Prev
                setLightboxIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
                setIsZoomed(false);
              }
              setTouchStartX(null);
            }}
          >
            {/* Previous Image Button */}
            {product.images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
                  setIsZoomed(false);
                }}
                className="absolute left-3 sm:left-6 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
                title="Foto Sebelumnya (Tombol Panah Kiri)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Central Big Image */}
            <div 
              className="relative max-h-full max-w-full flex items-center justify-center transition-all duration-300 overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={product.images[lightboxIndex] || displayedImage}
                alt={`${product.name} - Foto ${lightboxIndex + 1}`}
                referrerPolicy="no-referrer"
                onClick={() => setIsZoomed(!isZoomed)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                }}
                className={`max-h-[70vh] sm:max-h-[78vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-xl shadow-2xl transition-transform duration-300 select-none ${
                  isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                }`}
              />
            </div>

            {/* Next Image Button */}
            {product.images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
                  setIsZoomed(false);
                }}
                className="absolute right-3 sm:right-6 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
                title="Foto Berikutnya (Tombol Panah Kanan)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Footer: Thumbnails Carousel & Navigation Hint */}
          <div 
            className="w-full p-3 sm:p-4 bg-black/80 border-t border-stone-800/80 z-10 flex flex-col items-center gap-2 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1 scrollbar-thin">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setLightboxIndex(idx);
                      setActiveImageIndex(idx);
                      setIsZoomed(false);
                    }}
                    className={`relative w-14 h-18 sm:w-16 sm:h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      lightboxIndex === idx 
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 opacity-100 shadow-md' 
                        : 'border-transparent opacity-50 hover:opacity-90 hover:border-stone-500'
                    }`}
                    title={`Lihat Foto ${idx + 1}`}
                  >
                    <img 
                      src={img} 
                      alt={`Thumb ${idx + 1}`} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 text-[11px] text-stone-400">
              <span>💡 Klik gambar untuk perbesar/perkecil</span>
              <span className="hidden sm:inline">• Tekan <b>Esc</b> untuk menutup</span>
              <span className="hidden sm:inline">• Gunakan tombol panah keyboard atau usap layar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
