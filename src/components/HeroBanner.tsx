import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, ArrowRight, ShieldCheck, Truck, Clock, RefreshCw } from 'lucide-react';
import { Category } from '../types';

export const HeroBanner: React.FC = () => {
  const { 
    t, 
    setSelectedCategory, 
    selectedCategory, 
    setIsOrderTrackingOpen,
    products,
    setSelectedProductForDetail,
    formatPrice
  } = useStore();

  const heroProduct = products.find(p => p.id === 'saena-01') || products[0];
  const heroImage = heroProduct?.images?.[0] || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop';

  const categoryList: { id: Category; label: string }[] = [
    { id: 'all', label: t.categories.all },
    { id: 'abaya-gamis', label: t.categories['abaya-gamis'] },
    { id: 'hijab-pashmina', label: t.categories['hijab-pashmina'] },
    { id: 'dress-kaftan', label: t.categories['dress-kaftan'] },
    { id: 'mukena-silk', label: t.categories['mukena-silk'] },
    { id: 'koko-kurta', label: t.categories['koko-kurta'] },
    { id: 'aksesoris', label: t.categories.aksesoris },
  ];

  return (
    <div className="relative overflow-hidden bg-[#F5EFE6] border-b border-[#E8DFC0]/60">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#F5EFE6] via-[#FAF8F5]/80 to-[#ECE3D4] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text & Call to Action */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C3B2B]/10 text-[#1C3B2B] text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#B38F5B]" />
              <span>{t.hero.tag}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-normal text-[#1C3B2B] leading-[1.15] tracking-tight">
              {t.hero.title}
            </h1>

            <p className="text-sm sm:text-base text-[#524B42] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {t.hero.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <a
                href="#katalog-produk"
                className="px-6 py-3 bg-[#1C3B2B] text-white hover:bg-[#28523C] text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>{t.hero.ctaShop}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => setIsOrderTrackingOpen(true)}
                className="px-6 py-3 bg-white text-[#1C3B2B] hover:bg-[#FAF8F5] border border-[#D5C6B3] text-sm font-medium rounded-full shadow-sm transition-all flex items-center gap-2"
              >
                <Truck className="w-4 h-4 text-[#B38F5B]" />
                <span>{t.hero.ctaLookbook}</span>
              </button>
            </div>

            {/* 4 Value Propositions Pill Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#E5DDD0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1C3B2B]/10 flex items-center justify-center text-[#1C3B2B] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#1C3B2B]">100% Syari & Ori</p>
                  <p className="text-[10px] text-[#7A7266]">Sutra Mulberry 6A</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1C3B2B]/10 flex items-center justify-center text-[#1C3B2B] shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#1C3B2B]">Auto Ongkir</p>
                  <p className="text-[10px] text-[#7A7266]">Domestik & Global</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1C3B2B]/10 flex items-center justify-center text-[#1C3B2B] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#1C3B2B]">Live Tracking</p>
                  <p className="text-[10px] text-[#7A7266]">Update Resi Real-time</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1C3B2B]/10 flex items-center justify-center text-[#1C3B2B] shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#1C3B2B]">Notif WhatsApp</p>
                  <p className="text-[10px] text-[#7A7266]">Resmi & Instan</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Imagery Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md">
              {/* Decorative Frame */}
              <div className="absolute -inset-2 rounded-3xl border border-[#C5A880]/50 rotate-1 pointer-events-none" />
              
              {/* Main Image */}
              <div 
                onClick={() => heroProduct && setSelectedProductForDetail(heroProduct)}
                className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5] bg-[#EAE2D5] cursor-pointer group"
                title="Klik untuk melihat detail produk Madina Silk Abaya"
              >
                <img
                  src={heroImage}
                  alt={heroProduct?.name || "Madina Silk Abaya saena.id"}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop";
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Floating Badge on Photo */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-[#EDE4D6] flex items-center justify-between group-hover:border-[#C5A880] transition-colors">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#B38F5B] tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-[#B38F5B]" />
                      Signature Edition
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold text-[#1C3B2B] line-clamp-1">
                      {heroProduct?.name || "Madina Silk Abaya with French Khimar"}
                    </h4>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-xs sm:text-sm font-bold text-[#1C3B2B] block">
                      {formatPrice(heroProduct?.price || 685000)}
                    </span>
                    <span className="inline-block text-[10px] text-[#2E7D32] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      Tersedia
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Interactive Category Filter Pills */}
        <div id="katalog-produk" className="pt-10 sm:pt-14">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoryList.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#1C3B2B] text-white shadow-sm'
                    : 'bg-white text-[#4A453E] hover:bg-[#EDE5D8] border border-[#E0D5C5]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
