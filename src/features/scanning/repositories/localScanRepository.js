/**
 * ============================================================
 * SEBAShield
 * Encrypted Local Scan Repository
 * ============================================================
 *
 * Purpose:
 * Provides the single approved interface for storing, retrieving,
 * updating, and deleting private scan history on the device.
 *
 * Security design:
 * - Raw scan history is encrypted before entering AsyncStorage.
 * - AES-256-GCM provides confidentiality and integrity.
 * - The AES key is stored separately in Expo SecureStore.
 * - A fresh AES-GCM nonce is generated for every write.
 * - Previous plaintext AsyncStorage history is migrated
 *   automatically after the first successful read.
 *
 * Architectural responsibility:
 * - This repository handles local persistence only.
 * - It does not perform scan analysis.
 * - It does not communicate with Firebase.
 * - It does not manage React state or navigation.
 *
 * Offline-first design:
 * Every completed scan is saved locally before cloud
 * synchronization is attempted.
 * ============================================================
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as SecureStore from "expo-secure-store";

import {
  AESEncryptionKey,
  AESKeySize,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from "expo-crypto";

import {
  createScanRecord,
  generateScanId,
  isValidScanRecord,
  SCAN_TYPES,
  SYNC_STATUS,
} from "../models/scanModel";

/**
 * Main history key.
 *
 * The existing key is intentionally preserved so previous
 * plaintext installations can be migrated automatically.
 */
export const HISTORY_STORAGE_KEY =
  "@sebashield_scan_history";

/**
 * Metadata key describing the current local-storage schema.
 */
const STORAGE_VERSION_KEY =
  "@sebashield_storage_schema_version";

/**
 * Current encrypted local-storage schema.
 *
 * Version 1:
 *   Plain JSON array stored directly in AsyncStorage.
 *
 * Version 2:
 *   AES-256-GCM encrypted JSON payload.
 */
export const LOCAL_STORAGE_SCHEMA_VERSION = 2;

/**
 * SecureStore key containing only the AES encryption key.
 *
 * SecureStore keys cannot contain arbitrary characters, so this
 * identifier uses supported characters only.
 */
const ENCRYPTION_KEY_STORAGE_KEY =
  "sebashield.local-history.encryption-key.v2";

/**
 * Versioned encrypted-envelope identifier.
 */
const ENCRYPTED_HISTORY_FORMAT =
  "sebashield.encrypted-history";

/**
 * Encryption algorithm recorded in the envelope.
 */
const ENCRYPTION_ALGORITHM =
  "AES-256-GCM";

/**
 * Additional authenticated data binds encrypted history to this
 * SEBAShield storage format.
 */
const ENCRYPTION_AAD_TEXT =
  "SEBAShield:local-history:v2";

/**
 * Cache the imported/generated AES key for the current process.
 *
 * The actual persistent key remains in SecureStore.
 */
let cachedEncryptionKey = null;
let encryptionKeyPromise = null;

/**
 * SecureStore configuration.
 *
 * On iOS, the key can only be retrieved while the device is
 * unlocked and is not intended to migrate to another device.
 *
 * requireAuthentication is intentionally not enabled because
 * SEBAShield needs normal background application access without
 * presenting a biometric dialog for every history operation.
 */
const SECURE_STORE_OPTIONS = {
  keychainAccessible:
    SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * Returns true when a value is a normal object.
 */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Converts text to UTF-8 bytes.
 */
function encodeUtf8(value) {
  return new TextEncoder().encode(value);
}

/**
 * Converts UTF-8 bytes back to text.
 */
function decodeUtf8(value) {
  return new TextDecoder().decode(value);
}

/**
 * Returns the additional authenticated data used for AES-GCM.
 */
function getEncryptionAad() {
  return encodeUtf8(
    ENCRYPTION_AAD_TEXT
  );
}

/**
 * Loads or creates the AES-256 encryption key.
 *
 * Only the key is stored in SecureStore. Scan history itself
 * remains in encrypted AsyncStorage.
 */
async function getOrCreateEncryptionKey() {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  if (encryptionKeyPromise) {
    return encryptionKeyPromise;
  }

  encryptionKeyPromise =
    (async () => {
      const secureStoreAvailable =
        await SecureStore.isAvailableAsync();

      if (!secureStoreAvailable) {
        throw new Error(
          "Secure local storage is unavailable on this device."
        );
      }

      const storedKey =
        await SecureStore.getItemAsync(
          ENCRYPTION_KEY_STORAGE_KEY,
          SECURE_STORE_OPTIONS
        );

      if (storedKey) {
        return AESEncryptionKey.import(
          storedKey,
          "base64"
        );
      }

      const generatedKey =
        await AESEncryptionKey.generate(
          AESKeySize.AES256
        );

      const encodedKey =
        await generatedKey.encoded(
          "base64"
        );

      await SecureStore.setItemAsync(
        ENCRYPTION_KEY_STORAGE_KEY,
        encodedKey,
        SECURE_STORE_OPTIONS
      );

      return generatedKey;
    })();

  try {
    cachedEncryptionKey =
      await encryptionKeyPromise;

    return cachedEncryptionKey;
  } finally {
    encryptionKeyPromise = null;
  }
}

/**
 * Converts an unknown value into a safe string array.
 *
 * Older scans may contain:
 * - string arrays;
 * - objects with message, label, or description properties;
 * - a single string;
 * - null or unsupported values.
 */
function normalizeTextArray(value) {
  if (typeof value === "string") {
    const trimmedValue =
      value.trim();

    return trimmedValue
      ? [trimmedValue]
      : [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (
        typeof item === "string"
      ) {
        return item.trim();
      }

      if (isPlainObject(item)) {
        const possibleText =
          item.message ??
          item.description ??
          item.label ??
          item.title ??
          item.text;

        return typeof possibleText ===
          "string"
          ? possibleText.trim()
          : "";
      }

      return "";
    })
    .filter(Boolean);
}

/**
 * Normalizes risk-level wording while preserving the analysis
 * result generated by the scanner.
 */
function normalizeRiskLevel(
  riskLevel
) {
  if (
    typeof riskLevel !== "string" ||
    !riskLevel.trim()
  ) {
    return "Unknown";
  }

  const normalizedValue =
    riskLevel
      .trim()
      .toLowerCase();

  const knownRiskLevels = {
    safe: "Safe",
    low: "Low",
    medium: "Medium",
    moderate: "Medium",
    high: "High",
    critical: "Critical",
    unknown: "Unknown",
  };

  return (
    knownRiskLevels[
      normalizedValue
    ] ?? riskLevel.trim()
  );
}

/**
 * Maps old scanner names to the standardized scan types.
 */
function normalizeLegacyScanType(
  scanType
) {
  const normalizedValue =
    typeof scanType === "string"
      ? scanType
          .trim()
          .toLowerCase()
      : "";

  const aliases = {
    message:
      SCAN_TYPES.MESSAGE,
    text:
      SCAN_TYPES.MESSAGE,
    sms:
      SCAN_TYPES.MESSAGE,
    email:
      SCAN_TYPES.MESSAGE,

    link:
      SCAN_TYPES.LINK,
    url:
      SCAN_TYPES.LINK,
    website:
      SCAN_TYPES.LINK,

    "fake-job":
      SCAN_TYPES.FAKE_JOB,
    fakejob:
      SCAN_TYPES.FAKE_JOB,
    fake_job:
      SCAN_TYPES.FAKE_JOB,
    job:
      SCAN_TYPES.FAKE_JOB,
  };

  return (
    aliases[normalizedValue] ??
    SCAN_TYPES.MESSAGE
  );
}

/**
 * Returns the most likely original content from a current or
 * legacy scan object.
 */
function getOriginalContent(
  record
) {
  const candidates = [
    record.originalContent,
    record.content,
    record.message,
    record.url,
    record.link,
    record.jobDescription,
    record.description,
  ];

  const matchedValue =
    candidates.find(
      (value) =>
        typeof value ===
          "string" &&
        value.trim()
    );

  return (
    matchedValue?.trim() ?? ""
  );
}

/**
 * Converts an older saved record into the current scan model.
 *
 * This protects existing user history after architecture upgrades.
 */
function normalizeLegacyRecord(
  record
) {
  if (!isPlainObject(record)) {
    return null;
  }

  if (
    isValidScanRecord(record)
  ) {
    return {
      ...record,

      details:
        isPlainObject(
          record.details
        )
          ? {
              ...record.details,
            }
          : {},
    };
  }

  try {
    const normalizedRecord =
      createScanRecord({
        id:
          typeof record.id ===
            "string" &&
          record.id.trim()
            ? record.id.trim()
            : generateScanId(),

        ownerId:
          typeof record.ownerId ===
            "string" &&
          record.ownerId.trim()
            ? record.ownerId.trim()
            : null,

        scanType:
          normalizeLegacyScanType(
            record.scanType ??
              record.type
          ),

        score:
          record.score ??
          record.riskScore ??
          record.totalScore ??
          0,

        riskLevel:
          normalizeRiskLevel(
            record.riskLevel ??
              record.risk ??
              record.level
          ),

        indicators:
          normalizeTextArray(
            record.indicators ??
              record.threats ??
              record.findings
          ),

        recommendations:
          normalizeTextArray(
            record.recommendations ??
              record.guidance ??
              record.actions
          ),

        originalContent:
          getOriginalContent(
            record
          ),

        details:
          isPlainObject(
            record.details
          )
            ? record.details
            : {},

        syncStatus:
          Object.values(
            SYNC_STATUS
          ).includes(
            record.syncStatus
          )
            ? record.syncStatus
            : SYNC_STATUS.PENDING,
      });

    /**
     * Preserve historical timestamps whenever possible.
     */
    return {
      ...normalizedRecord,

      createdAt:
        typeof record.createdAt ===
        "string"
          ? record.createdAt
          : normalizedRecord.createdAt,

      updatedAt:
        typeof record.updatedAt ===
        "string"
          ? record.updatedAt
          : normalizedRecord.updatedAt,
    };
  } catch (error) {
    console.warn(
      "SEBAShield skipped an invalid legacy scan record:",
      {
        name:
          error?.name ??
          "UnknownError",
      }
    );

    return null;
  }
}

/**
 * Sorts scans from newest to oldest.
 */
function sortScansNewestFirst(
  scans
) {
  return [...scans].sort(
    (
      firstScan,
      secondScan
    ) => {
      const firstDate =
        new Date(
          firstScan.createdAt
        ).getTime();

      const secondDate =
        new Date(
          secondScan.createdAt
        ).getTime();

      return (
        secondDate -
        firstDate
      );
    }
  );
}

/**
 * Determines whether a parsed AsyncStorage value is a
 * SEBAShield encrypted-history envelope.
 */
function isEncryptedEnvelope(
  value
) {
  return (
    isPlainObject(value) &&
    value.format ===
      ENCRYPTED_HISTORY_FORMAT &&
    value.schemaVersion ===
      LOCAL_STORAGE_SCHEMA_VERSION &&
    value.algorithm ===
      ENCRYPTION_ALGORITHM &&
    value.encoding ===
      "base64" &&
    typeof value.payload ===
      "string" &&
    Boolean(value.payload)
  );
}

/**
 * Encrypts a normalized history array using AES-256-GCM.
 */
async function encryptHistory(
  scans
) {
  const encryptionKey =
    await getOrCreateEncryptionKey();

  const plaintext =
    JSON.stringify(scans);

  const plaintextBytes =
    encodeUtf8(plaintext);

  /**
   * expo-crypto generates a fresh GCM nonce when no explicit
   * nonce is supplied.
   */
  const sealedData =
    await aesEncryptAsync(
      plaintextBytes,
      encryptionKey,
      {
        additionalData:
          getEncryptionAad(),
      }
    );

  /**
   * Combined representation contains:
   *
   * IV + ciphertext + authentication tag
   */
  const encryptedPayload =
    await sealedData.combined(
      "base64"
    );

  return {
    format:
      ENCRYPTED_HISTORY_FORMAT,

    schemaVersion:
      LOCAL_STORAGE_SCHEMA_VERSION,

    algorithm:
      ENCRYPTION_ALGORITHM,

    encoding:
      "base64",

    payload:
      encryptedPayload,
  };
}

/**
 * Decrypts an encrypted history envelope.
 *
 * AES-GCM authentication causes modified or corrupted ciphertext
 * to fail instead of returning silently altered history.
 */
async function decryptHistory(
  envelope
) {
  if (
    !isEncryptedEnvelope(
      envelope
    )
  ) {
    throw new Error(
      "Unsupported encrypted scan-history format."
    );
  }

  const encryptionKey =
    await getOrCreateEncryptionKey();

  const sealedData =
    AESSealedData.fromCombined(
      envelope.payload
    );

  const decryptedBytes =
    await aesDecryptAsync(
      sealedData,
      encryptionKey,
      {
        additionalData:
          getEncryptionAad(),

        output:
          "bytes",
      }
    );

  const decryptedText =
    decodeUtf8(
      decryptedBytes
    );

  const parsedHistory =
    JSON.parse(
      decryptedText
    );

  if (
    !Array.isArray(
      parsedHistory
    )
  ) {
    throw new Error(
      "Decrypted scan history has an invalid structure."
    );
  }

  return parsedHistory;
}

/**
 * Reads local history.
 *
 * Supported formats:
 *
 * 1. Legacy plaintext JSON array.
 * 2. Version-2 encrypted history envelope.
 *
 * Plaintext records are identified so getHistory() can migrate
 * them immediately after a successful read.
 */
async function readRawHistory() {
  const storedValue =
    await AsyncStorage.getItem(
      HISTORY_STORAGE_KEY
    );

  if (!storedValue) {
    return {
      history: [],
      requiresEncryptionMigration:
        false,
    };
  }

  let parsedValue;

  try {
    parsedValue =
      JSON.parse(
        storedValue
      );
  } catch {
    throw new Error(
      "Local scan history is corrupted or unreadable."
    );
  }

  /**
   * Previous SEBAShield versions stored the raw array directly.
   */
  if (
    Array.isArray(
      parsedValue
    )
  ) {
    return {
      history:
        parsedValue,

      requiresEncryptionMigration:
        true,
    };
  }

  /**
   * Current encrypted format.
   */
  if (
    isEncryptedEnvelope(
      parsedValue
    )
  ) {
    const decryptedHistory =
      await decryptHistory(
        parsedValue
      );

    return {
      history:
        decryptedHistory,

      requiresEncryptionMigration:
        false,
    };
  }

  throw new Error(
    "Local scan history uses an unsupported storage format."
  );
}

/**
 * Encrypts and writes the complete normalized history.
 *
 * No raw scan content is written directly to AsyncStorage.
 */
async function writeHistory(
  scans
) {
  if (!Array.isArray(scans)) {
    throw new TypeError(
      "Local scan history must be stored as an array."
    );
  }

  const encryptedEnvelope =
    await encryptHistory(
      scans
    );

  await AsyncStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify(
      encryptedEnvelope
    )
  );

  await AsyncStorage.setItem(
    STORAGE_VERSION_KEY,
    String(
      LOCAL_STORAGE_SCHEMA_VERSION
    )
  );
}

/**
 * Retrieves all locally stored scans.
 *
 * Legacy records are normalized automatically.
 *
 * Existing plaintext scan history is automatically rewritten as
 * AES-256-GCM ciphertext after a successful read.
 */
export async function getHistory() {
  try {
    const {
      history: rawHistory,
      requiresEncryptionMigration,
    } =
      await readRawHistory();

    const normalizedHistory =
      rawHistory
        .map(
          normalizeLegacyRecord
        )
        .filter(Boolean);

    const sortedHistory =
      sortScansNewestFirst(
        normalizedHistory
      );

    const rawSerialized =
      JSON.stringify(
        rawHistory
      );

    const normalizedSerialized =
      JSON.stringify(
        sortedHistory
      );

    /**
     * Rewrite when:
     *
     * - the old plaintext format was detected; or
     * - record normalization changed the history.
     */
    if (
      requiresEncryptionMigration ||
      rawSerialized !==
        normalizedSerialized
    ) {
      await writeHistory(
        sortedHistory
      );
    }

    return sortedHistory;
  } catch (error) {
    /**
     * Do not silently treat decryption failure as empty history.
     *
     * Returning [] here could allow a later save operation to
     * overwrite ciphertext that could not temporarily be read.
     */
    console.error(
      "SEBAShield could not securely load local scan history:",
      {
        name:
          error?.name ??
          "UnknownError",

        message:
          error?.message ??
          "Secure local history could not be read.",
      }
    );

    throw error;
  }
}

/**
 * Saves a completed scan locally.
 *
 * Existing scanner screens may pass either:
 *
 * - a standardized scan record; or
 * - a previous partial scan object.
 *
 * Both formats are accepted.
 */
export async function saveScan(
  scanData
) {
  if (
    !isPlainObject(
      scanData
    )
  ) {
    throw new TypeError(
      "A scan record must be provided as an object."
    );
  }

  try {
    const scanRecord =
      isValidScanRecord(
        scanData
      )
        ? {
            ...scanData,

            details:
              isPlainObject(
                scanData.details
              )
                ? {
                    ...scanData.details,
                  }
                : {},
          }
        : createScanRecord({
            id:
              typeof scanData.id ===
                "string" &&
              scanData.id.trim()
                ? scanData.id.trim()
                : generateScanId(),

            ownerId:
              typeof scanData.ownerId ===
                "string" &&
              scanData.ownerId.trim()
                ? scanData.ownerId.trim()
                : null,

            scanType:
              normalizeLegacyScanType(
                scanData.scanType ??
                  scanData.type
              ),

            score:
              scanData.score ??
              scanData.riskScore ??
              scanData.totalScore ??
              0,

            riskLevel:
              normalizeRiskLevel(
                scanData.riskLevel ??
                  scanData.risk ??
                  scanData.level
              ),

            indicators:
              normalizeTextArray(
                scanData.indicators ??
                  scanData.threats ??
                  scanData.findings
              ),

            recommendations:
              normalizeTextArray(
                scanData.recommendations ??
                  scanData.guidance ??
                  scanData.actions
              ),

            originalContent:
              getOriginalContent(
                scanData
              ),

            details:
              isPlainObject(
                scanData.details
              )
                ? scanData.details
                : {},

            syncStatus:
              Object.values(
                SYNC_STATUS
              ).includes(
                scanData.syncStatus
              )
                ? scanData.syncStatus
                : SYNC_STATUS.PENDING,
          });

    const existingHistory =
      await getHistory();

    /**
     * Replace an existing record with the same ID rather than
     * creating a duplicate.
     */
    const historyWithoutDuplicate =
      existingHistory.filter(
        (
          existingScan
        ) =>
          existingScan.id !==
          scanRecord.id
      );

    const updatedHistory =
      sortScansNewestFirst([
        scanRecord,
        ...historyWithoutDuplicate,
      ]);

    await writeHistory(
      updatedHistory
    );

    return scanRecord;
  } catch (error) {
    console.error(
      "SEBAShield could not securely save the scan locally:",
      {
        name:
          error?.name ??
          "UnknownError",

        message:
          error?.message ??
          "Secure local history could not be written.",
      }
    );

    throw error;
  }
}

/**
 * Retrieves a single local scan by its unique ID.
 */
export async function getScanById(
  scanId
) {
  if (
    typeof scanId !==
      "string" ||
    !scanId.trim()
  ) {
    return null;
  }

  const history =
    await getHistory();

  return (
    history.find(
      (scan) =>
        scan.id ===
        scanId.trim()
    ) ?? null
  );
}

/**
 * Replaces one existing scan record.
 */
export async function updateScan(
  updatedScan
) {
  if (
    !isValidScanRecord(
      updatedScan
    )
  ) {
    throw new Error(
      "Cannot update an invalid SEBAShield scan record."
    );
  }

  const history =
    await getHistory();

  const scanExists =
    history.some(
      (scan) =>
        scan.id ===
        updatedScan.id
    );

  if (!scanExists) {
    throw new Error(
      `Local scan was not found: ${updatedScan.id}`
    );
  }

  const updatedHistory =
    history.map(
      (scan) =>
        scan.id ===
        updatedScan.id
          ? {
              ...updatedScan,

              updatedAt:
                new Date().toISOString(),
            }
          : scan
    );

  await writeHistory(
    sortScansNewestFirst(
      updatedHistory
    )
  );

  return (
    updatedHistory.find(
      (scan) =>
        scan.id ===
        updatedScan.id
    ) ?? null
  );
}

/**
 * Updates only synchronization-related fields of one scan.
 */
export async function updateLocalSyncStatus(
  scanId,
  syncStatus,
  ownerId = null
) {
  if (
    !Object.values(
      SYNC_STATUS
    ).includes(
      syncStatus
    )
  ) {
    throw new Error(
      `Unsupported synchronization status: ${syncStatus}`
    );
  }

  const existingScan =
    await getScanById(
      scanId
    );

  if (!existingScan) {
    throw new Error(
      `Local scan was not found: ${scanId}`
    );
  }

  return updateScan({
    ...existingScan,

    ownerId:
      ownerId ??
      existingScan.ownerId ??
      null,

    syncStatus,

    updatedAt:
      new Date().toISOString(),
  });
}

/**
 * Returns scans waiting for Firebase synchronization.
 */
export async function getPendingScans() {
  const history =
    await getHistory();

  return history.filter(
    (scan) =>
      scan.syncStatus ===
        SYNC_STATUS.PENDING ||
      scan.syncStatus ===
        SYNC_STATUS.FAILED
  );
}

/**
 * Deletes one scan from local history.
 *
 * @returns {Promise<boolean>}
 */
export async function deleteScan(
  scanId
) {
  if (
    typeof scanId !==
      "string" ||
    !scanId.trim()
  ) {
    return false;
  }

  const history =
    await getHistory();

  const updatedHistory =
    history.filter(
      (scan) =>
        scan.id !==
        scanId.trim()
    );

  if (
    updatedHistory.length ===
    history.length
  ) {
    return false;
  }

  await writeHistory(
    updatedHistory
  );

  return true;
}

/**
 * Deletes the complete local scan history.
 *
 * The encryption key is also deleted after the encrypted
 * AsyncStorage record has been removed. This provides
 * cryptographic cleanup in addition to storage deletion.
 */
export async function clearHistory() {
  try {
    /**
     * Remove encrypted data first.
     *
     * If SecureStore key deletion later fails, no local history
     * ciphertext remains accessible through this repository.
     */
    await AsyncStorage.multiRemove([
      HISTORY_STORAGE_KEY,
      STORAGE_VERSION_KEY,
    ]);

    await SecureStore.deleteItemAsync(
      ENCRYPTION_KEY_STORAGE_KEY,
      SECURE_STORE_OPTIONS
    );

    cachedEncryptionKey =
      null;

    encryptionKeyPromise =
      null;

    return true;
  } catch (error) {
    console.error(
      "SEBAShield could not securely clear local scan history:",
      {
        name:
          error?.name ??
          "UnknownError",

        message:
          error?.message ??
          "Secure local history could not be cleared.",
      }
    );

    throw error;
  }
}

/**
 * Generates summary statistics for the dashboard and history UI.
 */
export async function getHistoryStatistics() {
  const history =
    await getHistory();

  return history.reduce(
    (
      statistics,
      scan
    ) => {
      statistics.total += 1;

      const riskLevel =
        scan.riskLevel.toLowerCase();

      if (
        riskLevel === "high" ||
        riskLevel ===
          "critical"
      ) {
        statistics.highRisk +=
          1;
      } else if (
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

      if (
        scan.syncStatus ===
        SYNC_STATUS.SYNCED
      ) {
        statistics.synced +=
          1;
      }

      if (
        scan.syncStatus ===
          SYNC_STATUS.PENDING ||
        scan.syncStatus ===
          SYNC_STATUS.FAILED
      ) {
        statistics.pendingSync +=
          1;
      }

      return statistics;
    },
    {
      total: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      synced: 0,
      pendingSync: 0,
    }
  );
}