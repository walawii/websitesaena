import crypto from 'crypto';

export interface DokuOrderRequest {
  orderId: string;
  invoiceNumber?: string;
  amount: number;
  customer: {
    fullName: string;
    email?: string;
    whatsapp: string;
    address: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  channel?: string;
  callbackUrl?: string;
}

export interface DokuPaymentResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    invoiceNumber: string;
    paymentUrl?: string;
    paymentMethodType: string;
    virtualAccountInfo?: {
      vaNumber: string;
      bank: string;
      expiredDate?: string;
      howToPayUrl?: string;
    };
    qrisInfo?: {
      qrString: string;
      qrImage?: string;
      expiredDate?: string;
    };
    creditCardInfo?: {
      url?: string;
    };
    retailInfo?: {
      paymentCode: string;
      merchant: string;
      expiredDate?: string;
    };
    status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'FAILED';
    amount: number;
    expiredAt?: string;
    rawResponse?: any;
  };
}

export interface DokuConnectivityStatus {
  configured: boolean;
  apiReachable: boolean;
  authenticationVerified: boolean;
  paymentTransactionTested: boolean;
  mode: 'production' | 'sandbox';
  clientId?: string;
  message: string;
}

export async function testDokuApiConnectivity(): Promise<DokuConnectivityStatus> {
  const clientId = process.env.DOKU_CLIENT_ID?.trim() || '';
  const secretKey = process.env.DOKU_SECRET_KEY?.trim() || '';
  const environment = (process.env.DOKU_ENVIRONMENT?.trim().toLowerCase() === 'production')
    ? 'production'
    : 'sandbox';

  if (!clientId || !secretKey) {
    return {
      configured: false,
      apiReachable: false,
      authenticationVerified: false,
      paymentTransactionTested: false,
      mode: environment,
      message: 'Kredensial DOKU belum dikonfigurasi di server environment (DOKU_CLIENT_ID & DOKU_SECRET_KEY wajib diisi).'
    };
  }

  const baseUrl = environment === 'production' 
    ? 'https://api.doku.com' 
    : 'https://api-sandbox.doku.com';

  const requestTarget = '/checkout/v1/payment';
  const requestId = `DIAG-${Date.now()}`;
  const requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z';

  // Minimal diagnostic payload to test connectivity & HMAC credentials validation without triggering real payment charges
  const testPayload = JSON.stringify({
    order: {
      amount: 10000,
      invoice_number: `DIAG-${Date.now()}`,
      currency: 'IDR'
    }
  });

  const signature = generateDokuSignature(
    clientId,
    requestId,
    requestTimestamp,
    requestTarget,
    testPayload,
    secretKey
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${baseUrl}${requestTarget}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': clientId,
        'Request-Id': requestId,
        'Request-Timestamp': requestTimestamp,
        'Signature': signature
      },
      body: testPayload,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // DOKU authenticates signature and headers first.
    // HTTP 401 / 403 indicates invalid Client-Id, invalid Secret Key, or bad HMAC signature.
    if (res.status === 401 || res.status === 403) {
      return {
        configured: true,
        apiReachable: true,
        authenticationVerified: false,
        paymentTransactionTested: false,
        mode: environment,
        clientId: `${clientId.substring(0, 6)}••••••••`,
        message: `API DOKU reachable, namun kredensial/HMAC ditolak (${environment.toUpperCase()} mode): HTTP ${res.status} Unauthorized.`
      };
    }

    // HTTP 200 or 400 (parameter validation error) confirms credentials & signature were accepted by DOKU
    return {
      configured: true,
      apiReachable: true,
      authenticationVerified: true,
      paymentTransactionTested: false, // Diagnostic check only - no real payment transaction executed
      mode: environment,
      clientId: `${clientId.substring(0, 6)}••••••••`,
      message: `API DOKU reachable & authentication verified (${environment.toUpperCase()} mode). Diagnostik koneksi berhasil (bukan bukti transaksi pembayaran).`
    };
  } catch (err: any) {
    return {
      configured: true,
      apiReachable: false,
      authenticationVerified: false,
      paymentTransactionTested: false,
      mode: environment,
      clientId: `${clientId.substring(0, 6)}••••••••`,
      message: `Kredensial DOKU terkonfigurasi, namun server DOKU tidak dapat dijangkau: ${err.message}`
    };
  }
}

export function generateDokuSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  bodyJson: string,
  secretKey: string
): string {
  // 1. Calculate Body Digest
  const digest = crypto.createHash('sha256').update(bodyJson).digest('base64');
  
  // 2. Format signature component
  const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
  
  // 3. Compute HMAC-SHA256
  const hmac = crypto.createHmac('sha256', secretKey).update(component).digest('base64');
  return `HMACSHA256=${hmac}`;
}

// Verify incoming Webhook Signature from DOKU Jokul
export function verifyDokuWebhookSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  rawBody: string,
  receivedSignature: string,
  secretKey: string
): boolean {
  if (!clientId || !requestId || !requestTimestamp || !receivedSignature || !secretKey) {
    return false;
  }

  const expectedSignature = generateDokuSignature(
    clientId,
    requestId,
    requestTimestamp,
    requestTarget,
    rawBody,
    secretKey
  );

  // Constant-time comparison to prevent timing attacks
  try {
    const cleanReceived = receivedSignature.trim();
    const cleanExpected = expectedSignature.trim();
    return crypto.timingSafeEqual(Buffer.from(cleanReceived), Buffer.from(cleanExpected));
  } catch {
    return false;
  }
}

export async function processDokuPayment(
  reqPayload: DokuOrderRequest
): Promise<DokuPaymentResult> {
  const clientId = process.env.DOKU_CLIENT_ID?.trim() || '';
  const secretKey = process.env.DOKU_SECRET_KEY?.trim() || '';
  const environment = (process.env.DOKU_ENVIRONMENT?.trim().toLowerCase() === 'production')
    ? 'production'
    : 'sandbox';

  if (!clientId || !secretKey) {
    return {
      success: false,
      error: 'Kredensial DOKU belum dikonfigurasi di server (DOKU_CLIENT_ID dan DOKU_SECRET_KEY wajib diset).'
    };
  }

  const invoiceNumber = reqPayload.invoiceNumber || `INV-${reqPayload.orderId}`;
  const baseUrl = environment === 'production' 
    ? 'https://api.doku.com' 
    : 'https://api-sandbox.doku.com';

  const requestTarget = '/checkout/v1/payment';
  const requestId = `REQ-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z';

  const defaultCallback = reqPayload.callbackUrl || 
    `${process.env.APP_URL || 'https://saena.my.id'}/thank-you?order=${reqPayload.orderId}`;

  // Jokul DOKU Checkout V1 Payload
  const bodyPayload = {
    order: {
      amount: Math.round(reqPayload.amount),
      invoice_number: invoiceNumber,
      currency: 'IDR',
      callback_url: defaultCallback,
      auto_redirect: false,
      line_items: reqPayload.items.map(it => ({
        name: it.name.slice(0, 50),
        price: Math.round(it.price),
        quantity: it.quantity
      }))
    },
    payment: {
      payment_due_date: 120 // in minutes (2 hours)
    },
    customer: {
      name: reqPayload.customer.fullName.slice(0, 50),
      email: reqPayload.customer.email || 'pelanggan@saena.my.id',
      phone: reqPayload.customer.whatsapp.replace(/[^0-9+]/g, ''),
      address: reqPayload.customer.address.slice(0, 100)
    }
  };

  const bodyJson = JSON.stringify(bodyPayload);
  const signature = generateDokuSignature(
    clientId,
    requestId,
    requestTimestamp,
    requestTarget,
    bodyJson,
    secretKey
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`${baseUrl}${requestTarget}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': clientId,
        'Request-Id': requestId,
        'Request-Timestamp': requestTimestamp,
        'Signature': signature
      },
      body: bodyJson,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const resText = await res.text();
    let jsonResult: any = null;
    try {
      jsonResult = JSON.parse(resText);
    } catch {
      // response not json
    }

    if (res.ok && jsonResult) {
      const paymentUrl = jsonResult.response?.payment?.url || jsonResult.payment?.url;
      const returnedInvoice = jsonResult.response?.payment?.invoice_number || invoiceNumber;

      return {
        success: true,
        message: 'Berhasil membuat sesi transaksi resmi DOKU Payment Gateway.',
        data: {
          invoiceNumber: returnedInvoice,
          paymentUrl,
          paymentMethodType: reqPayload.channel || 'doku_checkout',
          virtualAccountInfo: jsonResult.response?.payment?.virtual_account_info ? {
            vaNumber: jsonResult.response.payment.virtual_account_info.virtual_account_number,
            bank: jsonResult.response.payment.virtual_account_info.bank || 'Bank',
            expiredDate: jsonResult.response.payment.virtual_account_info.expired_date,
            howToPayUrl: jsonResult.response.payment.virtual_account_info.how_to_pay_url
          } : undefined,
          qrisInfo: jsonResult.response?.payment?.qris_info ? {
            qrString: jsonResult.response.payment.qris_info.qr_string,
            qrImage: jsonResult.response.payment.qris_info.qr_image,
            expiredDate: jsonResult.response.payment.qris_info.expired_date
          } : undefined,
          status: 'PENDING',
          amount: reqPayload.amount,
          rawResponse: jsonResult
        }
      };
    } else {
      const errorDetail = jsonResult?.error?.message || jsonResult?.message || resText || `HTTP ${res.status}`;
      console.error(`[DOKU API Error ${res.status}]:`, errorDetail);
      return {
        success: false,
        error: `DOKU API menolak request (HTTP ${res.status}): ${errorDetail}`
      };
    }
  } catch (apiErr: any) {
    console.error('[DOKU Network Error]:', apiErr.message);
    return {
      success: false,
      error: `Gagal menghubungi server DOKU Gateway: ${apiErr.message}`
    };
  }
}
