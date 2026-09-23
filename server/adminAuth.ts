import crypto from 'crypto';

interface AdminSession {
  createdAt: number;
  expiresAt: number;
}

const adminSessions = new Map<string, AdminSession>();

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function safeCompareKeys(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  try {
    const bufA = Buffer.from(a.trim());
    const bufB = Buffer.from(b.trim());
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Generate cryptographically secure stateless HMAC admin session token
 * Valid for 12 hours. Works across serverless function instances without in-memory dependency.
 */
export function createSignedAdminToken(adminKey: string): string {
  const expiresIn = 12 * 3600; // 12 hours in seconds
  const payload = Buffer.from(JSON.stringify({
    role: 'admin',
    exp: Date.now() + (expiresIn * 1000),
    nonce: crypto.randomBytes(8).toString('hex')
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', adminKey).update(payload).digest('base64url');
  return `st_${payload}.${signature}`;
}

/**
 * Verify stateless HMAC admin session token
 */
export function verifySignedAdminToken(token: string, adminKey: string): boolean {
  if (!token || !token.startsWith('st_')) return false;
  const raw = token.slice(3);
  const [payload, signature] = raw.split('.');
  if (!payload || !signature || !adminKey) return false;
  try {
    const expectedSig = crypto.createHmac('sha256', adminKey).update(payload).digest('base64url');
    const bufA = Buffer.from(signature);
    const bufB = Buffer.from(expectedSig);
    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return false;
    }
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number(data.exp) > Date.now();
  } catch {
    return false;
  }
}

/**
 * Check if incoming request has valid Admin credentials
 * Supports Bearer token, x-admin-token, or x-admin-key
 */
export function verifyAdminRequest(req: any): boolean {
  const configuredAdminKey = process.env.SAENA_ADMIN_KEY?.trim();
  if (!configuredAdminKey) {
    return false;
  }

  // 1. Check Bearer token or x-admin-token header
  const authHeader = (req.headers?.['authorization'] as string) || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers?.['x-admin-token']) {
    token = String(req.headers['x-admin-token']).trim();
  }

  if (token) {
    // A. Check signed stateless token
    if (verifySignedAdminToken(token, configuredAdminKey)) {
      return true;
    }

    // B. Check in-memory map
    if (adminSessions.has(token)) {
      const session = adminSessions.get(token)!;
      if (Date.now() < session.expiresAt) {
        return true;
      } else {
        adminSessions.delete(token);
      }
    }
  }

  // 2. Direct x-admin-key header check (must strictly match SAENA_ADMIN_KEY)
  const reqAdminKey = (req.headers?.['x-admin-key'] as string)?.trim();
  if (reqAdminKey && safeCompareKeys(reqAdminKey, configuredAdminKey)) {
    return true;
  }

  return false;
}

export function registerAdminSession(token: string, expiresInSeconds: number): void {
  adminSessions.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + (expiresInSeconds * 1000)
  });
}

export function removeAdminSession(token: string): void {
  adminSessions.delete(token);
}

/**
 * Express-compatible middleware
 */
export function requireAdminAuth(req: any, res: any, next: any) {
  if (verifyAdminRequest(req)) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: 'Akses ditolak: Autentikasi pengelola (SAENA_ADMIN_KEY) diperlukan atau sesi telah kedaluwarsa.'
  });
}
