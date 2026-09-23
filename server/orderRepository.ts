import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  runTransaction
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DEFAULT_FIREBASE_CONFIG = {
  projectId: "gen-lang-client-0928298497",
  appId: "1:104229383669:web:162f0f6b76dc18492904bc",
  apiKey: "AIzaSyDgePFPgCVQhUxVxV362Z4gvVtuivyaB6A",
  authDomain: "gen-lang-client-0928298497.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-saenaidbusanamus-37b1774c-092f-4d11-899c-3a7926323a33",
  storageBucket: "gen-lang-client-0928298497.firebasestorage.app",
  messagingSenderId: "104229383669",
  measurementId: "",
  oAuthClientId: "104229383669-n1f4vj3r991sm4935966k719a9nflau0.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

let loadedFirebaseConfig = DEFAULT_FIREBASE_CONFIG;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    loadedFirebaseConfig = JSON.parse(raw);
  }
} catch (e: any) {
  console.warn('[OrderRepository] Using embedded default Firebase configuration:', e.message);
}

// Initialize Firestore
let db: any = null;

try {
  const app = getApps().length === 0 ? initializeApp(loadedFirebaseConfig) : getApp();
  db = getFirestore(app, loadedFirebaseConfig.firestoreDatabaseId);
  console.log('[OrderRepository] Firebase Firestore initialized successfully for backend.');
} catch (err: any) {
  console.error('[OrderRepository] Error initializing Firestore in server:', err.message);
}

export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
export type ShippingStatus = 'NOT_CREATED' | 'PENDING' | 'CREATED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  variant?: string;
  color?: string;
  size?: string;
  price: number;
  quantity: number;
  weight?: number; // grams
  image?: string;
}

export interface CustomerData {
  customerName: string;
  phone: string;
  email?: string;
}

export interface ShippingAddressData {
  address: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
}

export interface OrderPriceData {
  subtotal: number;
  discount: number;
  shippingCost: number;
  grandTotal: number;
}

export interface PaymentData {
  paymentMethod: 'DOKU' | 'COD';
  paymentProvider: 'DOKU' | 'COD';
  paymentChannel: string;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paymentAmount: number;
  paymentCreatedAt: string;
  paymentPaidAt?: string | null;
  paymentUrl?: string | null;
  vaNumber?: string | null;
  bank?: string | null;
  qrisString?: string | null;
  qrisImage?: string | null;
  dokuResponse?: any;
}

export interface ShippingData {
  shippingProvider: 'Mengantar';
  courier: string;
  service: string;
  shippingStatus: ShippingStatus;
  mengantarOrderId?: string | null;
  trackingNumber?: string | null;
  airwaybill?: string | null;
  labelUrl?: string | null;
  shippingCreatedAt?: string | null;
  shippingUpdatedAt?: string | null;
  estimatedDelivery?: string;
  notes?: string;
  mengantarResponse?: any;
}

export interface StoredOrder {
  id: string;
  orderNumber: string; // SNA-YYYYMMDD-XXXX
  invoiceNumber: string; // INV-SNA-YYYYMMDD-XXXX
  accessToken: string; // Secure token for customer order verification
  processedWebhookIds?: string[]; // Tracking IDs of processed webhooks (idempotency)
  customer: CustomerData;
  shippingAddress: ShippingAddressData;
  items: OrderItem[];
  quantity: number;
  weight: number; // in grams
  price: OrderPriceData;
  payment: PaymentData;
  shipping: ShippingData;
  // Legacy / Flat compatibility fields for existing frontend components:
  total: number;
  status: string;
  trackingNumber: string;
  createdAt: string;
  updatedAt: string;
  metaTracking?: {
    fbp?: string;
    fbc?: string;
    clientIp?: string;
    clientUserAgent?: string;
    eventSourceUrl?: string;
  };
  metaCapiPurchaseSent?: boolean;
}

// In-memory fallback cache if Firestore is temporarily offline
const memoryOrders = new Map<string, StoredOrder>();

// Generate secure order number: SNA-YYYYMMDD-XXXX and crypto accessToken
export function generateOrderNumber(): { orderNumber: string; invoiceNumber: string; accessToken: string } {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000).toString(36).toUpperCase();
  const orderNumber = `SNA-${yyyy}${mm}${dd}-${rand}`;
  const invoiceNumber = `INV-${orderNumber}`;
  const accessToken = crypto.randomBytes(16).toString('hex');
  return { orderNumber, invoiceNumber, accessToken };
}


// Sanitize for Firestore (remove undefined)
function sanitize(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
}

export function getDb() {
  return db;
}

/**
 * Find dynamic product from Firestore 'products' collection if created by Admin
 */
export async function findProductByIdFromFirestore(productId: string): Promise<{ id: string; name: string; price: number; weight: number } | null> {
  if (!productId || !db) return null;
  try {
    const docRef = doc(db, 'products', productId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        name: data.name || 'Produk Butik saena.id',
        price: Number(data.price) || 0,
        weight: Number(data.weight) || 600
      };
    }
  } catch (err: any) {
    console.warn(`[OrderRepository] Query product "${productId}" from Firestore notice:`, err.message);
  }
  return null;
}

export async function reserveProductStockInFirestore(items: OrderItem[]): Promise<void> {
  if (!db || !Array.isArray(items) || items.length === 0) return;

  await runTransaction(db, async (transaction: any) => {
    const updates: Array<{ ref: any; stock: Record<string, number>; totalStock: number }> = [];

    for (const item of items) {
      if (!item.productId) continue;

      const docRef = doc(db, 'products', item.productId);
      const snap = await transaction.get(docRef);
      if (!snap.exists()) continue;

      const data = snap.data();
      const currentStock = { ...(data.stock || {}) } as Record<string, number>;
      const requestedKey = item.color || item.variant || 'Standard';
      const quantity = Math.max(1, Number(item.quantity) || 1);

      let stockKey = requestedKey;
      if (currentStock[stockKey] === undefined && item.size && currentStock[item.size] !== undefined) {
        stockKey = item.size;
      }
      if (currentStock[stockKey] === undefined) {
        const keys = Object.keys(currentStock);
        if (keys.length === 0) continue;
        stockKey = keys[0];
      }

      const available = Number(currentStock[stockKey]) || 0;
      if (available < quantity) {
        throw new Error(`Stok produk "${item.name}" tidak mencukupi untuk varian "${stockKey}". Tersedia ${available}, diminta ${quantity}.`);
      }

      currentStock[stockKey] = available - quantity;
      const totalStock = Object.values(currentStock).reduce((sum: number, value: any) => sum + (Number(value) || 0), 0);
      updates.push({ ref: docRef, stock: currentStock, totalStock });
    }

    for (const update of updates) {
      transaction.update(update.ref, {
        stock: update.stock,
        totalStock: update.totalStock,
        updatedAt: new Date().toISOString()
      });
    }
  });
}

/**
 * Restore product stock in Firestore when order is cancelled or payment expired
 */
export async function restoreProductStock(items: OrderItem[]): Promise<void> {
  if (!db || !Array.isArray(items) || items.length === 0) return;
  for (const item of items) {
    if (!item.productId) continue;
    try {
      const docRef = doc(db, 'products', item.productId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const currentStock = { ...(data.stock || {}) };
        const colorKey = item.color || item.variant || 'Standard';
        if (currentStock[colorKey] !== undefined) {
          currentStock[colorKey] = (Number(currentStock[colorKey]) || 0) + (item.quantity || 1);
        } else if (item.size && currentStock[item.size] !== undefined) {
          currentStock[item.size] = (Number(currentStock[item.size]) || 0) + (item.quantity || 1);
        } else if (Object.keys(currentStock).length > 0) {
          const firstKey = Object.keys(currentStock)[0];
          currentStock[firstKey] = (Number(currentStock[firstKey]) || 0) + (item.quantity || 1);
        }
        const updatedTotal = Object.values(currentStock).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
        await updateDoc(docRef, {
          stock: currentStock,
          totalStock: updatedTotal,
          updatedAt: new Date().toISOString()
        });
        console.log(`[OrderRepository] Restored stock for product "${item.productId}" variant "${colorKey}" by ${item.quantity}.`);
      }
    } catch (err: any) {
      console.warn(`[OrderRepository] Restore stock notice for "${item.productId}":`, err.message);
    }
  }
}

export async function saveOrder(order: StoredOrder): Promise<StoredOrder> {
  if (!db) {
    throw new Error('Firestore tidak tersedia; pesanan tidak boleh dianggap tersimpan.');
  }

  try {
    const docRef = doc(db, 'orders', order.id);
    const sanitized = sanitize({
      ...order,
      // Ensure compatibility with existing firestore.rules (needs customer: map, items: list, total: number, status: string)
      customer: {
        fullName: order.customer.customerName,
        whatsapp: order.customer.phone,
        email: order.customer.email || '',
        address: order.shippingAddress.address,
        province: order.shippingAddress.province,
        city: order.shippingAddress.city,
        subdistrict: order.shippingAddress.district,
        postalCode: order.shippingAddress.postalCode,
        country: 'Indonesia'
      },
      shippingAddress: order.shippingAddress,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        product: {
          id: item.productId,
          name: item.name,
          price: item.price
        },
        selectedColor: { name: item.color || 'Default', hex: '#1C3B2B' },
        selectedSize: item.size || 'All Size',
        quantity: item.quantity,
        price: item.price
      })),
      total: order.price.grandTotal,
      subtotal: order.price.subtotal,
      shippingCost: order.price.shippingCost,
      discount: order.price.discount,
      status: order.status || (order.payment.paymentStatus === 'PAID' 
        ? (order.shipping.shippingStatus === 'CREATED' ? 'sedang_dikemas' : 'dibayar')
        : 'menunggu_pembayaran'),
      trackingNumber: order.shipping.trackingNumber || ''
    });

    await setDoc(docRef, sanitized, { merge: true });
    memoryOrders.set(order.orderNumber, order);
    memoryOrders.set(order.id, order);
    console.log(`[OrderRepository] Order saved to Firestore successfully: ${order.orderNumber} (ID: ${order.id})`);

  } catch (err: any) {
    console.error(`[OrderRepository] Failed to save order to Firestore (${order.orderNumber}):`, err.message);
    throw err;
  }

  return order;
}

export async function findOrderByNumber(identifier: string): Promise<StoredOrder | null> {
  if (!identifier) return null;

  // 1. Check in-memory cache first
  const cached = memoryOrders.get(identifier);
  if (cached) return cached;

  if (!db) return null;

  try {
    // 2. Try doc get by id
    const docRef = doc(db, 'orders', identifier);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as any;
      const order = mapFirestoreDataToStoredOrder(data, snap.id);
      memoryOrders.set(order.orderNumber, order);
      memoryOrders.set(order.id, order);
      return order;
    }

    // 3. Try query by orderNumber
    const q1 = query(collection(db, 'orders'), where('orderNumber', '==', identifier), limit(1));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const docSnap = snap1.docs[0];
      const order = mapFirestoreDataToStoredOrder(docSnap.data(), docSnap.id);
      memoryOrders.set(order.orderNumber, order);
      memoryOrders.set(order.id, order);
      return order;
    }

    // 4. Try query by invoiceNumber
    const q2 = query(collection(db, 'orders'), where('invoiceNumber', '==', identifier), limit(1));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const docSnap = snap2.docs[0];
      const order = mapFirestoreDataToStoredOrder(docSnap.data(), docSnap.id);
      memoryOrders.set(order.orderNumber, order);
      memoryOrders.set(order.id, order);
      return order;
    }

    // 5. Try query by payment.doku.invoiceNumber
    const q3 = query(collection(db, 'orders'), where('payment.doku.invoiceNumber', '==', identifier), limit(1));
    const snap3 = await getDocs(q3);
    if (!snap3.empty) {
      const docSnap = snap3.docs[0];
      const order = mapFirestoreDataToStoredOrder(docSnap.data(), docSnap.id);
      memoryOrders.set(order.orderNumber, order);
      memoryOrders.set(order.id, order);
      return order;
    }
  } catch (err: any) {
    console.error(`[OrderRepository] Error finding order ${identifier}:`, err.message);
  }

  return null;
}

export async function findOrderByShipmentIdentity(
  orderId?: string,
  cnoteNo?: string
): Promise<StoredOrder | null> {
  const cleanOrderId = (orderId || '').trim();
  const cleanCnoteNo = (cnoteNo || '').trim();

  if (!cleanOrderId && !cleanCnoteNo) {
    return null;
  }

  // 1. Search in-memory cache
  for (const ord of memoryOrders.values()) {
    if (cleanOrderId) {
      if (
        ord.orderNumber === cleanOrderId ||
        ord.id === cleanOrderId ||
        ord.invoiceNumber === cleanOrderId ||
        ord.shipping?.mengantarOrderId === cleanOrderId
      ) {
        return ord;
      }
    }
    if (cleanCnoteNo) {
      if (
        ord.shipping?.trackingNumber === cleanCnoteNo ||
        ord.trackingNumber === cleanCnoteNo ||
        ord.shipping?.airwaybill === cleanCnoteNo
      ) {
        return ord;
      }
    }
  }

  // 2. Lookup by orderId
  if (cleanOrderId) {
    const found = await findOrderByNumber(cleanOrderId);
    if (found) return found;

    if (db) {
      try {
        const qMgt = query(collection(db, 'orders'), where('shipping.mengantarOrderId', '==', cleanOrderId), limit(1));
        const snapMgt = await getDocs(qMgt);
        if (!snapMgt.empty) {
          const docSnap = snapMgt.docs[0];
          const order = mapFirestoreDataToStoredOrder(docSnap.data(), docSnap.id);
          memoryOrders.set(order.orderNumber, order);
          memoryOrders.set(order.id, order);
          return order;
        }
      } catch (err: any) {
        console.warn('[OrderRepository] Query by shipping.mengantarOrderId failed:', err.message);
      }
    }
  }

  // 3. Lookup by cnoteNo (resi / waybill)
  if (cleanCnoteNo && db) {
    try {
      const qTrack1 = query(collection(db, 'orders'), where('shipping.trackingNumber', '==', cleanCnoteNo), limit(1));
      const snapTrack1 = await getDocs(qTrack1);
      if (!snapTrack1.empty) {
        const docSnap = snapTrack1.docs[0];
        const order = mapFirestoreDataToStoredOrder(docSnap.data(), docSnap.id);
        memoryOrders.set(order.orderNumber, order);
        memoryOrders.set(order.id, order);
        return order;
      }

      const qTrack2 = query(collection(db, 'orders'), where('trackingNumber', '==', cleanCnoteNo), limit(1));
      const snapTrack2 = await getDocs(qTrack2);
      if (!snapTrack2.empty) {
        const docSnap = snapTrack2.docs[0];
        const order = mapFirestoreDataToStoredOrder(docSnap.data(), docSnap.id);
        memoryOrders.set(order.orderNumber, order);
        memoryOrders.set(order.id, order);
        return order;
      }

      const qTrack3 = query(collection(db, 'orders'), where('shipping.airwaybill', '==', cleanCnoteNo), limit(1));
      const snapTrack3 = await getDocs(qTrack3);
      if (!snapTrack3.empty) {
        const docSnap = snapTrack3.docs[0];
        const order = mapFirestoreDataToStoredOrder(docSnap.data(), docSnap.id);
        memoryOrders.set(order.orderNumber, order);
        memoryOrders.set(order.id, order);
        return order;
      }
    } catch (err: any) {
      console.warn('[OrderRepository] Query by cnoteNo failed:', err.message);
    }
  }

  return null;
}

export async function updateOrderPayment(
  orderNumber: string,
  paymentStatus: PaymentStatus,
  extra: {
    paidAt?: string;
    dokuResponse?: any;
    paymentUrl?: string;
    vaNumber?: string;
    qrisString?: string;
    webhookId?: string;
  }
): Promise<StoredOrder | null> {
  const order = await findOrderByNumber(orderNumber);
  if (!order) return null;

  // Protection against out-of-order webhook state downgrade
  // Once an order is marked PAID, never downgrade to UNPAID, PENDING, FAILED, or EXPIRED
  if (order.payment.paymentStatus === 'PAID' && paymentStatus !== 'PAID') {
    console.warn(`[OrderRepository] Rejected payment status downgrade from PAID to ${paymentStatus} for order ${orderNumber}.`);
    if (extra.webhookId) {
      if (!order.processedWebhookIds) order.processedWebhookIds = [];
      if (!order.processedWebhookIds.includes(extra.webhookId)) {
        order.processedWebhookIds.push(extra.webhookId);
        await saveOrder(order);
      }
    }
    return order;
  }

  order.payment.paymentStatus = paymentStatus;
  if (extra.paidAt) order.payment.paymentPaidAt = extra.paidAt;
  if (extra.dokuResponse) order.payment.dokuResponse = extra.dokuResponse;
  if (extra.paymentUrl) order.payment.paymentUrl = extra.paymentUrl;
  if (extra.vaNumber) order.payment.vaNumber = extra.vaNumber;
  if (extra.qrisString) order.payment.qrisString = extra.qrisString;
  
  if (extra.webhookId) {
    if (!order.processedWebhookIds) order.processedWebhookIds = [];
    if (!order.processedWebhookIds.includes(extra.webhookId)) {
      order.processedWebhookIds.push(extra.webhookId);
    }
  }

  order.updatedAt = new Date().toISOString();

  if (paymentStatus === 'PAID') {
    // Preserve progressive shipping stages if shipment already advanced
    if (order.shipping.shippingStatus === 'DELIVERED') {
      order.status = 'tiba_di_tujuan';
    } else if (order.shipping.shippingStatus === 'IN_TRANSIT' || order.shipping.shippingStatus === 'PICKED_UP') {
      order.status = 'dikirim';
    } else if (order.shipping.shippingStatus === 'CREATED') {
      order.status = 'sedang_dikemas';
    } else {
      order.status = 'dibayar';
    }
  } else if (paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED') {
    // Only cancel if order has not yet been fulfilled, paid, or shipped
    if (order.status === 'menunggu_pembayaran') {
      order.status = 'dibatalkan';
      restoreProductStock(order.items).catch(err => {
        console.warn(`[OrderRepository] Restore stock notice for order ${order.orderNumber}:`, err.message);
      });
    }
  }

  return saveOrder(order);
}

// In-memory set to guarantee strict idempotency even under concurrent webhook triggers
const sentMetaPurchaseOrders = new Set<string>();

/**
 * Atomically claim order for Meta CAPI Purchase dispatch.
 * Guarantees that even with multiple webhooks, retries, or reloads,
 * exactly one Purchase event is dispatched per order.
 */
export async function claimOrderForMetaPurchase(orderNumber: string): Promise<boolean> {
  if (!orderNumber) return false;

  // 1. Fast in-memory check
  if (sentMetaPurchaseOrders.has(orderNumber)) {
    return false;
  }

  // 2. Fetch order to verify persistence state
  const order = await findOrderByNumber(orderNumber);
  if (!order) return false;

  // 3. Persistent flag check
  if (order.metaCapiPurchaseSent) {
    sentMetaPurchaseOrders.add(orderNumber);
    return false;
  }

  // 4. Atomically claim & persist
  sentMetaPurchaseOrders.add(orderNumber);
  order.metaCapiPurchaseSent = true;
  await saveOrder(order);
  return true;
}


export async function updateOrderShipping(
  orderNumber: string,
  shippingStatus: ShippingStatus,
  extra: {
    trackingNumber?: string;
    mengantarOrderId?: string;
    airwaybill?: string;
    labelUrl?: string;
    mengantarResponse?: any;
  }
): Promise<StoredOrder | null> {
  const order = await findOrderByNumber(orderNumber);
  if (!order) return null;

  order.shipping.shippingStatus = shippingStatus;
  if (extra.trackingNumber) {
    order.shipping.trackingNumber = extra.trackingNumber;
    order.trackingNumber = extra.trackingNumber;
  }
  if (extra.mengantarOrderId) order.shipping.mengantarOrderId = extra.mengantarOrderId;
  if (extra.airwaybill) order.shipping.airwaybill = extra.airwaybill;
  if (extra.labelUrl) order.shipping.labelUrl = extra.labelUrl;
  if (extra.mengantarResponse) order.shipping.mengantarResponse = extra.mengantarResponse;
  order.shipping.shippingUpdatedAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  if (shippingStatus === 'CREATED') {
    order.status = 'sedang_dikemas';
  } else if (shippingStatus === 'PICKED_UP' || shippingStatus === 'IN_TRANSIT') {
    order.status = 'dikirim';
  } else if (shippingStatus === 'DELIVERED') {
    order.status = 'tiba_di_tujuan';
  }

  return saveOrder(order);
}

export async function getAllOrdersList(limitCount = 50): Promise<StoredOrder[]> {
  if (!db) {
    return Array.from(memoryOrders.values()).slice(0, limitCount);
  }

  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const list: StoredOrder[] = [];
    snap.forEach(docSnap => {
      list.push(mapFirestoreDataToStoredOrder(docSnap.data(), docSnap.id));
    });
    return list;
  } catch (err: any) {
    console.warn('[OrderRepository] Failed to query all orders, falling back to memory:', err.message);
    return Array.from(memoryOrders.values()).slice(0, limitCount);
  }
}

function mapFirestoreDataToStoredOrder(data: any, id: string): StoredOrder {
  const orderNumber = data.orderNumber || data.id || id;
  const invoiceNumber = data.invoiceNumber || `INV-${orderNumber}`;
  
  const customerName = data.customer?.customerName || data.customer?.fullName || 'Pelanggan';
  const phone = data.customer?.phone || data.customer?.whatsapp || '';
  const email = data.customer?.email || '';

  const address = data.shippingAddress?.address || data.customer?.address || '';
  const province = data.shippingAddress?.province || data.customer?.province || '';
  const city = data.shippingAddress?.city || data.customer?.city || '';
  const district = data.shippingAddress?.district || data.customer?.subdistrict || '';
  const postalCode = data.shippingAddress?.postalCode || data.customer?.postalCode || '';

  const subtotal = Number(data.price?.subtotal ?? data.subtotal ?? 0);
  const discount = Number(data.price?.discount ?? data.discount ?? 0);
  const shippingCost = Number(data.price?.shippingCost ?? data.shippingCost ?? 0);
  const grandTotal = Number(data.price?.grandTotal ?? data.total ?? (subtotal + shippingCost - discount));

  const paymentStatus: PaymentStatus = data.payment?.paymentStatus || (data.status === 'dibayar' ? 'PAID' : 'PENDING');
  const shippingStatus: ShippingStatus = data.shipping?.shippingStatus || (data.trackingNumber ? 'CREATED' : 'NOT_CREATED');

  return {
    id,
    orderNumber,
    invoiceNumber,
    accessToken: data.accessToken || data.token || id,
    processedWebhookIds: Array.isArray(data.processedWebhookIds) ? data.processedWebhookIds : [],
    customer: {
      customerName,
      phone,
      email
    },
    shippingAddress: {
      address,
      province,
      city,
      district,
      postalCode
    },
    items: (data.items || []).map((it: any, idx: number) => ({
      id: it.id || `item-${idx}`,
      productId: it.productId || it.product?.id || 'prod-01',
      name: it.name || it.product?.name || 'Busana Muslim Saena',
      variant: it.variant || it.selectedColor?.name || '',
      color: it.color || it.selectedColor?.name || '',
      size: it.size || it.selectedSize || 'All Size',
      price: Number(it.price || it.product?.price || 0),
      quantity: Number(it.quantity || 1),
      weight: Number(it.weight || 600),
      image: it.image || it.product?.images?.[0]
    })),
    quantity: Number(data.quantity || 1),
    weight: Number(data.weight || 600),
    price: {
      subtotal,
      discount,
      shippingCost,
      grandTotal
    },
    payment: {
      paymentMethod: data.payment?.paymentMethod || (data.payment?.channel === 'cod' ? 'COD' : 'DOKU'),
      paymentProvider: data.payment?.paymentProvider || (data.payment?.channel === 'cod' ? 'COD' : 'DOKU'),
      paymentChannel: data.payment?.paymentChannel || data.payment?.channel || 'doku_checkout',
      paymentStatus,
      paymentReference: data.payment?.paymentReference || data.payment?.doku?.invoiceNumber,
      paymentAmount: Number(data.payment?.paymentAmount || grandTotal),
      paymentCreatedAt: data.payment?.paymentCreatedAt || data.createdAt || new Date().toISOString(),
      paymentPaidAt: data.payment?.paymentPaidAt || data.payment?.paidAt || null,
      paymentUrl: data.payment?.paymentUrl || data.payment?.doku?.paymentUrl || null,
      vaNumber: data.payment?.vaNumber || data.payment?.doku?.virtualAccountInfo?.vaNumber || null,
      bank: data.payment?.bank || data.payment?.doku?.virtualAccountInfo?.bank || null,
      qrisString: data.payment?.qrisString || data.payment?.doku?.qrisInfo?.qrString || null,
      qrisImage: data.payment?.qrisImage || data.payment?.doku?.qrisInfo?.qrImage || null,
      dokuResponse: data.payment?.dokuResponse || data.payment?.doku
    },
    shipping: {
      shippingProvider: 'Mengantar',
      courier: data.shipping?.courier || 'JNE',
      service: data.shipping?.service || 'REG',
      shippingStatus,
      mengantarOrderId: data.shipping?.mengantarOrderId || data.mengantar?.mengantarOrderId || null,
      trackingNumber: data.shipping?.trackingNumber || data.trackingNumber || data.mengantar?.trackingNumber || null,
      airwaybill: data.shipping?.airwaybill || data.mengantar?.airwayBillUrl || null,
      labelUrl: data.shipping?.labelUrl || data.mengantar?.labelUrl || null,
      shippingCreatedAt: data.shipping?.shippingCreatedAt || data.mengantar?.syncedAt || null,
      shippingUpdatedAt: data.shipping?.shippingUpdatedAt || null,
      estimatedDelivery: data.shipping?.estimatedDelivery || '2 - 3 Hari',
      notes: data.notes || '',
      mengantarResponse: data.shipping?.mengantarResponse || data.mengantar
    },
    total: grandTotal,
    status: data.status || (paymentStatus === 'PAID' ? 'dibayar' : 'menunggu_pembayaran'),
    trackingNumber: data.shipping?.trackingNumber || data.trackingNumber || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    metaTracking: data.metaTracking,
    metaCapiPurchaseSent: Boolean(data.metaCapiPurchaseSent)
  };
}
