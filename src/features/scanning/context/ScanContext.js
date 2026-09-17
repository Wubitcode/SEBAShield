/**
 * ============================================================
 * SEBAShield
 * Scan Context
 * ============================================================
 *
 * Purpose:
 * Provides shared scan state and actions throughout SEBAShield.
 *
 * Responsibilities:
 * - Load encrypted local scan history
 * - Restore privacy-minimized cloud metadata after sign-in
 * - Submit new scans
 * - Save scans locally first
 * - Synchronize scans with Firestore when authenticated
 * - Retry pending Firebase synchronization
 * - Delete individual scans from local and cloud history
 * - Clear complete local and cloud scan history
 * - Manage history statistics
 * - Preserve offline-first scanning behavior
 *
 * Security:
 * - Firebase UID comes from AuthContext.
 * - Raw submitted content is encrypted before local persistence.
 * - firebaseScanRepository controls the reduced cloud record.
 * - AI analysis is supplemental and does not replace local
 *   rule-based analysis.
 * - Deletion uses cloud-first behavior when authenticated so
 *   cloud records are not silently orphaned.
 * ============================================================
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuth,
} from "../../authentication/context/AuthContext";

import {
  analyzeWithAI,
} from "../../aiAnalysis/services/aiAnalysisService";

import {
  clearHistory,
  deleteScan,
  getHistory,
  getHistoryStatistics,
} from "../repositories/localScanRepository";

import {
  deleteScanFromFirestore,
  getUserScansFromFirestore,
} from "../repositories/firebaseScanRepository";

import {
  ScanServiceError,
  submitScan,
} from "../services/scanService";

import {
  syncPendingScans,
  syncScanWithFirestore,
} from "../services/scanSyncService";

/**
 * Default statistics before history is loaded.
 */
const DEFAULT_STATISTICS =
  Object.freeze({
    total: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    synced: 0,
    pendingSync: 0,
  });


/**
 * Marks where a history record originated.
 *
 * Cloud-only records are intentionally kept in memory only.
 * They are never written back into encrypted local history.
 */
const HISTORY_SOURCE =
  Object.freeze({
    LOCAL:
      "local",

    CLOUD:
      "cloud",
  });

/**
 * Converts supported date values into an ISO string for the UI.
 *
 * Firestore Timestamp values are handled without requiring the
 * History screen to know about Firestore-specific types.
 */
function normalizeHistoryDate(
  value
) {
  if (!value) {
    return null;
  }

  if (
    typeof value ===
      "string"
  ) {
    const parsedDate =
      new Date(value);

    return Number.isNaN(
      parsedDate.getTime()
    )
      ? null
      : parsedDate.toISOString();
  }

  if (
    value instanceof Date
  ) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value.toISOString();
  }

  if (
    typeof value?.toDate ===
      "function"
  ) {
    const convertedDate =
      value.toDate();

    return (
      convertedDate instanceof
        Date &&
      !Number.isNaN(
        convertedDate.getTime()
      )
    )
      ? convertedDate.toISOString()
      : null;
  }

  if (
    typeof value?.seconds ===
      "number"
  ) {
    const convertedDate =
      new Date(
        value.seconds *
          1000
      );

    return Number.isNaN(
      convertedDate.getTime()
    )
      ? null
      : convertedDate.toISOString();
  }

  return null;
}

/**
 * Creates a privacy-minimized history record from Firestore.
 *
 * IMPORTANT:
 * This function uses an explicit allowlist instead of spreading
 * the complete Firestore document. Even if a legacy cloud record
 * accidentally contains an old raw-content field, that field is
 * not restored into application history.
 */
function createCloudHistoryRecord(
  cloudScan
) {
  if (
    typeof cloudScan?.id !==
      "string" ||
    !cloudScan.id.trim()
  ) {
    return null;
  }

  return {
    id:
      cloudScan.id.trim(),

    ownerId:
      typeof cloudScan.ownerId ===
        "string"
        ? cloudScan.ownerId
        : null,

    scanType:
      typeof cloudScan.scanType ===
        "string"
        ? cloudScan.scanType
        : "unknown",

    score:
      typeof cloudScan.score ===
        "number" &&
      Number.isFinite(
        cloudScan.score
      )
        ? cloudScan.score
        : null,

    riskLevel:
      typeof cloudScan.riskLevel ===
        "string"
        ? cloudScan.riskLevel
        : "Unknown Risk",

    indicatorCodes:
      Array.isArray(
        cloudScan.indicatorCodes
      )
        ? cloudScan.indicatorCodes
            .filter(
              (code) =>
                typeof code ===
                "string"
            )
            .slice(
              0,
              20
            )
        : [],

    analyzerVersion:
      typeof cloudScan.analyzerVersion ===
        "string"
        ? cloudScan.analyzerVersion
        : null,

    cloudSchemaVersion:
      typeof cloudScan.cloudSchemaVersion ===
        "string"
        ? cloudScan.cloudSchemaVersion
        : null,

    createdAt:
      normalizeHistoryDate(
        cloudScan.createdAt
      ),

    updatedAt:
      normalizeHistoryDate(
        cloudScan.updatedAt
      ),

    cloudSyncedAt:
      normalizeHistoryDate(
        cloudScan.cloudSyncedAt
      ),

    syncStatus:
      "SYNCED",

    historySource:
      HISTORY_SOURCE.CLOUD,

    isCloudOnly:
      true,
  };
}

/**
 * Returns a sortable timestamp for one history record.
 */
function getHistoryTimestamp(
  scan
) {
  const value =
    scan?.createdAt ||
    scan?.updatedAt ||
    scan?.cloudSyncedAt;

  if (!value) {
    return 0;
  }

  const parsedDate =
    new Date(value);

  const timestamp =
    parsedDate.getTime();

  return Number.isNaN(
    timestamp
  )
    ? 0
    : timestamp;
}

/**
 * Merges encrypted local history with privacy-minimized Firestore
 * metadata.
 *
 * Rules:
 * - Local records win when the same scan exists in both places.
 * - Cloud-only records contain metadata only.
 * - Cloud-only records remain in memory and are not persisted
 *   into the local encrypted repository.
 */
function mergeHistoryRecords(
  localScans,
  cloudScans
) {
  const mergedById =
    new Map();

  const safeLocalScans =
    Array.isArray(
      localScans
    )
      ? localScans
      : [];

  const safeCloudScans =
    Array.isArray(
      cloudScans
    )
      ? cloudScans
      : [];

  for (
    const localScan
    of safeLocalScans
  ) {
    if (
      typeof localScan?.id !==
        "string" ||
      !localScan.id.trim()
    ) {
      continue;
    }

    mergedById.set(
      localScan.id,
      {
        ...localScan,

        historySource:
          HISTORY_SOURCE.LOCAL,

        isCloudOnly:
          false,
      }
    );
  }

  for (
    const cloudScan
    of safeCloudScans
  ) {
    const cloudRecord =
      createCloudHistoryRecord(
        cloudScan
      );

    if (!cloudRecord) {
      continue;
    }

    const existingLocalRecord =
      mergedById.get(
        cloudRecord.id
      );

    if (
      existingLocalRecord
    ) {
      mergedById.set(
        cloudRecord.id,
        {
          ...cloudRecord,
          ...existingLocalRecord,

          cloudRecordAvailable:
            true,

          historySource:
            HISTORY_SOURCE.LOCAL,

          isCloudOnly:
            false,
        }
      );

      continue;
    }

    mergedById.set(
      cloudRecord.id,
      cloudRecord
    );
  }

  return Array.from(
    mergedById.values()
  ).sort(
    (
      firstScan,
      secondScan
    ) =>
      getHistoryTimestamp(
        secondScan
      ) -
      getHistoryTimestamp(
        firstScan
      )
  );
}

/**
 * Calculates statistics for the combined in-memory history.
 */
function calculateHistoryStatistics(
  history
) {
  return (
    Array.isArray(
      history
    )
      ? history
      : []
  ).reduce(
    (
      statistics,
      scan
    ) => {
      statistics.total +=
        1;

      const riskLevel =
        String(
          scan?.riskLevel ??
            ""
        )
          .trim()
          .toLowerCase();

      if (
        riskLevel ===
          "high risk" ||
        riskLevel ===
          "critical" ||
        riskLevel ===
          "high"
      ) {
        statistics.highRisk +=
          1;
      } else if (
        riskLevel ===
          "suspicious" ||
        riskLevel ===
          "caution" ||
        riskLevel ===
          "medium risk" ||
        riskLevel ===
          "medium" ||
        riskLevel ===
          "moderate"
      ) {
        statistics.mediumRisk +=
          1;
      } else {
        statistics.lowRisk +=
          1;
      }

      const syncStatus =
        String(
          scan?.syncStatus ??
            ""
        )
          .trim()
          .toUpperCase();

      if (
        scan?.isCloudOnly ||
        syncStatus ===
          "SYNCED"
      ) {
        statistics.synced +=
          1;
      }

      if (
        syncStatus ===
          "PENDING" ||
        syncStatus ===
          "FAILED"
      ) {
        statistics.pendingSync +=
          1;
      }

      return statistics;
    },
    {
      ...DEFAULT_STATISTICS,
    }
  );
}

/**
 * Context starts as null so incorrect provider usage can be
 * detected by useScan().
 */
const ScanContext =
  createContext(null);

/**
 * Converts unknown errors into readable application messages.
 *
 * @param {*} error
 * @returns {string}
 */
function getErrorMessage(
  error
) {
  if (
    error instanceof
    ScanServiceError
  ) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return (
    "An unexpected SEBAShield error occurred."
  );
}

/**
 * ============================================================
 * ScanProvider
 * ============================================================
 *
 * AuthProvider must wrap ScanProvider so the Firebase UID is
 * available here.
 */
export function ScanProvider({
  children,
}) {
  /**
   * Firebase authentication information.
   */
  const {
    uid,
    isAuthenticated,
    isInitializing:
      isAuthInitializing,
  } = useAuth();

  /**
   * Complete local scan history.
   */
  const [
    scans,
    setScans,
  ] = useState([]);

  /**
   * Most recently completed scan.
   */
  const [
    lastScan,
    setLastScan,
  ] = useState(null);

  /**
   * Local history statistics.
   */
  const [
    statistics,
    setStatistics,
  ] = useState({
    ...DEFAULT_STATISTICS,
  });

  /**
   * Initial local history loading state.
   */
  const [
    isInitializing,
    setIsInitializing,
  ] = useState(true);

  /**
   * Manual history-refresh state.
   */
  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  /**
   * Local scan-analysis state.
   */
  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  /**
   * Local and cloud history-management state.
   */
  const [
    isManagingHistory,
    setIsManagingHistory,
  ] = useState(false);

  /**
   * Firebase synchronization state.
   */
  const [
    isSyncing,
    setIsSyncing,
  ] = useState(false);

  /**
   * Main scan/history error.
   */
  const [
    error,
    setError,
  ] = useState(null);

  /**
   * Cloud synchronization errors are intentionally separate.
   *
   * A Firebase failure should not make a successful local scan
   * appear to have failed.
   */
  const [
    syncError,
    setSyncError,
  ] = useState(null);

  /**
   * Most recent synchronization summary.
   */
  const [
    lastSyncSummary,
    setLastSyncSummary,
  ] = useState(null);

  /**
   * Clears the main scan error.
   */
  const clearError =
    useCallback(() => {
      setError(null);
    }, []);

  /**
   * Clears only Firebase synchronization errors.
   */
  const clearSyncError =
    useCallback(() => {
      setSyncError(null);
    }, []);

  /**
   * ============================================================
   * refreshHistory
   * ============================================================
   *
   * Loads encrypted local history first and, when Firebase
   * Authentication is available, merges privacy-minimized
   * Firestore metadata for the current UID.
   *
   * Cloud-only records remain in memory only. Raw submitted
   * content is never reconstructed from Firestore.
   */
  const refreshHistory =
    useCallback(
      async ({
        showRefreshIndicator = true,
      } = {}) => {
        if (
          showRefreshIndicator
        ) {
          setIsRefreshing(
            true
          );
        }

        setError(null);

        try {
          /**
           * Local encrypted history is always the offline-first
           * source of truth for raw submitted content.
           */
          const storedScans =
            await getHistory();

          let combinedHistory =
            mergeHistoryRecords(
              storedScans,
              []
            );

          /**
           * Retrieve cloud metadata only after Firebase has a
           * verified current identity.
           *
           * A cloud-read failure does not hide valid local history.
           */
          if (
            !isAuthInitializing &&
            isAuthenticated &&
            uid
          ) {
            try {
              const cloudScans =
                await getUserScansFromFirestore(
                  uid
                );

              combinedHistory =
                mergeHistoryRecords(
                  storedScans,
                  cloudScans
                );
            } catch (
              cloudHistoryError
            ) {
              setSyncError(
                getErrorMessage(
                  cloudHistoryError
                )
              );
            }
          }

          setScans(
            combinedHistory
          );

          setStatistics(
            calculateHistoryStatistics(
              combinedHistory
            )
          );

          return combinedHistory;
        } catch (
          refreshError
        ) {
          const message =
            getErrorMessage(
              refreshError
            );

          setError(message);

          throw refreshError;
        } finally {
          if (
            showRefreshIndicator
          ) {
            setIsRefreshing(
              false
            );
          }
        }
      },
      [
        uid,
        isAuthenticated,
        isAuthInitializing,
      ]
    );

  /**
   * ============================================================
   * Initial Local History Load
   * ============================================================
   *
   * Local history is loaded independently of Firebase so the
   * application remains usable offline.
   */
  useEffect(() => {
    let providerIsMounted =
      true;

    async function initializeScanState() {
      setIsInitializing(
        true
      );

      try {
        const [
          storedScans,
          storedStatistics,
        ] = await Promise.all([
          getHistory(),
          getHistoryStatistics(),
        ]);

        if (
          !providerIsMounted
        ) {
          return;
        }

        setScans(
          storedScans
        );

        setStatistics({
          ...DEFAULT_STATISTICS,
          ...storedStatistics,
        });
      } catch (
        initializationError
      ) {
        if (
          !providerIsMounted
        ) {
          return;
        }

        setError(
          getErrorMessage(
            initializationError
          )
        );
      } finally {
        if (
          providerIsMounted
        ) {
          setIsInitializing(
            false
          );
        }
      }
    }

    initializeScanState();

    return () => {
      providerIsMounted =
        false;
    };
  }, []);

  /**
   * ============================================================
   * Automatic Pending-Scan Synchronization
   * ============================================================
   *
   * Synchronize pending local scans after Firebase Authentication
   * becomes available.
   *
   * Offline-first flow:
   *
   * Local scan
   *     ↓
   * AsyncStorage
   *     ↓
   * PENDING
   *     ↓
   * Internet/auth available
   *     ↓
   * Firestore
   */
  useEffect(() => {
    if (
      isAuthInitializing ||
      !isAuthenticated ||
      !uid
    ) {
      return undefined;
    }

    let effectIsActive =
      true;

    async function synchronizeStoredScans() {
      setIsSyncing(true);

      setSyncError(null);

      try {
        const summary =
          await syncPendingScans(
            uid
          );

        if (
          !effectIsActive
        ) {
          return;
        }

        setLastSyncSummary(
          summary
        );

        await refreshHistory({
          showRefreshIndicator:
            false,
        });
      } catch (
        synchronizationError
      ) {
        if (
          !effectIsActive
        ) {
          return;
        }

        setSyncError(
          getErrorMessage(
            synchronizationError
          )
        );
      } finally {
        if (
          effectIsActive
        ) {
          setIsSyncing(
            false
          );
        }
      }
    }

    synchronizeStoredScans();

    return () => {
      effectIsActive =
        false;
    };
  }, [
    uid,
    isAuthenticated,
    isAuthInitializing,
    refreshHistory,
  ]);

  /**
   * ============================================================
   * submitNewScan
   * ============================================================
   *
   * Processing sequence:
   *
   * 1. Analyze content locally.
   * 2. Save the scan locally.
   * 3. Attempt Firestore synchronization.
   * 4. Request optional AI analysis.
   * 5. Preserve the local result even if Firebase or AI is
   *    unavailable.
   */
  const submitNewScan =
    useCallback(
      async ({
        scanType,
        content,
      }) => {
        setIsSubmitting(
          true
        );

        setError(null);

        setSyncError(null);

        try {
          /**
           * Local analysis and persistence happen first.
           *
           * This remains the primary SEBAShield scanning path
           * and does not depend on Firebase or external AI.
           */
          const result =
            await submitScan({
              scanType,

              content,

              /**
               * Attach Firebase ownership when authentication
               * is already available.
               */
              ownerId:
                uid ?? null,
            });

          let finalScanRecord =
            result.scanRecord;

          let syncSucceeded =
            false;

          /**
           * Synchronization is attempted only when an
           * authenticated Firebase UID exists.
           */
          if (uid) {
            setIsSyncing(
              true
            );

            try {
              const synchronizedScan =
                await syncScanWithFirestore(
                  uid,
                  result.scanRecord
                );

              if (
                synchronizedScan
              ) {
                finalScanRecord =
                  synchronizedScan;
              }

              syncSucceeded =
                true;
            } catch (
              synchronizationError
            ) {
              /**
               * Do not fail the completed local scan if cloud
               * synchronization is temporarily unavailable.
               *
               * The pending local scan can be retried later.
               */
              setSyncError(
                getErrorMessage(
                  synchronizationError
                )
              );
            } finally {
              setIsSyncing(
                false
              );
            }
          }

          /**
           * AI analysis is an optional secondary intelligence
           * layer.
           *
           * Submitted content is transmitted only to the secure
           * AI backend for the current inference request.
           *
           * aiAnalysisService returns an "unavailable" result
           * when the backend cannot be reached, so AI failure
           * does not break the completed local scan.
           */
          const aiAnalysis =
            await analyzeWithAI({
              scanId:
                finalScanRecord.id,

              scanType,

              content,

              /**
               * The provider adapter forwards only the approved
               * local-analysis context.
               */
              localAnalysis:
                result.analysis,
            });

          setLastScan(
            finalScanRecord
          );

          /**
           * Reload local history so synchronization status and
           * statistics match repository state.
           */
          await refreshHistory({
            showRefreshIndicator:
              false,
          });

          /**
           * Return both local and AI analysis while preserving
           * the scanner result contract.
           */
          return {
            ...result,

            scanRecord:
              finalScanRecord,

            aiAnalysis,

            syncSucceeded,

            syncDeferred:
              !uid ||
              !syncSucceeded,
          };
        } catch (
          submissionError
        ) {
          const message =
            getErrorMessage(
              submissionError
            );

          setError(message);

          throw submissionError;
        } finally {
          setIsSubmitting(
            false
          );
        }
      },
      [
        uid,
        refreshHistory,
      ]
    );

  /**
   * ============================================================
   * retryPendingSync
   * ============================================================
   *
   * Manually retries all local scans still waiting for Firestore
   * synchronization.
   */
  const retryPendingSync =
    useCallback(
      async () => {
        if (!uid) {
          const message =
            "Firebase Authentication is not ready yet.";

          setSyncError(
            message
          );

          return {
            attempted: 0,
            synchronized: 0,
            failed: 0,
            failures: [],
          };
        }

        setIsSyncing(
          true
        );

        setSyncError(null);

        try {
          const summary =
            await syncPendingScans(
              uid
            );

          setLastSyncSummary(
            summary
          );

          await refreshHistory({
            showRefreshIndicator:
              false,
          });

          return summary;
        } catch (
          synchronizationError
        ) {
          setSyncError(
            getErrorMessage(
              synchronizationError
            )
          );

          throw synchronizationError;
        } finally {
          setIsSyncing(
            false
          );
        }
      },
      [
        uid,
        refreshHistory,
      ]
    );

  /**
   * ============================================================
   * removeScan
   * ============================================================
   *
   * Permanently removes one scan from SEBAShield history.
   *
   * Security policy:
   *
   * 1. Firebase authentication must be fully available.
   * 2. Delete the matching Firestore record first.
   * 3. Delete the encrypted local record only after the cloud
   *    deletion succeeds.
   * 4. Refresh local history and statistics.
   *
   * SEBAShield intentionally refuses local-only deletion while
   * authentication is unavailable. This prevents the interface
   * from reporting a successful permanent deletion while a cloud
   * copy may still exist.
   */
  const removeScan =
    useCallback(
      async (scanId) => {
        setIsManagingHistory(
          true
        );

        setError(null);

        try {
          /**
           * Do not delete history unless the current Firebase
           * identity can authorize the cloud deletion.
           */
          if (
            isAuthInitializing ||
            !isAuthenticated ||
            !uid
          ) {
            const message =
              "Firebase authentication is not available yet. SEBAShield kept this scan so cloud deletion can be verified. Please reconnect or reopen the app and try again.";

            setError(message);

            throw new Error(
              message
            );
          }

          /**
           * Delete the Firestore record first.
           *
           * This works for both normal local records and cloud-only
           * history records restored after account sign-in.
           */
          await deleteScanFromFirestore(
            uid,
            scanId
          );

          /**
           * Remove the encrypted local record when one exists.
           *
           * Cloud-only records intentionally have no local copy, so
           * deleteScan() may return false. That is not a failure:
           * the authoritative cloud deletion already succeeded.
           */
          await deleteScan(
            scanId
          );

          if (
            lastScan?.id ===
            scanId
          ) {
            setLastScan(
              null
            );
          }

          /**
           * Rebuild combined local + cloud history. The deleted
           * cloud-only record will disappear immediately.
           */
          await refreshHistory({
            showRefreshIndicator:
              false,
          });

          return true;
        } catch (
          deleteError
        ) {
          /**
           * Authentication/cloud failures preserve any encrypted
           * local copy so deletion can be retried safely.
           */
          setError(
            getErrorMessage(
              deleteError
            )
          );

          throw deleteError;
        } finally {
          setIsManagingHistory(
            false
          );
        }
      },
      [
        uid,
        isAuthenticated,
        isAuthInitializing,
        lastScan,
        refreshHistory,
      ]
    );

  /**
   * ============================================================
   * clearAllHistory
   * ============================================================
   *
   * Permanently clears the authenticated user's complete
   * SEBAShield scan history.
   *
   * Security policy:
   *
   * 1. Firebase authentication must be available.
   * 2. Retrieve all Firestore scan records for the user.
   * 3. Delete every cloud record.
   * 4. Clear encrypted local history.
   * 5. Reset in-memory application state.
   *
   * If authentication or any cloud deletion fails, local history
   * is preserved so the operation can be retried safely.
   */
  const clearAllHistory =
    useCallback(
      async () => {
        setIsManagingHistory(
          true
        );

        setError(null);

        try {
          /**
           * A complete-history deletion must not proceed locally
           * unless SEBAShield can verify and delete cloud records.
           */
          if (
            isAuthInitializing ||
            !isAuthenticated ||
            !uid
          ) {
            const message =
              "Firebase authentication is not available yet. SEBAShield kept your history so cloud deletion can be verified. Please reconnect or reopen the app and try again.";

            setError(message);

            throw new Error(
              message
            );
          }

          /**
           * Retrieve every cloud scan associated with the current
           * Firebase identity.
           *
           * This also finds older cloud records that may no longer
           * be represented in local history.
           */
          const cloudScans =
            await getUserScansFromFirestore(
              uid
            );

          /**
           * Delete sequentially.
           *
           * A retry after partial completion is safe because
           * Firestore document deletion is idempotent.
           */
          for (
            const cloudScan
            of cloudScans
          ) {
            if (
              typeof cloudScan?.id !==
                "string" ||
              !cloudScan.id.trim()
            ) {
              continue;
            }

            await deleteScanFromFirestore(
              uid,
              cloudScan.id
            );
          }

          /**
           * Cloud deletion completed successfully.
           *
           * clearHistory() now removes:
           * - encrypted AsyncStorage history;
           * - local schema metadata;
           * - the SecureStore AES key.
           */
          await clearHistory();

          setScans([]);

          setLastScan(
            null
          );

          setStatistics({
            ...DEFAULT_STATISTICS,
          });

          return true;
        } catch (
          clearHistoryError
        ) {
          /**
           * Preserve encrypted local history whenever permanent
           * cloud deletion cannot be verified.
           */
          setError(
            getErrorMessage(
              clearHistoryError
            )
          );

          throw clearHistoryError;
        } finally {
          setIsManagingHistory(
            false
          );
        }
      },
      [
        uid,
        isAuthenticated,
        isAuthInitializing,
      ]
    );

  /**
   * ============================================================
   * findScanById
   * ============================================================
   *
   * Finds one locally loaded scan.
   */
  const findScanById =
    useCallback(
      (scanId) =>
        scans.find(
          (scan) =>
            scan.id ===
            scanId
        ) ?? null,
      [
        scans,
      ]
    );

  /**
   * Combined busy state for UI components.
   */
  const isBusy =
    isInitializing ||
    isRefreshing ||
    isSubmitting ||
    isManagingHistory ||
    isSyncing;

  /**
   * ============================================================
   * Context Value
   * ============================================================
   *
   * Memoizing the context prevents unnecessary rerenders of
   * consumers when unrelated values have not changed.
   */
  const contextValue =
    useMemo(
      () => ({
        /**
         * Scan data.
         */
        scans,

        lastScan,

        statistics,

        /**
         * Firebase ownership information.
         */
        ownerId:
          uid ?? null,

        isCloudAuthenticated:
          Boolean(uid),

        /**
         * Operation states.
         */
        isInitializing,

        isRefreshing,

        isSubmitting,

        isManagingHistory,

        isSyncing,

        isBusy,

        /**
         * Errors and synchronization status.
         */
        error,

        syncError,

        lastSyncSummary,

        /**
         * Scan actions.
         */
        submitNewScan,

        refreshHistory,

        retryPendingSync,

        /**
         * History actions.
         */
        removeScan,

        clearAllHistory,

        findScanById,

        /**
         * Utility actions.
         */
        clearError,

        clearSyncError,

        setLastScan,
      }),
      [
        scans,
        lastScan,
        statistics,
        uid,

        isInitializing,
        isRefreshing,
        isSubmitting,
        isManagingHistory,
        isSyncing,
        isBusy,

        error,
        syncError,
        lastSyncSummary,

        submitNewScan,
        refreshHistory,
        retryPendingSync,
        removeScan,
        clearAllHistory,
        findScanById,
        clearError,
        clearSyncError,
      ]
    );

  return (
    <ScanContext.Provider
      value={
        contextValue
      }
    >
      {children}
    </ScanContext.Provider>
  );
}

/**
 * ============================================================
 * useScan
 * ============================================================
 *
 * Custom hook used by SEBAShield screens and components.
 *
 * Throws an explicit error when used outside ScanProvider so
 * configuration mistakes are detected early.
 */
export function useScan() {
  const context =
    useContext(
      ScanContext
    );

  if (!context) {
    throw new Error(
      "useScan must be used inside ScanProvider."
    );
  }

  return context;
}

export default ScanContext;