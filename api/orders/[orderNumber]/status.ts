import { findOrderByNumber } from '../../../server/orderRepository';
import { verifyAdminRequest } from '../../../server/adminAuth';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const orderNumber = String(req.query?.orderNumber || '').trim();
    if (!orderNumber) {
      return res.status(400).json({ success: false, error: 'Nomor pesanan wajib disertakan.' });
    }

    const token = (req.query?.token as string) || (req.headers?.['x-order-token'] as string);
    const order = await findOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pesanan tidak ditemukan'
      });
    }

    const isTokenMatch = !!(order.accessToken && token && token === order.accessToken);
    const isAdmin = verifyAdminRequest(req);

    if (!isTokenMatch && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Akses status pesanan ditolak. Diperlukan accessToken yang valid.'
      });
    }

    return res.status(200).json({
      success: true,
      orderNumber: order.orderNumber,
      paymentStatus: order.payment.paymentStatus,
      shippingStatus: order.shipping.shippingStatus,
      trackingNumber: order.shipping.trackingNumber || null,
      paidAt: order.payment.paymentPaidAt || null,
      paymentUrl: order.payment.paymentUrl || null,
      vaNumber: order.payment.vaNumber || null,
      bank: order.payment.bank || null,
      qrisString: order.payment.qrisString || null,
      qrisImage: order.payment.qrisImage || null,
      invoiceNumber: order.invoiceNumber,
      total: order.price.grandTotal
    });
  } catch (err: any) {
    console.error('[Order Status Exception]:', err);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat memeriksa status pesanan.'
    });
  }
}
