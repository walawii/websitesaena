import { calculateMengantarRates } from '../../server/mengantarService.ts';

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

    const { originCity = 'Kota Tasikmalaya', destinationCity, weight = 600 } = body || {};
    const ratesResult = await calculateMengantarRates(originCity, destinationCity, Number(weight) || 600);
    return res.status(200).json(ratesResult);
  } catch (err: any) {
    console.error('[Shipping Rates Exception]:', err);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat menghitung tarif ongkir.'
    });
  }
}
