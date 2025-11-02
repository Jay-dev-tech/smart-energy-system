
'use client';

import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

let firebaseApp: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let database: ReturnType<typeof getDatabase>;

function initializeFirebase() {
  if (!getApps().length) {
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    firebaseApp = getApp();
  }
  
  auth = getAuth(firebaseApp);
  database = getDatabase(firebaseApp);
}

// Initialize immediately on module load
initializeFirebase();

export function getSdks(app: FirebaseApp) {
  return {
    firebaseApp: app,
    database: getDatabase(app),
    auth: getAuth(app)
  };
}

export { firebaseApp, auth, database, initializeFirebase };
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
export * from './auth/use-user';
