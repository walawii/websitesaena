import { testDokuApiConnectivity } from '../../server/dokuService';

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
    const result = await testDokuApiConnectivity();
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[DOKU Test Connection Exception]:', err);
    return res.status(500).json({
      success: false,
      configured: false,
      apiReachable: false,
      authenticationVerified: false,
      paymentTransactionTested: false,
      mode: process.env.DOKU_ENVIRONMENT || 'sandbox',
      message: `Terjadi kesalahan saat menguji koneksi DOKU: ${err.message}`
    });
  }
}
