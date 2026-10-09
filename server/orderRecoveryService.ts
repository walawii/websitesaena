import { findOrderByNumber, StoredOrder, generateOrderNumber, saveOrder } from './orderRepository.ts';

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
}

// In-memory rate limiting map for recovery: key = `${ip}:${orderNumber}`
const recoveryAttempts = new Map<string, AttemptRecord>();
const ipAttempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const MAX_IP_ATTEMPTS = 15;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

// Clean up stale attempt records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of recoveryAttempts.entries()) {
    if (now > record.lockedUntil && (now - record.firstAttempt) > WINDOW_MS) {
      recoveryAttempts.delete(key);
    }
  }
  for (const [key, record] of ipAttempts.entries()) {
    if (now > record.lockedUntil && (now - record.firstAttempt) > WINDOW_MS) {
      ipAttempts.delete(key);
    }
  }
}, 60000).unref();

export interface RecoveryResult {
  success: boolean;
  statusCode: number;
  error?: string;
  code?: string;
  order?: any;
  accessToken?: string;
}

/**
 * Normalize Indonesian phone numbers to pure digits standardizing prefix
 */
export function normalizePhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('62')) {
    return '0' + digits.slice(2);
  }
  return digits;
}

/**
 * Normalize name string for anti-tampering comparison
 */
export function normalizeName(raw: string): string {
  return String(raw || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Verify customer identity with strict rate limiting and uniform error reporting
 * (Prevents username/phone enumeration or order existence leaking)
 */
export async function verifyAndRecoverOrder(
  orderNumber: string,
  rawPhone: string,
  rawName: string,
  clientIp: string
): Promise<RecoveryResult> {
  const cleanOrderNum = String(orderNumber || '').trim();
  const cleanPhone = normalizePhone(rawPhone);
  const cleanName = normalizeName(rawName);

  const rateLimitKey = `${clientIp || 'unknown'}:${cleanOrderNum}`;
  const ipKey = clientIp || 'unknown';
  const now = Date.now();

  const ipRecord = ipAttempts.get(ipKey) || {
    count: 0,
    firstAttempt: now,
    lockedUntil: 0
  };

  if (now < ipRecord.lockedUntil) {
    const remainingMinutes = Math.ceil((ipRecord.lockedUntil - now) / 60000);
    return {
      success: false,
      statusCode: 429,
      error: `Batas percobaan verifikasi tercapai dari IP Anda. Demi keamanan, silakan coba lagi dalam ${remainingMinutes} menit.`,
      code: 'RATE_LIMITED'
    };
  }

  if (now - ipRecord.firstAttempt > WINDOW_MS) {
    ipRecord.count = 0;
    ipRecord.firstAttempt = now;
  }

  const record = recoveryAttempts.get(rateLimitKey) || {
    count: 0,
    firstAttempt: now,
    lockedUntil: 0
  };

  // Check lockout
  if (now < record.lockedUntil) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return {
      success: false,
      statusCode: 429,
      error: `Batas percobaan verifikasi tercapai. Demi keamanan, silakan coba lagi dalam ${remainingMinutes} menit.`,
      code: 'RATE_LIMITED'
    };
  }

  // Reset window if expired
  if (now - record.firstAttempt > WINDOW_MS) {
    record.count = 0;
    record.firstAttempt = now;
  }

  // Uniform generic failure response to prevent enumeration
  const failVerification = (): RecoveryResult => {
    record.count += 1;
    ipRecord.count += 1;
    if (ipRecord.count >= MAX_IP_ATTEMPTS) {
      ipRecord.lockedUntil = now + LOCKOUT_MS;
      ipAttempts.set(ipKey, ipRecord);
    } else {
      ipAttempts.set(ipKey, ipRecord);
    }
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_MS;
      recoveryAttempts.set(rateLimitKey, record);
      return {
        success: false,
        statusCode: 429,
        error: 'Terlalu banyak percobaan verifikasi yang gagal. Akses verifikasi dikunci sementara selama 15 menit.',
        code: 'RATE_LIMITED'
      };
    }
    recoveryAttempts.set(rateLimitKey, record);
    return {
      success: false,
      statusCode: 403,
      error: 'Data verifikasi tidak sesuai atau akses pesanan dibatasi. Silakan periksa kembali Nama dan Nomor WhatsApp Anda.',
      code: 'VERIFICATION_FAILED'
    };
  };

  if (!cleanOrderNum || cleanPhone.length < 9 || cleanName.length < 3) {
    return failVerification();
  }

  // Lookup order
  const order = await findOrderByNumber(cleanOrderNum);
  if (!order) {
    return failVerification();
  }

  const orderPhone = normalizePhone(order.customer.phone);
  const orderName = normalizeName(order.customer.customerName);

  // Exact phone match + exact full name match (anti-guessing / anti-enumeration)
  const isPhoneMatch = cleanPhone === orderPhone;
  const isNameMatch = cleanName.length >= 3 && orderName === cleanName;

  if (!isPhoneMatch || !isNameMatch) {
    return failVerification();
  }

  // Successful verification: reset rate limiting attempts
  recoveryAttempts.delete(rateLimitKey);

  // If token is expired, generate fresh scoped access token with 30-day validity
  let token = order.accessToken;
  const expiresAtMs = order.accessTokenExpiresAt ? new Date(order.accessTokenExpiresAt).getTime() : 0;
  if (!token || (expiresAtMs > 0 && now > expiresAtMs)) {
    const { accessToken, accessTokenExpiresAt } = generateOrderNumber();
    order.accessToken = accessToken;
    order.accessTokenExpiresAt = accessTokenExpiresAt;
    token = accessToken;
    await saveOrder(order).catch(() => undefined);
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
      email: order.customer.email
    },
    shippingAddress: order.shippingAddress,
    items: order.items,
    quantity: order.quantity,
    weight: order.weight,
    price: order.price,
    payment: {
      paymentMethod: order.payment.paymentMethod,
      paymentProvider: order.payment.paymentProvider,
      paymentChannel: order.payment.paymentChannel,
      paymentStatus: order.payment.paymentStatus,
      paymentAmount: order.payment.paymentAmount,
      paymentCreatedAt: order.payment.paymentCreatedAt,
      paymentPaidAt: order.payment.paymentPaidAt,
      paymentUrl: order.payment.paymentUrl,
      vaNumber: order.payment.vaNumber,
      bank: order.payment.bank,
      qrisString: order.payment.qrisString,
      qrisImage: order.payment.qrisImage
    },
    shipping: {
      shippingProvider: order.shipping.shippingProvider,
      courier: order.shipping.courier,
      service: order.shipping.service,
      shippingStatus: order.shipping.shippingStatus,
      trackingNumber: order.shipping.trackingNumber,
      airwaybill: order.shipping.airwaybill,
      labelUrl: order.shipping.labelUrl,
      estimatedDelivery: order.shipping.estimatedDelivery
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };

  return {
    success: true,
    statusCode: 200,
    order: orderPayload,
    accessToken: token
  };
}

// Reset recovery attempts map (used by unit tests)
export function resetRecoveryAttemptsForTesting(): void {
  recoveryAttempts.clear();
}
