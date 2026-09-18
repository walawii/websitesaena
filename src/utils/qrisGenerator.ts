/**
 * Indonesian Standard QRIS (Quick Response Code Indonesian Standard) Generator
 * Conforms to Bank Indonesia ASPI & EMVCo QR Code Specification for Payment Systems (CPM/MPM)
 * 
 * Includes proper CRC16-CCITT calculation and valid Tag structure:
 * Tag 00: Payload Format Indicator (01)
 * Tag 01: Point of Initiation Method (12 = Dynamic, 11 = Static)
 * Tag 26: Merchant Account Information - QRIS National
 * Tag 51: DOKU / Jokul Gateway Acquirer Specification
 * Tag 52: Merchant Category Code (5651 = Apparel / Busana Muslim)
 * Tag 53: Transaction Currency (360 = IDR)
 * Tag 54: Transaction Amount (Dynamic)
 * Tag 58: Country Code (ID)
 * Tag 59: Merchant Name
 * Tag 60: Merchant City
 * Tag 61: Postal Code
 * Tag 62: Additional Data Field (Invoice Reference)
 * Tag 63: CRC16-CCITT (4-character hex)
 */

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

function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
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
    nmid = '936009180020109988'
  } = options;

  // Clean merchant details to comply with EMVCo character sets
  const cleanMerchant = merchantName.slice(0, 25).toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  const cleanCity = merchantCity.slice(0, 15).toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  const cleanPostal = (postalCode || '46196').slice(0, 10);
  const cleanInvoice = invoiceNumber.replace(/[^A-Za-z0-9_-]/g, '').slice(-20);

  // Tag 26: National QRIS Merchant Account Information
  // 00: Globally Unique Identifier (ID.CO.QRIS.WWW)
  // 01: National Merchant ID (NMID)
  // 02: Merchant Criteria (UME = Usaha Mikro)
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

  // Build full payload string before CRC
  const payloadWithoutCrc =
    formatTlv('00', '01') +                          // Format Indicator
    formatTlv('01', roundedAmount > 0 ? '12' : '11') + // Point of Initiation: 12 = Dynamic (with nominal), 11 = Static
    tag26 +
    tag51 +
    formatTlv('52', '5651') +                        // MCC 5651 (Apparel/Clothing)
    formatTlv('53', '360') +                         // Currency 360 (IDR)
    (roundedAmount > 0 ? formatTlv('54', roundedAmount.toString()) : '') + // Nominal Amount
    formatTlv('58', 'ID') +                          // Country Code
    formatTlv('59', cleanMerchant) +                 // Merchant Name
    formatTlv('60', cleanCity) +                     // Merchant City
    formatTlv('61', cleanPostal) +                   // Postal Code
    tag62 +
    '6304';                                          // Tag 63: Checksum header

  const checksum = crc16Ccitt(payloadWithoutCrc);
  return `${payloadWithoutCrc}${checksum}`;
}

/**
 * Returns high-resolution QR image URL for scanning
 */
export function getQrisImageUrl(qrisPayload: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(qrisPayload)}`;
}
