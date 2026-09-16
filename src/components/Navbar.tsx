import React, { useState } from 'react';
import { useStore, CURRENCY_CONFIGS } from '../context/StoreContext';
import { 
  ShoppingBag, 
  Search, 
  Bell, 
  Truck, 
  ShieldCheck, 
  LayoutDashboard, 
  Store, 
  Globe, 
  X,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  LogOut,
  Lock
} from 'lucide-react';
import { LanguageCode, CurrencyCode } from '../types';

export const Navbar: React.FC = () => {
  const {
    t,
    cart,
    notifications,
    unreadNotifCount,
    language,
    currency,
    isAdminMode,
    searchQuery,
    isOrderTrackingOpen,
    setLanguage,
    setCurrency,
    setIsCartOpen,
    setIsOrderTrackingOpen,
    setIsAdminMode,
    setSearchQuery,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    requestBrowserPushPermission,
    firebaseSyncStatus,
    isAuthenticatedAdmin,
    logoutAdmin
  } = useStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const cartTotalItems = cart.reduce((total, item) => total + item.quantity, 0);

  const languages: { code: LanguageCode; name: string; flag: string }[] = [
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', name: 'English (UK/US)', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' }
  ];

  const currencies: CurrencyCode[] = ['IDR', 'USD', 'SAR', 'MYR'];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EBE3D7] transition-all">
      {/* Top micro announcement bar */}
      <div className="bg-[#1C3B2B] text-[#E7DECD] text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#C5A880] animate-pulse" />
        <span>{t.hero.freeShippingNotice}</span>
        <span className="hidden sm:inline text-white/40">|</span>
        <span className="hidden sm:inline text-[#C5A880]">Gunakan Kupon: SAENARAMADHAN (Diskon 15%)</span>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20 gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAdminMode(false)}
              className="text-left group cursor-pointer focus:outline-none"
              title="saena.my.id Muslim Boutique"
            >
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#1C3B2B] group-hover:text-[#2A5941] transition-colors">
                  saena
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#B38F5B] tracking-widest lowercase">
                  .my.id
                </span>
              </div>
              <p className="text-[10px] tracking-widest text-[#7C756B] uppercase font-medium -mt-1 hidden sm:block">
                Modest Elegance
              </p>
            </button>
          </div>

          {/* Search Input Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#8C8377] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.nav.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-[#F3EFEA] border border-[#E2D8CA] rounded-full focus:outline-none focus:border-[#1C3B2B] focus:ring-1 focus:ring-[#1C3B2B] text-[#242320] placeholder-[#9C9488] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8377] hover:text-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 text-[#4A453E] hover:text-[#1C3B2B] hover:bg-[#EFE9E0] rounded-full transition-colors"
              title="Cari Produk"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Currency Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsCurrencyOpen(!isCurrencyOpen);
                  setIsLangOpen(false);
                  setIsNotifOpen(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-[#4A453E] hover:text-[#1C3B2B] hover:bg-[#EFE9E0] rounded-lg border border-[#E2D8CA] flex items-center gap-1 transition-colors"
                title="Pilih Mata Uang"
              >
                <span>{CURRENCY_CONFIGS[currency].code}</span>
                <span className="text-[#8C8377] text-[10px]">({CURRENCY_CONFIGS[currency].symbol})</span>
              </button>

              {isCurrencyOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-[#E5DDD2] py-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[10px] uppercase font-semibold text-[#8C8377] border-b border-[#F0EAE1]">
                    Currency
                  </div>
                  {currencies.map(cur => (
                    <button
                      key={cur}
                      onClick={() => {
                        setCurrency(cur);
                        setIsCurrencyOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#FAF8F5] transition-colors ${
                        currency === cur ? 'font-semibold text-[#1C3B2B] bg-[#F4EFEA]' : 'text-[#4A453E]'
                      }`}
                    >
                      <span>{cur}</span>
                      <span className="text-[#8C8377]">{CURRENCY_CONFIGS[cur].symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Multi-Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsLangOpen(!isLangOpen);
                  setIsCurrencyOpen(false);
                  setIsNotifOpen(false);
                }}
                className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-[#4A453E] hover:text-[#1C3B2B] hover:bg-[#EFE9E0] rounded-lg border border-[#E2D8CA] flex items-center gap-1.5 transition-colors"
                title="Pilih Bahasa"
              >
                <Globe className="w-4 h-4 text-[#7C756B]" />
                <span className="hidden sm:inline uppercase">{language}</span>
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E5DDD2] py-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-[#8C8377] border-b border-[#F0EAE1]">
                    Language / Bahasa
                  </div>
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#FAF8F5] transition-colors ${
                        language === l.code ? 'font-semibold text-[#1C3B2B] bg-[#F4EFEA]' : 'text-[#4A453E]'
                      }`}
                    >
                      <span className="text-base">{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Track Order Button */}
            <button
              onClick={() => setIsOrderTrackingOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1C3B2B] hover:bg-[#EFE9E0] rounded-lg border border-[#D8CEBF] transition-colors"
              title="Lacak Pengiriman Real-time"
            >
              <Truck className="w-3.5 h-3.5 text-[#B38F5B]" />
              <span>{t.nav.trackOrder}</span>
            </button>

            {/* Push Notification Center Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsLangOpen(false);
                  setIsCurrencyOpen(false);
                }}
                className="relative p-2 text-[#4A453E] hover:text-[#1C3B2B] hover:bg-[#EFE9E0] rounded-full transition-colors"
                title="Notifikasi Promo & Pesanan"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#B34033] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5DDD2] p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#1C3B2B]" />
                      <h4 className="text-sm font-semibold text-[#1F2421]">Notifikasi Push</h4>
                      {unreadNotifCount > 0 && (
                        <span className="text-[10px] bg-[#B34033]/10 text-[#B34033] font-bold px-2 py-0.5 rounded-full">
                          {unreadNotifCount} Baru
                        </span>
                      )}
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] text-[#8C8377] hover:text-[#1C3B2B] font-medium"
                      >
                        Tandai sudah dibaca
                      </button>
                    )}
                  </div>

                  {/* Notification items */}
                  <div className="divide-y divide-[#F5EFE6] max-h-72 overflow-y-auto my-2">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[#8C8377]">
                        Tidak ada notifikasi baru.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            if (notif.linkTarget) {
                              setIsOrderTrackingOpen(true);
                              setIsNotifOpen(false);
                            }
                          }}
                          className={`py-3 px-2 rounded-lg cursor-pointer transition-colors ${
                            notif.read ? 'opacity-70 hover:bg-[#FAF8F5]' : 'bg-[#FAF6F0] hover:bg-[#F5EFE6]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-xs font-semibold text-[#1C3B2B] leading-snug">
                              {notif.title}
                            </h5>
                            <span className="text-[10px] text-[#A0988C] shrink-0">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-[#4A453E] mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          {notif.linkTarget && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B38F5B] mt-1 hover:underline">
                              Lihat Pelacakan Resi <ExternalLink className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#F0EAE1]">
                    <button
                      onClick={() => requestBrowserPushPermission()}
                      className="w-full py-1.5 text-xs text-center font-medium text-[#1C3B2B] hover:bg-[#FAF6F0] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#B38F5B]" />
                      <span>Izinkan Notifikasi Push Browser</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-[#1C3B2B] text-white hover:bg-[#254F3A] rounded-full shadow-sm transition-all flex items-center justify-center cursor-pointer"
              title="Buka Tas Belanja"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartTotalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C5A880] text-[#1C3B2B] text-xs font-bold rounded-full flex items-center justify-center shadow">
                  {cartTotalItems}
                </span>
              )}
            </button>

            {/* Admin Switcher & Session Controls - Visible ONLY to Authenticated Admin */}
            {isAuthenticatedAdmin && (
              <div className="ml-1 flex items-center gap-1">
                <button
                  onClick={() => setIsAdminMode(!isAdminMode)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    isAdminMode
                      ? 'bg-[#B38F5B] text-white hover:bg-[#9B7A4C]'
                      : 'bg-[#EDE5D8] text-[#3D3830] hover:bg-[#E2D6C5]'
                  }`}
                  title="Beralih ke Admin Dashboard atau Toko Pelanggan"
                >
                  {isAdminMode ? (
                    <>
                      <Store className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ke Toko</span>
                    </>
                  ) : (
                    <>
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#1C3B2B]" />
                      <span className="hidden sm:inline">Admin</span>
                      <span 
                        title={firebaseSyncStatus === 'connected' ? 'Firestore Cloud Online' : 'Connecting'} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          firebaseSyncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                        }`} 
                      />
                    </>
                  )}
                </button>

                <button
                  onClick={() => logoutAdmin()}
                  className="p-1.5 rounded-full text-[#8C8377] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Keluar dari Sesi Pengelola (Logout Admin)"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Mobile Search Bar Expansion */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#8C8377] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.nav.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2 text-xs bg-[#F3EFEA] border border-[#E2D8CA] rounded-full focus:outline-none focus:border-[#1C3B2B] text-[#242320]"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8377]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
