/**
 * Meta (Facebook) Pixel Helper for saena.my.id Meta Ads Tracking
 * Pixel ID: 1446293640844777
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const META_PIXEL_ID = '1446293640844777';

/**
 * Track standard PageView event
 */
export const trackMetaPageView = () => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
};

/**
 * Track ViewContent event (e.g. Viewing Mukena Alisa Landing Page or Product details)
 */
export const trackMetaViewContent = (params: {
  contentName: string;
  contentCategory?: string;
  value?: number;
  currency?: string;
}) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'ViewContent', {
      content_name: params.contentName,
      content_category: params.contentCategory || 'Busana Muslim',
      value: params.value,
      currency: params.currency || 'IDR'
    });
  }
};

/**
 * Track InitiateCheckout event (e.g. User starts filling the order form)
 */
export const trackMetaInitiateCheckout = (params: {
  contentName: string;
  value: number;
  currency?: string;
  numItems?: number;
}) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', {
      content_name: params.contentName,
      value: params.value,
      currency: params.currency || 'IDR',
      num_items: params.numItems || 1
    });
  }
};

/**
 * Track Purchase conversion event for Meta Ads ROAS tracking
 */
export const trackMetaPurchase = (params: {
  orderId: string;
  contentName: string;
  value: number;
  currency?: string;
  numItems?: number;
}) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'Purchase', {
      order_id: params.orderId,
      content_name: params.contentName,
      value: params.value,
      currency: params.currency || 'IDR',
      num_items: params.numItems || 1
    });
  }
};

/**
 * Track Lead event (e.g. Customer contacts CS or submits contact info)
 */
export const trackMetaLead = (contentName?: string) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', {
      content_name: contentName || 'Inquiry Mukena Alisa'
    });
  }
};
