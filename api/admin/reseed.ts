import { verifyAdminRequest } from '../../server/adminAuth.ts';
import { reseedDatabaseInFirestoreServer } from '../../server/orderRepository.ts';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await reseedDatabaseInFirestoreServer();
    return res.status(200).json({
      success: true,
      message: 'Katalog produk, voucher, dan setting gudang Tamansari Tasikmalaya berhasil dimuat ulang ke Firestore.'
    });
  } catch (err: any) {
    console.error('[Admin Reseed Database Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Gagal memuat ulang database.' });
  }
}
