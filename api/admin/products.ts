import { verifyAdminRequest } from '../../server/adminAuth.ts';
import {
  saveProductToFirestoreServer,
  deleteProductFromFirestoreServer,
  deleteAllProductsFromFirestoreServer
} from '../../server/orderRepository.ts';

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

  try {
    if (req.method === 'POST' || req.method === 'PUT') {
      let product = req.body;
      if (typeof product === 'string') {
        try { product = JSON.parse(product); } catch {}
      }
      if (!product || !product.id) {
        return res.status(400).json({ success: false, error: 'Product ID dan data wajib disertakan.' });
      }
      await saveProductToFirestoreServer(product);
      return res.status(200).json({ success: true, message: 'Produk berhasil disimpan ke database.', product });
    }

    if (req.method === 'DELETE') {
      const { id, all } = req.query || {};
      if (all === 'true') {
        const count = await deleteAllProductsFromFirestoreServer();
        return res.status(200).json({ success: true, message: `Semua produk (${count}) berhasil dihapus.`, count });
      }
      if (!id) {
        return res.status(400).json({ success: false, error: 'Product ID wajib disertakan untuk penghapusan.' });
      }
      await deleteProductFromFirestoreServer(String(id));
      return res.status(200).json({ success: true, message: `Produk ${id} berhasil dihapus.` });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err: any) {
    console.error('[Admin Products API Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Gagal memproses data produk.' });
  }
}
