import { verifyAdminRequest } from '../../../../server/adminAuth.ts';
import { updateOrderStatusInFirestoreServer } from '../../../../server/orderRepository.ts';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (!verifyAdminRequest(req)) {
    return res.status(401).json({
      success: false,
      error: 'Akses ditolak: Autentikasi pengelola (SAENA_ADMIN_KEY) diperlukan.'
    });
  }

  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const orderNumber = String(req.query?.orderNumber || '').trim();
    if (!orderNumber) {
      return res.status(400).json({ success: false, error: 'Nomor pesanan wajib disertakan.' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const { status, trackingHistory, trackingNumber } = body || {};
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status pesanan wajib disertakan.' });
    }

    const updated = await updateOrderStatusInFirestoreServer(orderNumber, status, trackingHistory, trackingNumber);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan.' });
    }

    return res.status(200).json({
      success: true,
      message: `Status pesanan ${orderNumber} berhasil diperbarui menjadi ${status}.`,
      order: updated
    });
  } catch (err: any) {
    console.error('[Admin Order Status API Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Gagal memperbarui status pesanan.' });
  }
}
