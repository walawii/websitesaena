/**
 * Utility functions for text cleaning and sanitization
 */

/**
 * Cleans HTML tags from product descriptions (especially from Excel / BigSeller / Shopee / Marketplace exports)
 * Converts <br>, <p>, <div>, <li> to clean newlines and bullets, strips <html>, <head>, <body>, <span>, etc.
 * Decodes HTML entities and normalizes paragraph breaks.
 */
export function cleanHtmlDescription(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return '';

  let cleaned = raw;

  // 1. Remove entire <head>...</head>, <style>...</style>, <script>...</script> and their contents
  cleaned = cleaned.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // 2. Convert <br>, <br/>, <br /> to newline
  cleaned = cleaned.replace(/<br\s*[\/]?>/gi, '\n');

  // 3. Convert closing block tags </p>, </div>, </li>, </h[1-6]>, </tr> to newline
  cleaned = cleaned.replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n');

  // 4. Convert <li> to bullet symbol
  cleaned = cleaned.replace(/<li[^>]*>/gi, '• ');

  // 5. Strip all remaining HTML opening/closing/self-closing tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // 6. Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&bull;/gi, '•')
    .replace(/&middot;/gi, '·')
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return '';
      }
    });

  // 7. Clean up lines: trim trailing and leading spaces per line, keep meaningful line breaks
  const rawLines = cleaned.split(/\r?\n/);
  const formattedLines: string[] = [];
  let consecutiveEmpty = 0;

  for (const line of rawLines) {
    const trimmed = line.replace(/[ \t]+/g, ' ').trim();
    if (!trimmed) {
      consecutiveEmpty++;
      // Allow at most one empty line separator between paragraphs
      if (consecutiveEmpty <= 1 && formattedLines.length > 0) {
        formattedLines.push('');
      }
    } else {
      consecutiveEmpty = 0;
      formattedLines.push(trimmed);
    }
  }

  return formattedLines.join('\n').trim();
}

/**
 * Normalizes Indonesian phone numbers into the standard international format (628xxxxxxxxxx)
 * Handles numbers starting with 08, +62, 62, or 8, and strips non-numeric characters.
 */
export function normalizeIndonesianPhone(phone?: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Generates an official WhatsApp notification message from the Admin to the Customer/Visitor
 */
export function createCustomerWhatsAppMessage(order: any): string {
  if (!order) return '';

  const itemsText = Array.isArray(order.items)
    ? order.items
        .map((item: any, idx: number) => {
          const color = item.selectedColor?.name || item.color || '';
          const size = item.selectedSize || item.size || 'All Size';
          const qty = item.quantity || 1;
          const price = item.price || 0;
          return `${idx + 1}. *${item.product?.name || 'Busana Muslim'}*\n   - Varian: ${color}, ${size}\n   - Qty: ${qty} pcs (Rp ${(price * qty).toLocaleString('id-ID')})`;
        })
        .join('\n')
    : '-';

  const isCod = order.payment?.channel === 'cod';
  const paymentText = isCod
    ? '💵 COD (Bayar Tunai ke Kurir saat paket tiba)'
    : `💳 ${order.payment?.channelName || (order.payment?.channel || 'TRANSFER').toUpperCase()} (${order.status === 'dibayar' ? '✅ LUNAS' : '⏳ Menunggu Pembayaran'})`;

  const trackingText = order.trackingNumber || order.mengantar?.trackingNumber
    ? `📦 *No. Resi*: *${order.trackingNumber || order.mengantar?.trackingNumber}* (${order.mengantar?.courier || order.shipping?.courier || 'JNE'})`
    : `🚚 *Ekspedisi*: ${order.shipping?.courier || 'JNE'} (Sedang Diproses Kurir Mengantar.com)`;

  return (
`*SAENA.ID - KONFIRMASI PESANAN RESMI* 🌙
Assalamualaikum wr. wb. Kak *${order.customer?.fullName || 'Pelanggan Setia'}*,

Terima kasih telah berbelanja busana muslim di *saena.id*. Pesanan Anda telah tercatat di sistem kami:

🧾 *No. Invoice*: #${order.id}
📅 *Tanggal*: ${order.createdAt || new Date().toLocaleDateString('id-ID')}
${trackingText}
🏢 *Gudang Asal*: Central Warehouse Tamansari, Kota Tasikmalaya (46196)
💳 *Metode Pembayaran*: ${paymentText}
🚚 *Ongkos Kirim*: GRATIS ONGKIR SE-INDONESIA (Rp 0)
✨ *TOTAL AKHIR*: *Rp ${(order.total || 0).toLocaleString('id-ID')}*

📋 *Rincian Produk:*
${itemsText}

📍 *Alamat Pengiriman:*
${order.customer?.address || ''}, ${order.customer?.city || ''}, ${order.customer?.province || ''} ${order.customer?.postalCode ? `(${order.customer.postalCode})` : ''}

Layanan Customer Care siap membantu jika ada pertanyaan seputar ukuran atau jadwal pengiriman.
Terima kasih banyak atas kepercayaannya pada saena.id! 🙏
_Wassalamu'alaikum wr. wb._`
  );
}

/**
 * Generates direct wa.me link to message the customer directly
 */
export function createCustomerWhatsAppUrl(order: any): string {
  if (!order || !order.customer?.whatsapp) return '';
  const cleanPhone = normalizeIndonesianPhone(order.customer.whatsapp);
  const text = createCustomerWhatsAppMessage(order);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

