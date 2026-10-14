// Endpoint verification status constant per audit requirement
export const MENGANTAR_ENDPOINT_STATUS = 'MENGANTAR_ENDPOINT_NOT_VERIFIED';

export interface MengantarOrderRequest {
  orderId: string;
  customer: {
    fullName: string;
    whatsapp: string;
    email?: string;
    address: string;
    subdistrict: string;
    city: string;
    province: string;
    postalCode: string;
    notes?: string;
  };
  sender?: {
    name?: string;
    phone?: string;
    address?: string;
    subdistrict?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  courier: string; // e.g. "JNE", "J&T Express", "SiCepat", "Anteraja"
  serviceType?: string; // "REG", "EZ", "GOKIL", etc.
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    weight?: number; // in grams
  }>;
  totalAmount: number;
  shippingCost: number;
  isCod?: boolean;
  notes?: string;
}

export interface MengantarOrderResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    mengantarOrderId: string;
    trackingNumber: string;
    courier: string;
    serviceType: string;
    status: 'MENUNGGU_PICKUP' | 'PICKUP' | 'DIKIRIM' | 'TIBA_DI_TUJUAN' | 'SELESAI';
    pickupTime?: string;
    shippingFee: number;
    isCod: boolean;
    codAmount: number;
    labelUrl?: string;
    airwayBillUrl?: string;
    barcodeNumber?: string;
    estimatedDelivery?: string;
    syncedAt: string;
    rawResponse?: any;
  };
}

export async function processMengantarOrder(
  reqPayload: MengantarOrderRequest
): Promise<MengantarOrderResponse> {
  const apiKey = process.env.MENGANTAR_API_KEY?.trim() || '';

  if (!apiKey) {
    return {
      success: false,
      error: 'MENGANTAR_API_KEY belum dikonfigurasi di environment server.'
    };
  }

  const courier = reqPayload.courier || 'JNE';
  const serviceType = reqPayload.serviceType || 'REG';

  // Default Central Boutique Warehouse Tamansari Tasikmalaya
  const senderInfo = {
    name: reqPayload.sender?.name || 'saena.id (Central Boutique Warehouse)',
    phone: reqPayload.sender?.phone || '+6285724023064',
    address: reqPayload.sender?.address || 'Jl. Tamansari No. 88, Kec. Tamansari',
    subdistrict: reqPayload.sender?.subdistrict || 'Kecamatan Tamansari',
    city: reqPayload.sender?.city || 'Kota Tasikmalaya',
    province: reqPayload.sender?.province || 'Jawa Barat',
    postalCode: reqPayload.sender?.postalCode || '46196'
  };

  const mgtPayload = {
    reference_id: reqPayload.orderId,
    courier: courier.toLowerCase().replace(/[^a-z0-9]/g, ''),
    service: serviceType,
    is_cod: !!reqPayload.isCod,
    cod_amount: reqPayload.isCod ? Math.round(reqPayload.totalAmount) : 0,
    sender: {
      name: senderInfo.name,
      phone: senderInfo.phone,
      address: senderInfo.address,
      subdistrict: senderInfo.subdistrict,
      city: senderInfo.city,
      province: senderInfo.province,
      postal_code: senderInfo.postalCode
    },
    recipient: {
      name: reqPayload.customer.fullName,
      phone: reqPayload.customer.whatsapp.replace(/[^0-9+]/g, ''),
      address: reqPayload.customer.address,
      subdistrict: reqPayload.customer.subdistrict,
      city: reqPayload.customer.city,
      province: reqPayload.customer.province,
      postal_code: reqPayload.customer.postalCode
    },
    items: reqPayload.items.map(item => ({
      name: item.name,
      qty: item.quantity,
      price: Math.round(item.price),
      weight: item.weight || 600
    })),
    notes: reqPayload.notes || 'Busana Muslimah Premium saena.id'
  };

  // Official Mengantar API Base URL
  const baseUrl = (process.env.MENGANTAR_BASE_URL?.trim() || 'https://api.mengantar.com').replace(/\/+$/, '');
  const endpoint = `${baseUrl}/orders`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'User-Agent': 'saena.id-mengantar-integration'
      },
      body: JSON.stringify(mgtPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const resText = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(resText);
    } catch {
      // not json
    }

    if (res.ok && json) {
      const orderId = json.order_id || json.id || json.data?.id || json.data?.order_id || json.data?.orderId;
      const tracking = json.airwaybill || json.tracking_number || json.data?.tracking_number || json.data?.airwaybill || json.data?.waybill;
      const labelUrl = json.label_url || json.data?.label_url || json.data?.pdf_url;

      // Requirement 5: Ensure response contains a valid non-empty shipment identifier
      // Order ID / shipment ID and tracking number if provided. Never fake tracking numbers.
      const validOrderId = orderId ? String(orderId).trim() : '';
      const validTracking = tracking ? String(tracking).trim() : '';

      if (validOrderId || validTracking) {
        return {
          success: true,
          message: 'Pesanan berhasil dibuat di sistem Mengantar.com!',
          data: {
            mengantarOrderId: validOrderId || validTracking,
            trackingNumber: validTracking,
            courier,
            serviceType,
            status: 'MENUNGGU_PICKUP',
            pickupTime: 'Kurir Express Menjemput ke Gudang Tamansari',
            shippingFee: reqPayload.shippingCost,
            isCod: !!reqPayload.isCod,
            codAmount: reqPayload.isCod ? reqPayload.totalAmount : 0,
            labelUrl: labelUrl ? String(labelUrl) : undefined,
            airwayBillUrl: labelUrl ? String(labelUrl) : undefined,
            barcodeNumber: validTracking || undefined,
            estimatedDelivery: '2 - 3 Hari Kerja',
            syncedAt: new Date().toISOString(),
            rawResponse: json
          }
        };
      } else {
        console.warn('[Mengantar Service] HTTP 200 OK received but payload lacks required shipment identifier:', json);
        return {
          success: false,
          error: 'Mengantar API merespons HTTP 200 OK namun tidak menyertakan identifier pengiriman yang valid (order ID atau tracking number tidak ditemukan).'
        };
      }
    }

    const errDetail = json?.message || json?.error || resText || `HTTP ${res.status}`;
    return {
      success: false,
      error: `Gagal memproses pesanan ke Mengantar.com (HTTP ${res.status}): ${errDetail}`
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal menghubungi server Mengantar: ${err.message}`
    };
  }
}

export interface MengantarRatesOptions {
  originCity?: string;
  originSubdistrict?: string;
  destinationCity: string;
  destinationDistrict?: string;
  destinationProvince?: string;
  destinationPostalCode?: string;
  weightGrams?: number;
}

export async function calculateMengantarRates(
  originOrOptions: string | MengantarRatesOptions = 'Kota Tasikmalaya',
  destinationCityParam?: string,
  weightGramsParam: number = 600,
  destinationDistrictParam?: string,
  destinationProvinceParam?: string,
  destinationPostalCodeParam?: string
): Promise<{
  success: boolean;
  origin?: string;
  destination?: string;
  weightGrams?: number;
  rates?: Array<{ courier: string; service: string; name: string; cost: number; etd?: string }>;
  error?: string;
}> {
  const isObj = typeof originOrOptions === 'object' && originOrOptions !== null;
  const originCity: string = isObj ? (originOrOptions.originCity || 'Kota Tasikmalaya') : (typeof originOrOptions === 'string' ? originOrOptions : 'Kota Tasikmalaya');
  const originSubdistrict: string = isObj ? (originOrOptions.originSubdistrict || 'Kecamatan Tamansari') : 'Kecamatan Tamansari';
  const destinationCity = isObj ? originOrOptions.destinationCity : (destinationCityParam || '');
  const destinationDistrict = isObj ? (originOrOptions.destinationDistrict || '') : (destinationDistrictParam || '');
  const destinationProvince = isObj ? (originOrOptions.destinationProvince || '') : (destinationProvinceParam || '');
  const destinationPostalCode = isObj ? (originOrOptions.destinationPostalCode || '') : (destinationPostalCodeParam || '');
  const weightGrams = isObj ? (originOrOptions.weightGrams || 600) : (weightGramsParam || 600);

  if (!destinationCity && !destinationDistrict) {
    return {
      success: false,
      error: 'Kota/Kabupaten atau Kecamatan tujuan pengiriman wajib diisi untuk menghitung ongkos kirim.'
    };
  }

  const apiKey = process.env.MENGANTAR_API_KEY?.trim() || '';
  const baseUrl = (process.env.MENGANTAR_BASE_URL?.trim() || 'https://api.mengantar.com').replace(/\/+$/, '');

  if (!apiKey) {
    return {
      success: false,
      error: 'MENGANTAR_API_KEY belum dikonfigurasi di environment server. Layanan perhitungan ongkir resmi Mengantar.com memerlukan API key.'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const mgtPayload = {
      origin: originCity,
      origin_city: originCity,
      origin_subdistrict: originSubdistrict,
      destination: destinationDistrict ? `${destinationDistrict}, ${destinationCity}` : destinationCity,
      destination_city: destinationCity,
      destination_subdistrict: destinationDistrict,
      destination_province: destinationProvince,
      postal_code: destinationPostalCode,
      weight: weightGrams
    };

    const res = await fetch(`${baseUrl}/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'User-Agent': 'saena.id-mengantar-rates'
      },
      body: JSON.stringify(mgtPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const rawRates = data?.rates || data?.data?.rates || data?.data;
      if (Array.isArray(rawRates) && rawRates.length > 0) {
        const rates = rawRates.map((r: any) => ({
          courier: String(r.courier || r.courier_name || r.name || 'JNE').trim(),
          service: String(r.service || r.service_name || r.code || 'REG').trim(),
          name: `${r.courier || 'Kurir'} ${r.service || 'REG'}`,
          cost: Number(r.cost || r.price || r.tariff || r.fee) || 0,
          etd: r.etd || r.estimated || r.duration || '2-3 Hari'
        })).filter((r: any) => r.cost > 0);

        if (rates.length > 0) {
          return {
            success: true,
            origin: originCity,
            destination: destinationCity,
            weightGrams,
            rates
          };
        }
      }
    }

    const resText = await res.text().catch(() => '');
    return {
      success: false,
      error: `Mengantar.com tidak dapat mengembalikan tarif ongkir (HTTP ${res.status}): ${resText.slice(0, 150) || 'Format data rute tidak dikenali.'}`
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal menghubungi layanan ongkir Mengantar.com: ${err.message}`
    };
  }
}

export interface MengantarConnectivityStatus {
  configured: boolean;
  apiReachable: boolean;
  authenticationVerified: boolean;
  endpointVerified: boolean;
  verificationStatus: string;
  message: string;
}

export async function testMengantarApiConnectivity(): Promise<MengantarConnectivityStatus> {
  const apiKey = process.env.MENGANTAR_API_KEY?.trim() || '';
  const baseUrl = (process.env.MENGANTAR_BASE_URL?.trim() || 'https://api.mengantar.com').replace(/\/+$/, '');

  if (!apiKey) {
    return {
      configured: false,
      apiReachable: false,
      authenticationVerified: false,
      endpointVerified: false,
      verificationStatus: MENGANTAR_ENDPOINT_STATUS,
      message: 'MENGANTAR_API_KEY belum dikonfigurasi di server environment.'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Diagnostic check to Mengantar Base URL
    const res = await fetch(`${baseUrl}/orders?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.status === 401 || res.status === 403) {
      return {
        configured: true,
        apiReachable: true,
        authenticationVerified: false,
        endpointVerified: false,
        verificationStatus: MENGANTAR_ENDPOINT_STATUS,
        message: 'Server Mengantar reachable, namun MENGANTAR_API_KEY ditolak (HTTP 401/403 Unauthorized).'
      };
    }

    if (res.ok) {
      return {
        configured: true,
        apiReachable: true,
        authenticationVerified: true,
        endpointVerified: false, // Ditandai false karena dokumentasi resmi API Mengantar belum diverifikasi dari akun
        verificationStatus: MENGANTAR_ENDPOINT_STATUS,
        message: 'API Mengantar reachable & request diagnostik diterima (HTTP 200). Status integrasi: MENGANTAR_ENDPOINT_NOT_VERIFIED (menunggu verifikasi spesifikasi resmi Mengantar).'
      };
    }

    return {
      configured: true,
      apiReachable: true,
      authenticationVerified: false,
      endpointVerified: false,
      verificationStatus: MENGANTAR_ENDPOINT_STATUS,
      message: `Server Mengantar merespons HTTP ${res.status}. Status: MENGANTAR_ENDPOINT_NOT_VERIFIED.`
    };
  } catch (err: any) {
    return {
      configured: true,
      apiReachable: false,
      authenticationVerified: false,
      endpointVerified: false,
      verificationStatus: MENGANTAR_ENDPOINT_STATUS,
      message: `MENGANTAR_API_KEY terkonfigurasi, namun gagal menghubungi server Mengantar (${baseUrl}): ${err.message}`
    };
  }
}

