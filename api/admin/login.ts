import { safeCompareKeys, createSignedAdminToken, registerAdminSession } from '../../server/adminAuth.ts';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { key, secret } = body || {};
    const suppliedKey = String(key || secret || '').trim();
    const adminKey = process.env.SAENA_ADMIN_KEY?.trim();

    if (!adminKey) {
      console.error('[Admin Auth] SAENA_ADMIN_KEY is not configured in server environment.');
      return res.status(500).json({
        success: false,
        error: 'SAENA_ADMIN_KEY belum dikonfigurasi di server environment.'
      });
    }

    if (!suppliedKey || !safeCompareKeys(suppliedKey, adminKey)) {
      return res.status(401).json({
        success: false,
        error: 'Kunci akses pengelola (SAENA_ADMIN_KEY) tidak valid.'
      });
    }

    const sessionToken = createSignedAdminToken(adminKey);
    const expiresIn = 12 * 3600; // 12 hours
    registerAdminSession(sessionToken, expiresIn);

    return res.status(200).json({
      success: true,
      token: sessionToken,
      expiresIn,
      message: 'Autentikasi pengelola berhasil.'
    });
  } catch (err: any) {
    console.error('[Admin Login Exception]:', err);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan sistem saat proses autentikasi pengelola.'
    });
  }
}
