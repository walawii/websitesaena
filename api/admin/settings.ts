import { verifyAdminRequest } from '../../server/adminAuth.ts';
import { saveStoreSettingsToFirestoreServer } from '../../server/orderRepository.ts';

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

  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    let settings = req.body;
    if (typeof settings === 'string') {
      try { settings = JSON.parse(settings); } catch {}
    }
    await saveStoreSettingsToFirestoreServer(settings);
    return res.status(200).json({
      success: true,
      message: 'Pengaturan toko berhasil diperbarui ke database Firestore.'
    });
  } catch (err: any) {
    console.error('[Admin Settings API Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Gagal menyimpan pengaturan toko.' });
  }
}
