/**
 * Meta (Facebook) Pixel & Conversions API Helper for saena.my.id
 * Dataset ID: 2123607221569260
 *
 * Rules:
 * - Read META_CAPI_ACCESS_TOKEN exclusively from the server environment.
 * - Never hardcode or expose the access token in frontend JavaScript.
 * - Never return the access token through an API endpoint.
 * - Never store the token in localStorage, sessionStorage, cookies, or Firestore.
 * - Browser Meta Pixel + server-side Meta Conversions API with event deduplication (same event_id).
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const META_PIXEL_ID = '2123607221569260';

/**
 * Generate a unique event_id for Meta Pixel & CAPI deduplication
 */
export function generateMetaEventId(prefix: string = 'evt'): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${ts}_${rand}`;
}

/**
 * Retrieve _fbp (Facebook Browser Pixel) first-party cookie
 */
export function getFbpCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(^|;\s*)_fbp=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : undefined;
}

/**
 * Retrieve _fbc (Facebook Click ID) cookie or build from URL fbclid parameter
 */
export function getFbcCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(^|;\s*)_fbc=([^;]+)/);
  if (match) return decodeURIComponent(match[2]);

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) {
      return `fb.1.${Date.now()}.${fbclid}`;
    }
  }
  return undefined;
}

/**
 * Asynchronously forward event to backend server Conversions API endpoint
 * Uses keepalive to guarantee delivery even if user navigates away.
 */
export async function sendMetaCapiProxy(payload: {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  customData?: Record<string, any>;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    fbp?: string;
    fbc?: string;
  };
}): Promise<void> {
  try {
    const eventSourceUrl =
      payload.eventSourceUrl || (typeof window !== 'undefined' ? window.location.href : 'https://saena.my.id/alisa');

    const fbp = payload.userData?.fbp || getFbpCookie();
    const fbc = payload.userData?.fbc || getFbcCookie();

    await fetch('/api/meta/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        eventName: payload.eventName,
        eventId: payload.eventId,
        eventSourceUrl,
        customData: payload.customData,
        userData: {
          ...payload.userData,
          fbp,
          fbc
        }
      })
    });
  } catch (err) {
    // Non-blocking for user flow
    console.debug('[Meta CAPI Client] Dispatch notice:', err);
  }
}

/**
 * Track standard PageView event (deduplicated between Pixel & CAPI)
 */
export const trackMetaPageView = (options?: {
  eventId?: string;
  eventSourceUrl?: string;
}): string => {
  const eventId = options?.eventId || generateMetaEventId('alisa_pv');
  const eventSourceUrl = options?.eventSourceUrl || (typeof window !== 'undefined' ? window.location.href : undefined);

  // 1. Browser Meta Pixel with eventID for deduplication
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'PageView', {}, { eventID: eventId });
  }

  // 2. Server-side Conversions API with exact same event_id
  sendMetaCapiProxy({
    eventName: 'PageView',
    eventId,
    eventSourceUrl
  });

  return eventId;
};

/**
 * Track ViewContent event (e.g. Viewing Mukena Alisa Landing Page or Product details)
 */
export const trackMetaViewContent = (params: {
  contentName: string;
  contentCategory?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  eventId?: string;
  eventSourceUrl?: string;
}): string => {
  const eventId = params.eventId || generateMetaEventId('alisa_vc');
  const eventSourceUrl = params.eventSourceUrl || (typeof window !== 'undefined' ? window.location.href : undefined);

  const customData: Record<string, any> = {
    content_name: params.contentName,
    content_category: params.contentCategory || 'Mukena Traveling',
    value: params.value ?? 79500,
    currency: params.currency || 'IDR',
    content_type: 'product',
    content_ids: params.contentIds || ['alisa-01']
  };

  // 1. Browser Meta Pixel
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'ViewContent', customData, { eventID: eventId });
  }

  // 2. Server Conversions API
  sendMetaCapiProxy({
    eventName: 'ViewContent',
    eventId,
    eventSourceUrl,
    customData
  });

  return eventId;
};

/**
 * Track InitiateCheckout event (e.g. User clicks CTA that starts order flow on /alisa)
 */
export const trackMetaInitiateCheckout = (params: {
  contentName: string;
  value: number;
  currency?: string;
  numItems?: number;
  contentIds?: string[];
  eventId?: string;
  eventSourceUrl?: string;
}): string => {
  const eventId = params.eventId || generateMetaEventId('alisa_ic');
  const eventSourceUrl = params.eventSourceUrl || (typeof window !== 'undefined' ? window.location.href : undefined);

  const customData: Record<string, any> = {
    content_name: params.contentName,
    value: params.value,
    currency: params.currency || 'IDR',
    num_items: params.numItems || 1,
    content_type: 'product',
    content_ids: params.contentIds || ['alisa-01']
  };

  // 1. Browser Meta Pixel
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', customData, { eventID: eventId });
  }

  // 2. Server Conversions API
  sendMetaCapiProxy({
    eventName: 'InitiateCheckout',
    eventId,
    eventSourceUrl,
    customData
  });

  return eventId;
};

/**
 * Track Purchase conversion event for Meta Ads ROAS tracking
 * NOTE: Only called after backend confirms successful payment!
 * Uses orderId as eventID to ensure deduplication with backend server CAPI Purchase event.
 */
export const trackMetaPurchase = (params: {
  orderId: string;
  contentName: string;
  value: number;
  currency?: string;
  numItems?: number;
  contentIds?: string[];
  eventId?: string;
}): string => {
  const eventId = params.eventId || params.orderId;

  const customData: Record<string, any> = {
    order_id: params.orderId,
    content_name: params.contentName,
    value: params.value,
    currency: params.currency || 'IDR',
    num_items: params.numItems || 1,
    content_type: 'product',
    content_ids: params.contentIds || ['alisa-01']
  };

  // Browser Meta Pixel with eventID
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'Purchase', customData, { eventID: eventId });
  }

  return eventId;
};

/**
 * Track Lead event (e.g. Customer contacts CS or submits contact info)
 */
export const trackMetaLead = (contentName?: string): string => {
  const eventId = generateMetaEventId('alisa_lead');
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(
      'track',
      'Lead',
      {
        content_name: contentName || 'Inquiry Mukena Alisa'
      },
      { eventID: eventId }
    );
  }
  return eventId;
};

