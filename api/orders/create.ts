import { processOrderCreation } from '../../server/orderCreationService';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: any, res: any) {
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

    const clientIp = typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : req.socket?.remoteAddress || '';

    const result = await processOrderCreation(body, req.headers, clientIp);
    return res.status(result.statusCode).json(result.body);
  } catch (error: any) {
    console.error('[API Order Create Exception]', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Terjadi kesalahan sistem saat membuat pesanan.'
    });
  }
}
