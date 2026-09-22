import { Order, MengantarOrderData, MengantarStoreConfig } from '../types';

export const DEFAULT_MENGANTAR_CONFIG: MengantarStoreConfig = {
  apiKey: '',
  environment: 'production',
  autoCreateOnPaid: false, // Manual by default: Admin triggers Mengantar dispatch from dashboard
  defaultCourier: 'JNE',
  pickupTimeSlot: '14:00 - 17:00 WIB'
};

export async function createMengantarOrderApi(
  order: Order,
  _config?: any
): Promise<{ success: boolean; data?: MengantarOrderData; message?: string }> {
  try {
    const payload = {
      orderId: order.id,
      customer: order.customer,
      courier: order.shipping.courier,
      serviceType: order.shipping.service || 'REG',
      items: order.items.map(item => ({
        name: `${item.product.name} (${item.selectedColor.name}, ${item.selectedSize})`,
        quantity: item.quantity,
        price: item.price,
        weight: item.product.weight || 600
      })),
      totalAmount: order.total,
      shippingCost: order.shippingCost,
      isCod: order.payment.channel === 'cod',
      notes: order.notes || 'Busana Muslimah Butik saena.id'
    };

    const res = await fetch('/api/mengantar/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let result: any = null;
    try {
      result = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Respon Mengantar.com bukan JSON'
      };
    }

    if (result?.success && result?.data) {
      return {
        success: true,
        data: {
          mengantarOrderId: result.data.mengantarOrderId,
          trackingNumber: result.data.trackingNumber,
          courier: result.data.courier,
          serviceType: result.data.serviceType,
          status: result.data.status || 'MENUNGGU_PICKUP',
          pickupTime: result.data.pickupTime,
          labelUrl: result.data.labelUrl,
          airwayBillUrl: result.data.airwayBillUrl,
          shippingFee: result.data.shippingFee,
          syncedAt: result.data.syncedAt,
          isCod: result.data.isCod,
          codAmount: result.data.codAmount
        },
        message: result.message
      };
    } else {
      return {
        success: false,
        message: result?.error || result?.message || 'Gagal memproses pesanan ke Mengantar.com'
      };
    }
  } catch (err: any) {
    console.error('Error calling Mengantar API:', err);
    return {
      success: false,
      message: err.message || 'Koneksi ke Mengantar.com terputus.'
    };
  }
}

export async function testMengantarConnectionApi(
  _apiKeyOrConfig?: any,
  _environment?: any
): Promise<{
  success: boolean;
  configured: boolean;
  apiReachable?: boolean;
  authenticationVerified?: boolean;
  endpointVerified?: boolean;
  verificationStatus?: string;
  verified: boolean;
  connected?: boolean;
  message: string;
}> {
  try {
    const res = await fetch('/api/mengantar/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // ignore
    }

    if (!res.ok || !json) {
      return {
        success: false,
        configured: false,
        apiReachable: false,
        authenticationVerified: false,
        endpointVerified: false,
        verificationStatus: 'MENGANTAR_ENDPOINT_NOT_VERIFIED',
        verified: false,
        connected: false,
        message: json?.message || json?.error || `Gagal menghubungi server test Mengantar (HTTP ${res.status})`
      };
    }

    return {
      success: !!json.configured,
      configured: !!json.configured,
      apiReachable: !!json.apiReachable,
      authenticationVerified: !!json.authenticationVerified,
      endpointVerified: !!json.endpointVerified,
      verificationStatus: json.verificationStatus || 'MENGANTAR_ENDPOINT_NOT_VERIFIED',
      verified: !!json.authenticationVerified,
      connected: !!json.authenticationVerified,
      message: json.message || (json.authenticationVerified ? 'Kredensial Mengantar.com diterima server.' : 'Kredensial Mengantar belum terverifikasi.')
    };
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      apiReachable: false,
      authenticationVerified: false,
      endpointVerified: false,
      verificationStatus: 'MENGANTAR_ENDPOINT_NOT_VERIFIED',
      verified: false,
      connected: false,
      message: err.message || 'Gagal menghubungi server Mengantar'
    };
  }
}

