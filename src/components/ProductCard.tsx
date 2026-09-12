import React from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Star, Heart, Eye, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { 
    formatPrice, 
    setSelectedProductForDetail, 
    addToCart, 
    wishlist, 
    toggleWishlist 
  } = useStore();

  const isWishlisted = wishlist.includes(product.id);
  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isLowStock = product.totalStock > 0 && product.totalStock <= 5;
  const isOutOfStock = product.totalStock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    // Add default first size and first color
    const defaultSize = product.sizes[0] || 'All Size';
    const defaultColor = product.colors[0] || { name: 'Standard', hex: '#000000' };
    addToCart(product, defaultSize, defaultColor, 1);
  };

  return (
    <div 
      onClick={() => setSelectedProductForDetail(product)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-[#E8DFC0]/70 hover:border-[#C5A880] transition-all duration-300 shadow-sm hover:shadow-md flex flex-col cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] bg-[#F2ECE4] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {discountPercent > 0 && (
            <span className="px-2.5 py-1 bg-[#B34033] text-white text-[10px] font-bold rounded-full tracking-wider uppercase shadow-sm">
              Hemat {discountPercent}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="px-2.5 py-0.5 bg-[#1C3B2B] text-white text-[10px] font-semibold rounded-full tracking-wider uppercase shadow-sm">
              New
            </span>
          )}
          {isLowStock && (
            <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-medium rounded-full shadow-sm animate-pulse">
              Sisa {product.totalStock}!
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2.5 py-1 bg-neutral-800 text-white text-[10px] font-bold rounded-full uppercase">
              Habis
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#4A453E] hover:text-[#B34033] hover:bg-white shadow transition-transform active:scale-90"
          title="Simpan ke Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#B34033] text-[#B34033]' : ''}`} />
        </button>

        {/* Quick View Hover Button */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProductForDetail(product);
            }}
            className="flex-1 py-2 px-3 bg-white/95 backdrop-blur-sm text-[#1C3B2B] hover:bg-white text-xs font-semibold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Detail</span>
          </button>

          {!isOutOfStock && (
            <button
              onClick={handleQuickAdd}
              className="py-2 px-3 bg-[#1C3B2B] hover:bg-[#28523C] text-white text-xs font-semibold rounded-xl shadow-md flex items-center justify-center gap-1 transition-all"
              title="Tambah ke Tas"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-semibold text-[#1C3B2B]">
              {product.rating}
            </span>
            <span className="text-[11px] text-[#8C8377]">
              ({product.reviewCount})
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-[#1F2421] group-hover:text-[#1C3B2B] line-clamp-2 leading-snug mb-1">
            {product.name}
          </h3>

          {/* Material specs */}
          <p className="text-[11px] text-[#787063] line-clamp-1 mb-3">
            {product.material}
          </p>
        </div>

        {/* Colors Swatches & Price */}
        <div className="pt-2 border-t border-[#F2ECE4] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-bold text-[#1C3B2B]">
                {formatPrice(product.price)}
              </span>
            </div>
            {product.originalPrice && (
              <span className="text-[11px] text-[#A69C8E] line-through block">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Color preview dots */}
          <div className="flex items-center gap-1">
            {product.colors.slice(0, 3).map((col, idx) => (
              <span
                key={idx}
                className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-2xs"
                style={{ backgroundColor: col.hex }}
                title={col.name}
              />
            ))}
            {product.colors.length > 3 && (
              <span className="text-[10px] text-[#8C8377] font-medium">
                +{product.colors.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
