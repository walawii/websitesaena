import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Package, 
  Copy, 
  Check, 
  Share2,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { OrderStatus, Order } from '../types';

export const OrderTrackingModal: React.FC = () => {
  const {
    isOrderTrackingOpen,
    setIsOrderTrackingOpen,
    orders,
    activeOrder,
    setActiveOrder,
    updateOrderStatus,
    formatPrice,
    setIsWhatsAppModalOpen,
    setActiveWhatsAppOrder
  } = useStore();

  const [searchInput, setSearchInput] = useState('');
  const [copiedResi, setCopiedResi] = useState(false);
  const [searchError, setSearchError] = useState('');

  if (!isOrderTrackingOpen) return null;

  // Selected order to display
  const currentOrder: Order | undefined = activeOrder || orders[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    const query = searchInput.trim().toUpperCase();
    if (!query) return;

    const found = orders.find(
      o => o.id.toUpperCase() === query || o.trackingNumber.toUpperCase() === query
    );

    if (found) {
      setActiveOrder(found);
      setSearchInput('');
    } else {
      setSearchError('Nomor pesanan atau nomor resi tidak ditemukan di sistem.');
    }
  };

  const handleCopyResi = (resi: string) => {
    navigator.clipboard.writeText(resi);
    setCopiedResi(true);
    setTimeout(() => setCopiedResi(false), 2000);
  };

  // Milestone progression definition
  const milestones: { status: OrderStatus; title: string; desc: string }[] = [
    {
      status: 'menunggu_pembayaran',
      title: 'Pesanan Dibuat',
      desc: 'Pesanan telah diterima dan menunggu verifikasi pembayaran'
    },
    {
      status: 'dibayar',
      title: 'Pembayaran Diverifikasi',
      desc: 'Pembayaran telah lunas & terekam di sistem otomatis'
    },
    {
      status: 'sedang_dikemas',
      title: 'Diproses & Dikemas',
      desc: 'Quality control, pengemasan boks butik & parfum kasturi'
    },
    {
      status: 'dikirim',
      title: 'Diserahkan ke Kurir',
      desc: 'Paket telah dibawa kurir ekspedisi dengan nomor resi aktif'
    },
    {
      status: 'tiba_di_tujuan',
      title: 'Kurir Menuju Alamat',
      desc: 'Paket tiba di hub kota Anda dan diantar kurir ke rumah'
    },
    {
      status: 'selesai',
      title: 'Paket Telah Diterima',
      desc: 'Pesanan berhasil diserahkan dengan aman kepada penerima'
    }
  ];

  const statusOrderIndex: Record<OrderStatus, number> = {
    menunggu_pembayaran: 0,
    dibayar: 1,
    sedang_dikemas: 2,
    dikirim: 3,
    tiba_di_tujuan: 4,
    selesai: 5,
    dibatalkan: -1
  };

  const currentStepIdx = currentOrder ? statusOrderIndex[currentOrder.status] : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E5DDD2] my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE2D5] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#1C3B2B]" />
            <div>
              <h3 className="font-display text-base sm:text-lg font-semibold text-[#1C3B2B]">
                Pelacakan Pengiriman Real-Time
              </h3>
              <p className="text-[11px] text-[#7A7266]">
                Pantau langsung pergerakan kurir ekspedisi pesanan Anda
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOrderTrackingOpen(false)}
            className="p-1 rounded-full text-gray-500 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="space-y-1.5">
            <div className="relative flex">
              <Search className="w-4 h-4 text-[#8C8377] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari ID Pesanan (cth: SAENA-98214) atau Nomor Resi..."
                className="w-full pl-10 pr-24 py-2.5 text-xs bg-[#FAF7F2] border border-[#D5C9B8] rounded-xl focus:outline-none focus:border-[#1C3B2B] text-[#242320]"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#1C3B2B] text-white text-xs font-semibold rounded-lg hover:bg-[#28523C] transition-colors"
              >
                Lacak
              </button>
            </div>
            {searchError && (
              <p className="text-xs text-[#B34033] font-medium pl-2">{searchError}</p>
            )}
          </form>

          {currentOrder ? (
            <div className="space-y-6">
              
              {/* Order & Courier Banner */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E5DDD2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1C3B2B]">
                      {currentOrder.id}
                    </span>
                    <span className="text-[10px] bg-[#1C3B2B]/10 text-[#1C3B2B] font-bold px-2 py-0.5 rounded-full uppercase">
                      {currentOrder.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A7266] mt-0.5">
                    Dipesan pada {currentOrder.createdAt} • Penerima: {currentOrder.customer.fullName}
                  </p>
                </div>

                {/* Resi Box */}
                <div className="bg-white p-2.5 rounded-xl border border-[#E2D8CA] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-[#7A7266] block">
                      {currentOrder.shipping.courier} ({currentOrder.shipping.service})
                    </span>
                    <span className="font-mono text-xs font-bold text-[#1C3B2B]">
                      {currentOrder.trackingNumber}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyResi(currentOrder.trackingNumber)}
                    className="p-1.5 text-xs bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#4A453E] rounded-lg border border-[#D5C9B8] flex items-center gap-1"
                    title="Salin Resi"
                  >
                    {copiedResi ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Milestone Progress Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C3B2B]">
                    Status Perjalanan Paket
                  </h4>
                  <span className="text-[11px] text-[#7A7266] font-medium">
                    Tracking Ekspedisi Real-Time
                  </span>
                </div>

                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5DDD2]">
                  {milestones.map((step, idx) => {
                    const isDone = currentStepIdx >= idx;
                    const isCurrent = currentStepIdx === idx;

                    return (
                      <div key={step.status} className="relative flex items-start gap-3">
                        {/* Step Marker Dot */}
                        <div 
                          className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                            isCurrent
                              ? 'bg-[#1C3B2B] border-[#C5A880] text-white shadow-md ring-4 ring-[#1C3B2B]/10 animate-pulse'
                              : isDone
                              ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
                              : 'bg-white border-[#D5C9B8] text-[#9A9184]'
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          )}
                        </div>

                        {/* Text */}
                        <div>
                          <h5 className={`text-xs font-bold leading-tight ${
                            isCurrent ? 'text-[#1C3B2B] text-sm' : isDone ? 'text-[#1F2421]' : 'text-[#8C8377]'
                          }`}>
                            {step.title}
                          </h5>
                          <p className="text-[11px] text-[#6E6659] mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Real-Time Transit Logs */}
              <div className="space-y-3 pt-4 border-t border-[#EAE2D5]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C3B2B]">
                  Log Riwayat Pemindaian Kurir
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {currentOrder.trackingHistory.slice().reverse().map((log, idx) => (
                    <div key={idx} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#F0EAE1] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[#8C8377] text-[10px]">
                        <span className="flex items-center gap-1 text-[#1C3B2B] font-semibold">
                          <MapPin className="w-3 h-3 text-[#B38F5B]" />
                          {log.location}
                        </span>
                        <span>{log.time}</span>
                      </div>
                      <p className="text-[#4A453E] leading-relaxed">
                        {log.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    setActiveWhatsAppOrder(currentOrder);
                    setIsWhatsAppModalOpen(true);
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim Rincian Resi ke WhatsApp</span>
                </button>

                <button
                  onClick={() => setIsOrderTrackingOpen(false)}
                  className="py-2.5 px-4 bg-[#EAE2D5] hover:bg-[#DFD6C7] text-[#3D3830] text-xs font-semibold rounded-xl transition-colors"
                >
                  Tutup
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-xs text-[#7A7266]">
              Belum ada data pesanan yang dipilih. Silakan masukkan nomor pesanan di atas.
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
