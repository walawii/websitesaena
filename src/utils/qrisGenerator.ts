/**
 * Indonesian Standard QRIS (Quick Response Code Indonesian Standard) Generator & Parser
 * Conforms to Bank Indonesia ASPI & EMVCo QR Code Specification for Payment Systems (CPM/MPM)
 */
import { DokuStoreConfig } from '../types';

export function crc16Ccitt(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Converts a static QRIS string (e.g. from merchant's BCA/GoPay/Shopee/DOKU)
 * into a dynamic QRIS by embedding the exact order amount and recalculating CRC16.
 */
export function convertStaticToDynamicQris(staticQris: string, amount: number, invoiceNumber?: string): string {
  if (!staticQris || !staticQris.startsWith('000201')) {
    return staticQris;
  }

  // Strip existing 4-character CRC
  let payload = staticQris.trim();
  if (payload.includes('6304')) {
    const parts = payload.split('6304');
    payload = parts[0] + '6304';
  } else {
    payload = payload.slice(0, -4);
    if (!payload.endsWith('6304')) {
      payload += '6304';
    }
  }

  // Switch Point of Initiation from 010211 (static) to 010212 (dynamic)
  payload = payload.replace('010211', '010212');

  const roundedAmount = Math.max(0, Math.round(amount));
  const amtStr = roundedAmount.toString();
  const tag54 = formatTlv('54', amtStr);

  // Locate Tag 58 (Country Code '5802ID')
  const tag58Idx = payload.indexOf('5802ID');
  if (tag58Idx !== -1) {
    const before58 = payload.substring(0, tag58Idx);
    const from58 = payload.substring(tag58Idx);

    // Remove any existing Tag 54 before Tag 58
    const tag54Regex = /54(\d{2})(\d+)/;
    const cleanBefore58 = before58.replace(tag54Regex, '');

    payload = cleanBefore58 + tag54 + from58;
  }

  // If invoice number is provided and Tag 62 is not present, add invoice
  if (invoiceNumber && !payload.includes('62')) {
    const cleanInvoice = invoiceNumber.replace(/[^A-Za-z0-9_-]/g, '').slice(-20);
    const tag62 = formatTlv('62', formatTlv('01', cleanInvoice));
    const crcHeaderIdx = payload.lastIndexOf('6304');
    if (crcHeaderIdx !== -1) {
      payload = payload.slice(0, crcHeaderIdx) + tag62 + '6304';
    }
  }

  // Recalculate CRC16-CCITT for payload (excluding the final 4 hex digits)
  const checksum = crc16Ccitt(payload);
  return `${payload}${checksum}`;
}

/**
 * Extracts basic metadata from an EMVCo QRIS string
 */
export function parseQrisPayload(qrisStr: string): {
  merchantName?: string;
  merchantCity?: string;
  postalCode?: string;
  nmid?: string;
  amount?: number;
} {
  const result: {
    merchantName?: string;
    merchantCity?: string;
    postalCode?: string;
    nmid?: string;
    amount?: number;
  } = {};

  try {
    let idx = 0;
    while (idx < qrisStr.length - 4) {
      const tag = qrisStr.slice(idx, idx + 2);
      const len = parseInt(qrisStr.slice(idx + 2, idx + 4), 10);
      if (isNaN(len) || len <= 0) break;
      const val = qrisStr.slice(idx + 4, idx + 4 + len);

      if (tag === '59') result.merchantName = val;
      if (tag === '60') result.merchantCity = val;
      if (tag === '61') result.postalCode = val;
      if (tag === '54') result.amount = parseFloat(val);

      if (tag === '26' || tag === '51') {
        // Look for sub-tag 01 (NMID)
        let subIdx = 0;
        while (subIdx < val.length) {
          const sTag = val.slice(subIdx, subIdx + 2);
          const sLen = parseInt(val.slice(subIdx + 2, subIdx + 4), 10);
          if (isNaN(sLen) || sLen <= 0) break;
          const sVal = val.slice(subIdx + 4, subIdx + 4 + sLen);
          if (sTag === '01') result.nmid = sVal;
          subIdx += 4 + sLen;
        }
      }

      idx += 4 + len;
    }
  } catch (err) {
    console.warn('Error parsing QRIS payload:', err);
  }

  return result;
}

export interface GenerateQrisOptions {
  invoiceNumber: string;
  amount: number;
  merchantName?: string;
  merchantCity?: string;
  postalCode?: string;
  nmid?: string;
}

/**
 * Generates an ASPI / Bank Indonesia compliant dynamic QRIS string
 */
export function generateValidQrisPayload(options: GenerateQrisOptions): string {
  const {
    invoiceNumber,
    amount,
    merchantName = 'SAENA BUTIK MUSLIMAH',
    merchantCity = 'TASIKMALAYA',
    postalCode = '46196',
    nmid = 'ID10200382910'
  } = options;

  const cleanMerchant = merchantName.slice(0, 25).toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  const cleanCity = merchantCity.slice(0, 15).toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  const cleanPostal = (postalCode || '46196').slice(0, 10);
  const cleanInvoice = (invoiceNumber || 'INV01').replace(/[^A-Za-z0-9_-]/g, '').slice(-20);

  // Tag 26: National QRIS Merchant Account Information
  const tag26_00 = formatTlv('00', 'ID.CO.QRIS.WWW');
  const tag26_01 = formatTlv('01', nmid);
  const tag26_02 = formatTlv('02', 'UME');
  const tag26 = formatTlv('26', tag26_00 + tag26_01 + tag26_02);

  // Tag 51: DOKU Payment Gateway / Jokul Acquirer Info
  const tag51_00 = formatTlv('00', 'ID.DOKU.WWW');
  const tag51_01 = formatTlv('01', '000000000000001');
  const tag51 = formatTlv('51', tag51_00 + tag51_01);

  // Tag 62: Additional Data Field (Invoice / Reference ID)
  const tag62_01 = formatTlv('01', cleanInvoice);
  const tag62 = formatTlv('62', tag62_01);

  const roundedAmount = Math.max(0, Math.round(amount));

  const payloadWithoutCrc =
    formatTlv('00', '01') +
    formatTlv('01', roundedAmount > 0 ? '12' : '11') +
    tag26 +
    tag51 +
    formatTlv('52', '5651') +
    formatTlv('53', '360') +
    (roundedAmount > 0 ? formatTlv('54', roundedAmount.toString()) : '') +
    formatTlv('58', 'ID') +
    formatTlv('59', cleanMerchant) +
    formatTlv('60', cleanCity) +
    formatTlv('61', cleanPostal) +
    tag62 +
    '6304';

  const checksum = crc16Ccitt(payloadWithoutCrc);
  return `${payloadWithoutCrc}${checksum}`;
}

/**
 * Returns high-resolution QR image URL for scanning
 */
export function getQrisImageUrl(qrisPayload: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(qrisPayload)}`;
}

/**
 * Returns the best QRIS presentation for a given order:
 * 1. If merchant uploaded a custom QRIS image -> uses that image directly
 * 2. If merchant configured a custom static QRIS code -> converts to dynamic with exact order amount
 * 3. Default -> generates Bank Indonesia compliant dynamic QRIS
 */
export function getSmartQrisForOrder(options: {
  orderId: string;
  amount: number;
  config?: Partial<DokuStoreConfig>;
}): {
  qrImageUrl: string;
  qrisString: string;
  isCustomImage: boolean;
  merchantName: string;
  merchantNmid: string;
} {
  const { orderId, amount, config } = options;

  // Case 1: Merchant has uploaded their own official QRIS Image
  if (config?.customQrisImage && config.customQrisImage.trim().length > 10) {
    return {
      qrImageUrl: config.customQrisImage.trim(),
      qrisString: config.customQrisString || '',
      isCustomImage: true,
      merchantName: config.merchantName || 'SAENA BUTIK MUSLIMAH',
      merchantNmid: config.merchantNmid || 'ID10200382910'
    };
  }

  // Case 2: Merchant provided their own real static QRIS String (e.g. from BCA/GoPay/Shopee)
  if (config?.customQrisString && config.customQrisString.startsWith('000201')) {
    const dynamicPayload = convertStaticToDynamicQris(config.customQrisString, amount, orderId);
    const parsed = parseQrisPayload(config.customQrisString);
    return {
      qrImageUrl: getQrisImageUrl(dynamicPayload, 300),
      qrisString: dynamicPayload,
      isCustomImage: false,
      merchantName: parsed.merchantName || config.merchantName || 'SAENA BUTIK MUSLIMAH',
      merchantNmid: parsed.nmid || config.merchantNmid || 'ID10200382910'
    };
  }

  // Case 3: Standard Dynamic QRIS
  const qrisPayload = generateValidQrisPayload({
    invoiceNumber: orderId,
    amount,
    merchantName: config?.merchantName || 'SAENA BUTIK MUSLIMAH',
    merchantCity: config?.merchantCity || 'TASIKMALAYA',
    postalCode: '46196',
    nmid: config?.merchantNmid || 'ID10200382910'
  });

  return {
    qrImageUrl: getQrisImageUrl(qrisPayload, 300),
    qrisString: qrisPayload,
    isCustomImage: false,
    merchantName: config?.merchantName || 'SAENA BUTIK MUSLIMAH',
    merchantNmid: config?.merchantNmid || 'ID10200382910'
  };
}
