/**
 * ============================================================
 * SEBAShield
 * Firebase Scan Repository
 * ============================================================
 *
 * Purpose:
 * Handles privacy-conscious cloud persistence of SEBAShield
 * scan records in Cloud Firestore.
 *
 * Firestore Structure:
 *
 * users/{uid}/scans/{scanId}
 *
 * Security Model:
 * - Every cloud scan belongs to one authenticated Firebase UID.
 * - Firestore Security Rules restrict each user to their own
 *   scan records.
 * - The authenticated UID is enforced again at the repository
 *   boundary before every write.
 * - Raw submitted content is never written to Firestore.
 * - Human-readable findings and recommendations remain local.
 * - Only the privacy-approved representation produced by
 *   toCloudScanRecord() may be synchronized.
 *
 * Privacy-Safe Cloud Fields:
 * - id
 * - ownerId
 * - scanType
 * - score
 * - riskLevel
 * - indicatorCodes
 * - analyzerVersion
 * - cloudSchemaVersion
 * - createdAt
 * - updatedAt
 * - cloudSyncedAt
 *
 * Deliberately Excluded:
 * - originalContent
 * - originalMessage
 * - originalUrl
 * - contentPreview
 * - human-readable indicators
 * - recommendations
 * - analyzer details
 * - AI summaries
 * - AI explanations
 * - local synchronization state
 * - local synchronization errors
 *
 * Responsibilities:
 * - Save a privacy-minimized scan to Firestore
 * - Read one cloud scan
 * - Read all cloud scans for an authenticated user
 * - Delete one cloud scan
 *
 * This repository does not manage:
 * - React state
 * - AsyncStorage
 * - local scan-history presentation
 * - AI inference
 *
 * ============================================================
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  firestoreDatabase,
} from "../../../infrastructure/firebase/firebaseConfig";

import {
  toCloudScanRecord,
} from "../models/scanModel";

/**
 * ============================================================
 * Firebase Scan Repository Error Codes
 * ============================================================
 */
export const FIREBASE_SCAN_ERROR_CODES =
  Object.freeze({
    INVALID_USER_ID:
      "INVALID_USER_ID",

    INVALID_SCAN:
      "INVALID_SCAN",

    SAVE_FAILED:
      "SAVE_FAILED",

    READ_FAILED:
      "READ_FAILED",

    DELETE_FAILED:
      "DELETE_FAILED",
  });

/**
 * ============================================================
 * FirebaseScanRepositoryError
 * ============================================================
 *
 * Standard repository-layer error used to provide predictable
 * error handling to higher application layers.
 */
export class FirebaseScanRepositoryError
  extends Error {
  constructor(
    message,
    code,
    originalError = null
  ) {
    super(message);

    this.name =
      "FirebaseScanRepositoryError";

    this.code = code;

    this.originalError =
      originalError;
  }
}

/**
 * ============================================================
 * validateUserId
 * ============================================================
 *
 * Ensures that a Firebase UID exists before any cloud operation
 * is attempted.
 *
 * @param {*} uid
 * @returns {string}
 */
function validateUserId(uid) {
  if (
    typeof uid !== "string" ||
    !uid.trim()
  ) {
    throw new FirebaseScanRepositoryError(
      "A valid Firebase user ID is required.",
      FIREBASE_SCAN_ERROR_CODES
        .INVALID_USER_ID
    );
  }

  return uid.trim();
}

/**
 * ============================================================
 * validateScanRecord
 * ============================================================
 *
 * Performs the minimum repository-level validation needed before
 * the scan is passed to the stricter toCloudScanRecord()
 * serializer.
 *
 * @param {*} scanRecord
 * @returns {Object}
 */
function validateScanRecord(
  scanRecord
) {
  if (
    !scanRecord ||
    typeof scanRecord !==
      "object"
  ) {
    throw new FirebaseScanRepositoryError(
      "A valid scan record is required.",
      FIREBASE_SCAN_ERROR_CODES
        .INVALID_SCAN
    );
  }

  if (
    typeof scanRecord.id !==
      "string" ||
    !scanRecord.id.trim()
  ) {
    throw new FirebaseScanRepositoryError(
      "The scan record does not contain a valid ID.",
      FIREBASE_SCAN_ERROR_CODES
        .INVALID_SCAN
    );
  }

  return scanRecord;
}

/**
 * ============================================================
 * getUserScansCollection
 * ============================================================
 *
 * Returns the Firestore collection reference for one
 * authenticated user's scans.
 *
 * @param {string} uid
 * @returns {import("firebase/firestore").CollectionReference}
 */
function getUserScansCollection(
  uid
) {
  return collection(
    firestoreDatabase,
    "users",
    uid,
    "scans"
  );
}

/**
 * ============================================================
 * getScanDocumentReference
 * ============================================================
 *
 * Returns the Firestore document reference for one scan.
 *
 * @param {string} uid
 * @param {string} scanId
 * @returns {import("firebase/firestore").DocumentReference}
 */
function getScanDocumentReference(
  uid,
  scanId
) {
  return doc(
    firestoreDatabase,
    "users",
    uid,
    "scans",
    scanId
  );
}

/**
 * ============================================================
 * saveScanToFirestore
 * ============================================================
 *
 * Saves one privacy-minimized scan record to Firestore.
 *
 * Important Privacy Behavior:
 *
 * The local scan record may contain sensitive values such as:
 * - complete submitted content,
 * - human-readable findings,
 * - recommendations,
 * - analyzer-specific details.
 *
 * None of those fields are written directly.
 *
 * The record must first pass through toCloudScanRecord(), which
 * creates an explicit allowlist of cloud-approved fields.
 *
 * Replacement Write:
 *
 * This repository intentionally DOES NOT use merge:true.
 *
 * Earlier SEBAShield versions synchronized fields including:
 * - indicators,
 * - recommendations,
 * - details.
 *
 * If merge:true were retained, those legacy fields could remain
 * inside an existing Firestore document even after the current
 * serializer stopped sending them.
 *
 * A complete replacement write ensures that every successfully
 * synchronized document contains only the current privacy-safe
 * cloud schema.
 *
 * @param {string} uid
 * @param {Object} scanRecord
 * @returns {Promise<Object>}
 */
export async function saveScanToFirestore(
  uid,
  scanRecord
) {
  const validatedUid =
    validateUserId(uid);

  const validatedScan =
    validateScanRecord(
      scanRecord
    );

  try {
    /**
     * Enforce the authenticated Firebase UID as the owner.
     *
     * Never trust a stale, null, or caller-provided ownerId when
     * synchronizing cloud data.
     */
    const ownedScanRecord = {
      ...validatedScan,

      ownerId:
        validatedUid,
    };

    /**
     * Convert the private local scan into the approved,
     * privacy-minimized Firestore representation.
     *
     * toCloudScanRecord() deliberately excludes all sensitive
     * and free-text analysis fields that are not required in
     * cloud storage.
     */
    const cloudScanRecord =
      toCloudScanRecord(
        ownedScanRecord
      );

    const scanReference =
      getScanDocumentReference(
        validatedUid,
        validatedScan.id
      );

    /**
     * Replace the complete Firestore document.
     *
     * No merge option is supplied.
     *
     * This guarantees that legacy fields from older schema
     * versions cannot survive after this scan is synchronized
     * using the current privacy-safe serializer.
     */
    await setDoc(
      scanReference,
      {
        ...cloudScanRecord,

        /**
         * Enforce identity fields again at the repository
         * boundary so that document contents remain consistent
         * with Firestore Security Rules.
         */
        id:
          validatedScan.id,

        ownerId:
          validatedUid,

        /**
         * Firestore generates the authoritative timestamp for
         * the latest successful cloud synchronization.
         */
        cloudSyncedAt:
          serverTimestamp(),
      }
    );

    /**
     * Return the normalized cloud representation to the caller.
     *
     * cloudSyncedAt is not returned here because serverTimestamp()
     * is resolved by Firestore after the write.
     */
    return {
      ...cloudScanRecord,

      id:
        validatedScan.id,

      ownerId:
        validatedUid,
    };
  } catch (error) {
    /**
     * Preserve repository errors that have already been
     * normalized by this layer.
     */
    if (
      error instanceof
      FirebaseScanRepositoryError
    ) {
      throw error;
    }

    /**
     * Log only diagnostic metadata.
     *
     * Never log the scan record or submitted user content.
     */
    console.error(
      "[SEBAShield Firestore] Scan save failed.",
      {
        code:
          error?.code ??
          "unknown-firestore-error",

        message:
          error?.message ??
          "Unknown Firestore error",
      }
    );

    throw new FirebaseScanRepositoryError(
      "SEBAShield could not synchronize the scan with Firestore.",
      FIREBASE_SCAN_ERROR_CODES
        .SAVE_FAILED,
      error
    );
  }
}

/**
 * ============================================================
 * getScanFromFirestore
 * ============================================================
 *
 * Retrieves one cloud scan belonging to the authenticated user.
 *
 * Firestore Security Rules remain the authoritative access
 * control layer.
 *
 * @param {string} uid
 * @param {string} scanId
 * @returns {Promise<Object|null>}
 */
export async function getScanFromFirestore(
  uid,
  scanId
) {
  const validatedUid =
    validateUserId(uid);

  if (
    typeof scanId !==
      "string" ||
    !scanId.trim()
  ) {
    throw new FirebaseScanRepositoryError(
      "A valid scan ID is required.",
      FIREBASE_SCAN_ERROR_CODES
        .INVALID_SCAN
    );
  }

  try {
    const scanReference =
      getScanDocumentReference(
        validatedUid,
        scanId.trim()
      );

    const snapshot =
      await getDoc(
        scanReference
      );

    if (
      !snapshot.exists()
    ) {
      return null;
    }

    return {
      ...snapshot.data(),

      /**
       * The Firestore document ID is authoritative.
       */
      id:
        snapshot.id,
    };
  } catch (error) {
    /**
     * Log only technical error metadata.
     *
     * Cloud scan contents are deliberately excluded.
     */
    console.error(
      "[SEBAShield Firestore] Scan read failed.",
      {
        code:
          error?.code ??
          "unknown-firestore-error",

        message:
          error?.message ??
          "Unknown Firestore error",
      }
    );

    throw new FirebaseScanRepositoryError(
      "SEBAShield could not retrieve the cloud scan.",
      FIREBASE_SCAN_ERROR_CODES
        .READ_FAILED,
      error
    );
  }
}

/**
 * ============================================================
 * getUserScansFromFirestore
 * ============================================================
 *
 * Retrieves all cloud scans belonging to one authenticated user.
 *
 * Results are ordered newest first using createdAt.
 *
 * @param {string} uid
 * @returns {Promise<Object[]>}
 */
export async function getUserScansFromFirestore(
  uid
) {
  const validatedUid =
    validateUserId(uid);

  try {
    const scansQuery =
      query(
        getUserScansCollection(
          validatedUid
        ),

        orderBy(
          "createdAt",
          "desc"
        )
      );

    const snapshot =
      await getDocs(
        scansQuery
      );

    return snapshot.docs.map(
      (
        documentSnapshot
      ) => ({
        ...documentSnapshot.data(),

        /**
         * Use Firestore's document ID as the authoritative ID.
         */
        id:
          documentSnapshot.id,
      })
    );
  } catch (error) {
    /**
     * Do not log retrieved scan documents.
     */
    console.error(
      "[SEBAShield Firestore] Scan history read failed.",
      {
        code:
          error?.code ??
          "unknown-firestore-error",

        message:
          error?.message ??
          "Unknown Firestore error",
      }
    );

    throw new FirebaseScanRepositoryError(
      "SEBAShield could not retrieve cloud scan history.",
      FIREBASE_SCAN_ERROR_CODES
        .READ_FAILED,
      error
    );
  }
}

/**
 * ============================================================
 * deleteScanFromFirestore
 * ============================================================
 *
 * Permanently deletes one cloud scan belonging to the
 * authenticated Firebase user.
 *
 * This repository function affects only Firestore.
 * Local deletion is handled separately by the local scan
 * repository / ScanContext workflow.
 *
 * @param {string} uid
 * @param {string} scanId
 * @returns {Promise<boolean>}
 */
export async function deleteScanFromFirestore(
  uid,
  scanId
) {
  const validatedUid =
    validateUserId(uid);

  if (
    typeof scanId !==
      "string" ||
    !scanId.trim()
  ) {
    throw new FirebaseScanRepositoryError(
      "A valid scan ID is required.",
      FIREBASE_SCAN_ERROR_CODES
        .INVALID_SCAN
    );
  }

  try {
    const scanReference =
      getScanDocumentReference(
        validatedUid,
        scanId.trim()
      );

    await deleteDoc(
      scanReference
    );

    return true;
  } catch (error) {
    /**
     * Log only diagnostic metadata.
     *
     * Never log deleted scan contents.
     */
    console.error(
      "[SEBAShield Firestore] Scan deletion failed.",
      {
        code:
          error?.code ??
          "unknown-firestore-error",

        message:
          error?.message ??
          "Unknown Firestore error",
      }
    );

    throw new FirebaseScanRepositoryError(
      "SEBAShield could not delete the cloud scan.",
      FIREBASE_SCAN_ERROR_CODES
        .DELETE_FAILED,
      error
    );
  }
}