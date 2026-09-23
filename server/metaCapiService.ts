import crypto from 'crypto';
import type { StoredOrder } from './orderRepository.ts';

/**
 * Meta Conversions API (CAPI) Service for saena.my.id
 * Dataset ID: 2123607221569260
 *
 * Rules:
 * - Read META_CAPI_ACCESS_TOKEN exclusively from the server environment.
 * - Never hardcode or expose the access token in frontend JavaScript.
 * - Never return the access token through an API endpoint.
 * - Never store the token in localStorage, sessionStorage, cookies, or Firestore.
 */

export const META_DATASET_ID = '2123607221569260';

export interface MetaUserData {
  clientIp?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface MetaCapiEventOptions {
  eventName: 'PageView' | 'ViewContent' | 'InitiateCheckout' | 'Purchase' | string;
  eventId: string;
  eventTime?: number; // Unix timestamp in seconds
  eventSourceUrl?: string;
  actionSource?: 'website' | 'email' | 'other';
  userData?: MetaUserData;
  customData?: Record<string, any>;
}

/**
 * Normalize and hash string with SHA-256 (lowercase hex) per Meta CAPI specs
 */
export function hashMetaField(value?: string | null): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normalize and hash phone number with country code (e.g. 628...)
 */
export function hashPhone(phone?: string | null): string | undefined {
  if (!phone || typeof phone !== 'string') return undefined;
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) {
    digits = '62' + digits.substring(1);
  } else if (!digits.startsWith('62') && digits.length >= 9) {
    digits = '62' + digits;
  }
  if (!digits) return undefined;
  return crypto.createHash('sha256').update(digits).digest('hex');
}

/**
 * Dispatch an event to Meta Conversions API (Graph API v20.0)
 */
export async function sendMetaCapiEvent(options: MetaCapiEventOptions): Promise<{
  success: boolean;
  skipped?: boolean;
  eventsReceived?: number;
  fbtraceId?: string;
  error?: string;
  message?: string;
}> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim() || '';
  const datasetId = process.env.META_DATASET_ID?.trim() || META_DATASET_ID;
  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim() || undefined;

  // Graceful fallback if access token is not configured
  if (!accessToken) {
    console.log(
      `[Meta CAPI] Notice: META_CAPI_ACCESS_TOKEN is not configured on server. Event "${options.eventName}" (${options.eventId}) skipped.`
    );
    return {
      success: true,
      skipped: true,
      message: 'META_CAPI_ACCESS_TOKEN is not configured on server. Event skipped gracefully.'
    };
  }

  try {
    const rawUserData = options.userData || {};
    const userDataPayload: Record<string, any> = {};

    if (rawUserData.clientIp) {
      userDataPayload.client_ip_address = rawUserData.clientIp;
    }
    if (rawUserData.clientUserAgent) {
      userDataPayload.client_user_agent = rawUserData.clientUserAgent;
    }
    if (rawUserData.fbp) {
      userDataPayload.fbp = rawUserData.fbp;
    }
    if (rawUserData.fbc) {
      userDataPayload.fbc = rawUserData.fbc;
    }

    const hashedEmail = hashMetaField(rawUserData.email);
    if (hashedEmail) userDataPayload.em = [hashedEmail];

    const hashedPhone = hashPhone(rawUserData.phone);
    if (hashedPhone) userDataPayload.ph = [hashedPhone];

    const hashedFirstName = hashMetaField(rawUserData.firstName);
    if (hashedFirstName) userDataPayload.fn = [hashedFirstName];

    const hashedCity = hashMetaField(rawUserData.city);
    if (hashedCity) userDataPayload.ct = [hashedCity];

    const hashedProvince = hashMetaField(rawUserData.province);
    if (hashedProvince) userDataPayload.st = [hashedProvince];

    const hashedPostalCode = hashMetaField(rawUserData.postalCode);
    if (hashedPostalCode) userDataPayload.zp = [hashedPostalCode];

    const hashedCountry = hashMetaField(rawUserData.country || 'id');
    if (hashedCountry) userDataPayload.country = [hashedCountry];

    const eventPayload: Record<string, any> = {
      event_name: options.eventName,
      event_time: options.eventTime || Math.floor(Date.now() / 1000),
      event_id: options.eventId,
      event_source_url: options.eventSourceUrl || 'https://saena.my.id',
      action_source: options.actionSource || 'website',
      user_data: userDataPayload
    };

    if (options.customData && Object.keys(options.customData).length > 0) {
      eventPayload.custom_data = options.customData;
    }

    const requestBody: Record<string, any> = {
      data: [eventPayload]
    };

    if (testEventCode) {
      requestBody.test_event_code = testEventCode;
    }

    const graphApiUrl = `https://graph.facebook.com/v20.0/${encodeURIComponent(datasetId)}/events?access_token=${encodeURIComponent(accessToken)}`;

    const res = await fetch(graphApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data: any = await res.json().catch(() => null);

    if (res.ok && data) {
      console.log(
        `[Meta CAPI] Event "${options.eventName}" (${options.eventId}) successfully delivered. events_received: ${data.events_received || 1}`
      );
      return {
        success: true,
        eventsReceived: data.events_received,
        fbtraceId: data.fbtrace_id
      };
    } else {
      const errMsg = data?.error?.message || `HTTP ${res.status} from Meta Graph API`;
      console.error(
        `[Meta CAPI] Error dispatching event "${options.eventName}" (${options.eventId}):`,
        errMsg
      );
      return {
        success: false,
        error: errMsg
      };
    }
  } catch (err: any) {
    console.error(`[Meta CAPI] Network exception for "${options.eventName}" (${options.eventId}):`, err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Dispatch Purchase event for an order after backend confirms payment.
 * Uses orderNumber as eventId to match browser Pixel eventID.
 */
export async function sendMetaCapiPurchase(order: StoredOrder): Promise<{
  success: boolean;
  skipped?: boolean;
  error?: string;
}> {
  const contentItems = order.items.map(it => ({
    id: it.id || it.name,
    quantity: it.quantity,
    item_price: it.price
  }));

  const mainItemName = order.items[0]?.name || 'Madina Silk Abaya Set saena.id';

  return sendMetaCapiEvent({
    eventName: 'Purchase',
    eventId: order.orderNumber, // Deterministic event_id for deduplication
    eventSourceUrl: `https://saena.my.id/thank-you?order=${encodeURIComponent(order.orderNumber)}`,
    actionSource: 'website',
    userData: {
      clientIp: (order as any).metaTracking?.clientIp,
      clientUserAgent: (order as any).metaTracking?.clientUserAgent,
      fbp: (order as any).metaTracking?.fbp,
      fbc: (order as any).metaTracking?.fbc,
      email: order.customer.email,
      phone: order.customer.phone,
      firstName: order.customer.customerName?.split(' ')[0] || order.customer.customerName,
      lastName: order.customer.customerName?.split(' ').slice(1).join(' ') || undefined,
      city: order.shippingAddress.city,
      province: order.shippingAddress.province,
      postalCode: order.shippingAddress.postalCode,
      country: 'id'
    },
    customData: {
      currency: 'IDR',
      value: order.price.grandTotal,
      content_name: mainItemName,
      content_type: 'product',
      contents: contentItems,
      num_items: order.items.reduce((acc, it) => acc + it.quantity, 0),
      order_id: order.orderNumber
    }
  });
}
