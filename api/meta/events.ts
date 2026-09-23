import { sendMetaCapiEvent } from '../../server/metaCapiService.ts';

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

    const { eventName, eventId, eventSourceUrl, userData, customData } = body || {};

    if (!eventName || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Parameter eventName dan eventId wajib diisi.'
      });
    }

    const clientIp = typeof req.headers?.['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : req.socket?.remoteAddress || '';
    const clientUserAgent = (req.headers?.['user-agent'] as string) || '';

    const effectiveUserData = {
      ...userData,
      clientIp: userData?.clientIp || clientIp,
      clientUserAgent: userData?.clientUserAgent || clientUserAgent
    };

    const result = await sendMetaCapiEvent({
      eventName,
      eventId,
      eventSourceUrl: eventSourceUrl || 'https://saena.my.id',
      actionSource: 'website',
      userData: effectiveUserData,
      customData
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    console.error('[Meta CAPI Route Exception]:', err);
    return res.status(500).json({
      success: false,
      error: 'Gagal mengirim event Meta Conversions API.'
    });
  }
}
