import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Order, AvailableCoupon, ProductReview, StoreWarehouseInfo } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, AVAILABLE_COUPONS, SHIPPING_ORIGIN, DEFAULT_WHATSAPP_NUMBER } from '../data/mockData';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Helper to remove undefined fields which Firestore rejects
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, value) => {
    return value === undefined ? null : value;
  }));
}

// Error Handling according to Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on initial boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline. Checking Firebase configuration.");
      return false;
    }
    return true;
  }
}

// Safe connection test and catalog availability check
export async function initializeDatabaseIfNeeded(): Promise<void> {
  try {
    const isOnline = await testConnection();
    if (!isOnline) {
      console.warn('[Firestore] Client is offline or database is unreachable.');
    }
  } catch (error) {
    console.warn('Initial Firestore connection check notice:', error);
  }
}

// Reseed database via server API for administrator
export async function forceReseedAllDatabase(adminToken?: string): Promise<void> {
  const token = adminToken || localStorage.getItem('saena_admin_token_v1') || '';
  const res = await fetch('/api/admin/reseed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-admin-token': token
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memuat ulang database melalui server.');
  }
}

// Database sync helper functions via Server-Authoritative Admin API
export async function syncOrderToFirestore(order: Order): Promise<void> {
  // Order persistence is handled authoritatively by POST /api/orders/create.
  // Direct client writes to orders collection are restricted for data security.
  console.log('[OrderSync] Order handled authoritatively by server backend:', order.id);
}

export async function syncProductToFirestore(product: Product, adminToken?: string): Promise<void> {
  const token = adminToken || localStorage.getItem('saena_admin_token_v1') || '';
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-admin-token': token
    },
    body: JSON.stringify(product)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal menyimpan produk ke database.');
  }
}

export async function updateProductStockInFirestore(productId: string, newStock: Record<string, number>, totalStock: number, adminToken?: string): Promise<void> {
  const token = adminToken || localStorage.getItem('saena_admin_token_v1') || '';
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-admin-token': token
    },
    body: JSON.stringify({
      id: productId,
      stock: newStock,
      totalStock
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memperbarui stok produk.');
  }
}

export async function syncOrderStatusInFirestore(
  orderId: string, 
  status: Order['status'], 
  trackingHistory: Order['trackingHistory'],
  trackingNumber?: string,
  adminToken?: string
): Promise<void> {
  const token = adminToken || localStorage.getItem('saena_admin_token_v1') || '';
  const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-admin-token': token
    },
    body: JSON.stringify({
      status,
      trackingHistory,
      trackingNumber
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memperbarui status pesanan.');
  }
}

export async function deleteProductFromFirestore(productId: string, adminToken?: string): Promise<void> {
  const token = adminToken || localStorage.getItem('saena_admin_token_v1') || '';
  const res = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-admin-token': token
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal menghapus produk.');
  }
}

export async function deleteAllProductsFromFirestore(adminToken?: string): Promise<number> {
  const token = adminToken || localStorage.getItem('saena_admin_token_v1') || '';
  const res = await fetch('/api/admin/products?all=true', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-admin-token': token
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mengosongkan katalog produk.');
  }
  const data = await res.json().catch(() => ({ count: 0 }));
  return data.count || 0;
}

export async function deleteAllOrdersFromFirestore(adminToken?: string): Promise<number> {
  const token = adminToken || localStorage.getItem('saena_admin_token_v1') || '';
  const res = await fetch('/api/admin/orders/delete-all', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-admin-token': token
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal menghapus semua pesanan.');
  }
  const data = await res.json().catch(() => ({ count: 0 }));
  return data.count || 0;
}

