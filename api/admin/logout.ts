import { removeAdminSession } from '../../server/adminAuth';

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

  const authHeader = (req.headers?.['authorization'] as string) || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers?.['x-admin-token']) {
    token = String(req.headers['x-admin-token']).trim();
  }

  if (token) {
    removeAdminSession(token);
  }

  return res.status(200).json({
    success: true,
    message: 'Sesi pengelola berhasil diakhiri.'
  });
}
