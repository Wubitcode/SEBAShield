/**
 * ============================================================
 * SEBAShield
 * Firebase Client Configuration
 * ============================================================
 *
 * Initializes:
 * - Firebase Authentication
 * - Cloud Firestore
 * - Cloud Functions
 *
 * Firebase client configuration is loaded from the root .env
 * file. Private AI keys must never be stored in this file.
 * ============================================================
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";

import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

/**
 * Values are loaded from:
 *
 * /SEBAShield/.env
 */
const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,

  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,

  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,

  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,

  messagingSenderId:
    process.env
      .EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Cloud Functions deployment region.
 */
export const FIREBASE_FUNCTIONS_REGION =
  process.env
    .EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION ||
  "northamerica-northeast1";

/**
 * Detect missing Firebase configuration before initialization.
 */
function validateFirebaseConfig(config) {
  const missingFields = Object.entries(config)
    .filter(
      ([, value]) =>
        typeof value !== "string" ||
        value.trim() === ""
    )
    .map(([fieldName]) => fieldName);

  if (missingFields.length > 0) {
    throw new Error(
      `Firebase configuration is incomplete. Missing: ${missingFields.join(
        ", "
      )}`
    );
  }
}

validateFirebaseConfig(firebaseConfig);

/**
 * Prevent duplicate initialization during Expo Fast Refresh.
 */
export const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

/**
 * Initialize Firebase Authentication with persistent React Native
 * storage so the anonymous user remains signed in after closing
 * and reopening the application.
 */
function createFirebaseAuth() {
  try {
    return initializeAuth(firebaseApp, {
      persistence:
        getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    /**
     * Fast Refresh may attempt to initialize Authentication again.
     * In that case, reuse the existing Auth instance.
     */
    if (
      error?.code === "auth/already-initialized"
    ) {
      return getAuth(firebaseApp);
    }

    throw error;
  }
}

export const firebaseAuth =
  createFirebaseAuth();

/**
 * Firestore database instance.
 */
export const firestoreDatabase =
  getFirestore(firebaseApp);

/**
 * Callable Cloud Functions instance.
 */
export const firebaseFunctions =
  getFunctions(
    firebaseApp,
    FIREBASE_FUNCTIONS_REGION
  );

export default firebaseApp;