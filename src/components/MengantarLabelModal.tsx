import React from 'react';
import { Order } from '../types';
import { X, Printer, Truck, CheckCircle2, ShieldCheck, QrCode, ExternalLink } from 'lucide-react';

interface MengantarLabelModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MengantarLabelModal: React.FC<MengantarLabelModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCod = order.payment.channel === 'cod';
  const courierName = order.mengantar?.courier || order.shipping.courier || 'JNE';
  const trackingNumber = order.mengantar?.trackingNumber || order.trackingNumber || 'MGT-00000000';
  const mengantarOrderId = order.mengantar?.mengantarOrderId || `MGT-${order.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#E8DFC0] print:border-0 print:shadow-none print:max-w-none print:w-full">
        
        {/* Modal Header (Hidden on Print) */}
        <div className="px-6 py-4 bg-[#1C3B2B] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C5A880]/20 flex items-center justify-center text-[#F3E8CE]">
              <Truck className="w-4 h-4 text-[#C5A880]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">Label Pengiriman Mengantar.com</h3>
              <p className="text-[11px] text-[#C5A880]">Format Standar Resi Thermal (100 × 150 mm)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#C5A880] hover:bg-[#b09268] text-[#1C3B2B] font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Resi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Label Area */}
        <div className="p-6 print:p-4 bg-neutral-50 flex justify-center">
          <div 
            id="mengantar-shipping-label"
            className="w-full max-w-[380px] bg-white border-2 border-black p-4 text-black font-mono text-[11px] space-y-3 print:border print:shadow-none"
          >
            {/* Header: Mengantar & Courier */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div>
                <span className="text-xs font-black tracking-widest text-[#1C3B2B] uppercase block">
                  MENGANTAR.COM
                </span>
                <span className="text-[9px] text-neutral-600 block">Shipping Aggregator</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black uppercase px-2 py-0.5 bg-black text-white rounded-xs">
                  {courierName}
                </span>
                <span className="text-[10px] font-bold block mt-0.5">
                  {order.shipping.service || 'REGULER'}
                </span>
              </div>
            </div>

            {/* Barcode & Resi Display */}
            <div className="text-center py-2 border-b-2 border-black space-y-1">
              {/* Simulated Code 128 barcode bars */}
              <div className="h-10 flex items-center justify-center gap-[2px] overflow-hidden px-4">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 1, 2, 4, 2, 1, 3, 1, 4, 2].map((w, i) => (
                  <div 
                    key={i} 
                    className="bg-black h-full" 
                    style={{ width: `${w}px` }} 
                  />
                ))}
              </div>
              <div className="text-xs font-black tracking-wider uppercase">
                NO RESI: {trackingNumber}
              </div>
              <div className="text-[9px] text-neutral-600">
                Mengantar Order ID: {mengantarOrderId} | Ref: {order.id}
              </div>
            </div>

            {/* COD or Non COD banner */}
            <div className={`p-2 border-2 border-black text-center font-black ${isCod ? 'bg-black text-white text-xs' : 'bg-neutral-100 text-black text-[11px]'}`}>
              {isCod ? (
                <div>
                  <span className="tracking-widest uppercase">⚠️ PAKET C.O.D (BAYAR DI TEMPAT)</span>
                  <div className="text-sm mt-0.5">
                    TAGIHAN: Rp {order.total.toLocaleString('id-ID')}
                  </div>
                </div>
              ) : (
                <div className="tracking-wider uppercase">
                  ✓ NON-COD / SUDAH LUNAS (JANGAN TAGIH PEMBELI)
                </div>
              )}
            </div>

            {/* Receiver & Sender Columns */}
            <div className="grid grid-cols-2 gap-2 border-b-2 border-black pb-2">
              {/* Receiver */}
              <div className="border-r border-black pr-2">
                <div className="text-[9px] font-bold uppercase bg-black text-white px-1 py-0.5 inline-block mb-1">
                  PENERIMA:
                </div>
                <div className="font-bold text-[11px] leading-tight">{order.customer.fullName}</div>
                <div className="text-[10px] text-neutral-800 leading-tight mt-0.5">{order.customer.whatsapp}</div>
                <div className="text-[10px] leading-tight mt-1 text-neutral-900 break-words">
                  {order.customer.address}
                </div>
                <div className="text-[9px] font-bold text-neutral-800 mt-1 uppercase">
                  {order.customer.subdistrict}, {order.customer.city}
                </div>
                <div className="text-[9px] font-bold">
                  KODE POS: {order.customer.postalCode || '46196'}
                </div>
              </div>

              {/* Sender */}
              <div className="pl-1">
                <div className="text-[9px] font-bold uppercase bg-neutral-200 text-black px-1 py-0.5 inline-block mb-1">
                  PENGIRIM:
                </div>
                <div className="font-bold text-[11px] leading-tight text-[#1C3B2B]">saena.id Boutique</div>
                <div className="text-[10px] text-neutral-800 leading-tight mt-0.5">+6285724023064</div>
                <div className="text-[9px] leading-tight mt-1 text-neutral-700">
                  Central Boutique Warehouse, Jl. Tamansari No. 88
                </div>
                <div className="text-[9px] font-bold text-neutral-800 mt-1 uppercase">
                  Kec. Tamansari, Kota Tasikmalaya (46196)
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div className="border-b-2 border-black pb-2 space-y-1">
              <div className="text-[9px] font-bold uppercase flex justify-between">
                <span>ISI PAKET (BUSANA MUSLIM):</span>
                <span>BERAT: ~{(order.items.length * 0.5).toFixed(1)} KG</span>
              </div>
              <div className="text-[9px] text-neutral-800 space-y-0.5 max-h-20 overflow-hidden">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[240px]">
                      {it.quantity}x {it.product.name} ({it.selectedColor.name}, {it.selectedSize})
                    </span>
                    <span className="font-mono">Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-[8px] text-neutral-600 flex items-center justify-between pt-1">
              <span>Dicetak via Mengantar.com API Engine</span>
              <span>{new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden on Print) */}
        <div className="p-4 bg-white border-t border-[#E8DFC0] flex items-center justify-between print:hidden">
          <div className="text-xs text-[#736B5E]">
            Resi resmi tercatat di server <strong>Mengantar.com</strong>.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#1F2421] text-xs font-semibold rounded-xl transition-all"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-[#1C3B2B] hover:bg-[#28523C] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#C5A880]" />
              <span>Cetak Label Thermal</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
