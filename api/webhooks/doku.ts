import {
  verifyDokuWebhookSignature
} from '../../server/dokuService';
import {
  findOrderByNumber,
  updateOrderPayment,
  updateOrderShipping,
  claimOrderForMetaPurchase
} from '../../server/orderRepository';
import { processMengantarOrder } from '../../server/mengantarService';
import { sendMetaCapiPurchase } from '../../server/metaCapiService';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: any): Promise<string> {
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const rawBody = await readRawBody(req);

    const clientId = String(req.headers['client-id'] || '');
    const requestId = String(req.headers['request-id'] || '');
    const requestTimestamp = String(req.headers['request-timestamp'] || '');
    const signature = String(req.headers['signature'] || '');
    const secretKey = process.env.DOKU_SECRET_KEY || '';
    const requestTarget = new URL(req.url || '/api/webhooks/doku', 'https://saena.my.id').pathname;

    if (!signature || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'DOKU webhook authentication is not configured.'
      });
    }

    const valid = verifyDokuWebhookSignature(
      clientId,
      requestId,
      requestTimestamp,
      requestTarget,
      rawBody,
      signature,
      secretKey
    );

    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Webhook signature verification failed.'
      });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload.'
      });
    }

    const invoiceNumber = String(
      payload.order?.invoice_number ||
      payload.orderId ||
      payload.invoiceNumber ||
      ''
    ).trim();

    const rawStatus = String(
      payload.transaction?.status ||
      payload.status ||
      ''
    ).trim().toUpperCase();

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing invoice number.'
      });
    }

    const order = await findOrderByNumber(invoiceNumber);
    if (!order) {
      return res.status(200).json({
        success: true,
        message: 'Webhook accepted; order not found.'
      });
    }

    if (order.payment.paymentStatus === 'PAID' && order.processedWebhookIds?.includes(requestId)) {
      return res.status(200).json({
        success: true,
        message: 'Webhook already processed.'
      });
    }

    if (rawStatus === 'SUCCESS' || rawStatus === 'PAID') {
      const paidAmount = Number(
        payload.order?.amount ??
        payload.amount ??
        payload.transaction?.amount
      );
      const expectedAmount = Number(order.price.grandTotal);

      if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
        return res.status(400).json({
          success: false,
          error: 'Payment amount does not match the order total.'
        });
      }

      const updated = await updateOrderPayment(order.orderNumber, 'PAID', {
        paidAt: new Date().toISOString(),
        dokuResponse: payload,
        webhookId: requestId
      });

      if (!updated) {
        return res.status(500).json({
          success: false,
          error: 'Failed to persist paid order.'
        });
      }

      const canSendPurchase = await claimOrderForMetaPurchase(order.orderNumber);
      if (canSendPurchase) {
        sendMetaCapiPurchase(updated).catch(err => {
          console.error('[DOKU Webhook] Meta CAPI Purchase failed:', err?.message || err);
        });
      }

      if (
        process.env.MENGANTAR_API_KEY &&
        updated.shipping.shippingStatus !== 'CREATED' &&
        !updated.shipping.trackingNumber
      ) {
        try {
          const shipment = await processMengantarOrder({
            orderId: updated.orderNumber,
            customer: {
              fullName: updated.customer.customerName,
              whatsapp: updated.customer.phone,
              email: updated.customer.email,
              address: updated.shippingAddress.address,
              subdistrict: updated.shippingAddress.district,
              city: updated.shippingAddress.city,
              province: updated.shippingAddress.province,
              postalCode: updated.shippingAddress.postalCode,
              notes: 'Pesanan Dibayar DOKU saena.id'
            },
            courier: updated.shipping.courier,
            serviceType: updated.shipping.service,
            items: updated.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              weight: item.weight
            })),
            totalAmount: updated.price.grandTotal,
            shippingCost: updated.price.shippingCost,
            isCod: false,
            notes: 'Pesanan Dibayar DOKU saena.id'
          });

          if (shipment.success && shipment.data) {
            await updateOrderShipping(updated.orderNumber, 'CREATED', {
              trackingNumber: shipment.data.trackingNumber,
              mengantarOrderId: shipment.data.mengantarOrderId,
              airwaybill: shipment.data.airwayBillUrl,
              labelUrl: shipment.data.labelUrl,
              mengantarResponse: shipment.data
            });
          } else {
            await updateOrderShipping(updated.orderNumber, 'FAILED', {
              mengantarResponse: shipment
            });
          }
        } catch (shipmentError: any) {
          console.error('[DOKU Webhook] Mengantar dispatch failed:', shipmentError?.message || shipmentError);
          await updateOrderShipping(updated.orderNumber, 'FAILED', {});
        }
      }

      return res.status(200).json({
        success: true,
        status: 'PAID',
        orderNumber: updated.orderNumber
      });
    }

    if (rawStatus === 'FAILED') {
      return res.status(200).json({
        success: true,
        status: 'FAILED_IGNORED',
        message: 'Checkout failure notification acknowledged without cancelling the order.'
      });
    }

    if (rawStatus === 'EXPIRED') {
      await updateOrderPayment(order.orderNumber, 'EXPIRED', {
        dokuResponse: payload,
        webhookId: requestId
      });
    } else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCELED') {
      await updateOrderPayment(order.orderNumber, 'CANCELLED', {
        dokuResponse: payload,
        webhookId: requestId
      });
    }

    return res.status(200).json({
      success: true,
      status: rawStatus || 'RECEIVED',
      orderNumber: order.orderNumber
    });
  } catch (error: any) {
    console.error('[DOKU Webhook] Handler error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Webhook processing failed'
    });
  }
}
