import crypto from 'crypto';
import { 
  findOrderByShipmentIdentity, 
  saveOrder, 
  claimOrderForMetaPurchase,
  StoredOrder, 
  ShippingStatus 
} from './orderRepository';
import { sendMetaCapiPurchase } from './metaCapiService';

export interface MengantarWebhookPayload {
  cnote_no?: string;
  order_id?: string;
  courier?: string;
  status_category?: string;
  data?: {
    cnote_no?: string;
    order_id?: string;
    courier?: string;
    status_category?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface MengantarWebhookResult {
  statusCode: number;
  response: {
    success: boolean;
    message?: string;
    orderId?: string;
    orderNumber?: string;
    trackingNumber?: string;
    statusCategory?: string;
    shippingStatus?: ShippingStatus;
    orderStatus?: string;
    isDuplicate?: boolean;
    error?: string;
  };
}

/**
 * Verifies Mengantar webhook signature using HMAC-SHA256 hex with constant-time comparison
 * signature = HMAC-SHA256 hex of: {x-timestamp}.{raw request body}
 */
export function verifyMengantarWebhookSignature(
  timestamp: string,
  rawBody: string,
  signature: string,
  secret: string
): { valid: boolean; reason?: string } {
  if (!signature || !signature.trim()) {
    return { valid: false, reason: 'Header x-signature is missing or empty.' };
  }
  if (!timestamp || !timestamp.trim()) {
    return { valid: false, reason: 'Header x-timestamp is missing or empty.' };
  }
  if (!secret || !secret.trim()) {
    return { valid: false, reason: 'MENGANTAR_WEBHOOK_SECRET is not configured on server.' };
  }

  try {
    const payloadToSign = `${timestamp}.${rawBody}`;
    const calculatedHex = crypto
      .createHmac('sha256', secret.trim())
      .update(payloadToSign)
      .digest('hex');

    const cleanProvided = signature.trim().toLowerCase().replace(/^sha256=/, '');
    const cleanCalculated = calculatedHex.toLowerCase();

    const providedBuf = Buffer.from(cleanProvided, 'utf8');
    const calculatedBuf = Buffer.from(cleanCalculated, 'utf8');

    if (providedBuf.length !== calculatedBuf.length) {
      return { valid: false, reason: 'Signature length mismatch.' };
    }

    const isValid = crypto.timingSafeEqual(providedBuf, calculatedBuf);
    return { valid: isValid, reason: isValid ? undefined : 'HMAC-SHA256 signature verification failed.' };
  } catch (err: any) {
    return { valid: false, reason: `Error verifying signature: ${err.message}` };
  }
}

/**
 * Progression hierarchy to prevent late/out-of-order webhooks from regressing status:
 * DELIVERED must never be downgraded by late ON DELIVERY or PENDING PICKUP webhooks
 */
const SHIPPING_RANK: Record<string, number> = {
  'NOT_CREATED': 0,
  'PENDING': 1,
  'CREATED': 2,
  'PICKED_UP': 3,
  'IN_TRANSIT': 4,
  'DELIVERED': 5
};

export function mapMengantarStatusCategory(statusCategory: string): {
  shippingStatus: ShippingStatus;
  orderStatus?: string;
  rank: number;
  note?: string;
} {
  const norm = (statusCategory || '').trim().toUpperCase();

  switch (norm) {
    case 'ACTIVE':
      return {
        shippingStatus: 'CREATED',
        orderStatus: 'sedang_dikemas',
        rank: 2,
        note: 'Pesanan aktif di sistem Mengantar'
      };

    case 'WAITING NEXT PROCESS':
      return {
        shippingStatus: 'CREATED',
        orderStatus: 'sedang_dikemas',
        rank: 2,
        note: 'Menunggu proses lanjutan kurir'
      };

    case 'PENDING PICKUP':
      return {
        shippingStatus: 'CREATED',
        orderStatus: 'sedang_dikemas',
        rank: 2,
        note: 'Menunggu penjemputan oleh kurir'
      };

    case 'PICKED UP':
      return {
        shippingStatus: 'PICKED_UP',
        orderStatus: 'dikirim',
        rank: 3,
        note: 'Paket telah di-pickup kurir dari warehouse'
      };

    case 'ON DELIVERY':
      return {
        shippingStatus: 'IN_TRANSIT',
        orderStatus: 'dikirim',
        rank: 4,
        note: 'Paket dalam perjalanan pengantaran kurir ke alamat tujuan'
      };

    case 'DELIVERED':
      return {
        shippingStatus: 'DELIVERED',
        orderStatus: 'tiba_di_tujuan',
        rank: 5,
        note: 'Paket berhasil diterima oleh pelanggan'
      };

    case 'UNDELIVERED':
      return {
        shippingStatus: 'IN_TRANSIT',
        orderStatus: 'dikirim',
        rank: 4,
        note: 'Percobaan antar kurir belum berhasil (Undelivered)'
      };

    case 'PICKUP FAILED':
      return {
        shippingStatus: 'FAILED',
        orderStatus: 'sedang_dikemas',
        rank: 2,
        note: 'Penjemputan paket kurir gagal (Pickup Failed)'
      };

    case 'RTS':
      return {
        shippingStatus: 'FAILED',
        orderStatus: 'dibatalkan',
        rank: 4,
        note: 'Paket diretur kembali ke pengirim (RTS)'
      };

    case 'ERROR':
      return {
        shippingStatus: 'FAILED',
        rank: 2,
        note: 'Kendala operasional pengiriman ekspedisi (Error)'
      };

    case 'CANCELED':
    case 'CANCELLED':
      return {
        shippingStatus: 'CANCELLED',
        orderStatus: 'dibatalkan',
        rank: 1,
        note: 'Pengiriman dibatalkan (Canceled)'
      };

    default:
      console.warn(`[Mengantar Webhook] Unrecognized status_category: "${statusCategory}"`);
      return {
        shippingStatus: 'IN_TRANSIT',
        rank: 3,
        note: `Status Mengantar: ${statusCategory}`
      };
  }
}

/**
 * Processes incoming Mengantar webhook payload idempotently
 */
export async function processMengantarWebhook(
  payload: MengantarWebhookPayload,
  timestampHeader?: string
): Promise<MengantarWebhookResult> {
  const data = payload?.data || payload;

  const cnoteNo = String(data?.cnote_no || data?.cnoteNo || data?.airwaybill || data?.tracking_number || data?.trackingNumber || '').trim();
  const orderId = String(data?.order_id || data?.orderId || data?.reference_id || data?.referenceId || '').trim();
  const courier = String(data?.courier || data?.courier_name || '').trim();
  const statusCategory = String(data?.status_category || data?.statusCategory || data?.status || '').trim();

  if (!orderId && !cnoteNo) {
    return {
      statusCode: 400,
      response: {
        success: false,
        error: 'Payload missing order_id and cnote_no.'
      }
    };
  }

  if (!statusCategory) {
    return {
      statusCode: 400,
      response: {
        success: false,
        error: 'Payload missing status_category.'
      }
    };
  }

  // 1. Find matching order in Proyek A repository
  const order = await findOrderByShipmentIdentity(orderId, cnoteNo);

  if (!order) {
    console.warn(`[Mengantar Webhook] Order not found for order_id: "${orderId}", cnote_no: "${cnoteNo}". Likely test webhook.`);
    return {
      statusCode: 200,
      response: {
        success: true,
        message: 'Webhook received and signature valid. Order identity not found in Proyek A (test or external shipment).',
        orderId,
        trackingNumber: cnoteNo,
        statusCategory
      }
    };
  }

  console.log(`[Mengantar Webhook] Matched order: ${order.orderNumber} (ID: ${order.id}). Status Category: "${statusCategory}"`);

  // 2. Idempotency Check
  const eventKey = `${order.orderNumber}_${statusCategory.toUpperCase()}_${cnoteNo}_${timestampHeader || ''}`;
  order.processedWebhookIds = Array.isArray(order.processedWebhookIds) ? order.processedWebhookIds : [];

  if (order.processedWebhookIds.includes(eventKey)) {
    console.log(`[Mengantar Webhook] Idempotent duplicate: eventKey "${eventKey}" already processed for order ${order.orderNumber}.`);
    return {
      statusCode: 200,
      response: {
        success: true,
        message: 'Webhook already processed (idempotent duplicate).',
        orderNumber: order.orderNumber,
        isDuplicate: true,
        shippingStatus: order.shipping.shippingStatus,
        orderStatus: order.status
      }
    };
  }

  // 3. Status mapping & Out-of-order check
  const mapped = mapMengantarStatusCategory(statusCategory);
  const currentRank = SHIPPING_RANK[order.shipping.shippingStatus] ?? 0;
  const isCurrentlyDelivered = order.shipping.shippingStatus === 'DELIVERED';

  // Prevent regression: If already DELIVERED, ignore earlier transit statuses
  if (isCurrentlyDelivered && mapped.rank < 5) {
    console.log(`[Mengantar Webhook] Ignoring out-of-order status "${statusCategory}" (rank ${mapped.rank}) because order ${order.orderNumber} is already DELIVERED.`);
    order.processedWebhookIds.push(eventKey);
    await saveOrder(order);
    return {
      statusCode: 200,
      response: {
        success: true,
        message: 'Order is already DELIVERED. Out-of-order transition skipped.',
        orderNumber: order.orderNumber,
        shippingStatus: order.shipping.shippingStatus,
        orderStatus: order.status
      }
    };
  }

  // Prevent regression: If currently IN_TRANSIT or PICKED_UP and received PENDING PICKUP / ACTIVE / WAITING NEXT PROCESS
  const isEarlierPickupStatus = mapped.rank < currentRank && (currentRank >= 3);
  if (isEarlierPickupStatus) {
    console.log(`[Mengantar Webhook] Order ${order.orderNumber} is already at rank ${currentRank} (${order.shipping.shippingStatus}). Skipping earlier status "${statusCategory}".`);
    if (cnoteNo && !order.shipping.trackingNumber) {
      order.shipping.trackingNumber = cnoteNo;
      order.trackingNumber = cnoteNo;
    }
    order.processedWebhookIds.push(eventKey);
    await saveOrder(order);
    return {
      statusCode: 200,
      response: {
        success: true,
        message: 'Order already at a higher shipping progression. Skipped regression.',
        orderNumber: order.orderNumber,
        shippingStatus: order.shipping.shippingStatus,
        orderStatus: order.status
      }
    };
  }

  // 4. Apply updates
  order.shipping.shippingStatus = mapped.shippingStatus;
  if (cnoteNo) {
    order.shipping.trackingNumber = cnoteNo;
    order.trackingNumber = cnoteNo;
  }
  if (courier) {
    order.shipping.courier = courier;
  }
  if (orderId && !order.shipping.mengantarOrderId) {
    order.shipping.mengantarOrderId = orderId;
  }
  if (mapped.note) {
    order.shipping.notes = mapped.note;
  }

  order.shipping.shippingUpdatedAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();
  order.shipping.mengantarResponse = data;

  if (mapped.orderStatus) {
    order.status = mapped.orderStatus;
  }

  // 5. Special handling for DELIVERED on COD orders
  if (mapped.shippingStatus === 'DELIVERED') {
    if (order.payment.paymentMethod === 'COD' && order.payment.paymentStatus !== 'PAID') {
      order.payment.paymentStatus = 'PAID';
      order.payment.paymentPaidAt = new Date().toISOString();
      console.log(`[Mengantar Webhook] COD order ${order.orderNumber} marked as PAID upon delivery.`);

      // Dispatch Meta CAPI Purchase event asynchronously (non-blocking)
      claimOrderForMetaPurchase(order.orderNumber).then(canSend => {
        if (canSend) {
          sendMetaCapiPurchase(order).catch(err => {
            console.error(`[Meta CAPI] Error sending Purchase for COD order ${order.orderNumber}:`, err.message);
          });
        }
      }).catch(err => {
        console.error(`[Meta CAPI] Error claiming COD purchase:`, err.message);
      });
    }
  }

  // 6. Record idempotency event key & save
  order.processedWebhookIds.push(eventKey);
  await saveOrder(order);

  console.log(`[Mengantar Webhook] Order ${order.orderNumber} updated successfully to shippingStatus="${order.shipping.shippingStatus}", orderStatus="${order.status}".`);

  return {
    statusCode: 200,
    response: {
      success: true,
      message: `Order ${order.orderNumber} updated successfully.`,
      orderNumber: order.orderNumber,
      trackingNumber: order.shipping.trackingNumber || cnoteNo,
      statusCategory,
      shippingStatus: order.shipping.shippingStatus,
      orderStatus: order.status
    }
  };
}
