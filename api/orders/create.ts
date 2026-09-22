import { processDokuPayment } from '../../server/dokuService';
import { generateOrderNumber, saveOrder, StoredOrder } from '../../server/orderRepository';

export const config = { api: { bodyParser: true } };

const CATALOG: Record<string, { name: string; price: number; weight: number; qty: number }> = {
  'alisa-01': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Hemat 1 Pcs)', price: 79500, weight: 600, qty: 1 },
  'alisa-02': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Bundling 2 Pcs)', price: 159000, weight: 1200, qty: 2 },
  'alisa-03': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Best Seller 3 Pcs)', price: 238500, weight: 1800, qty: 3 },
  'paket-1': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Hemat 1 Pcs)', price: 79500, weight: 600, qty: 1 },
  'paket-2': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Bundling 2 Pcs)', price: 159000, weight: 1200, qty: 2 },
  'paket-3': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Best Seller 3 Pcs)', price: 238500, weight: 1800, qty: 3 }
};

const SERVER_COUPONS: Record<string, { discountPercent: number; maxDiscount?: number }> = {
  SAENARAMADHAN: { discountPercent: 15, maxDiscount: 150000 },
  WELCOME10: { discountPercent: 10 },
  ELEGANT20: { discountPercent: 20, maxDiscount: 200000 }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const { customer, items, shipping, paymentMethod, paymentChannel, notes } = req.body || {};
    if (!customer?.customerName || !customer?.phone) {
      return res.status(400).json({ success: false, error: 'Nama lengkap dan nomor WhatsApp pelanggan wajib diisi.' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, error: 'Keranjang belanja kosong.' });
    }

    const cleanPhone = String(customer.phone).replace(/[^0-9+]/g, '');
    if (cleanPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, error: 'Nomor WhatsApp tidak valid.' });
    }

    const couponCode = String(req.body?.couponCode || '').trim().toUpperCase();
    const coupon = couponCode ? SERVER_COUPONS[couponCode] : null;
    if (couponCode && !coupon) {
      return res.status(400).json({ success: false, error: 'Kode voucher promo tidak valid.' });
    }

    const catalogItems = items.map((it: any) => {
      const key = String(it.productId || it.id || '').toLowerCase();
      const catalog = CATALOG[key];
      if (!catalog) {
        throw new Error(`Produk tidak dikenali: ${key || 'tanpa ID'}`);
      }
      return {
        id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        productId: key || 'alisa-01',
        name: catalog.name,
        variant: it.variant || it.color || 'Standard',
        color: it.color || 'Standard',
        size: it.size || 'All Size',
        price: catalog.price,
        quantity: Math.max(1, Number(it.quantity) || catalog.qty),
        weight: catalog.weight
      };
    });

    const subtotal = catalogItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const SHIPPING_RATES: Record<string, number> = {
      'jne-reg': 15000,
      'jne-yes': 25000,
      'jne-oke': 12000,
      'jnt-ez': 14000,
      'jnt-super': 22000,
      'sicepat-reg': 14000,
      'dhl-intl': 150000
    };
    const shippingId = String(shipping?.id || '').toLowerCase();
    const shippingCost = SHIPPING_RATES[shippingId] ?? 15000;
    const discount = coupon
      ? Math.min((subtotal * coupon.discountPercent) / 100, coupon.maxDiscount ?? Number.POSITIVE_INFINITY)
      : 0;
    const grandTotal = Math.max(0, subtotal - discount + shippingCost);
    const { orderNumber, invoiceNumber, accessToken } = generateOrderNumber();

    if (paymentMethod === 'COD') {
      return res.status(501).json({ success: false, error: 'COD sementara belum diaktifkan di endpoint checkout baru.' });
    }

    if (!process.env.DOKU_CLIENT_ID || !process.env.DOKU_SECRET_KEY) {
      return res.status(503).json({ success: false, error: 'DOKU belum dikonfigurasi di Production.' });
    }

    const doku = await processDokuPayment({
      orderId: orderNumber,
      invoiceNumber,
      amount: grandTotal,
      customer: {
        fullName: String(customer.customerName).trim(),
        email: String(customer.email || '').trim(),
        whatsapp: cleanPhone,
        address: String(customer.address || '').trim()
      },
      items: catalogItems.map(it => ({ name: it.name, quantity: it.quantity, price: it.price })),
      channel: paymentChannel || 'doku_checkout'
    });

    if (!doku.success || !doku.data) {
      return res.status(502).json({ success: false, error: doku.error || 'DOKU gagal membuat sesi pembayaran.', orderNumber });
    }

    const d = doku.data;
    const now = new Date().toISOString();
    const order: StoredOrder = {
      id: orderNumber, orderNumber, invoiceNumber, accessToken,
      customer: { customerName: String(customer.customerName).trim(), phone: cleanPhone, email: String(customer.email || '').trim() },
      shippingAddress: {
        address: String(customer.address || '').trim(),
        province: String(customer.province || '').trim(),
        city: String(customer.city || '').trim(),
        district: String(customer.subdistrict || '').trim(),
        postalCode: String(customer.postalCode || '').trim()
      },
      items: catalogItems, quantity: catalogItems.reduce((s,it)=>s+it.quantity,0),
      weight: catalogItems.reduce((s,it)=>s+it.weight*it.quantity,0),
      price: { subtotal, discount, shippingCost, grandTotal },
      payment: {
        paymentMethod:'DOKU', paymentProvider:'DOKU', paymentChannel: paymentChannel || 'doku_checkout',
        paymentStatus:'PENDING', paymentReference: invoiceNumber, paymentAmount:grandTotal,
        paymentCreatedAt:now, paymentPaidAt:null, paymentUrl:d.paymentUrl || null,
        vaNumber:d.virtualAccountInfo?.vaNumber || null, bank:d.virtualAccountInfo?.bank || null,
        qrisString:d.qrisInfo?.qrString || null, qrisImage:d.qrisInfo?.qrImage || null, dokuResponse:d
      },
      shipping: {
        shippingProvider:'Mengantar', courier:shipping?.courier || 'JNE', service:shipping?.service || 'REG',
        shippingStatus:'NOT_CREATED', mengantarOrderId:null, trackingNumber:null, airwaybill:null,
        labelUrl:null, shippingCreatedAt:null, shippingUpdatedAt:null, notes:notes || ''
      },
      total:grandTotal, status:'menunggu_pembayaran', trackingNumber:'', createdAt:now, updatedAt:now
    };

    await saveOrder(order);

    return res.status(200).json({
      success:true,
      data:{
        orderNumber, invoiceNumber, accessToken, grandTotal,
        paymentUrl:d.paymentUrl || null, vaNumber:d.virtualAccountInfo?.vaNumber || null,
        bank:d.virtualAccountInfo?.bank || null, qrisString:d.qrisInfo?.qrString || null,
        qrisImage:d.qrisInfo?.qrImage || null
      }
    });
  } catch (error: any) {
    console.error('[Vercel order create]', error);
    return res.status(500).json({ success:false, error:error?.message || 'Terjadi kesalahan server saat membuat pesanan.' });
  }
}
