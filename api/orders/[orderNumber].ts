import { findOrderByNumber } from '../../server/orderRepository.ts';
import { verifyAdminRequest } from '../../server/adminAuth.ts';
import { verifyAndRecoverOrder } from '../../server/orderRecoveryService.ts';

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
    const reqPhone = String(req.query?.phone || req.headers?.['x-verify-phone'] || '').trim();
    const reqName = String(req.query?.name || req.headers?.['x-verify-name'] || '').trim();

    // Anti-Enumeration: Block queries without credentials
    if (!token && !isAdmin && !reqPhone && !reqName) {
      return res.status(403).json({
        success: false,
        error: 'Akses pesanan dibatasi. Token keamanan (accessToken) atau verifikasi identitas pemilik pesanan diperlukan.',
        code: 'UNAUTHORIZED'
      });
    }

    const order = await findOrderByNumber(orderNumber);

    if (!order) {
      if (isAdmin) {
        return res.status(404).json({
          success: false,
          error: 'Pesanan tidak ditemukan di database saena.id.'
        });
      }
      return res.status(403).json({
        success: false,
        error: 'Akses pesanan ditolak. Kredensial keamanan tidak valid atau pesanan tidak ditemukan.',
        code: 'ACCESS_DENIED'
      });
    }

    // Security check: Customer must provide matching accessToken or verified admin
    const isTokenMatch = !!(order.accessToken && token && token === order.accessToken);

    if (token && !isTokenMatch && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Akses pesanan ditolak. Token keamanan tidak cocok dengan pesanan ini.',
        code: 'ACCESS_DENIED'
      });
    }

    if (isTokenMatch) {
      const expiresAt = order.accessTokenExpiresAt
        ? new Date(order.accessTokenExpiresAt).getTime()
        : (order.createdAt ? new Date(order.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000 : Infinity);

      if (Date.now() > expiresAt) {
        return res.status(403).json({
          success: false,
          error: 'Akses pesanan telah kedaluwarsa demi keamanan (token expired). Silakan verifikasi identitas pemilik pesanan untuk melihat detail pesanan.',
          code: 'TOKEN_EXPIRED'
        });
      }
    }

    // Customer verification fallback: Strictly rate-limited via verifyAndRecoverOrder
    let isCustomerVerified = false;
    if (!isTokenMatch && !isAdmin && (reqPhone || reqName)) {
      const clientIp = typeof req.headers?.['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : req.socket?.remoteAddress || '';

      const recoveryRes = await verifyAndRecoverOrder(orderNumber, reqPhone, reqName, clientIp);
      if (!recoveryRes.success) {
        return res.status(recoveryRes.statusCode).json({
          success: false,
          error: recoveryRes.error,
          code: recoveryRes.code
        });
      }
      isCustomerVerified = true;
    }

    if (!isTokenMatch && !isCustomerVerified && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Akses pesanan dibatasi. Token keamanan (accessToken) atau verifikasi identitas pemilik pesanan diperlukan.',
        code: 'UNAUTHORIZED'
      });
    }

    const orderPayload = {
      id: order.id,
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber,
      status: order.status,
      customer: {
        customerName: order.customer.customerName,
        fullName: order.customer.customerName,
        phone: order.customer.phone,
        whatsapp: order.customer.phone,
        email: order.customer.email || ''
      },
      shippingAddress: {
        address: order.shippingAddress.address,
        province: order.shippingAddress.province,
        city: order.shippingAddress.city,
        district: order.shippingAddress.district || '',
        postalCode: order.shippingAddress.postalCode || ''
      },
      items: order.items.map(it => ({
        id: it.id,
        name: it.name,
        variant: it.variant,
        color: it.color,
        size: it.size,
        price: it.price,
        quantity: it.quantity,
        weight: it.weight,
        image: it.image
      })),
      quantity: order.quantity || order.items.reduce((sum, it) => sum + (it.quantity || 1), 0),
      weight: order.weight || 600,
      price: order.price,
      payment: {
        paymentMethod: order.payment.paymentMethod,
        paymentProvider: order.payment.paymentProvider,
        paymentChannel: order.payment.paymentChannel,
        paymentStatus: order.payment.paymentStatus,
        paymentAmount: order.payment.paymentAmount || order.price.grandTotal,
        paymentCreatedAt: order.payment.paymentCreatedAt || order.createdAt,
        paymentPaidAt: order.payment.paymentPaidAt || null,
        paymentUrl: order.payment.paymentUrl || null,
        vaNumber: order.payment.vaNumber || null,
        bank: order.payment.bank || null,
        qrisString: order.payment.qrisString || null,
        qrisImage: order.payment.qrisImage || null
      },
      shipping: {
        shippingProvider: order.shipping.shippingProvider,
        courier: order.shipping.courier,
        service: order.shipping.service,
        shippingStatus: order.shipping.shippingStatus,
        trackingNumber: order.shipping.trackingNumber || null,
        airwaybill: order.shipping.airwaybill || null,
        labelUrl: order.shipping.labelUrl || null,
        estimatedDelivery: order.shipping.estimatedDelivery || '2-3 Hari'
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    return res.status(200).json({
      success: true,
      order: orderPayload,
      data: orderPayload
    });
  } catch (err: any) {
    console.error('[Get Order Exception]:', err);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan sistem saat memuat data pesanan.'
    });
  }
}
