import React from 'react';
import { ExternalLink } from 'lucide-react';

export const SHOPEE_STORE_URL = 'https://shopee.co.id/saena.id';
export const TIKTOK_STORE_URL = 'https://vt.tiktok.com/ZSqVW8534/?page=Mall';

export const ShopeeLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-label="Shopee Logo"
  >
    <path 
      d="M38 15.5H32.8C32.1 9.9 28.5 6 24 6C19.5 6 15.9 9.9 15.2 15.5H10C8.6 15.5 7.5 16.6 7.5 18V38C7.5 39.4 8.6 40.5 10 40.5H38C39.4 40.5 40.5 39.4 40.5 38V18C40.5 16.6 39.4 15.5 38 15.5Z" 
      fill="#EE4D2D" 
    />
    <path 
      d="M24 8.5C27 8.5 29.5 11.5 30.2 15.5H17.8C18.5 11.5 21 8.5 24 8.5Z" 
      stroke="white" 
      strokeWidth="2.5" 
      strokeMiterlimit="10" 
      strokeLinecap="round"
    />
    <path 
      d="M25.7 22.8C23.2 22.2 21.6 22.8 21 23.9C20.6 24.6 20.8 25.6 21.4 26.2C22.2 27 24 27.5 25.8 28.1C28.2 28.9 30.2 30.3 30.2 32.8C30.2 35.8 27.5 37.5 23.9 37.5C20 37.5 17.6 35.2 17.5 32.2H20.6C20.8 33.6 22 34.9 24.1 34.9C25.8 34.9 27.1 34 27.1 32.6C27.1 31.4 26.2 30.7 24.3 30C22.1 29.3 18.1 28.3 18.1 24.8C18.1 22.1 20.6 20.2 24.2 20.2C27.7 20.2 29.9 22.2 30 24.7H26.9C26.7 23.5 25.6 22.8 24 22.8" 
      fill="white" 
    />
  </svg>
);

export const TikTokLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-label="TikTok Logo"
  >
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.888 2.868 2.897 2.897 0 0 1-2.896-2.895 2.897 2.897 0 0 1 2.896-2.896c.28 0 .546.04.8.114V9.378a6.34 6.34 0 0 0-.8-.051 6.342 6.342 0 0 0-6.342 6.342 6.342 6.342 0 0 0 6.342 6.342 6.342 6.342 0 0 0 6.342-6.342V8.924a8.17 8.17 0 0 0 4.887 1.602V7.08a4.84 4.84 0 0 1-1.126-.394z"/>
  </svg>
);

interface MarketplaceOrderProps {
  productTitle?: string;
  className?: string;
  variant?: 'compact' | 'cards' | 'modal' | 'banner';
}

export const MarketplaceOrderOptions: React.FC<MarketplaceOrderProps> = ({ 
  productTitle, 
  className = '',
  variant = 'compact'
}) => {
  if (variant === 'modal') {
    return (
      <div className={`p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5] space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1C3B2B] flex items-center gap-1.5">
            <span>Bisa juga pesan via Marketplace Resmi</span>
          </span>
          <span className="text-[10px] text-[#7A7266]">Official Store</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Shopee Button - Visible on both desktop & mobile */}
          <a
            href={SHOPEE_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 bg-white hover:bg-[#FFF5F2] text-[#EE4D2D] border border-[#FFD0C7] hover:border-[#EE4D2D] rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-2xs group"
            title={`Order di Shopee: ${productTitle || 'saena.id'}`}
          >
            <ShopeeLogo className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
            <span>Order via Shopee</span>
            <ExternalLink className="w-3 h-3 text-[#EE4D2D]/60 ml-auto" />
          </a>

          {/* TikTok Button - STRICTLY MOBILE WEB ONLY */}
          <a
            href={TIKTOK_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-all flex md:hidden items-center justify-center gap-2 shadow-2xs group"
            title={`Order di TikTok Shop: ${productTitle || 'saena.id'}`}
          >
            <TikTokLogo className="w-4 h-4 shrink-0 text-white transition-transform group-hover:scale-110" />
            <span>Order via TikTok Shop</span>
            <ExternalLink className="w-3 h-3 text-white/60 ml-auto" />
          </a>
        </div>

        {/* Informative footnote */}
        <p className="text-[10px] text-[#8C8377] leading-tight">
          Pilihan pembayaran, gratis ongkir, dan voucher marketplace berlaku sesuai ketentuan masing-masing aplikasi.
        </p>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`p-4 bg-white rounded-2xl border border-[#E8DFC0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
        <div className="text-center sm:text-left space-y-0.5">
          <h4 className="text-xs sm:text-sm font-bold text-[#1C3B2B]">
            Ingin Berbelanja Lewat Aplikasi Favorit Anda?
          </h4>
          <p className="text-[11px] text-[#7A7266]">
            Koleksi busana muslimah saena.id juga hadir resmi di Shopee dan TikTok Shop.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
          {/* Shopee */}
          <a
            href={SHOPEE_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#EE4D2D] hover:bg-[#D73E1F] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <ShopeeLogo className="w-4 h-4" />
            <span>Shopee Mall / Official</span>
          </a>

          {/* TikTok - STRICTLY MOBILE ONLY */}
          <a
            href={TIKTOK_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex md:hidden items-center gap-2"
          >
            <TikTokLogo className="w-4 h-4" />
            <span>TikTok Shop Mall</span>
          </a>
        </div>
      </div>
    );
  }

  // Default compact layout
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-medium text-[#7A7266]">Order via:</span>
      
      {/* Shopee */}
      <a
        href={SHOPEE_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#FFF5F2] border border-[#FFD0C7] text-[#EE4D2D] text-xs font-semibold rounded-lg transition-colors"
      >
        <ShopeeLogo className="w-3.5 h-3.5" />
        <span>Shopee</span>
      </a>

      {/* TikTok - STRICTLY MOBILE ONLY */}
      <a
        href={TIKTOK_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex md:hidden items-center gap-1.5 px-2.5 py-1 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors"
      >
        <TikTokLogo className="w-3.5 h-3.5 text-white" />
        <span>TikTok Shop</span>
      </a>
    </div>
  );
};
