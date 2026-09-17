/**
 * ============================================================
 * SEBAShield
 * Scan Synchronization Service
 * ============================================================
 *
 * Purpose:
 * Coordinates synchronization between SEBAShield's local
 * AsyncStorage scan history and Firebase Cloud Firestore.
 *
 * Architecture:
 *
 * Scanner Screen
 *      ↓
 * ScanContext
 *      ↓
 * scanService.js
 *      ↓
 * AsyncStorage
 *      ↓
 * scanSyncService.js
 *      ↓
 * firebaseScanRepository.js
 *      ↓
 * Cloud Firestore
 *
 * Offline-First Design:
 * - Every completed scan is saved locally first.
 * - Firebase synchronization is attempted afterward.
 * - Failed synchronization never deletes the local scan.
 * - Pending and previously failed scans can be retried later.
 *
 * Privacy:
 * - This service does not send raw content directly to Firestore.
 * - firebaseScanRepository.js creates the reduced cloud-safe
 *   representation before writing to Firestore.
 * - Diagnostic logs use scan IDs only and do not expose the
 *   submitted message, URL, or job content.
 *
 * ============================================================
 */

import {
  getPendingScans,
  getScanById,
  updateScan,
} from "../repositories/localScanRepository";

import {
  saveScanToFirestore,
} from "../repositories/firebaseScanRepository";

import {
  SYNC_STATUS,
} from "../models/scanModel";

/**
 * ============================================================
 * Synchronization Error Codes
 * ============================================================
 *
 * Centralized error codes allow ScanContext and future UI
 * components to distinguish synchronization failures from local
 * analysis failures.
 */
export const SCAN_SYNC_ERROR_CODES =
  Object.freeze({
    INVALID_USER:
      "INVALID_USER",

    INVALID_SCAN:
      "INVALID_SCAN",

    LOCAL_UPDATE_FAILED:
      "LOCAL_UPDATE_FAILED",

    SYNC_FAILED:
      "SYNC_FAILED",
  });

/**
 * ============================================================
 * ScanSyncServiceError
 * ============================================================
 *
 * Standard service-level error used by the synchronization layer.
 */
export class ScanSyncServiceError extends Error {
  constructor(
    message,
    code,
    originalError = null
  ) {
    super(message);

    this.name =
      "ScanSyncServiceError";

    this.code =
      code;

    this.originalError =
      originalError;
  }
}

/**
 * ============================================================
 * validateUserId
 * ============================================================
 *
 * Ensures synchronization is associated with a valid Firebase
 * Authentication UID.
 */
function validateUserId(uid) {
  if (
    typeof uid !== "string" ||
    !uid.trim()
  ) {
    throw new ScanSyncServiceError(
      "A valid Firebase user ID is required for synchronization.",
      SCAN_SYNC_ERROR_CODES.INVALID_USER
    );
  }

  return uid.trim();
}

/**
 * ============================================================
 * validateScanRecord
 * ============================================================
 *
 * Performs the minimum validation required before attempting
 * synchronization.
 */
function validateScanRecord(scanRecord) {
  if (
    !scanRecord ||
    typeof scanRecord !== "object" ||
    typeof scanRecord.id !==
      "string" ||
    !scanRecord.id.trim()
  ) {
    throw new ScanSyncServiceError(
      "A valid scan record is required for synchronization.",
      SCAN_SYNC_ERROR_CODES.INVALID_SCAN
    );
  }

  return scanRecord;
}

/**
 * ============================================================
 * getOriginalError
 * ============================================================
 *
 * Firebase repository errors may wrap the original Firebase SDK
 * exception inside originalError.
 *
 * This helper exposes the deepest useful diagnostic error without
 * changing the error returned to the UI.
 */
function getOriginalError(error) {
  return (
    error?.originalError ??
    error
  );
}

/**
 * ============================================================
 * getSafeSyncErrorMessage
 * ============================================================
 *
 * Produces a short diagnostic message suitable for:
 * - local sync metadata;
 * - development logs;
 * - retry diagnostics.
 *
 * Raw submitted scan content is never added to the message.
 */
function getSafeSyncErrorMessage(error) {
  const originalError =
    getOriginalError(error);

  if (
    originalError &&
    typeof originalError.message ===
      "string"
  ) {
    return originalError.message.slice(
      0,
      300
    );
  }

  if (
    error &&
    typeof error.message ===
      "string"
  ) {
    return error.message.slice(
      0,
      300
    );
  }

  return "Unknown Firebase synchronization error.";
}

/**
 * ============================================================
 * getSafeSyncErrorCode
 * ============================================================
 *
 * Extracts a Firebase or service error code for diagnostics.
 */
function getSafeSyncErrorCode(error) {
  const originalError =
    getOriginalError(error);

  return (
    originalError?.code ??
    error?.code ??
    "unknown-sync-error"
  );
}

/**
 * ============================================================
 * updateLocalScanFields
 * ============================================================
 *
 * Safely updates selected fields of one local scan.
 *
 * IMPORTANT:
 *
 * localScanRepository.updateScan() accepts ONE complete scan
 * record:
 *
 *   updateScan(updatedScan)
 *
 * It does NOT accept:
 *
 *   updateScan(scanId, changes)
 *
 * Therefore this helper:
 *
 * 1. Retrieves the existing complete scan.
 * 2. Merges the requested field changes.
 * 3. Sends one complete record to updateScan().
 *
 * This preserves all required scan-model properties while
 * allowing the synchronization service to modify only sync
 * metadata.
 */
async function updateLocalScanFields(
  scanId,
  fieldUpdates
) {
  const existingScan =
    await getScanById(scanId);

  if (!existingScan) {
    throw new ScanSyncServiceError(
      `Local scan was not found: ${scanId}`,
      SCAN_SYNC_ERROR_CODES
        .LOCAL_UPDATE_FAILED
    );
  }

  const updatedScan = {
    ...existingScan,
    ...fieldUpdates,
  };

  return updateScan(
    updatedScan
  );
}

/**
 * ============================================================
 * syncScanWithFirestore
 * ============================================================
 *
 * Synchronizes one locally stored scan with Cloud Firestore.
 *
 * Processing Sequence:
 *
 * 1. Validate the Firebase UID.
 * 2. Validate the scan.
 * 3. Mark the local record as PENDING.
 * 4. Associate it with the authenticated Firebase UID.
 * 5. Send the cloud-safe representation to Firestore.
 * 6. Mark the local record as SYNCED when successful.
 * 7. Mark the record as FAILED when synchronization fails.
 *
 * The local scan always remains available.
 */
export async function syncScanWithFirestore(
  uid,
  scanRecord
) {
  const validatedUid =
    validateUserId(uid);

  const validatedScan =
    validateScanRecord(scanRecord);

  try {
    /**
     * Associate this local record with the current Firebase user
     * and explicitly mark it as waiting for cloud synchronization.
     */
    const preparedLocalScan =
      await updateLocalScanFields(
        validatedScan.id,
        {
          ownerId:
            validatedUid,

          syncStatus:
            SYNC_STATUS.PENDING,

          syncError:
            null,
        }
      );

    /**
     * firebaseScanRepository is responsible for:
     * - creating the Firestore document path;
     * - setting ownerId;
     * - removing raw originalContent;
     * - writing the reduced record to Firestore.
     */
    await saveScanToFirestore(
      validatedUid,
      preparedLocalScan
    );

    const synchronizedAt =
      new Date().toISOString();

    /**
     * Firestore accepted the record.
     *
     * Update the local copy so the application does not attempt
     * to upload the same scan again during the next startup.
     */
    const synchronizedScan =
      await updateLocalScanFields(
        validatedScan.id,
        {
          ownerId:
            validatedUid,

          syncStatus:
            SYNC_STATUS.SYNCED,

          lastSyncedAt:
            synchronizedAt,

          syncError:
            null,
        }
      );

    console.info(
      "[SEBAShield Sync] Scan synchronized.",
      {
        scanId:
          validatedScan.id,
      }
    );

    return synchronizedScan;
  } catch (error) {
    const syncErrorMessage =
      getSafeSyncErrorMessage(
        error
      );

    const syncErrorCode =
      getSafeSyncErrorCode(
        error
      );

    /**
     * Best-effort failure-state update.
     *
     * A secondary AsyncStorage failure must not hide the original
     * Firebase synchronization error.
     */
    try {
      await updateLocalScanFields(
        validatedScan.id,
        {
          ownerId:
            validatedUid,

          syncStatus:
            SYNC_STATUS.FAILED,

          syncError:
            syncErrorMessage,
        }
      );
    } catch (
      localStatusError
    ) {
      console.error(
        "[SEBAShield Sync] Unable to record failed synchronization state.",
        {
          scanId:
            validatedScan.id,

          code:
            getSafeSyncErrorCode(
              localStatusError
            ),

          message:
            getSafeSyncErrorMessage(
              localStatusError
            ),
        }
      );
    }

    /**
     * Log only technical synchronization metadata.
     *
     * Raw user-submitted content is intentionally excluded.
     */
    console.error(
      "[SEBAShield Sync] Scan synchronization failed.",
      {
        scanId:
          validatedScan.id,

        code:
          syncErrorCode,

        message:
          syncErrorMessage,
      }
    );

    throw new ScanSyncServiceError(
      "The scan was saved locally but could not be synchronized with Firebase.",
      SCAN_SYNC_ERROR_CODES.SYNC_FAILED,
      error
    );
  }
}

/**
 * ============================================================
 * getScansAwaitingSync
 * ============================================================
 *
 * Returns scans that still require cloud synchronization.
 *
 * The local repository already considers both:
 * - PENDING scans; and
 * - FAILED scans
 *
 * eligible for retry.
 */
export async function getScansAwaitingSync() {
  return getPendingScans();
}

/**
 * ============================================================
 * syncPendingScans
 * ============================================================
 *
 * Attempts to synchronize every pending or previously failed
 * local scan for the authenticated Firebase user.
 *
 * Processing is sequential rather than parallel so startup does
 * not generate an unnecessary burst of Firestore writes.
 *
 * One failed scan does not stop the remaining scans.
 */
export async function syncPendingScans(
  uid
) {
  const validatedUid =
    validateUserId(uid);

  const pendingScans =
    await getScansAwaitingSync();

  /**
   * Synchronization summary returned to ScanContext.
   */
  const summary = {
    attempted:
      pendingScans.length,

    synchronized:
      0,

    failed:
      0,

    failures:
      [],
  };

  /**
   * Synchronize records one at a time.
   */
  for (const scan of pendingScans) {
    try {
      await syncScanWithFirestore(
        validatedUid,
        scan
      );

      summary.synchronized += 1;
    } catch (error) {
      summary.failed += 1;

      summary.failures.push({
        scanId:
          scan.id,

        code:
          getSafeSyncErrorCode(
            error
          ),

        message:
          getSafeSyncErrorMessage(
            error
          ),
      });
    }
  }

  /**
   * The summary intentionally excludes user-submitted content.
   */
  console.info(
    "[SEBAShield Sync] Synchronization completed.",
    {
      attempted:
        summary.attempted,

      synchronized:
        summary.synchronized,

      failed:
        summary.failed,
    }
  );

  return summary;
}