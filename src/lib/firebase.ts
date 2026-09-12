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
  collection
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Order, AvailableCoupon, ProductReview, StoreWarehouseInfo } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, AVAILABLE_COUPONS, SHIPPING_ORIGIN } from '../data/mockData';

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

// Auto seed initial data if collections are empty
export async function initializeDatabaseIfNeeded(): Promise<void> {
  try {
    // 1. Seed Store Origin Settings (Tamansari Tasikmalaya)
    const settingsRef = doc(db, 'store_settings', 'central_warehouse');
    const settingsSnap = await getDoc(settingsRef).catch(() => null);
    if (!settingsSnap || !settingsSnap.exists()) {
      await setDoc(settingsRef, sanitizeForFirestore({
        id: 'central_warehouse',
        storeName: 'saena.id - Busana Muslimah Eksklusif',
        originSubdistrict: SHIPPING_ORIGIN.subdistrict,
        originCity: SHIPPING_ORIGIN.city,
        originProvince: SHIPPING_ORIGIN.province,
        originPostalCode: SHIPPING_ORIGIN.postalCode,
        warehouseName: SHIPPING_ORIGIN.warehouseName,
        address: SHIPPING_ORIGIN.address,
        contactWhatsApp: '081234567890',
        createdAt: new Date().toISOString()
      }));
    }

    // 2. Check and seed products
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection).catch(err => {
      handleFirestoreError(err, OperationType.LIST, 'products');
    });

    if (productSnapshot && productSnapshot.empty) {
      console.log('Seeding initial products to Firestore...');
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), sanitizeForFirestore({
          ...prod,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `products/${prod.id}`);
        });
      }
    }

    // 3. Check and seed initial orders
    const ordersCollection = collection(db, 'orders');
    const orderSnapshot = await getDocs(ordersCollection).catch(err => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    });

    if (orderSnapshot && orderSnapshot.empty) {
      console.log('Seeding initial orders to Firestore...');
      for (const ord of INITIAL_ORDERS) {
        await setDoc(doc(db, 'orders', ord.id), sanitizeForFirestore({
          ...ord,
          createdAt: ord.createdAt || new Date().toISOString(),
          updatedAt: ord.updatedAt || new Date().toISOString()
        })).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `orders/${ord.id}`);
        });
      }
    }

    // 4. Check and seed coupons
    const couponsCollection = collection(db, 'coupons');
    const couponSnapshot = await getDocs(couponsCollection).catch(err => {
      handleFirestoreError(err, OperationType.LIST, 'coupons');
    });

    if (couponSnapshot && couponSnapshot.empty) {
      console.log('Seeding initial coupons to Firestore...');
      for (const [code, coup] of Object.entries(AVAILABLE_COUPONS)) {
        await setDoc(doc(db, 'coupons', code), sanitizeForFirestore({
          id: code,
          code: code,
          discountPercent: coup.discountPercent,
          maxDiscount: coup.maxDiscount,
          minSpend: 0,
          description: coup.description,
          isActive: true,
          createdAt: new Date().toISOString()
        })).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `coupons/${code}`);
        });
      }
    }
  } catch (error) {
    console.warn('Initial Firestore seeding check encountered an issue:', error);
  }
}

// Force full reseed for administrator
export async function forceReseedAllDatabase(): Promise<void> {
  for (const prod of INITIAL_PRODUCTS) {
    await setDoc(doc(db, 'products', prod.id), sanitizeForFirestore({
      ...prod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  for (const ord of INITIAL_ORDERS) {
    await setDoc(doc(db, 'orders', ord.id), sanitizeForFirestore({
      ...ord,
      createdAt: ord.createdAt || new Date().toISOString(),
      updatedAt: ord.updatedAt || new Date().toISOString()
    }));
  }

  for (const [code, coup] of Object.entries(AVAILABLE_COUPONS)) {
    await setDoc(doc(db, 'coupons', code), sanitizeForFirestore({
      id: code,
      code: code,
      discountPercent: coup.discountPercent,
      maxDiscount: coup.maxDiscount,
      minSpend: 0,
      description: coup.description,
      isActive: true,
      createdAt: new Date().toISOString()
    }));
  }

  await setDoc(doc(db, 'store_settings', 'central_warehouse'), sanitizeForFirestore({
    id: 'central_warehouse',
    storeName: 'saena.id - Busana Muslimah Eksklusif',
    originSubdistrict: SHIPPING_ORIGIN.subdistrict,
    originCity: SHIPPING_ORIGIN.city,
    originProvince: SHIPPING_ORIGIN.province,
    originPostalCode: SHIPPING_ORIGIN.postalCode,
    warehouseName: SHIPPING_ORIGIN.warehouseName,
    address: SHIPPING_ORIGIN.address,
    contactWhatsApp: '081234567890',
    createdAt: new Date().toISOString()
  }));
}

// Database sync helper functions
export async function syncOrderToFirestore(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), sanitizeForFirestore({
      ...order,
      updatedAt: new Date().toISOString()
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function syncProductToFirestore(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), sanitizeForFirestore({
      ...product,
      updatedAt: new Date().toISOString()
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateProductStockInFirestore(productId: string, newStock: Record<string, number>, totalStock: number): Promise<void> {
  const path = `products/${productId}`;
  try {
    await updateDoc(doc(db, 'products', productId), sanitizeForFirestore({
      stock: newStock,
      totalStock,
      updatedAt: new Date().toISOString()
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function syncOrderStatusInFirestore(
  orderId: string, 
  status: Order['status'], 
  trackingHistory: Order['trackingHistory'],
  trackingNumber?: string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const updatePayload: Record<string, any> = {
      status,
      trackingHistory,
      updatedAt: new Date().toISOString()
    };
    if (trackingNumber) {
      updatePayload.trackingNumber = trackingNumber;
    }
    await updateDoc(doc(db, 'orders', orderId), sanitizeForFirestore(updatePayload));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
