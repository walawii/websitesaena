import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

async function deleteAllProducts() {
  console.log('Connecting to Firestore project:', firebaseConfig.projectId);
  console.log('Database ID:', firebaseConfig.firestoreDatabaseId);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  let totalDeleted = 0;
  while (true) {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    if (snapshot.empty || snapshot.docs.length === 0) {
      console.log('No remaining products in Firestore.');
      break;
    }

    console.log(`Found batch of ${snapshot.docs.length} products to delete...`);

    // Firestore batch limit is 500 operations
    const docsToDelete = snapshot.docs.slice(0, 450);
    const batch = writeBatch(db);

    for (const docSnap of docsToDelete) {
      batch.delete(doc(db, 'products', docSnap.id));
    }

    await batch.commit();
    totalDeleted += docsToDelete.length;
    console.log(`Deleted ${totalDeleted} products so far...`);

    if (snapshot.docs.length <= docsToDelete.length) {
      break;
    }
  }

  console.log(`ALL DONE: Total ${totalDeleted} products deleted from Firestore.`);
  process.exit(0);
}

deleteAllProducts().catch((err) => {
  console.error('Error deleting products:', err);
  process.exit(1);
});
