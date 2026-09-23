import { verifyAdminRequest } from '../../../../server/adminAuth.ts';
import { findOrderByNumber, updateOrderShipping } from '../../../../server/orderRepository.ts';
import { processMengantarOrder } from '../../../../server/mengantarService.ts';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  if (!verifyAdminRequest(req)) {
    return res.status(401).json({
      success: false,
      error: 'Akses ditolak: Autentikasi pengelola (SAENA_ADMIN_KEY) diperlukan.'
    });
  }

  try {
    const orderNumber = String(req.query?.orderNumber || '').trim();
    if (!orderNumber) {
      return res.status(400).json({ success: false, error: 'Nomor pesanan wajib disertakan.' });
    }

    const order = await findOrderByNumber(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan di database saena.id.' });
    }

    // Check if shipment already created to prevent duplicates
    const isAlreadyCreated = order.shipping.shippingStatus === 'CREATED';
    const hasTrackingNumber = !!(order.shipping.trackingNumber && order.shipping.trackingNumber.trim());
    const hasMengantarOrderId = !!(order.shipping.mengantarOrderId && order.shipping.mengantarOrderId.trim());

    if (isAlreadyCreated || hasTrackingNumber || hasMengantarOrderId) {
      return res.status(200).json({
        success: true,
        alreadyCreated: true,
        message: 'Pengiriman sudah terbit sebelumnya. Tidak dapat membuat pengiriman kedua.',
        trackingNumber: order.shipping.trackingNumber || null,
        mengantarOrderId: order.shipping.mengantarOrderId || null,
        labelUrl: order.shipping.labelUrl || null,
        shippingStatus: order.shipping.shippingStatus,
        order
      });
    }

    if (!process.env.MENGANTAR_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'MENGANTAR_API_KEY belum dikonfigurasi di environment server.'
      });
    }

    const isCod = order.payment.paymentMethod === 'COD';
    const mgtRes = await processMengantarOrder({
      orderId: order.orderNumber,
      customer: {
        fullName: order.customer.customerName,
        whatsapp: order.customer.phone,
        email: order.customer.email,
        address: order.shippingAddress.address,
        subdistrict: order.shippingAddress.district,
        city: order.shippingAddress.city,
        province: order.shippingAddress.province,
        postalCode: order.shippingAddress.postalCode,
        notes: isCod ? 'Pesanan COD Saena' : 'Pesanan Dibayar Saena'
      },
      courier: order.shipping.courier,
      serviceType: order.shipping.service,
      items: order.items.map(it => ({
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        weight: it.weight || 600
      })),
      totalAmount: order.price.grandTotal,
      shippingCost: order.price.shippingCost,
      isCod,
      notes: isCod ? 'Pesanan COD Saena' : 'Pesanan Dibayar Saena'
    });

    if (mgtRes.success && mgtRes.data) {
      const updated = await updateOrderShipping(order.orderNumber, 'CREATED', {
        trackingNumber: mgtRes.data.trackingNumber,
        mengantarOrderId: mgtRes.data.mengantarOrderId,
        airwaybill: mgtRes.data.airwayBillUrl,
        labelUrl: mgtRes.data.labelUrl,
        mengantarResponse: mgtRes.data
      });

      return res.status(200).json({
        success: true,
        message: 'Pengiriman berhasil diproses ke Mengantar.com!',
        data: mgtRes.data,
        order: updated
      });
    } else {
      await updateOrderShipping(order.orderNumber, 'FAILED', {
        mengantarResponse: mgtRes
      });
      return res.status(400).json({
        success: false,
        error: mgtRes.error || 'Gagal memproses ulang pengiriman kurir ke Mengantar.'
      });
    }
  } catch (err: any) {
    console.error('[Admin Retry Shipping Exception]:', err);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan sistem saat mencoba ulang pengiriman.'
    });
  }
}
