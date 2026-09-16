import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { DEFAULT_WHATSAPP_DISPLAY, DEFAULT_WHATSAPP_CLEAN } from '../data/mockData';
import { 
  Heart, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  Send, 
  Check, 
  Phone, 
  MapPin, 
  Clock,
  Instagram,
  Facebook,
  Lock
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { 
    t, 
    setSelectedCategory, 
    setIsOrderTrackingOpen,
    setIsAdminLoginModalOpen,
    isAuthenticatedAdmin,
    setIsAdminMode
  } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSent, setNewsletterSent] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSent(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSent(false), 4000);
  };

  return (
    <footer className="bg-[#1C2822] text-[#D8CFBF] border-t border-[#2A3A32] pt-14 pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                saena
              </span>
              <span className="text-sm font-semibold text-[#C5A880] tracking-widest lowercase">
                .my.id
              </span>
            </div>
            
            <p className="text-[#A89F90] leading-relaxed max-w-sm">
              Butik busana muslim syari modern berkelas internasional. Menghadirkan abaya sutra mulberry eksklusif, French khimar, dress kaftan, dan mukena ibadah dengan standar butik haute couture.
            </p>

            <div className="space-y-2 text-[#C5BBAE]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C5A880] shrink-0" />
                <span>Flagship Boutique: Perum Graha Tresna, Tasikmalaya</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C5A880] shrink-0" />
                <span>WhatsApp Customer Service: {DEFAULT_WHATSAPP_DISPLAY}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C5A880] shrink-0" />
                <span>Layanan Pelanggan: Setiap Hari (08:00 - 22:00 WIB)</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              Koleksi Busana
            </h4>
            <ul className="space-y-2 text-[#A89F90]">
              <li>
                <button onClick={() => setSelectedCategory('abaya-gamis')} className="hover:text-white transition-colors">
                  Abaya & Gamis
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('hijab-pashmina')} className="hover:text-white transition-colors">
                  Hijab & Pashmina Silk
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('dress-kaftan')} className="hover:text-white transition-colors">
                  Dress & Kaftan Mewah
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('mukena-silk')} className="hover:text-white transition-colors">
                  Mukena Silk Premium
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('koko-kurta')} className="hover:text-white transition-colors">
                  Koko & Kurta Pria
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('aksesoris')} className="hover:text-white transition-colors">
                  Bros & Aksesoris
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service & Features */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              Layanan Pelanggan
            </h4>
            <ul className="space-y-2 text-[#A89F90]">
              <li>
                <button onClick={() => setIsOrderTrackingOpen(true)} className="hover:text-white transition-colors flex items-center gap-1.5 text-left">
                  <Truck className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Lacak Pengiriman Real-Time</span>
                </button>
              </li>
              <li>
                <a 
                  href={`https://wa.me/${DEFAULT_WHATSAPP_CLEAN}?text=Halo%20Admin%20saena.id,%20saya%20ingin%20konsultasi%20ukuran%20busana`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-white transition-colors block"
                >
                  Konsultasi Ukuran & Bahan via WhatsApp ({DEFAULT_WHATSAPP_DISPLAY})
                </a>
              </li>
              <li>
                <span className="text-[#A89F90]">Garansi Pengembalian & Penukaran 7 Hari</span>
              </li>
              <li>
                <span className="text-[#A89F90]">Katalog Pesanan Seragam & Seserahan</span>
              </li>
            </ul>
          </div>

          {/* Col 4: VIP Newsletter */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              Warta Eksklusif
            </h4>
            <p className="text-[#A89F90]">
              Dapatkan katalog koleksi terbatas Hari Raya dan undangan privat peluncuran busana baru.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Masukkan email Anda..."
                  className="w-full px-3 py-2 text-xs bg-[#293830] text-white border border-[#3D5246] rounded-l-lg focus:outline-none focus:border-[#C5A880]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A880] text-[#1C2822] font-bold rounded-r-lg hover:bg-[#D4BA95] transition-colors shrink-0"
                >
                  Daftar
                </button>
              </div>
              {newsletterSent && (
                <p className="text-[#C5A880] text-[11px] flex items-center gap-1 font-semibold">
                  <Check className="w-3 h-3" />
                  <span>Terima kasih telah bergabung dengan lingkaran saena.id!</span>
                </p>
              )}
            </form>
          </div>

        </div>

        {/* Accepted Payments & Logistics Badges */}
        <div className="pt-8 border-t border-[#2A3A32] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-[10px] uppercase font-bold text-[#8C8377] tracking-wider block">
              Metode Pembayaran Terverifikasi Otomatis
            </span>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold text-white/90">
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">QRIS</span>
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">BCA Virtual Account</span>
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">Mandiri VA</span>
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">BNI & BRI</span>
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">GoPay</span>
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">ShopeePay</span>
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">Visa / Mastercard</span>
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">COD</span>
            </div>
          </div>

          <div className="space-y-1.5 text-center md:text-right">
            <span className="text-[10px] uppercase font-bold text-[#8C8377] tracking-wider block">
              Mitra Ekspedisi Logistik Resmi
            </span>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-xs font-semibold text-white/90">
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">SiCepat Ekspres</span>
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">JNE Express</span>
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">J&T Express</span>
              <span className="px-2.5 py-1 bg-[#283830] rounded border border-[#3A4E42]">DHL Express Worldwide</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 border-t border-[#2A3A32] flex flex-col sm:flex-row items-center justify-between text-[#827A6D] text-[11px] gap-3">
          <p>© 2026 saena.my.id • Hak Cipta Dilindungi Undang-Undang. Modest Muslim Fashion & Boutique.</p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="hover:text-white cursor-pointer">Kebijakan Privasi</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Syarat & Ketentuan</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Sertifikasi Halal & Syari</span>
            {isAuthenticatedAdmin && (
              <>
                <span>•</span>
                <button 
                  onClick={() => setIsAdminMode(true)}
                  className="text-[#C5A880] hover:text-white flex items-center gap-1 font-medium transition-colors"
                  title="Buka Panel Pengelola"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Panel Pengelola</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
