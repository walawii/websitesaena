import { processDokuPayment } from './dokuService';
import { processMengantarOrder } from './mengantarService';
import {
  generateOrderNumber,
  saveOrder,
  reserveProductStockInFirestore,
  restoreProductStock,
  findProductByIdFromFirestore,
  StoredOrder
} from './orderRepository';
import { INITIAL_PRODUCTS, AVAILABLE_COUPONS } from '../src/data/mockData';

export interface OrderCreationResult {
  statusCode: number;
  body: {
    success: boolean;
    error?: string;
    message?: string;
    data?: any;
    orderNumber?: string;
    invoiceNumber?: string;
    accessToken?: string;
    grandTotal?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    paymentUrl?: string | null;
    vaNumber?: string | null;
    bank?: string | null;
    qrisString?: string | null;
    qrisImage?: string | null;
    shippingStatus?: string;
    trackingNumber?: string | null;
  };
}

// In-memory debounce cache against rapid double-clicks within 10 seconds
const recentCheckoutAttempts = new Map<string, { order: StoredOrder; timestamp: number }>();

// Clean up old debounce entries periodically
setInterval(() => {
  const cutoff = Date.now() - 30000;
  for (const [key, value] of recentCheckoutAttempts.entries()) {
    if (value.timestamp < cutoff) {
      recentCheckoutAttempts.delete(key);
    }
  }
}, 60000).unref();

// Server-Authoritative Product & Package Catalog
const SERVER_PRODUCT_CATALOG: Record<string, { name: string; price: number; weight: number; qty?: number }> = {
  // Alisa Mukena Bundles
  'alisa-01': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Hemat 1 Pcs)', price: 79500, weight: 600, qty: 1 },
  'alisa-02': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Bundling 2 Pcs)', price: 159000, weight: 1200, qty: 2 },
  'alisa-03': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Best Seller 3 Pcs)', price: 238500, weight: 1800, qty: 3 },
  'paket-1': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Hemat 1 Pcs)', price: 79500, weight: 600, qty: 1 },
  'paket-2': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Bundling 2 Pcs)', price: 159000, weight: 1200, qty: 2 },
  'paket-3': { name: 'Mukena Traveling 2in1 Laser Cut Alisa (Paket Best Seller 3 Pcs)', price: 238500, weight: 1800, qty: 3 },

  // saena.id Central Boutique Catalog (Tamansari Tasikmalaya)
  'saena-01': { name: 'Madina Silk Abaya Set with French Khimar', price: 685000, weight: 550, qty: 1 },
  'saena-02': { name: 'Zafira Mulberry Silk Abaya Bordir Emas', price: 545000, weight: 500, qty: 1 },
  'saena-03': { name: 'Madina Pleated Silk Pashmina Shawl', price: 129000, weight: 200, qty: 1 },
  'saena-04': { name: 'Voal Syar\'i Silk Laser Cut Exclusive', price: 115000, weight: 150, qty: 1 },
  'saena-05': { name: 'Kaftan Silk Jacquard Royal Brunei Edition', price: 750000, weight: 700, qty: 1 },
  'saena-06': { name: 'Alya Maxi Silk Tiered Dress Kondangan', price: 565000, weight: 650, qty: 1 },
  'saena-07': { name: 'Aisyah Silk Swarovski Mukena Set 2in1', price: 385000, weight: 600, qty: 1 },
  'saena-08': { name: 'Humaira Travelling Mini Silk Mukena', price: 295000, weight: 350, qty: 1 },
  'saena-09': { name: 'Rayyan Kurta Kemeja Pria Toyobo Silk', price: 275000, weight: 400, qty: 1 },
  'saena-10': { name: 'Bros Mutiara Air Tawar Lombok Gold 18K Edition', price: 165000, weight: 100, qty: 1 }
};

// Also index all INITIAL_PRODUCTS by id and slug
for (const p of INITIAL_PRODUCTS) {
  if (!SERVER_PRODUCT_CATALOG[p.id.toLowerCase()]) {
    SERVER_PRODUCT_CATALOG[p.id.toLowerCase()] = {
      name: p.name,
      price: p.price,
      weight: p.weight || 600,
      qty: 1
    };
  }
  if (p.slug && !SERVER_PRODUCT_CATALOG[p.slug.toLowerCase()]) {
    SERVER_PRODUCT_CATALOG[p.slug.toLowerCase()] = {
      name: p.name,
      price: p.price,
      weight: p.weight || 600,
      qty: 1
    };
  }
}

// Server Coupons
const SERVER_AVAILABLE_COUPONS: Record<string, { discountPercent: number; maxDiscount?: number }> = {
  'SAENARAMADHAN': { discountPercent: 15, maxDiscount: 150000 },
  'WELCOME10': { discountPercent: 10 },
  'ELEGANT20': { discountPercent: 20, maxDiscount: 200000 }
};

// Shipping Rates Map
const SHIPPING_RATES: Record<string, number> = {
  'jne-reg': 15000,
  'jne-yes': 25000,
  'jne-oke': 12000,
  'jnt-ez': 14000,
  'jnt-super': 22000,
  'sicepat-reg': 14000,
  'dhl-intl': 150000
};

export function calculateServerShipping(
  shipping: any,
  freeShippingPromo = false
): number {
  if (freeShippingPromo) {
    return 0;
  }

  const id = String(shipping?.id || '').toLowerCase().trim();
  const courier = String(shipping?.courier || '').toLowerCase().trim();
  const service = String(shipping?.service || '').toLowerCase().trim();

  if (SHIPPING_RATES[id] !== undefined) {
    return SHIPPING_RATES[id];
  }

  if (id === 'jne-yes' || service.includes('yes') || service.includes('yakin esok')) return 25000;
  if (id === 'jne-oke' || service.includes('oke') || service.includes('ekonomis')) return 12000;
  if (id === 'jnt-super' || service.includes('super') || service.includes('next day')) return 22000;
  if (id === 'dhl-intl' || courier.includes('dhl') || service.includes('worldwide') || service.includes('internasional')) return 150000;
  if (id === 'jnt-ez' || courier.includes('j&t') || courier.includes('jnt') || service.includes('ez')) return 14000;
  if (id === 'sicepat-reg' || courier.includes('sicepat')) return 14000;
  if (id === 'jne-reg' || courier.includes('jne') || service.includes('reg')) return 15000;

  // Default authoritative standard rate
  return 15000;
}

export async function processOrderCreation(
  body: any,
  headers: Record<string, any> = {},
  clientIp = ''
): Promise<OrderCreationResult> {
  try {
    const {
      customer,
      shippingAddress,
      shipping,
      items,
      courier,
      service,
      packageId,
      paymentMethod, // 'DOKU' | 'COD'
      paymentChannel, // e.g. 'doku_qris', 'doku_checkout', 'cod'
      couponCode,
      notes,
      metaTracking
    } = body || {};

    // 1. Validate Customer Name & Phone
    const customerName = String(
      customer?.customerName || customer?.fullName || customer?.name || ''
    ).trim();

    const rawPhone = String(
      customer?.phone || customer?.whatsapp || ''
    ).trim();

    if (!customerName || !rawPhone) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'Nama lengkap dan nomor WhatsApp pelanggan wajib diisi.'
        }
      };
    }

    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
    if (cleanPhone.replace(/\D/g, '').length < 10) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'Nomor WhatsApp tidak valid (minimal 10 digit angka).'
        }
      };
    }

    // 2. Validate Shipping Address
    const effectiveShippingAddress = {
      address: String(shippingAddress?.address || customer?.address || '').trim(),
      province: String(shippingAddress?.province || customer?.province || '').trim(),
      city: String(shippingAddress?.city || customer?.city || '').trim(),
      district: String(shippingAddress?.district || customer?.district || customer?.subdistrict || '').trim(),
      postalCode: String(shippingAddress?.postalCode || customer?.postalCode || '').trim()
    };

    if (!effectiveShippingAddress.address || !effectiveShippingAddress.city || !effectiveShippingAddress.province) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'Alamat pengiriman lengkap (alamat jalan, kota/kabupaten, dan provinsi) wajib diisi.'
        }
      };
    }

    // 3. Validate Cart Items
    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'Keranjang belanja kosong.'
        }
      };
    }

    // Debounce check against rapid double-clicks (within 10 seconds)
    const shippingKey = String(shipping?.id || body?.shippingId || courier || '').trim().toLowerCase();
    const paymentKey = String(paymentMethod || paymentChannel || '').trim().toLowerCase();
    const idempotencyKey = `${cleanPhone}-${shippingKey}-${paymentKey}-${JSON.stringify(items.map((it: any) => ({ p: it.packageId || it.productId || it.id, q: it.quantity || 1 })))}`;
    const recent = recentCheckoutAttempts.get(idempotencyKey);
    if (recent && (Date.now() - recent.timestamp < 10000)) {
      const recentOrder = recent.order;
      const responseData = {
        orderNumber: recentOrder.orderNumber,
        invoiceNumber: recentOrder.invoiceNumber,
        accessToken: recentOrder.accessToken,
        grandTotal: recentOrder.price.grandTotal,
        paymentMethod: recentOrder.payment.paymentMethod,
        paymentStatus: recentOrder.payment.paymentStatus,
        paymentUrl: recentOrder.payment.paymentUrl,
        vaNumber: recentOrder.payment.vaNumber,
        bank: recentOrder.payment.bank,
        qrisString: recentOrder.payment.qrisString,
        qrisImage: recentOrder.payment.qrisImage,
        message: 'Pesanan telah terbit sebelumnya (pencegahan duplikasi).'
      };
      return {
        statusCode: 200,
        body: {
          success: true,
          data: responseData,
          ...responseData
        }
      };
    }

    let calculatedSubtotal = 0;
    let totalQuantity = 0;
    let totalWeightGrams = 0;
    const validatedItems: any[] = [];

    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const rawKey = String(packageId || it.packageId || it.productId || it.id || '').toLowerCase().trim();
      let catalog = SERVER_PRODUCT_CATALOG[rawKey];
      let firestoreProd: any = null;

      // Check Firestore if custom/dynamic product created in admin
      if (!catalog) {
        firestoreProd = await findProductByIdFromFirestore(rawKey);
        if (firestoreProd) {
          catalog = {
            name: firestoreProd.name,
            price: firestoreProd.price,
            weight: firestoreProd.weight || 600,
            qty: 1
          };
        }
      }

      // Check bundle aliases
      if (!catalog) {
        if (rawKey.includes('paket-3') || rawKey.includes('alisa-03') || it.name?.includes('3 Pcs')) {
          catalog = SERVER_PRODUCT_CATALOG['alisa-03'];
        } else if (rawKey.includes('paket-2') || rawKey.includes('alisa-02') || it.name?.includes('2 Pcs')) {
          catalog = SERVER_PRODUCT_CATALOG['alisa-02'];
        } else if (rawKey.includes('paket-1') || rawKey.includes('alisa-01') || it.name?.includes('1 Pcs')) {
          catalog = SERVER_PRODUCT_CATALOG['alisa-01'];
        }
      }

      if (!catalog) {
        return {
          statusCode: 400,
          body: {
            success: false,
            error: `Produk "${it.name || it.productId || it.id || 'Unknown'}" tidak valid atau tidak ditemukan di katalog resmi saena.id.`
          }
        };
      }

      const qty = Math.max(1, Number(it.quantity) || catalog.qty || 1);

      // Inventory out-of-stock and negative stock prevention
      let availableStock: number | null = null;
      if (firestoreProd) {
        if (typeof firestoreProd.totalStock === 'number') {
          availableStock = firestoreProd.totalStock;
        } else if (firestoreProd.stock && typeof firestoreProd.stock === 'object') {
          const vKey = it.variant || it.color || 'Standard';
          availableStock = firestoreProd.stock[vKey] ?? Object.values(firestoreProd.stock).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
        }
      } else {
        const mockProd = INITIAL_PRODUCTS.find(p => p.id === rawKey || p.slug === rawKey);
        if (mockProd) {
          if (typeof mockProd.totalStock === 'number') {
            availableStock = mockProd.totalStock;
          } else if (mockProd.stock && typeof mockProd.stock === 'object') {
            const vKey = it.variant || it.color || 'Standard';
            availableStock = (mockProd.stock as any)[vKey] ?? Object.values(mockProd.stock).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
          }
        }
      }

      if (availableStock !== null) {
        if (availableStock <= 0) {
          return {
            statusCode: 400,
            body: {
              success: false,
              error: `Stok produk "${catalog.name}" saat ini sedang habis.`
            }
          };
        }
        if (qty > availableStock) {
          return {
            statusCode: 400,
            body: {
              success: false,
              error: `Jumlah pesanan (${qty} pcs) melebihi stok yang tersedia (${availableStock} pcs) untuk produk "${catalog.name}".`
            }
          };
        }
      }

      const unitPrice = catalog.price;
      const weight = catalog.weight;

      calculatedSubtotal += unitPrice * (catalog.qty ? 1 : qty);
      totalQuantity += qty;
      totalWeightGrams += weight * (catalog.qty ? 1 : qty);

      validatedItems.push({
        id: `item-${Date.now()}-${idx}`,
        productId: rawKey || 'saena-01',
        name: it.name || catalog.name,
        variant: it.variant || it.color || 'Standard',
        color: it.color || 'Standard',
        size: it.size || 'All Size',
        price: unitPrice,
        quantity: qty,
        weight,
        image: it.image || it.product?.images?.[0]
      });
    }

    // 4. Server-Side Coupon & Discount Calculation
    let discount = 0;
    let isFreeShippingCoupon = false;
    const cleanCoupon = String(couponCode || body?.appliedCoupon || '').trim().toUpperCase();
    if (cleanCoupon) {
      const validCoupon = SERVER_AVAILABLE_COUPONS[cleanCoupon];
      if (!validCoupon) {
        return {
          statusCode: 400,
          body: {
            success: false,
            error: `Kupon promo "${cleanCoupon}" tidak valid atau sudah kedaluwarsa.`
          }
        };
      }
      let calculatedDiscount = Math.round((calculatedSubtotal * validCoupon.discountPercent) / 100);
      if (validCoupon.maxDiscount && calculatedDiscount > validCoupon.maxDiscount) {
        calculatedDiscount = validCoupon.maxDiscount;
      }
      discount = calculatedDiscount;
      if (cleanCoupon === 'GRATISONGKIR') {
        isFreeShippingCoupon = true;
      }
    }

    // 5. Server-Side Shipping Cost Calculation
    const effectiveShipping = shipping || {
      id: body?.shippingId,
      courier: courier,
      service: service
    };
    const calculatedShippingCost = calculateServerShipping(effectiveShipping, isFreeShippingCoupon);
    const grandTotal = Math.max(0, calculatedSubtotal + calculatedShippingCost - discount);

    // 6. Generate Order Identifiers & Crypto Security Token
    const { orderNumber, invoiceNumber, accessToken } = generateOrderNumber();
    const isCod = String(paymentMethod).toUpperCase() === 'COD' || paymentChannel === 'cod';

    // 7. Build Stored Order Model
    const storedOrder: StoredOrder = {
      id: orderNumber,
      orderNumber,
      invoiceNumber,
      accessToken,
      processedWebhookIds: [],
      customer: {
        customerName: customerName,
        phone: cleanPhone,
        email: String(customer?.email || '').trim()
      },
      shippingAddress: {
        address: effectiveShippingAddress.address,
        province: effectiveShippingAddress.province,
        city: effectiveShippingAddress.city,
        district: effectiveShippingAddress.district,
        postalCode: effectiveShippingAddress.postalCode
      },
      items: validatedItems,
      quantity: totalQuantity,
      weight: totalWeightGrams,
      price: {
        subtotal: calculatedSubtotal,
        discount,
        shippingCost: calculatedShippingCost,
        grandTotal
      },
      payment: {
        paymentMethod: isCod ? 'COD' : 'DOKU',
        paymentProvider: isCod ? 'COD' : 'DOKU',
        paymentChannel: isCod ? 'cod' : (paymentChannel || 'doku_checkout'),
        paymentStatus: 'PENDING',
        paymentReference: invoiceNumber,
        paymentAmount: grandTotal,
        paymentCreatedAt: new Date().toISOString(),
        paymentPaidAt: null,
        paymentUrl: null,
        vaNumber: null,
        bank: null,
        qrisString: null,
        qrisImage: null
      },
      shipping: {
        shippingProvider: 'Mengantar',
        courier: effectiveShipping?.courier || courier || 'JNE',
        service: effectiveShipping?.service || service || 'REG',
        shippingStatus: isCod ? 'PENDING' : 'NOT_CREATED',
        mengantarOrderId: null,
        trackingNumber: null,
        airwaybill: null,
        labelUrl: null,
        shippingCreatedAt: null,
        shippingUpdatedAt: null,
        estimatedDelivery: '2 - 3 Hari Kerja',
        notes: notes || ''
      },
      total: grandTotal,
      status: 'menunggu_pembayaran',
      trackingNumber: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metaTracking: {
        fbp: metaTracking?.fbp,
        fbc: metaTracking?.fbc,
        clientIp: clientIp || (headers['x-forwarded-for'] ? String(headers['x-forwarded-for']).split(',')[0].trim() : ''),
        clientUserAgent: String(headers['user-agent'] || ''),
        eventSourceUrl: metaTracking?.eventSourceUrl || 'https://saena.my.id'
      }
    };

    // Reserve inventory exactly once before any payment/shipping side effect.
    // Firestore transaction prevents concurrent checkouts from overselling stock.
    try {
      await reserveProductStockInFirestore(storedOrder.items);
    } catch (stockErr: any) {
      return {
        statusCode: 409,
        body: {
          success: false,
          error: stockErr?.message || 'Stok produk berubah dan tidak lagi mencukupi. Silakan ulangi checkout.'
        }
      };
    }

    // Persist the pending order before calling external gateways.
    // This guarantees webhooks can always find the order.
    try {
      await saveOrder(storedOrder);
    } catch (persistErr: any) {
      await restoreProductStock(storedOrder.items).catch(() => undefined);
      return {
        statusCode: 503,
        body: {
          success: false,
          error: 'Pesanan belum dapat disimpan ke database. Pembayaran tidak dijalankan. Silakan coba lagi.'
        }
      };
    }

    // Store in debounce cache only after the authoritative order exists.
    recentCheckoutAttempts.set(idempotencyKey, { order: storedOrder, timestamp: Date.now() });

    // 8. Handle COD Flow
    if (isCod) {
      storedOrder.payment.paymentStatus = 'UNPAID';
      storedOrder.status = 'sedang_dikemas';

      if (process.env.MENGANTAR_API_KEY) {
        try {
          const mgtRes = await processMengantarOrder({
            orderId: orderNumber,
            customer: {
              fullName: storedOrder.customer.customerName,
              whatsapp: storedOrder.customer.phone,
              email: storedOrder.customer.email,
              address: storedOrder.shippingAddress.address,
              subdistrict: storedOrder.shippingAddress.district,
              city: storedOrder.shippingAddress.city,
              province: storedOrder.shippingAddress.province,
              postalCode: storedOrder.shippingAddress.postalCode,
              notes: notes || 'Pesanan COD Saena Butik'
            },
            courier: storedOrder.shipping.courier,
            serviceType: storedOrder.shipping.service,
            items: storedOrder.items.map(i => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
              weight: i.weight
            })),
            totalAmount: grandTotal,
            shippingCost: calculatedShippingCost,
            isCod: true,
            notes: notes || 'Pesanan COD Saena Butik'
          });

          if (mgtRes.success && mgtRes.data) {
            storedOrder.shipping.shippingStatus = 'CREATED';
            storedOrder.shipping.trackingNumber = mgtRes.data.trackingNumber;
            storedOrder.shipping.mengantarOrderId = mgtRes.data.mengantarOrderId;
            storedOrder.shipping.labelUrl = mgtRes.data.labelUrl;
            storedOrder.shipping.airwaybill = mgtRes.data.airwayBillUrl;
            storedOrder.shipping.shippingCreatedAt = new Date().toISOString();
            storedOrder.trackingNumber = mgtRes.data.trackingNumber;
            storedOrder.shipping.mengantarResponse = mgtRes.data;
          } else {
            storedOrder.shipping.shippingStatus = 'FAILED';
          }
        } catch (mgtErr: any) {
          console.warn('[CreateOrder] Mengantar COD dispatch notice:', mgtErr.message);
          storedOrder.shipping.shippingStatus = 'FAILED';
        }
      }

      await saveOrder(storedOrder);

      const codResponseData = {
        orderNumber,
        invoiceNumber,
        accessToken,
        grandTotal,
        paymentMethod: 'COD',
        paymentStatus: storedOrder.payment.paymentStatus,
        shippingStatus: storedOrder.shipping.shippingStatus,
        trackingNumber: storedOrder.shipping.trackingNumber || null
      };

      return {
        statusCode: 200,
        body: {
          success: true,
          data: codResponseData,
          ...codResponseData
        }
      };
    }

    // 9. Handle DOKU Flow (Online Payment Gateway)
    if (!process.env.DOKU_CLIENT_ID || !process.env.DOKU_SECRET_KEY) {
      storedOrder.payment.paymentStatus = 'FAILED';
      storedOrder.status = 'dibatalkan';
      await saveOrder(storedOrder);
      await restoreProductStock(storedOrder.items).catch(() => undefined);

      return {
        statusCode: 503,
        body: {
          success: false,
          error: 'Layanan pembayaran DOKU belum dikonfigurasi di server environment (DOKU_CLIENT_ID & DOKU_SECRET_KEY wajib diisi).',
          orderNumber
        }
      };
    }

    const dokuRes = await processDokuPayment({
      orderId: orderNumber,
      invoiceNumber,
      amount: grandTotal,
      customer: {
        fullName: storedOrder.customer.customerName,
        whatsapp: storedOrder.customer.phone,
        email: storedOrder.customer.email,
        address: storedOrder.shippingAddress.address
      },
      items: storedOrder.items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price
      })),
      channel: paymentChannel || 'doku_checkout'
    });

    if (!dokuRes.success || !dokuRes.data) {
      storedOrder.payment.paymentStatus = 'FAILED';
      storedOrder.status = 'dibatalkan';
      await saveOrder(storedOrder);
      await restoreProductStock(storedOrder.items).catch(() => undefined);

      return {
        statusCode: 502,
        body: {
          success: false,
          error: `Gagal membuat sesi pembayaran DOKU: ${dokuRes.error || 'Server pembayaran DOKU tidak dapat merespons.'}`,
          orderNumber
        }
      };
    }

    const dokuData = dokuRes.data;
    storedOrder.payment.paymentUrl = dokuData.paymentUrl || null;
    storedOrder.payment.vaNumber = dokuData.virtualAccountInfo?.vaNumber || null;
    storedOrder.payment.bank = dokuData.virtualAccountInfo?.bank || null;
    storedOrder.payment.qrisString = dokuData.qrisInfo?.qrString || null;
    storedOrder.payment.qrisImage = dokuData.qrisInfo?.qrImage || null;
    storedOrder.payment.dokuResponse = dokuData;

    await saveOrder(storedOrder);

    const dokuResponseData = {
      orderNumber,
      invoiceNumber,
      accessToken,
      grandTotal,
      paymentMethod: 'DOKU',
      paymentStatus: storedOrder.payment.paymentStatus,
      paymentUrl: storedOrder.payment.paymentUrl,
      vaNumber: storedOrder.payment.vaNumber,
      bank: storedOrder.payment.bank,
      qrisString: storedOrder.payment.qrisString,
      qrisImage: storedOrder.payment.qrisImage
    };

    return {
      statusCode: 200,
      body: {
        success: true,
        data: dokuResponseData,
        ...dokuResponseData
      }
    };
  } catch (error: any) {
    console.error('[CreateOrder] Error creating order:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: error.message || 'Terjadi kesalahan sistem saat membuat pesanan.'
      }
    };
  }
}
