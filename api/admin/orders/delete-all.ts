import { verifyAdminRequest } from '../../../server/adminAuth.ts';
import { deleteAllOrdersFromFirestoreServer } from '../../../server/orderRepository.ts';

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

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const count = await deleteAllOrdersFromFirestoreServer();
    return res.status(200).json({
      success: true,
      message: `Semua pesanan (${count}) berhasil dihapus dari database.`,
      count
    });
  } catch (err: any) {
    console.error('[Admin Delete All Orders Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Gagal menghapus pesanan.' });
  }
}
