import { testMengantarApiConnectivity } from '../../server/mengantarService.ts';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const result = await testMengantarApiConnectivity();
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Mengantar Test Connection Exception]:', err);
    return res.status(500).json({
      success: false,
      configured: false,
      apiReachable: false,
      authenticationVerified: false,
      endpointVerified: false,
      verificationStatus: 'MENGANTAR_ENDPOINT_NOT_VERIFIED',
      message: `Terjadi kesalahan saat menguji koneksi Mengantar: ${err.message}`
    });
  }
}
