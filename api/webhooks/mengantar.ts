import { verifyMengantarWebhookSignature, processMengantarWebhook } from '../../server/mengantarWebhook';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body || {});

    const timestamp = String(req.headers['x-timestamp'] || '');
    const signature = String(req.headers['x-signature'] || '');
    const secret = process.env.MENGANTAR_WEBHOOK_SECRET || '';

    const verification = verifyMengantarWebhookSignature(
      timestamp,
      rawBody,
      signature,
      secret
    );

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: verification.reason || 'Invalid webhook signature'
      });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload'
      });
    }

    const result = await processMengantarWebhook(payload, timestamp);
    return res.status(result.statusCode).json(result.response);
  } catch (error: any) {
    console.error('[Mengantar Webhook] Handler error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Webhook processing failed'
    });
  }
}
