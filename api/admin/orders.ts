import { verifyAdminRequest } from '../../server/adminAuth';
import { getAllOrdersList } from '../../server/orderRepository';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  if (!verifyAdminRequest(req)) {
    return res.status(401).json({
      success: false,
      error: 'Akses ditolak: Autentikasi pengelola (SAENA_ADMIN_KEY) diperlukan atau sesi telah kedaluwarsa.'
    });
  }

  try {
    const limitCount = Math.min(100, Number(req.query?.limit) || 50);
    const list = await getAllOrdersList(limitCount);
    return res.status(200).json({
      success: true,
      total: list.length,
      orders: list
    });
  } catch (err: any) {
    console.error('[Admin Orders Exception]:', err);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat memuat daftar pesanan.'
    });
  }
}
