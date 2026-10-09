import { verifyAdminRequest } from '../../server/adminAuth.ts';
import { saveLandingPageToFirestoreServer, deleteLandingPageFromFirestoreServer } from '../../server/orderRepository.ts';

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

  if (req.method === 'DELETE') {
    try {
      const productId = String(req.query?.productId || req.query?.id || req.body?.productId || '').trim();
      if (!productId) {
        return res.status(400).json({ success: false, error: 'Product ID wajib disertakan.' });
      }
      await deleteLandingPageFromFirestoreServer(productId);
      return res.status(200).json({
        success: true,
        message: 'Konfigurasi landing page berhasil dihapus dari database.'
      });
    } catch (err: any) {
      console.error('[Admin Landing Pages Delete Error]:', err);
      return res.status(500).json({ success: false, error: err.message || 'Gagal menghapus landing page.' });
    }
  }

  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    let configPayload = req.body;
    if (typeof configPayload === 'string') {
      try { configPayload = JSON.parse(configPayload); } catch {}
    }
    await saveLandingPageToFirestoreServer(configPayload);
    return res.status(200).json({
      success: true,
      message: 'Konfigurasi landing page berhasil disimpan ke database Firestore.'
    });
  } catch (err: any) {
    console.error('[Admin Landing Pages API Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Gagal menyimpan landing page.' });
  }
}
