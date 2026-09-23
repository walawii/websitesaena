import { verifyAdminRequest } from '../../server/adminAuth';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (verifyAdminRequest(req)) {
    return res.status(200).json({ success: true, authenticated: true });
  }

  return res.status(401).json({
    success: false,
    authenticated: false,
    error: 'Sesi pengelola tidak valid atau telah kedaluwarsa.'
  });
}
