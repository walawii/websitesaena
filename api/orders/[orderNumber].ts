import { findOrderByNumber } from '../../server/orderRepository';
import { verifyAdminRequest } from '../../server/adminAuth';

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
        error: 'Pesanan tidak ditemukan di database saena.id.'
      });
    }

    // Security check: Customer must provide matching accessToken or verified admin
    const isTokenMatch = !!(order.accessToken && token && token === order.accessToken);
    const isAdmin = verifyAdminRequest(req);

    // Customer verification fallback: phone + name match (anti-IDOR)
    const reqPhone = String(req.query?.phone || '').replace(/\D/g, '');
    const reqName = String(req.query?.name || '').trim().toLowerCase();
    const orderPhone = order.customer?.phone?.replace(/\D/g, '') || '';
    const isCustomerVerified = reqPhone.length >= 10 &&
      reqPhone === orderPhone &&
      reqName.length >= 3 &&
      order.customer?.customerName?.toLowerCase().includes(reqName);

    if (!isTokenMatch && !isCustomerVerified && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Akses pesanan dibatasi. Token keamanan (accessToken) atau verifikasi identitas pemilik pesanan diperlukan.'
      });
    }

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoiceNumber,
        status: order.status,
        customer: {
          fullName: order.customer.customerName,
          whatsapp: order.customer.phone,
          email: order.customer.email,
          address: order.shippingAddress.address,
          city: order.shippingAddress.city,
          province: order.shippingAddress.province,
          postalCode: order.shippingAddress.postalCode,
          notes: order.shipping.notes
        },
        items: order.items.map(it => ({
          name: it.name,
          variant: it.variant,
          color: it.color,
          size: it.size,
          price: it.price,
          quantity: it.quantity,
          image: it.image
        })),
        price: order.price,
        payment: {
          paymentMethod: order.payment.paymentMethod,
          paymentStatus: order.payment.paymentStatus,
          paymentUrl: order.payment.paymentUrl,
          vaNumber: order.payment.vaNumber,
          bank: order.payment.bank,
          qrisString: order.payment.qrisString,
          qrisImage: order.payment.qrisImage,
          paidAt: order.payment.paymentPaidAt
        },
        shipping: {
          courier: order.shipping.courier,
          service: order.shipping.service,
          shippingStatus: order.shipping.shippingStatus,
          trackingNumber: order.shipping.trackingNumber,
          labelUrl: order.shipping.labelUrl,
          estimatedDelivery: order.shipping.estimatedDelivery
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  } catch (err: any) {
    console.error('[Get Order Exception]:', err);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan sistem saat memuat data pesanan.'
    });
  }
}
