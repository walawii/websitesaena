import { Order, MengantarOrderData, MengantarStoreConfig } from '../types';

export const DEFAULT_MENGANTAR_CONFIG: MengantarStoreConfig = {
  apiKey: '',
  environment: 'production',
  autoCreateOnPaid: true,
  defaultCourier: 'JNE',
  pickupTimeSlot: '14:00 - 17:00 WIB'
};

export async function createMengantarOrderApi(
  order: Order,
  config?: Partial<MengantarStoreConfig>
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
        weight: item.product.weight || 500
      })),
      totalAmount: order.total,
      shippingCost: order.shippingCost,
      isCod: order.payment.channel === 'cod',
      notes: order.notes || 'Busana Muslimah Butik saena.id'
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (config?.apiKey) {
      headers['x-mengantar-api-key'] = config.apiKey;
    }

    const res = await fetch('/api/mengantar/create-order', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.success && result.data) {
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
        message: result.error || 'Gagal memproses pesanan ke Mengantar.com'
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

export async function testMengantarConnectionApi(apiKey?: string, environment?: 'production' | 'sandbox') {
  try {
    const res = await fetch('/api/mengantar/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, environment })
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menghubungi server Mengantar'
    };
  }
}
