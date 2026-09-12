import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Tag, 
  ShieldCheck, 
  Truck,
  Check,
  Percent
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateCartQuantity,
    formatPrice,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    setIsCheckoutOpen,
    t
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isCartOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - couponDiscount);
  
  // Free Shipping Threshold (e.g., Rp 500.000)
  const freeShippingThreshold = 500000;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput.trim());
    if (res.success) {
      setCouponMessage({ text: res.message, isError: false });
      setCouponInput('');
    } else {
      setCouponMessage({ text: res.message, isError: true });
    }
  };

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col justify-between border-l border-[#E2D8CA] animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[#EAE2D5] bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#1C3B2B]" />
                <h3 className="font-display text-lg font-semibold text-[#1C3B2B]">
                  {t.cart.title}
                </h3>
                <span className="text-xs bg-[#1C3B2B]/10 text-[#1C3B2B] font-bold px-2 py-0.5 rounded-full">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-full text-[#7A7266] hover:text-black transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Indicator */}
            <div className="mt-4 pt-3 border-t border-[#F0EAE1]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1 text-[#1C3B2B] font-medium">
                  <Truck className="w-3.5 h-3.5 text-[#B38F5B]" />
                  {remainingForFreeShipping === 0 ? (
                    <span className="text-[#2E7D32] font-semibold">Gratis Ongkos Kirim Terpenuhi! 🎉</span>
                  ) : (
                    <span>Kurang <strong>{formatPrice(remainingForFreeShipping)}</strong> untuk Gratis Ongkir</span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-[#7A7266]">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full bg-[#EAE2D5] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#1C3B2B] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#EFE8DD] flex items-center justify-center mx-auto text-[#7A7266]">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <div>
                  <h4 className="font-display text-base font-semibold text-[#1C3B2B]">
                    {t.cart.empty}
                  </h4>
                  <p className="text-xs text-[#7A7266] mt-1 max-w-xs mx-auto">
                    Koleksi abaya sutra dan pashmina eksklusif kami siap melengkapi penampilan syari Anda.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#1C3B2B] text-white text-xs font-semibold rounded-full hover:bg-[#28523C] transition-all"
                >
                  {t.cart.startShopping}
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 bg-white rounded-xl border border-[#EBE3D7] flex gap-3 shadow-2xs"
                >
                  {/* Item Image */}
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-24 rounded-lg object-cover bg-[#F2ECE4] shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-[#1F2421] line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#9E9588] hover:text-[#B34033] transition-colors p-0.5"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#787063]">
                        <span className="flex items-center gap-1">
                          <span 
                            className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block" 
                            style={{ backgroundColor: item.selectedColor.hex }}
                          />
                          {item.selectedColor.name}
                        </span>
                        <span>•</span>
                        <span className="font-medium bg-[#FAF6F0] px-1.5 py-0.2 rounded border border-[#E5DDD2]">
                          {item.selectedSize}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#F5EFE6]">
                      <span className="text-xs font-bold text-[#1C3B2B]">
                        {formatPrice(item.price * item.quantity)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#D8CDBD] rounded-md overflow-hidden bg-white">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs text-[#524B40] hover:bg-[#F5EFE6]"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 text-xs font-semibold text-[#1C3B2B] min-w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-xs text-[#524B40] hover:bg-[#F5EFE6]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Coupon & Checkout */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 bg-white border-t border-[#EAE2D5] space-y-3">
              
              {/* Coupon Form */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-[#1C3B2B]/5 rounded-xl border border-[#1C3B2B]/20">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-[#1C3B2B]" />
                      <div>
                        <span className="text-xs font-bold text-[#1C3B2B]">{appliedCoupon}</span>
                        <span className="text-[10px] text-[#2E7D32] block font-medium">
                          Hemat {formatPrice(couponDiscount)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-[#B34033] hover:underline font-semibold"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-[#8C8377] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder={t.cart.couponCode}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#D5C9B8] rounded-xl focus:outline-none focus:border-[#1C3B2B] uppercase font-semibold"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#1C3B2B] text-white text-xs font-semibold rounded-xl hover:bg-[#28523C] transition-colors"
                      >
                        {t.cart.apply}
                      </button>
                    </div>

                    {/* Available promo suggestions */}
                    <div className="flex items-center gap-1.5 text-[10px] text-[#7A7266]">
                      <span>Coba:</span>
                      <button
                        type="button"
                        onClick={() => applyCoupon('SAENARAMADHAN')}
                        className="underline hover:text-[#1C3B2B] font-semibold"
                      >
                        SAENARAMADHAN
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => applyCoupon('WELCOME10')}
                        className="underline hover:text-[#1C3B2B] font-semibold"
                      >
                        WELCOME10
                      </button>
                    </div>

                    {couponMessage && (
                      <p className={`text-xs ${couponMessage.isError ? 'text-[#B34033]' : 'text-[#2E7D32]'} font-medium`}>
                        {couponMessage.text}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Price Calculation Summary */}
              <div className="space-y-1.5 pt-2 border-t border-[#F0EAE1] text-xs">
                <div className="flex justify-between text-[#5C5549]">
                  <span>{t.cart.subtotal}</span>
                  <span className="font-semibold text-[#1F2421]">{formatPrice(subtotal)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[#2E7D32]">
                    <span>{t.cart.discount} ({appliedCoupon})</span>
                    <span className="font-semibold">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#5C5549]">
                  <span>Estimasi Ongkir</span>
                  <span className="text-[#8C8377] text-[11px]">Dihitung otomatis di checkout</span>
                </div>

                <div className="flex justify-between text-sm sm:text-base font-bold text-[#1C3B2B] pt-2 border-t border-[#F0EAE1]">
                  <span>Total Sementara</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleProceedCheckout}
                className="w-full py-3.5 px-4 bg-[#1C3B2B] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#28523C] shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.cart.checkout}</span>
                <ArrowRight className="w-4 h-4 text-[#C5A880]" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#8C8377]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>Pembayaran Terenkripsi & Otomatis Verifikasi</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
