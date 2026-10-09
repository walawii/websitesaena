import { findOrderByNumber } from '../../../server/orderRepository.ts';
import { verifyAdminRequest } from '../../../server/adminAuth.ts';

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

    let token = '';
    const authHeader = (req.headers?.['authorization'] as string) || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers?.['x-order-token']) {
      token = String(req.headers['x-order-token']).trim();
    } else if (req.headers?.cookie) {
      const cookies = String(req.headers.cookie).split(';');
      for (const c of cookies) {
        const [k, v] = c.trim().split('=');
        if (k === `saena_order_token_${orderNumber}` || k === 'saena_order_token') {
          token = decodeURIComponent(v || '').trim();
          break;
        }
      }
    }

    const isAdmin = verifyAdminRequest(req);
    if (!token && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Akses status pesanan ditolak. Diperlukan accessToken yang valid.',
        code: 'UNAUTHORIZED'
      });
    }

    const order = await findOrderByNumber(orderNumber);

    if (!order) {
      if (isAdmin) {
        return res.status(404).json({
          success: false,
          error: 'Pesanan tidak ditemukan'
        });
      }
      return res.status(403).json({
        success: false,
        error: 'Akses status pesanan ditolak. Token tidak valid atau pesanan tidak ditemukan.',
        code: 'ACCESS_DENIED'
      });
    }

    const isTokenMatch = !!(order.accessToken && token && token === order.accessToken);

    if (!isTokenMatch && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Akses status pesanan ditolak. Diperlukan accessToken yang valid.',
        code: 'ACCESS_DENIED'
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
