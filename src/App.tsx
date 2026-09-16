import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { NotificationToast } from './components/NotificationToast';
import { MengantarLabelModal } from './components/MengantarLabelModal';
import { MengantarConfigModal } from './components/MengantarConfigModal';
import { DokuConfigModal } from './components/DokuConfigModal';
import { Footer } from './components/Footer';
import { MarketplaceOrderOptions } from './components/MarketplaceOrderLinks';
import { 
  Filter, 
  SlidersHorizontal, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  ArrowUpDown, 
  Search, 
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Award
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    products,
    isAdminMode,
    selectedProductForDetail,
    setSelectedProductForDetail,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    t,
    formatPrice,
    isAuthenticatedAdmin,
    setIsAdminMode,
    setIsAdminLoginModalOpen,
    reseedDatabase,
    isMengantarLabelModalOpen,
    setIsMengantarLabelModalOpen,
    activeMengantarLabelOrder,
    isMengantarConfigModalOpen,
    setIsMengantarConfigModalOpen,
    isDokuConfigModalOpen,
    setIsDokuConfigModalOpen
  } = useStore();

  // Global Admin Access Shortcut: Ctrl + Shift + A (or Cmd + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isAuthenticatedAdmin) {
          setIsAdminMode(!isAdminMode);
        } else {
          setIsAdminLoginModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticatedAdmin, isAdminMode, setIsAdminMode, setIsAdminLoginModalOpen]);

  // Filter products by category, search query, and price
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.material.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];

    return matchesCategory && matchesSearch && matchesPrice;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'priceAsc') return a.price - b.price;
    if (sortBy === 'priceDesc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'latest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
    return 0; // featured default
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF8F5]">
      {/* Top Navbar */}
      <Navbar />

      {/* Admin Mode vs Customer Storefront View - Only accessible when authenticated */}
      {isAdminMode && isAuthenticatedAdmin ? (
        <AdminDashboard />
      ) : (
        <main className="flex-1">
          
          {/* Hero Banner with Quick Category Navigation */}
          <HeroBanner />

          {/* Product Catalog Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
            
            {/* Catalog Filter & Sort Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8DFC0]/80">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C3B2B]">
                  {t.categories[selectedCategory as keyof typeof t.categories] || 'Koleksi Busana'}
                </h2>
                <p className="text-xs sm:text-sm text-[#736B5E] mt-0.5">
                  {t.filter.showing} <strong className="text-[#1C3B2B]">{sortedProducts.length}</strong> {t.filter.products} busana muslim berkualitas tinggi
                  {searchQuery && <span> untuk pencarian "{searchQuery}"</span>}
                </p>
              </div>

              {/* Controls: Price Filter & Sort Dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5 text-xs bg-white px-3 py-2 rounded-xl border border-[#DCD2C3] shadow-2xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#8C8377]" />
                  <span className="text-[#736B5E] font-medium hidden sm:inline">{t.filter.sort}:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-[#1F2421] font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="featured">{t.filter.sortOptions.featured}</option>
                    <option value="latest">{t.filter.sortOptions.latest}</option>
                    <option value="priceAsc">{t.filter.sortOptions.priceAsc}</option>
                    <option value="priceDesc">{t.filter.sortOptions.priceDesc}</option>
                    <option value="rating">{t.filter.sortOptions.rating}</option>
                  </select>
                </div>

                {/* Price quick filter pills */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setPriceRange([0, 1500000])}
                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                      priceRange[1] === 1500000 ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' : 'bg-white text-[#4A453E] border-[#DCD2C3]'
                    }`}
                  >
                    Semua Harga
                  </button>
                  <button
                    onClick={() => setPriceRange([0, 300000])}
                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                      priceRange[1] === 300000 ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' : 'bg-white text-[#4A453E] border-[#DCD2C3]'
                    }`}
                  >
                    &lt; 300rb
                  </button>
                  <button
                    onClick={() => setPriceRange([300000, 600000])}
                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                      priceRange[0] === 300000 && priceRange[1] === 600000 ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' : 'bg-white text-[#4A453E] border-[#DCD2C3]'
                    }`}
                  >
                    300rb - 600rb
                  </button>
                  <button
                    onClick={() => setPriceRange([600000, 1500000])}
                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                      priceRange[0] === 600000 ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' : 'bg-white text-[#4A453E] border-[#DCD2C3]'
                    }`}
                  >
                    &gt; 600rb (Silk & Kaftan)
                  </button>
                </div>

              </div>
            </div>

            {/* Product Grid */}
            {products.length === 0 ? (
              <div className="text-center py-20 px-4 bg-white rounded-3xl border border-[#EAE2D5] shadow-xs space-y-4 max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#8C8377] flex items-center justify-center mx-auto border border-[#E5DDD2]">
                  <ShoppingBag className="w-8 h-8 stroke-1 text-[#C5A880]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-bold text-[#1C3B2B]">
                    Katalog Busana Masih Kosong
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7A7266] max-w-md mx-auto leading-relaxed">
                    Seluruh produk dan foto varian telah berhasil dihapus dari toko dan database. Anda dapat mengimpor produk baru secara otomatis melalui file Excel/XLS atau link Shopee & TikTok di panel pengelola.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => reseedDatabase()}
                    className="px-5 py-2.5 bg-[#1C3B2B] hover:bg-[#28523C] text-white text-xs font-semibold rounded-xl transition-all shadow-sm inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#C5A880]" />
                    <span>Muat Koleksi Produk Terbaru</span>
                  </button>
                  <button
                    onClick={() => {
                      if (isAuthenticatedAdmin) {
                        setIsAdminMode(true);
                      } else {
                        setIsAdminLoginModalOpen(true);
                      }
                    }}
                    className="px-5 py-2.5 bg-white border border-[#DCD2C3] hover:bg-[#FAF8F5] text-[#1C3B2B] text-xs font-semibold rounded-xl transition-all shadow-xs inline-flex items-center gap-2"
                  >
                    <span>Buka Panel Admin</span>
                  </button>
                </div>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-[#EAE2D5] space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#8C8377] flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 stroke-1" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1C3B2B]">
                    Tidak Ada Produk yang Cocok
                  </h3>
                  <p className="text-xs text-[#7A7266] mt-1 max-w-sm mx-auto">
                    Coba ubah kata kunci pencarian atau reset filter kategori untuk menemukan busana impian Anda.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPriceRange([0, 1500000]);
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-5 py-2 bg-[#1C3B2B] text-white text-xs font-semibold rounded-full cursor-pointer hover:bg-[#28523C] transition-all"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {sortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

          </section>

          {/* Customer Reviews & Trust Showcase Section */}
          <section className="bg-[#F4ECE1]/60 border-y border-[#E8DFC0]/70 py-14 sm:py-18">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#B38F5B]">
                  Ulasan & Kepercayaan Pelanggan
                </span>
                <h2 className="font-display text-2xl sm:text-4xl font-semibold text-[#1C3B2B]">
                  Dicintai Ribuan Muslimah di Seluruh Nusantara & Dunia
                </h2>
                <div className="flex items-center justify-center gap-1 text-amber-500 pt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                  <span className="text-xs font-bold text-[#1C3B2B] ml-2">
                    4.9 / 5.0 dari 850+ Ulasan Pelanggan Terverifikasi
                  </span>
                </div>
              </div>

              {/* 3 Featured Reviews Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="p-6 bg-white rounded-2xl border border-[#E5DDD2] shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-[#4A453E] leading-relaxed">
                      "Masya Allah abaya Madina Silk-nya sangat anggun dan jatuhnya flowy berkelas. Khimar French-nya menutup aurat dengan sempurna tanpa khawatir tersingkap. Packaging wangi kasturi membuat unboxing terasa spesial."
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1C3B2B]">Aisyah Nurul Hidayah</h4>
                      <span className="text-[10px] text-[#7A7266]">Jakarta Selatan</span>
                    </div>
                    <span className="text-[10px] bg-[#2E7D32]/10 text-[#2E7D32] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-[#E5DDD2] shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-[#4A453E] leading-relaxed">
                      "Pashmina Mulberry Silk saena.id tidak licin sama sekali! Bahannya sejuk dipakai seharian di cuaca panas. Notifikasi WhatsApp otomatis masuk cepat beserta nomor resi pengiriman real-time."
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1C3B2B]">Siti Sarah Al-Habsyi</h4>
                      <span className="text-[10px] text-[#7A7266]">Surabaya, Jawa Timur</span>
                    </div>
                    <span className="text-[10px] bg-[#2E7D32]/10 text-[#2E7D32] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-[#E5DDD2] shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-[#4A453E] leading-relaxed">
                      "Pengiriman ke Kuala Lumpur via DHL Express sampai dalam 3 hari saja. Mukena Silk Jacquard dijadikan seserahan pernikahan anak kami dan semua keluarga memuji keindahannya."
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1C3B2B]">Fatima Zahra</h4>
                      <span className="text-[10px] text-[#7A7266]">Kuala Lumpur, Malaysia</span>
                    </div>
                    <span className="text-[10px] bg-[#2E7D32]/10 text-[#2E7D32] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Official Marketplace Alternative Banner */}
            <MarketplaceOrderOptions variant="banner" className="mt-8" />
          </section>

          {/* Boutique Craftsmanship & Material Highlight */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
            <div className="bg-[#1C3B2B] text-white rounded-3xl p-8 sm:p-14 overflow-hidden relative shadow-xl">
              <div className="relative z-10 max-w-xl space-y-4">
                <span className="text-xs uppercase font-bold tracking-widest text-[#C5A880]">
                  Filosofi Kesempurnaan saena.id
                </span>
                <h3 className="font-display text-2xl sm:text-4xl font-normal leading-tight">
                  Kenyamanan Syari Bertemu Estetika Modern
                </h3>
                <p className="text-xs sm:text-sm text-[#D5CAB9] leading-relaxed">
                  Setiap jahitan diproses oleh penjahit berpengalaman dengan teknik butik halus. Kami memilih serat sutra mulberry organik dan kain berpori mikro yang menyejukkan tubuh tanpa menerawang.
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-[#EFE8DC]">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#C5A880]" />
                    Sutra 6A Grade Terbaik
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                    Wudhu & Busui Friendly
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#C5A880]" />
                    QC Ketat Sebelum Kirim
                  </span>
                </div>
              </div>
            </div>
          </section>

        </main>
      )}

      {/* Boutique Footer */}
      <Footer />

      {/* Global Modals and Drawers */}
      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
        />
      )}

      <CartDrawer />
      <CheckoutModal />
      <WhatsAppModal />
      <OrderTrackingModal />
      <AdminLoginModal />
      <NotificationToast />

      {/* Mengantar.com Modals */}
      <MengantarLabelModal
        order={activeMengantarLabelOrder}
        isOpen={isMengantarLabelModalOpen}
        onClose={() => setIsMengantarLabelModalOpen(false)}
      />

      <MengantarConfigModal
        isOpen={isMengantarConfigModalOpen}
        onClose={() => setIsMengantarConfigModalOpen(false)}
      />

      {/* DOKU.com Payment Gateway Modal */}
      <DokuConfigModal
        isOpen={isDokuConfigModalOpen}
        onClose={() => setIsDokuConfigModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
}
