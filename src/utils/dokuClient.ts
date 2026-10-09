import { DokuStoreConfig, DokuPaymentData, PaymentChannel } from '../types';

export const DEFAULT_DOKU_CONFIG: DokuStoreConfig = {
  clientId: '',
  secretKey: '',
  environment: 'production',
  enabled: true,
  autoRedirectToPaymentUrl: false,
  activeChannels: {
    qris: true,
    virtualAccounts: true,
    eWallet: true,
    creditCard: true,
    convenienceStore: true
  },
  merchantName: 'SAENA BUTIK MUSLIMAH',
  merchantCity: 'TASIKMALAYA',
  merchantNmid: 'ID10200382910',
  bankAccounts: [
    { bank: 'BCA', accountNumber: '1480928371', holderName: 'SAENA BUTIK MUSLIMAH' },
    { bank: 'Mandiri', accountNumber: '1310018293847', holderName: 'SAENA BUTIK MUSLIMAH' },
    { bank: 'BRI', accountNumber: '010901029384501', holderName: 'SAENA BUTIK MUSLIMAH' }
  ]
};

export async function createDokuPaymentApi(
  orderPayload: {
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
    channel?: PaymentChannel;
    callbackUrl?: string;
  }
): Promise<{ success: boolean; message: string; data?: DokuPaymentData }> {
  try {
    const res = await fetch('/api/doku/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderPayload
      })
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Server DOKU mengembalikan respon non-JSON'
      };
    }

    if (!res.ok || !json.success) {
      return {
        success: false,
        message: json?.error || json?.message || `HTTP ${res.status}: Gagal memproses pembayaran DOKU`
      };
    }

    return json;
  } catch (err: any) {
    console.error('DOKU Client Error:', err);
    return {
      success: false,
      message: err?.message || 'Gagal menghubungi server DOKU Payment Gateway'
    };
  }
}

export async function testDokuConnectionApi(
  _configOrClientId?: any,
  _secretKey?: any,
  _mode?: any
): Promise<{
  success: boolean;
  configured: boolean;
  apiReachable?: boolean;
  authenticationVerified?: boolean;
  paymentTransactionTested?: boolean;
  verified: boolean;
  connected?: boolean;
  mode?: string;
  clientId?: string;
  message: string;
}> {
  try {
    const res = await fetch('/api/doku/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // Non-JSON
    }

    if (!res.ok || !json) {
      return {
        success: false,
        configured: false,
        apiReachable: false,
        authenticationVerified: false,
        paymentTransactionTested: false,
        verified: false,
        connected: false,
        message: json?.message || json?.error || `Gagal menghubungi server test DOKU (HTTP ${res.status})`
      };
    }

    return {
      success: !!json.configured,
      configured: !!json.configured,
      apiReachable: !!json.apiReachable,
      authenticationVerified: !!json.authenticationVerified,
      paymentTransactionTested: !!json.paymentTransactionTested,
      verified: !!json.authenticationVerified,
      connected: !!json.authenticationVerified,
      mode: json.mode || 'sandbox',
      clientId: json.clientId,
      message: json.message || (json.authenticationVerified ? 'API DOKU reachable & authentication verified.' : 'Kredensial DOKU belum terverifikasi.')
    };
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      apiReachable: false,
      authenticationVerified: false,
      paymentTransactionTested: false,
      verified: false,
      connected: false,
      message: `Gagal menghubungi server DOKU: ${err.message}`
    };
  }
}


export function getDokuChannelLabel(channel: PaymentChannel): {
  title: string;
  badge: string;
  description: string;
  bank?: string;
} {
  switch (channel) {
    case 'doku_checkout':
      return {
        title: 'DOKU All-in-One Checkout',
        badge: 'DOKU HOSTED',
        description: 'Pilih semua metode bayar resmi dalam satu halaman aman DOKU'
      };
    case 'doku_qris':
    case 'qris':
      return {
        title: 'DOKU QRIS Real-time',
        badge: 'INSTANT',
        description: 'Scan via BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA'
      };
    case 'doku_va_bca':
    case 'va_bca':
      return {
        title: 'BCA Virtual Account (DOKU)',
        badge: 'OTOMATIS',
        description: 'Nomor VA BCA resmi verifikasi otomatis 24 jam',
        bank: 'BCA'
      };
    case 'doku_va_mandiri':
    case 'va_mandiri':
      return {
        title: 'Mandiri Virtual Account (DOKU)',
        badge: 'OTOMATIS',
        description: 'Bayar via Livin\' by Mandiri, ATM, atau Internet Banking',
        bank: 'MANDIRI'
      };
    case 'doku_va_bni':
    case 'va_bni':
      return {
        title: 'BNI Virtual Account (DOKU)',
        badge: 'OTOMATIS',
        description: 'Bayar via BNI Mobile Banking atau ATM BNI',
        bank: 'BNI'
      };
    case 'doku_va_bri':
    case 'va_bri':
      return {
        title: 'BRI BRIVA (DOKU)',
        badge: 'OTOMATIS',
        description: 'Bayar via BRImo atau Agen BRILink',
        bank: 'BRI'
      };
    case 'doku_va_bsi':
      return {
        title: 'BSI Virtual Account (DOKU Syariah)',
        badge: 'SYARIAH',
        description: 'Bank Syariah Indonesia resmi tanpa riba',
        bank: 'BSI'
      };
    case 'doku_ewallet_ovo':
      return {
        title: 'OVO (DOKU Jokul)',
        badge: 'E-WALLET',
        description: 'Notifikasi push instan ke aplikasi OVO Anda'
      };
    case 'doku_ewallet_dana':
      return {
        title: 'DANA (DOKU Jokul)',
        badge: 'E-WALLET',
        description: 'Pembayaran cepat dengan saldo DANA'
      };
    case 'doku_ewallet_shopeepay':
      return {
        title: 'ShopeePay (DOKU Jokul)',
        badge: 'E-WALLET',
        description: 'Terhubung langsung ke akun ShopeePay'
      };
    case 'doku_cc':
    case 'cc':
      return {
        title: 'Kartu Kredit / Debit (DOKU)',
        badge: '3D SECURE',
        description: 'Visa, MasterCard, JCB dengan proteksi anti-fraud DOKU'
      };
    case 'doku_indomaret':
      return {
        title: 'Indomaret / Ceriamart (DOKU)',
        badge: 'GERAI RETAIL',
        description: 'Tunjukkan kode bayar DOKU ke kasir Indomaret terdekat'
      };
    case 'doku_alfamart':
      return {
        title: 'Alfamart / Alfamidi / Dan+Dan (DOKU)',
        badge: 'GERAI RETAIL',
        description: 'Tunjukkan kode bayar DOKU ke kasir Alfamart terdekat'
      };
    default:
      return {
        title: 'Pembayaran DOKU',
        badge: 'DOKU.COM',
        description: 'Gerbang pembayaran resmi DOKU Indonesia'
      };
  }
}


