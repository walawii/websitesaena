import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  BarChart3, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Plus, 
  Send, 
  CheckCircle2, 
  Clock, 
  Truck, 
  RefreshCw, 
  Search, 
  DollarSign, 
  Layers, 
  Edit3, 
  Save, 
  Sparkles,
  Smartphone,
  ExternalLink,
  ChevronDown,
  Database,
  Server,
  ShieldCheck,
  Check,
  LogOut,
  Trash2,
  FileSpreadsheet,
  Printer,
  Building2,
  QrCode,
  FileText
} from 'lucide-react';
import { OrderStatus, Category, Product } from '../types';
import { ProductEditModal } from './ProductEditModal';
import { CreateProductModal } from './CreateProductModal';
import { ImportMarketplaceModal } from './ImportMarketplaceModal';
import { ExcelImportModal } from './ExcelImportModal';
import { DEFAULT_WHATSAPP_DISPLAY, DEFAULT_WHATSAPP_NUMBER } from '../data/mockData';
import { testMengantarConnectionApi } from '../utils/mengantarClient';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    orders,
    formatPrice,
    updateOrderStatus,
    updateStock,
    updateColorStock,
    updateProduct,
    deleteProduct,
    quickRestock,
    updateProductPrice,
    addNewProduct,
    deleteAllProducts,
    sendPushNotification,
    setIsAdminMode,
    setActiveWhatsAppOrder,
    setIsWhatsAppModalOpen,
    isFirebaseConnected,
    firebaseSyncStatus,
    reseedDatabase,
    logoutAdmin,
    mengantarConfig,
    dispatchOrderToMengantar,
    setActiveMengantarLabelOrder,
    setIsMengantarLabelModalOpen,
    setIsMengantarConfigModalOpen
  } = useStore();

  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'inventory' | 'push' | 'database' | 'mengantar'>('analytics');
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');
  const [dispatchingOrderId, setDispatchingOrderId] = useState<string | null>(null);
  const [isBatchDispatching, setIsBatchDispatching] = useState(false);
  const [batchDispatchMsg, setBatchDispatchMsg] = useState<string | null>(null);
  const [testingMengantar, setTestingMengantar] = useState(false);
  const [mengantarTestResult, setMengantarTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [isReseeding, setIsReseeding] = useState(false);
  const [reseedDone, setReseedDone] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Delete Product State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // New Product & Marketplace Import Modal States
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isImportMarketplaceOpen, setIsImportMarketplaceOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [importedInitialData, setImportedInitialData] = useState<any | null>(null);

  // Push Broadcast State
  const [pushTitle, setPushTitle] = useState('✨ Flash Sale Spesial Ramadhan saena.id!');
  const [pushBody, setPushBody] = useState('Nikmati potongan 20% untuk semua koleksi Abaya & Silk Khimar hari ini saja. Gunakan kode ELEGANT20!');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Price Edit Inline state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  // Computed Analytics KPIs
  const totalRevenue = orders.reduce((sum, ord) => sum + (ord.status !== 'dibatalkan' ? ord.total : 0), 0);
  const todayRevenue = orders
    .filter(ord => ord.createdAt.includes('2026-09-11') || ord.createdAt.includes('Hari ini') || ord.createdAt.includes('Baru'))
    .reduce((sum, ord) => sum + ord.total, 0);

  const totalOrdersCount = orders.length;
  const totalItemsSold = orders.reduce((sum, ord) => {
    return sum + ord.items.reduce((iSum, it) => iSum + it.quantity, 0);
  }, 0);

  const lowStockProducts = products.filter(p => p.totalStock <= 10);

  // Filtered Orders
  const filteredOrders = orders.filter(ord => {
    const matchesStatus = orderFilterStatus === 'all' || ord.status === orderFilterStatus;
    const matchesSearch = 
      ord.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.customer.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.trackingNumber.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleBroadcastPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushBody.trim()) return;

    sendPushNotification(pushTitle.trim(), pushBody.trim(), 'promo');
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen pb-16">
      
      {/* Admin Subheader Bar */}
      <div className="bg-[#1C3B2B] text-white border-b border-[#2A5941] py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold tracking-tight">saena.id</span>
              <span className="text-[10px] bg-[#C5A880] text-[#1C3B2B] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-[#C5BBAE] mt-0.5">
              Pusat Kendali Penjualan Harian, Telemetri Real-Time, & Manajemen Inventaris Busana Muslim
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdminMode(false)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-lg border border-white/20 transition-colors flex items-center gap-1.5"
            >
              <span>Lihat Toko</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => logoutAdmin()}
              className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold rounded-lg border border-rose-400/30 transition-colors flex items-center gap-1.5"
              title="Kunci Panel dan Keluar dari Mode Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Kunci & Logout Admin</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Revenue */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <div className="flex items-center justify-between text-[#8C8377] mb-2">
              <span className="text-xs font-semibold">Omset Hari Ini</span>
              <div className="w-8 h-8 rounded-lg bg-[#1C3B2B]/10 text-[#1C3B2B] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#1C3B2B]">
              {formatPrice(todayRevenue || totalRevenue)}
            </div>
            <span className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1 mt-1">
              <span>+18.4%</span>
              <span className="text-[#8C8377] font-normal">vs kemarin</span>
            </span>
          </div>

          {/* Total Orders */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <div className="flex items-center justify-between text-[#8C8377] mb-2">
              <span className="text-xs font-semibold">Total Pesanan</span>
              <div className="w-8 h-8 rounded-lg bg-[#B38F5B]/10 text-[#B38F5B] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#1F2421]">
              {totalOrdersCount} Pesanan
            </div>
            <span className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1 mt-1">
              <span>100% Terlayani</span>
            </span>
          </div>

          {/* Items Sold */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <div className="flex items-center justify-between text-[#8C8377] mb-2">
              <span className="text-xs font-semibold">Produk Terjual</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#1F2421]">
              {totalItemsSold} Pcs
            </div>
            <span className="text-[11px] text-[#8C8377] mt-1 block">
              Abaya Silk & Hijab terlaris
            </span>
          </div>

          {/* Conversion */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <div className="flex items-center justify-between text-[#8C8377] mb-2">
              <span className="text-xs font-semibold">Konversi Checkout</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#1F2421]">
              4.8%
            </div>
            <span className="text-[11px] text-[#2E7D32] font-semibold mt-1 block">
              Tinggi (Industri avg: 2.2%)
            </span>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5DDD2] shadow-xs">
            <div className="flex items-center justify-between text-[#8C8377] mb-2">
              <span className="text-xs font-semibold">Peringatan Stok</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-800">
              {lowStockProducts.length} Produk
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-1 block">
              Stok &le; 10 unit tersisa
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E2D8CA] overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-[#1C3B2B] text-[#1C3B2B] bg-white shadow-2xs'
                : 'border-transparent text-[#787063] hover:text-[#1C3B2B]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Laporan & Analitik Penjualan</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-[#1C3B2B] text-[#1C3B2B] bg-white shadow-2xs'
                : 'border-transparent text-[#787063] hover:text-[#1C3B2B]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Manajemen Pesanan Real-Time ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'border-[#1C3B2B] text-[#1C3B2B] bg-white shadow-2xs'
                : 'border-transparent text-[#787063] hover:text-[#1C3B2B]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Manajemen Stok & Produk ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('push')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'push'
                ? 'border-[#1C3B2B] text-[#1C3B2B] bg-white shadow-2xs'
                : 'border-transparent text-[#787063] hover:text-[#1C3B2B]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Kirim Notifikasi Push Promosi</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'database'
                ? 'border-[#1C3B2B] text-[#1C3B2B] bg-white shadow-2xs'
                : 'border-transparent text-[#787063] hover:text-[#1C3B2B]'
            }`}
          >
            <Database className="w-4 h-4" />
            <div className="flex items-center gap-1.5">
              <span>Database Cloud Firestore</span>
              <span className={`w-2 h-2 rounded-full ${
                firebaseSyncStatus === 'connected' 
                  ? 'bg-emerald-500 animate-pulse' 
                  : firebaseSyncStatus === 'syncing'
                  ? 'bg-amber-500 animate-spin'
                  : 'bg-gray-400'
              }`} />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('mengantar')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'mengantar'
                ? 'border-[#1C3B2B] text-[#1C3B2B] bg-white shadow-2xs'
                : 'border-transparent text-[#787063] hover:text-[#1C3B2B]'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            <div className="flex items-center gap-1.5">
              <span>Mengantar.com</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                {orders.filter(o => o.mengantar).length} Resi
              </span>
            </div>
          </button>
        </div>

        {/* TAB 1: ANALYTICS & REPORTS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Daily Sales Bar Chart */}
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1C3B2B]">
                      Tren Penjualan Harian Real-Time (7 Hari Terakhir)
                    </h3>
                    <p className="text-xs text-[#7A7266]">
                      Grafik volume transaksi kotor (Gross Revenue) saena.id
                    </p>
                  </div>
                  <span className="text-xs bg-[#1C3B2B]/10 text-[#1C3B2B] font-bold px-2.5 py-1 rounded-full">
                    Live Telemetry
                  </span>
                </div>

                {/* SVG Visual Bar Chart */}
                <div className="pt-4">
                  <div className="h-56 flex items-end justify-between gap-3 px-2 border-b border-[#EAE2D5]">
                    {[
                      { day: 'Sen', amount: 3200000, height: '45%' },
                      { day: 'Sel', amount: 4100000, height: '55%' },
                      { day: 'Rab', amount: 2900000, height: '38%' },
                      { day: 'Kam', amount: 4800000, height: '65%' },
                      { day: 'Jum', amount: 6200000, height: '82%' },
                      { day: 'Sab', amount: 7500000, height: '95%' },
                      { day: 'Min (Hari Ini)', amount: 8200000, height: '100%', highlight: true }
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-semibold text-[#1C3B2B] opacity-0 group-hover:opacity-100 transition-opacity">
                          Rp {(bar.amount / 1000000).toFixed(1)}jt
                        </span>
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-95 ${
                            bar.highlight ? 'bg-[#1C3B2B]' : 'bg-[#C5A880]'
                          }`}
                          style={{ height: bar.height }}
                        />
                        <span className={`text-xs font-semibold ${bar.highlight ? 'text-[#1C3B2B]' : 'text-[#7A7266]'}`}>
                          {bar.day}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#7A7266] pt-2">
                    <span>*Data terakumulasi otomatis dari transaksi payment gateway</span>
                    <span className="font-semibold text-[#1C3B2B]">Rata-rata Harian: Rp 5.270.000</span>
                  </div>
                </div>
              </div>

              {/* Category Sales Share */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#1C3B2B]">
                  Pangsa Penjualan per Kategori
                </h3>
                
                <div className="space-y-3 pt-1">
                  {[
                    { label: 'Abaya & Gamis', share: 45, color: '#1C3B2B' },
                    { label: 'Hijab & Silk Pashmina', share: 25, color: '#B38F5B' },
                    { label: 'Dress & Kaftan Mewah', share: 15, color: '#6A7F60' },
                    { label: 'Mukena Silk Premium', share: 10, color: '#D4AF37' },
                    { label: 'Kurta Pria & Aksesoris', share: 5, color: '#8F6873' },
                  ].map((cat, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium text-[#3D3830]">{cat.label}</span>
                        <span className="font-bold text-[#1C3B2B]">{cat.share}%</span>
                      </div>
                      <div className="w-full bg-[#EAE2D5] rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ width: `${cat.share}%`, backgroundColor: cat.color }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5] text-xs text-[#524B40] space-y-1">
                  <div className="font-bold text-[#1C3B2B]">Highlight Performa:</div>
                  <p>Koleksi *Madina Silk Abaya Set* berkontribusi terbesar 34% terhadap total omset mingguan.</p>
                </div>
              </div>
            </div>

            {/* Best Sellers Ranking Table */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#1C3B2B]">
                Peringkat Produk Busana Terlaris (Best Sellers)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAE2D5] text-[#7A7266] font-semibold">
                      <th className="pb-2">Produk</th>
                      <th className="pb-2">Kategori</th>
                      <th className="pb-2">Harga</th>
                      <th className="pb-2">Sisa Stok</th>
                      <th className="pb-2">Rating & Ulasan</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE4]">
                    {products.slice(0, 5).map(prod => (
                      <tr key={prod.id} className="hover:bg-[#FAF8F5]">
                        <td className="py-2.5 flex items-center gap-2.5">
                          <img 
                            src={prod.images[0]} 
                            alt={prod.name} 
                            className="w-10 h-12 object-cover rounded-lg bg-[#EFE9E0]"
                          />
                          <div>
                            <span className="font-bold text-[#1C3B2B] block">{prod.name}</span>
                            <span className="text-[10px] text-[#7A7266]">{prod.material}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-[#5A5348] capitalize">
                          {prod.category.replace('-', ' ')}
                        </td>
                        <td className="py-2.5 font-bold text-[#1C3B2B]">
                          {formatPrice(prod.price)}
                        </td>
                        <td className="py-2.5 font-semibold">
                          <span className={prod.totalStock <= 5 ? 'text-[#B34033]' : 'text-[#2E7D32]'}>
                            {prod.totalStock} unit
                          </span>
                        </td>
                        <td className="py-2.5">
                          ⭐ {prod.rating} ({prod.reviewCount})
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2E7D32]/10 text-[#2E7D32]">
                            Aktif
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ORDER MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-4">
            {/* Origin Warehouse Header Banner with Mengantar Integration Status */}
            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2D8CA] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <Truck className="w-4 h-4 text-[#1C3B2B]" />
                <span className="font-bold text-[#1C3B2B]">Gudang Asal & Ekspedisi:</span>
                <span className="text-[#3D3830]">Tamansari, Tasikmalaya (46196)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Mengantar.com ({mengantarConfig.environment})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMengantarConfigModalOpen(true)}
                  className="text-xs bg-white text-[#1C3B2B] hover:bg-[#F4EFE6] border border-[#D5C9B8] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>⚙️ Atur Mengantar</span>
                </button>
                <button
                  onClick={async () => {
                    const pendingPaid = orders.filter(o => (o.status === 'dibayar' || o.status === 'sedang_dikemas') && !o.mengantar);
                    if (pendingPaid.length === 0) {
                      setBatchDispatchMsg('Semua pesanan lunas sudah terhubung dengan Mengantar.com.');
                      setTimeout(() => setBatchDispatchMsg(null), 4000);
                      return;
                    }
                    setIsBatchDispatching(true);
                    setBatchDispatchMsg(`Memproses ${pendingPaid.length} pesanan ke Mengantar...`);
                    let count = 0;
                    for (const ord of pendingPaid) {
                      try {
                        await dispatchOrderToMengantar(ord.id);
                        count++;
                      } catch (err) {
                        console.warn(err);
                      }
                    }
                    setIsBatchDispatching(false);
                    setBatchDispatchMsg(`Berhasil kirim ${count} pesanan ke Mengantar.com! Resi siap cetak.`);
                    setTimeout(() => setBatchDispatchMsg(null), 5000);
                  }}
                  disabled={isBatchDispatching}
                  className="text-xs bg-[#1C3B2B] hover:bg-[#2A4D3B] text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
                >
                  {isBatchDispatching ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Truck className="w-3 h-3 text-[#C5A880]" />
                  )}
                  <span>Kirim Semua Pesanan Lunas</span>
                </button>
              </div>
            </div>

            {batchDispatchMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{batchDispatchMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#1C3B2B]">
                  Manajemen Pesanan Masuk & Pengiriman Mengantar.com
                </h3>
                <p className="text-xs text-[#7A7266]">
                  Kelola status, kirim order ke Mengantar.com, dan cetak label resi thermal (100x150 mm)
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8C8377] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Cari ID/Nama/Resi..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                  />
                </div>

                <select
                  value={orderFilterStatus}
                  onChange={(e) => setOrderFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                >
                  <option value="all">Semua Status</option>
                  <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                  <option value="dibayar">Dibayar</option>
                  <option value="sedang_dikemas">Sedang Dikemas</option>
                  <option value="dikirim">Dikirim</option>
                  <option value="tiba_di_tujuan">Tiba di Tujuan</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE2D5] text-[#7A7266] font-semibold">
                    <th className="pb-2.5">ID Pesanan</th>
                    <th className="pb-2.5">Pelanggan</th>
                    <th className="pb-2.5">Item Busana</th>
                    <th className="pb-2.5">Total Tagihan</th>
                    <th className="pb-2.5">Kurir & No. Resi</th>
                    <th className="pb-2.5">Status Pesanan</th>
                    <th className="pb-2.5">Aksi & Mengantar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE4]">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 font-bold text-[#1C3B2B]">
                        {order.id}
                        <span className="block text-[10px] text-[#8C8377] font-normal">
                          {order.createdAt}
                        </span>
                      </td>

                      <td className="py-3">
                        <span className="font-bold text-[#1F2421] block">{order.customer.fullName}</span>
                        <span className="text-[10px] text-[#7A7266] block">
                          WA: {order.customer.whatsapp}
                        </span>
                        <span className="text-[10px] text-[#7A7266] block truncate max-w-[140px]">
                          {order.customer.city}
                        </span>
                      </td>

                      <td className="py-3">
                        <div className="space-y-0.5">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="text-[11px]">
                              {it.quantity}x {it.product.name} ({it.selectedSize})
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 font-bold text-[#1C3B2B]">
                        {formatPrice(order.total)}
                        <span className="block text-[10px] text-[#7A7266] font-normal">
                          via {order.payment.channel.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-[#1F2421]">
                            {order.mengantar?.courier || order.shipping.courier}
                          </span>
                          {order.mengantar ? (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded border border-emerald-200">
                              Mengantar
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-500 bg-gray-100 px-1 py-0.2 rounded">
                              Manual
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-[#1C3B2B] bg-[#EFE9E0] px-1.5 py-0.5 rounded block mt-0.5 font-bold">
                          {order.mengantar?.trackingNumber || order.trackingNumber}
                        </span>
                        {order.mengantar?.pickupTime && (
                          <span className="text-[10px] text-[#7A7266] block mt-0.5">
                            Pickup: {order.mengantar.pickupTime}
                          </span>
                        )}
                      </td>

                      {/* Status changer select */}
                      <td className="py-3">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border focus:outline-none ${
                            order.status === 'selesai'
                              ? 'bg-green-50 text-green-800 border-green-200'
                              : order.status === 'dikirim'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : order.status === 'sedang_dikemas'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-neutral-50 text-neutral-800 border-neutral-200'
                          }`}
                        >
                          <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                          <option value="dibayar">Dibayar (Lunas)</option>
                          <option value="sedang_dikemas">Sedang Dikemas</option>
                          <option value="dikirim">Dikirim (Kurir)</option>
                          <option value="tiba_di_tujuan">Tiba di Kota Tujuan</option>
                          <option value="selesai">Selesai (Diterima)</option>
                          <option value="dibatalkan">Dibatalkan</option>
                        </select>
                      </td>

                      <td className="py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => {
                              setActiveWhatsAppOrder(order);
                              setIsWhatsAppModalOpen(true);
                            }}
                            className="px-2 py-1 bg-[#25D366] text-white text-[11px] font-semibold rounded-lg hover:bg-[#20BA5A] flex items-center gap-1 transition-colors"
                            title="Kirim Invoice WhatsApp"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>WA</span>
                          </button>

                          {order.mengantar ? (
                            <button
                              onClick={() => {
                                setActiveMengantarLabelOrder(order);
                                setIsMengantarLabelModalOpen(true);
                              }}
                              className="px-2 py-1 bg-[#1C3B2B] text-[#F3EFEA] text-[11px] font-semibold rounded-lg hover:bg-[#2A4D3B] flex items-center gap-1 transition-colors shadow-2xs"
                              title="Cetak Label Resi Thermal Mengantar (100x150 mm)"
                            >
                              <Printer className="w-3 h-3 text-[#C5A880]" />
                              <span>Cetak Resi</span>
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                setDispatchingOrderId(order.id);
                                try {
                                  await dispatchOrderToMengantar(order.id);
                                } finally {
                                  setDispatchingOrderId(null);
                                }
                              }}
                              disabled={dispatchingOrderId === order.id}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-50"
                              title="Kirim Pesanan ke Mengantar.com untuk Terbitkan Resi Kurir"
                            >
                              {dispatchingOrderId === order.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Truck className="w-3 h-3" />
                              )}
                              <span>Kirim Mengantar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY & STOCK MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div className="bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#1C3B2B]">
                  Sistem Manajemen Stok & Katalog Produk
                </h3>
                <p className="text-xs text-[#7A7266]">
                  Pantau stok per ukuran, restock 1-klik, dan update harga jual produk
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                <button
                  id="open-excel-import-btn"
                  onClick={() => setIsExcelImportOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  title="Impor produk massal menggunakan format spreadsheet Excel (.xlsx / .xls)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Upload Excel / XLS</span>
                </button>

                <button
                  id="open-marketplace-import-btn"
                  onClick={() => setIsImportMarketplaceOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  title="Impor produk otomatis hanya dengan menempelkan link Shopee atau TikTok"
                >
                  <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                  <span>Impor Link Shopee / TikTok</span>
                </button>

                <button
                  id="open-manual-add-product-btn"
                  onClick={() => {
                    setImportedInitialData(null);
                    setIsAddProductOpen(true);
                  }}
                  className="px-4 py-2 bg-[#1C3B2B] text-white text-xs font-semibold rounded-xl hover:bg-[#28523C] shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4 text-[#C5A880]" />
                  <span>Tambah Busana Baru</span>
                </button>

                {products.length > 0 && (
                  <button
                    id="open-delete-all-products-btn"
                    onClick={() => setIsDeleteAllModalOpen(true)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all"
                    title="Hapus semua produk dari katalog dan database Firestore"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Semua Produk</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE2D5] text-[#7A7266] font-semibold">
                    <th className="pb-2.5">Koleksi Busana</th>
                    <th className="pb-2.5">Harga Jual</th>
                    <th className="pb-2.5">Rincian Stok per Warna & Foto Varian</th>
                    <th className="pb-2.5 text-center">Total Stok</th>
                    <th className="pb-2.5 text-right">Aksi & Menu Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE4]">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-full bg-[#F3EFEA] text-[#8C8377] flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6 stroke-1 text-[#C5A880]" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#1C3B2B]">Katalog Saat Ini Kosong</h4>
                            <p className="text-xs text-[#7A7266] mt-1">
                              Semua produk dan gambar telah dihapus dari toko dan database. Anda dapat mengunggah file Excel / XLS baru atau menempelkan tautan Shopee/TikTok untuk mengisi katalog.
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              onClick={() => setIsExcelImportOpen(true)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1 transition-all"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Upload Excel</span>
                            </button>
                            <button
                              onClick={() => setIsImportMarketplaceOpen(true)}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1 transition-all"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Impor Link Shopee / TikTok</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map(product => {
                    const isLow = product.totalStock <= 10;
                    const isOut = product.totalStock === 0;

                    return (
                      <tr key={product.id} className="hover:bg-[#FAF8F5] transition-colors">
                        {/* Product Info */}
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-14 object-cover rounded-lg bg-[#EFE9E0] border border-[#E5DDD2] shadow-xs"
                            />
                            <div>
                              <span className="font-bold text-[#1C3B2B] block leading-tight">{product.name}</span>
                              <span className="text-[10px] text-[#7A7266] font-mono">ID: {product.id}</span>
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-[#FAF6F0] text-[#7A7266] rounded text-[9px] border border-[#E5DDD2] capitalize">
                                {product.category.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Price with inline edit */}
                        <td className="py-3 font-bold text-[#1C3B2B] whitespace-nowrap">
                          {editingPriceId === product.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={tempPrice}
                                onChange={(e) => setTempPrice(Number(e.target.value))}
                                className="w-24 px-1.5 py-0.5 border border-[#1C3B2B] rounded text-xs bg-white"
                              />
                              <button
                                onClick={() => {
                                  updateProductPrice(product.id, tempPrice);
                                  setEditingPriceId(null);
                                }}
                                className="p-1 bg-[#1C3B2B] text-white rounded hover:bg-[#28523C]"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span>{formatPrice(product.price)}</span>
                              <button
                                onClick={() => {
                                  setEditingPriceId(product.id);
                                  setTempPrice(product.price);
                                }}
                                className="text-[#8C8377] hover:text-[#1C3B2B] transition-colors"
                                title="Ubah Harga"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Stock & Photo per Color Variant */}
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2 max-w-md">
                            {product.colors && product.colors.length > 0 ? (
                              product.colors.map(col => {
                                const currentStock = col.stock !== undefined ? col.stock : (product.stock[col.name] ?? 0);
                                const isColorLow = currentStock <= 3;
                                const isColorOut = currentStock === 0;

                                return (
                                  <div
                                    key={col.name}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shadow-2xs transition-all ${
                                      isColorOut
                                        ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                                        : isColorLow
                                        ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                                        : 'bg-white border-[#E5DDD2] text-[#3D3830]'
                                    }`}
                                  >
                                    {/* Color image thumbnail */}
                                    {col.image ? (
                                      <img
                                        src={col.image}
                                        alt={col.name}
                                        referrerPolicy="no-referrer"
                                        className="w-7 h-7 rounded-md object-cover border border-black/10 shrink-0"
                                        title={`Foto varian warna: ${col.name}`}
                                      />
                                    ) : (
                                      <span
                                        className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-2xs"
                                        style={{ backgroundColor: col.hex }}
                                        title={col.name}
                                      />
                                    )}

                                    {/* Color info */}
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1">
                                        <span
                                          className="w-2 h-2 rounded-full shrink-0"
                                          style={{ backgroundColor: col.hex }}
                                        />
                                        <span className="text-[11px] font-semibold truncate block max-w-[90px]">
                                          {col.name}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Color Stock Count & Quick Stepper */}
                                    <div className="flex items-center gap-1 bg-[#FAF8F5] px-1.5 py-0.5 rounded-lg border border-[#E8E1D5]">
                                      <button
                                        type="button"
                                        onClick={() => updateColorStock(product.id, col.name, Math.max(0, currentStock - 1))}
                                        className="text-stone-400 hover:text-stone-900 text-xs px-0.5"
                                        title="Kurangi stok warna ini"
                                      >
                                        -
                                      </button>
                                      <span className="font-mono font-bold text-[11px] text-[#1C3B2B] px-1">
                                        {currentStock}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => updateColorStock(product.id, col.name, currentStock + 1)}
                                        className="text-stone-400 hover:text-stone-900 text-xs px-0.5"
                                        title="Tambah stok warna ini"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              // Fallback for flat stock dictionary
                              (Object.entries(product.stock) as [string, number][]).map(([key, count]) => (
                                <span
                                  key={key}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-[#FAF6F0] text-[#3D3830] border-[#E5DDD2]"
                                >
                                  {key}: {count}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Total stock badge */}
                        <td className="py-3 font-bold text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1 ${
                              isOut
                                ? 'bg-red-100 text-red-800 font-bold'
                                : isLow
                                ? 'bg-amber-100 text-amber-900 font-bold'
                                : 'bg-green-100 text-green-900'
                            }`}
                          >
                            {product.totalStock} Unit
                          </span>
                        </td>

                        {/* Action Buttons: Edit Product & Quick Restock */}
                        <td className="py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Menu Edit Produk Button */}
                            <button
                              id={`edit-product-btn-${product.id}`}
                              onClick={() => setEditingProduct(product)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1C3B2B] hover:bg-[#28523C] text-white text-[11px] font-semibold rounded-lg shadow-xs transition-colors"
                              title="Edit deskripsi, foto per warna, dan rincian stok produk"
                            >
                              <Edit3 className="w-3 h-3 text-[#C5A880]" />
                              <span>Edit Produk</span>
                            </button>

                            {/* Quick restock +5 */}
                            <button
                              onClick={() => quickRestock(product.id, 5)}
                              className="px-2 py-1.5 bg-[#FAF6F0] hover:bg-[#EFE9E0] text-[#1C3B2B] font-semibold rounded-lg border border-[#D5C9B8] text-[11px] transition-colors"
                              title="Restock cepat +5 pcs ke produk ini"
                            >
                              +5
                            </button>

                            {/* Delete Product Button */}
                            <button
                              id={`delete-product-btn-${product.id}`}
                              onClick={() => setProductToDelete(product)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 rounded-lg text-xs transition-colors flex items-center justify-center"
                              title={`Hapus produk ${product.name} dari katalog & database`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PUSH PROMOTION BROADCASTER */}
        {activeTab === 'push' && (
          <div className="max-w-2xl bg-white p-6 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#1C3B2B]" />
                <h3 className="font-display text-base font-bold text-[#1C3B2B]">
                  Broadcast Push Promosi Eksklusif
                </h3>
              </div>
              <p className="text-xs text-[#7A7266] mt-1">
                Kirim pesan promosi flash sale atau diskon khusus langsung ke perangkat seluruh pelanggan setia saena.id secara instan.
              </p>
            </div>

            <form onSubmit={handleBroadcastPush} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#3D3830] block mb-1">
                  Judul Push Notification *
                </label>
                <input
                  type="text"
                  required
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  placeholder="Contoh: ✨ Flash Sale Abaya Series Malam Ini!"
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#3D3830] block mb-1">
                  Isi Pesan Promosi *
                </label>
                <textarea
                  required
                  rows={3}
                  value={pushBody}
                  onChange={(e) => setPushBody(e.target.value)}
                  placeholder="Tulis detail promosi, kode voucher, dan batasan waktu..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9B8] rounded-lg focus:outline-none focus:border-[#1C3B2B]"
                />
              </div>

              {/* Push Simulation Card */}
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E5DDD2] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#7A7266]">
                  Pratinjau Tampilan di Layar Pelanggan:
                </span>
                <div className="p-3 bg-white rounded-xl shadow-xs border border-[#EAE2D5] flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1C3B2B] text-white flex items-center justify-center font-serif text-sm font-bold shrink-0">
                    S
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-xs font-bold text-[#1C3B2B]">{pushTitle}</h5>
                      <span className="text-[9px] text-[#8C8377]">Sekarang</span>
                    </div>
                    <p className="text-[11px] text-[#4A453E] mt-0.5 leading-snug">
                      {pushBody}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {broadcastSent && (
                  <span className="text-xs text-[#2E7D32] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Notifikasi Berhasil Dikirim ke Seluruh Pelanggan!</span>
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-5 py-2.5 bg-[#1C3B2B] text-white text-xs font-semibold rounded-xl hover:bg-[#28523C] shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#C5A880]" />
                  <span>Kirim Broadcast Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: CLOUD DATABASE FIRESTORE */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            {/* Database Hero Status Banner */}
            <div className="bg-gradient-to-r from-[#1C3B2B] to-[#28523C] text-white p-6 rounded-2xl shadow-md space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                    <Database className="w-6 h-6 text-[#C5A880]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold">
                        Google Cloud Firestore Database
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        firebaseSyncStatus === 'connected' 
                          ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' 
                          : firebaseSyncStatus === 'syncing'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          firebaseSyncStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`} />
                        {firebaseSyncStatus === 'connected' ? 'Terhubung & Sinkron Real-Time' : 'Sedang Menghubungkan...'}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 mt-1 max-w-2xl leading-relaxed">
                      Seluruh transaksi pesanan, katalog busana muslimah, stok gudang Tamansari Kota Tasikmalaya, dan kupon diskon tersimpan permanen di cloud database dengan enkripsi standar Google Cloud.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isReseeding}
                  onClick={async () => {
                    setIsReseeding(true);
                    setReseedDone(false);
                    try {
                      await reseedDatabase();
                      setReseedDone(true);
                      setTimeout(() => setReseedDone(false), 4000);
                    } finally {
                      setIsReseeding(false);
                    }
                  }}
                  className="px-4 py-2.5 bg-[#C5A880] hover:bg-[#b0936b] text-[#1C3B2B] text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isReseeding ? 'animate-spin' : ''}`} />
                  <span>{isReseeding ? 'Menyinkronkan...' : 'Reseed & Sinkronkan Data'}</span>
                </button>
              </div>

              {reseedDone && (
                <div className="bg-emerald-500/20 border border-emerald-400/40 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 text-emerald-200">
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Katalog produk, pesanan, dan setting gudang Tamansari Tasikmalaya berhasil disinkronkan ke Cloud Firestore!</span>
                </div>
              )}

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/15 text-xs">
                <div>
                  <span className="text-white/60 block text-[11px]">Database ID:</span>
                  <span className="font-mono text-[11px] font-semibold text-[#E5DDD2] truncate block" title="ai-studio-saenaidbusanamus-37b1774c-092f-4d11-899c-3a7926323a33">
                    ai-studio-saenaidbusanamus...
                  </span>
                </div>
                <div>
                  <span className="text-white/60 block text-[11px]">Region Server:</span>
                  <span className="font-mono text-[11px] font-semibold text-[#E5DDD2]">
                    nam5 (Multi-region Cloud)
                  </span>
                </div>
                <div>
                  <span className="text-white/60 block text-[11px]">Security Rules:</span>
                  <span className="font-semibold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    V2 Hardened Active
                  </span>
                </div>
                <div>
                  <span className="text-white/60 block text-[11px]">Real-Time Sync:</span>
                  <span className="font-semibold text-[#C5A880]">
                    onSnapshot Websocket
                  </span>
                </div>
              </div>
            </div>

            {/* Firestore Collections Overview */}
            <div>
              <h3 className="text-sm font-bold text-[#1C3B2B] mb-3 flex items-center gap-2">
                <Server className="w-4 h-4 text-[#C5A880]" />
                <span>Struktur Tabel & Koleksi Dokumen Firestore saena.id</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Collection 1: products */}
                <div className="bg-white p-4 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1C3B2B] bg-[#F7F4EE] px-2 py-1 rounded-md border border-[#E2D8CA]">
                        /products
                      </span>
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {products.length} Dokumen
                      </span>
                    </div>
                    <span className="text-[11px] text-[#7A7266]">Read: Publik | Write: Admin</span>
                  </div>
                  <p className="text-xs text-[#524B41]">
                    Menyimpan seluruh katalog gamis, abaya, hijab silk, foto produk, variasi ukuran, harga IDR, dan stok gudang Tamansari.
                  </p>
                  <div className="text-[11px] text-[#7A7266] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EFE8DC] font-mono">
                    Fields: id, name, slug, category, price, stock, totalStock, material, images, rating, reviewCount
                  </div>
                </div>

                {/* Collection 2: orders */}
                <div className="bg-white p-4 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1C3B2B] bg-[#F7F4EE] px-2 py-1 rounded-md border border-[#E2D8CA]">
                        /orders
                      </span>
                      <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        {orders.length} Transaksi
                      </span>
                    </div>
                    <span className="text-[11px] text-[#7A7266]">Read: Customer | Write: Authed</span>
                  </div>
                  <p className="text-xs text-[#524B41]">
                    Menyimpan riwayat checkout, data pemesan WhatsApp, resi pengiriman JNE/J&T dari Tasikmalaya, serta status pembayaran QRIS & VA.
                  </p>
                  <div className="text-[11px] text-[#7A7266] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EFE8DC] font-mono">
                    Fields: id, customer, items, shipping, payment, total, status, trackingNumber, trackingHistory
                  </div>
                </div>

                {/* Collection 3: coupons */}
                <div className="bg-white p-4 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1C3B2B] bg-[#F7F4EE] px-2 py-1 rounded-md border border-[#E2D8CA]">
                        /coupons
                      </span>
                      <span className="text-[11px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                        2 Voucher Aktif
                      </span>
                    </div>
                    <span className="text-[11px] text-[#7A7266]">Read: Publik | Write: Admin</span>
                  </div>
                  <p className="text-xs text-[#524B41]">
                    Voucher promosi Hari Raya dan diskon pengguna baru (SAENARAMADHAN: 15% OFF, SAENABARU: Rp 50.000 OFF).
                  </p>
                  <div className="text-[11px] text-[#7A7266] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EFE8DC] font-mono">
                    Fields: code, discountType, discountValue, minPurchase, expiresAt
                  </div>
                </div>

                {/* Collection 4: store_settings */}
                <div className="bg-white p-4 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1C3B2B] bg-[#F7F4EE] px-2 py-1 rounded-md border border-[#E2D8CA]">
                        /store_settings
                      </span>
                      <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        Gudang Tasikmalaya
                      </span>
                    </div>
                    <span className="text-[11px] text-[#7A7266]">Read: Publik | Write: Admin</span>
                  </div>
                  <p className="text-xs text-[#524B41]">
                    Konfigurasi titik asal pengiriman: <strong>Kecamatan Tamansari, Kota Tasikmalaya (46196)</strong> sebagai acuan tarif ongkir JNE & J&T.
                  </p>
                  <div className="text-[11px] text-[#7A7266] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EFE8DC] font-mono">
                    originDistrict: Tamansari, originCity: Kota Tasikmalaya, province: Jawa Barat, postalCode: 46196
                  </div>
                </div>
              </div>
            </div>

            {/* Warehouse Configuration Details */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1C3B2B]">
                    Informasi Titik Asal Pengiriman & Ekspedisi Terintegrasi
                  </h4>
                  <p className="text-xs text-[#7A7266]">
                    Acuan penghitungan ongkir otomatis ke seluruh Indonesia
                  </p>
                </div>
                <span className="text-xs bg-[#1C3B2B]/10 text-[#1C3B2B] font-bold px-2.5 py-1 rounded-full">
                  Verified Origin
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE2D5]">
                  <span className="text-[11px] text-[#8C8377] block">Kecamatan Asal:</span>
                  <span className="font-bold text-[#1C3B2B]">Kec. Tamansari</span>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE2D5]">
                  <span className="text-[11px] text-[#8C8377] block">Kota & Provinsi:</span>
                  <span className="font-bold text-[#1C3B2B]">Kota Tasikmalaya, Jawa Barat</span>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE2D5]">
                  <span className="text-[11px] text-[#8C8377] block">WhatsApp Toko:</span>
                  <span className="font-bold text-[#1C3B2B]">{DEFAULT_WHATSAPP_DISPLAY}</span>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE2D5]">
                  <span className="text-[11px] text-[#8C8377] block">Ekspedisi Aktif:</span>
                  <span className="font-bold text-[#1C3B2B]">JNE, J&T, SiCepat</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MENGANTAR.COM INTEGRATION */}
        {activeTab === 'mengantar' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Mengantar Banner Header */}
            <div className="bg-[#1C3B2B] text-white p-6 rounded-2xl border border-[#C5A880]/30 shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#C5A880] text-[#1C3B2B]">
                      Agregator Ekspedisi
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      mengantarConfig.environment === 'production' 
                        ? 'bg-emerald-900/80 border-emerald-500 text-emerald-300' 
                        : 'bg-amber-900/80 border-amber-500 text-amber-300'
                    }`}>
                      Mode: {mengantarConfig.environment === 'production' ? 'Live Production API' : 'Sandbox (Simulasi)'}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-[#F3E8CE]">
                    Integrasi Resmi Mengantar.com
                  </h3>
                  <p className="text-xs text-[#D8CFBC] max-w-xl leading-relaxed">
                    Sistem otomatisasi penjemputan paket (courier pickup), penerbitan nomor resi resmi otomatis (AWB), cetak label thermal 100×150 mm, dan pelacakan status ekspedisi real-time dari Butik saena.id Tamansari Tasikmalaya.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={async () => {
                      setTestingMengantar(true);
                      setMengantarTestResult(null);
                      try {
                        const res = await testMengantarConnectionApi(mengantarConfig.apiKey, mengantarConfig.environment);
                        setMengantarTestResult(res);
                      } catch (err: any) {
                        setMengantarTestResult({ success: false, message: err?.message || 'Gagal tersambung' });
                      } finally {
                        setTestingMengantar(false);
                      }
                    }}
                    disabled={testingMengantar}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-[#F3EFEA] border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingMengantar ? 'animate-spin' : ''}`} />
                    <span>Uji Koneksi API</span>
                  </button>

                  <button
                    onClick={() => setIsMengantarConfigModalOpen(true)}
                    className="px-4 py-2.5 bg-[#C5A880] hover:bg-[#b59870] text-[#1C3B2B] text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-xs"
                  >
                    <span>⚙️ Atur Kredensial & Gudang</span>
                  </button>
                </div>
              </div>

              {/* Test Result Toast */}
              {mengantarTestResult && (
                <div className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  mengantarTestResult.success 
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' 
                    : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                }`}>
                  {mengantarTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{mengantarTestResult.message}</span>
                </div>
              )}
            </div>

            {/* Metric Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-1">
                <span className="text-[11px] text-[#7A7266] block font-medium">Status API Key</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${mengantarConfig.apiKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-sm font-bold text-[#1C3B2B]">
                    {mengantarConfig.apiKey ? 'Terpasang & Siap' : 'Sandbox Demo Mode'}
                  </span>
                </div>
                <p className="text-[10px] text-[#8C8377]">
                  {mengantarConfig.apiKey ? 'Terkoneksi ke server Mengantar.com' : 'Gunakan API key resmi untuk live pickup'}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-1">
                <span className="text-[11px] text-[#7A7266] block font-medium">Otomatisasi Order</span>
                <span className="text-sm font-bold text-[#1C3B2B] block">
                  {mengantarConfig.autoCreateOnPaid ? 'Aktif (Saat Lunas)' : 'Manual (Tombol Kirim)'}
                </span>
                <p className="text-[10px] text-[#8C8377]">
                  Resi diterbitkan otomatis saat pembayaran pelanggan sukses
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-1">
                <span className="text-[11px] text-[#7A7266] block font-medium">Pesanan Terdaftar</span>
                <span className="text-sm font-bold text-[#1C3B2B] block">
                  {orders.filter(o => o.mengantar).length} dari {orders.length} Pesanan
                </span>
                <p className="text-[10px] text-[#8C8377]">
                  Label thermal & kode booking AWB siap cetak
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-1">
                <span className="text-[11px] text-[#7A7266] block font-medium">Gudang Titik Pickup</span>
                <span className="text-sm font-bold text-[#1C3B2B] block truncate">
                  Tamansari, Tasikmalaya
                </span>
                <p className="text-[10px] text-[#8C8377]">
                  Jadwal Pickup: {mengantarConfig.pickupTimeSlot}
                </p>
              </div>
            </div>

            {/* Courier Partners Showcase */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1C3B2B]">
                    Ekspedisi Kurir Didukung Mengantar.com
                  </h4>
                  <p className="text-xs text-[#7A7266]">
                    Pickup langsung di butik atau drop point terdekat
                  </p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  Semua Kurir Terintegrasi
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {[
                  { name: 'JNE Express', code: 'JNE' },
                  { name: 'J&T Express', code: 'J&T' },
                  { name: 'SiCepat', code: 'SICEPAT' },
                  { name: 'Anteraja', code: 'ANTERAJA' },
                  { name: 'Ninja Xpress', code: 'NINJA' },
                  { name: 'Lion Parcel', code: 'LION' },
                  { name: 'ID Express', code: 'IDE' },
                  { name: 'SAP Express', code: 'SAP' }
                ].map(c => (
                  <div key={c.code} className="p-2.5 bg-[#FAF8F5] border border-[#EAE2D5] rounded-xl text-center">
                    <span className="block text-xs font-bold text-[#1C3B2B]">{c.name}</span>
                    <span className="text-[9px] text-emerald-700 font-medium">Pickup Aktif</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table of Orders with Mengantar Dispatch Tools */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5DDD2] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[#1C3B2B]">
                    Daftar Pesanan & Status Pengiriman Mengantar
                  </h4>
                  <p className="text-xs text-[#7A7266]">
                    Kirim pesanan baru ke Mengantar atau cetak label pengiriman thermal
                  </p>
                </div>

                <button
                  onClick={async () => {
                    const pendingPaid = orders.filter(o => !o.mengantar);
                    if (pendingPaid.length === 0) {
                      setBatchDispatchMsg('Semua pesanan sudah terhubung ke Mengantar.com.');
                      setTimeout(() => setBatchDispatchMsg(null), 4000);
                      return;
                    }
                    setIsBatchDispatching(true);
                    setBatchDispatchMsg(`Mendaftarkan ${pendingPaid.length} pesanan ke Mengantar...`);
                    let count = 0;
                    for (const ord of pendingPaid) {
                      try {
                        await dispatchOrderToMengantar(ord.id);
                        count++;
                      } catch (e) {
                        console.warn(e);
                      }
                    }
                    setIsBatchDispatching(false);
                    setBatchDispatchMsg(`Berhasil menghubungkan ${count} pesanan ke Mengantar.com!`);
                    setTimeout(() => setBatchDispatchMsg(null), 5000);
                  }}
                  disabled={isBatchDispatching}
                  className="px-3.5 py-1.5 bg-[#1C3B2B] hover:bg-[#2A4D3B] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 self-start sm:self-auto"
                >
                  {isBatchDispatching ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Truck className="w-3.5 h-3.5 text-[#C5A880]" />
                  )}
                  <span>Proses Semua ke Mengantar</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAE2D5] text-[#7A7266] font-semibold">
                      <th className="pb-2.5">Order ID</th>
                      <th className="pb-2.5">Penerima</th>
                      <th className="pb-2.5">Tujuan</th>
                      <th className="pb-2.5">Status Toko</th>
                      <th className="pb-2.5">Status Mengantar</th>
                      <th className="pb-2.5">Nomor Resi / AWB</th>
                      <th className="pb-2.5">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE4]">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-[#FAF8F5]">
                        <td className="py-3 font-bold text-[#1C3B2B]">
                          {order.id}
                          <span className="block text-[10px] text-[#8C8377] font-normal">{order.createdAt}</span>
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-[#1F2421] block">{order.customer.fullName}</span>
                          <span className="text-[10px] text-[#7A7266] block">{order.customer.whatsapp}</span>
                        </td>
                        <td className="py-3">
                          <span className="text-[11px] text-[#1F2421] block font-medium">{order.customer.city}</span>
                          <span className="text-[10px] text-[#7A7266] block truncate max-w-[160px]">{order.customer.address}</span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800">
                            {order.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3">
                          {order.mengantar ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Terbit Resi
                              </span>
                              <span className="block text-[10px] text-gray-500 font-mono mt-0.5">
                                {order.mengantar.mengantarOrderId}
                              </span>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Belum Diterbitkan
                            </span>
                          )}
                        </td>
                        <td className="py-3 font-mono font-bold text-[#1C3B2B]">
                          {order.mengantar?.trackingNumber || order.trackingNumber}
                          <span className="block text-[10px] text-gray-500 font-sans font-normal">
                            Kurir: {order.mengantar?.courier || order.shipping.courier}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            {order.mengantar ? (
                              <button
                                onClick={() => {
                                  setActiveMengantarLabelOrder(order);
                                  setIsMengantarLabelModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-[#1C3B2B] hover:bg-[#2A4D3B] text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                                title="Cetak Label Resi Thermal Mengantar (100x150 mm)"
                              >
                                <Printer className="w-3 h-3 text-[#C5A880]" />
                                <span>Cetak Label</span>
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  setDispatchingOrderId(order.id);
                                  try {
                                    await dispatchOrderToMengantar(order.id);
                                  } finally {
                                    setDispatchingOrderId(null);
                                  }
                                }}
                                disabled={dispatchingOrderId === order.id}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-50"
                              >
                                {dispatchingOrderId === order.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Truck className="w-3 h-3" />
                                )}
                                <span>Kirim ke Mengantar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: Otomatisasi Impor Produk dari Shopee atau TikTok */}
      <ImportMarketplaceModal
        isOpen={isImportMarketplaceOpen}
        onClose={() => setIsImportMarketplaceOpen(false)}
        onOpenManualWithData={(data) => {
          setImportedInitialData(data);
          setIsImportMarketplaceOpen(false);
          setIsAddProductOpen(true);
        }}
      />

      {/* MODAL: Impor Massal Produk via Format Excel / XLS */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
      />

      {/* MODAL: Tambah Busana Baru (Rincian Stok per Warna, Deskripsi & Foto per Warna Tersimpan ke Database) */}
      <CreateProductModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setImportedInitialData(null);
        }}
        initialData={importedInitialData}
        onOpenMarketplaceImport={() => {
          setIsAddProductOpen(false);
          setIsImportMarketplaceOpen(true);
        }}
        onOpenExcelImport={() => {
          setIsAddProductOpen(false);
          setIsExcelImportOpen(true);
        }}
      />

      {/* Edit Product Modal (Rincian Stok, Deskripsi & Foto per Warna) */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5DDD2] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1C3B2B]">Hapus Koleksi Busana?</h3>
                <p className="text-xs text-[#7A7266]">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE2D5] flex items-center gap-3">
              <img
                src={productToDelete.images[0]}
                alt={productToDelete.name}
                referrerPolicy="no-referrer"
                className="w-14 h-16 object-cover rounded-lg bg-[#EFE9E0] border border-[#E5DDD2]"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1C3B2B] truncate">{productToDelete.name}</p>
                <p className="text-[11px] text-[#7A7266] font-mono">ID: {productToDelete.id}</p>
                <p className="text-[11px] font-semibold text-[#B38F5B]">
                  {formatPrice(productToDelete.price)} &middot; Stok: {productToDelete.totalStock} pcs
                </p>
                <p className="text-[10px] text-[#7A7266] capitalize">Kategori: {productToDelete.category.replace('-', ' ')}</p>
              </div>
            </div>

            <p className="text-xs text-[#524B40] leading-relaxed">
              Produk busana ini beserta seluruh varian warna dan riwayat stoknya akan dihapus secara permanen dari katalog etalase dan database Cloud Firestore.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EAE2D5]">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#524B40] hover:bg-[#F3EFEA] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                id="confirm-delete-product-dashboard-btn"
                disabled={isDeletingProduct}
                onClick={async () => {
                  if (!productToDelete) return;
                  setIsDeletingProduct(true);
                  try {
                    await deleteProduct(productToDelete.id);
                    setProductToDelete(null);
                  } catch (err) {
                    console.error('Error deleting product:', err);
                  } finally {
                    setIsDeletingProduct(false);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingProduct ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Produk</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus SEMUA Produk */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#EAE2D5] space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-[#1C3B2B]">
                  Kosongkan Semua Produk dari Toko?
                </h3>
                <p className="text-xs text-[#7A7266]">
                  Tindakan ini akan menghapus <strong>seluruh produk ({products.length} item)</strong> beserta semua foto varian warna dan stoknya secara permanen dari katalog etalase dan database Cloud Firestore.
                </p>
              </div>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-[11px] text-rose-800">
              ⚠️ <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. Seluruh katalog toko dan database Firestore akan dikosongkan.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EAE2D5]">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                disabled={isDeletingAll}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#524B40] hover:bg-[#F3EFEA] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                id="confirm-delete-all-products-btn"
                disabled={isDeletingAll}
                onClick={async () => {
                  setIsDeletingAll(true);
                  try {
                    await deleteAllProducts();
                    setIsDeleteAllModalOpen(false);
                  } catch (err) {
                    console.error('Error deleting all products:', err);
                  } finally {
                    setIsDeletingAll(false);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus Semua...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Semua Produk</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
