import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from config.env
dotenv.config({ path: join(__dirname, 'config.env') });

let db;

try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not defined in environment variables');
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  // Validate required fields
  const requiredFields = ['project_id', 'private_key', 'client_email'];
  for (const field of requiredFields) {
    if (!serviceAccount[field]) {
      throw new Error(`Missing required field in service account: ${field}`);
    }
  }

  console.log('Initializing Firebase with project ID:', serviceAccount.project_id);
  
  initializeApp({
    credential: cert(serviceAccount)
  });

  db = getFirestore();
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  process.exit(1);
}

export { db };
