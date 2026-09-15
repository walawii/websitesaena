import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { INITIAL_PRODUCTS, DEFAULT_WHATSAPP_NUMBER, SHIPPING_ORIGIN } from '../src/data/mockData';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

function sanitize(data: any) {
  return JSON.parse(JSON.stringify(data, (_, value) => (value === undefined ? null : value)));
}

async function seed() {
  console.log(`Starting seed of ${INITIAL_PRODUCTS.length} latest products...`);
  
  // Seed central warehouse setting
  await setDoc(doc(db, 'store_settings', 'central_warehouse'), sanitize({
    id: 'central_warehouse',
    storeName: 'saena.id - Busana Muslimah Eksklusif',
    originSubdistrict: SHIPPING_ORIGIN.subdistrict,
    originCity: SHIPPING_ORIGIN.city,
    originProvince: SHIPPING_ORIGIN.province,
    originPostalCode: SHIPPING_ORIGIN.postalCode,
    warehouseName: SHIPPING_ORIGIN.warehouseName,
    address: SHIPPING_ORIGIN.address,
    contactWhatsApp: DEFAULT_WHATSAPP_NUMBER,
    updatedAt: new Date().toISOString()
  }));
  console.log('Warehouse settings updated with WA:', DEFAULT_WHATSAPP_NUMBER);

  for (const prod of INITIAL_PRODUCTS) {
    await setDoc(doc(db, 'products', prod.id), sanitize({
      ...prod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    console.log(`Product seeded: ${prod.id} - ${prod.name}`);
  }

  console.log('All latest products seeded successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
