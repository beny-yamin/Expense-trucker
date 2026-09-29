/**
 * firebaseAdmin.js
 * Initializes the Firebase Admin SDK for server-side token verification.
 * Uses Application Default Credentials via FIREBASE_PROJECT_ID env var.
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth }                       from 'firebase-admin/auth';

let adminApp;

if (!getApps().length) {
  // When running locally, use the project ID directly.
  // On Firebase / GCP this will auto-detect credentials.
  // For other environments, set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path.
  adminApp = initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
} else {
  adminApp = getApps()[0];
}

export const adminAuth = getAuth(adminApp);
