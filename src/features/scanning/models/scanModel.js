/**
 * ============================================================
 * SEBAShield
 * Standard Scan Model
 * ============================================================
 *
 * Purpose:
 * Defines the provider-independent, standardized structure used
 * by every SEBAShield scan.
 *
 * Supported scanners:
 * - Message Scanner
 * - Link Checker
 * - Fake Job Detector
 *
 * The standardized model supports:
 * - Local scan persistence
 * - Local scan history
 * - Firebase synchronization
 * - AI-assisted analysis
 * - Future threat-intelligence integrations
 * - Consistent synchronization state tracking
 *
 * Privacy Architecture:
 *
 * Local device:
 * - May retain the complete submitted content.
 * - May retain human-readable indicators.
 * - May retain recommendations and analyzer details.
 *
 * Firestore:
 * - Does NOT receive submitted content.
 * - Does NOT receive content previews.
 * - Does NOT receive free-text indicator descriptions.
 * - Does NOT receive recommendations.
 * - Does NOT receive analyzer details.
 * - Receives only privacy-minimized scan metadata and
 *   standardized indicator category codes.
 *
 * This separation reduces the possibility that sensitive
 * submitted content could be reconstructed indirectly from
 * cloud-synchronized analysis fields.
 * ============================================================
 */

/**
 * ============================================================
 * Scan Types
 * ============================================================
 *
 * Every scanner must use one of these standardized values.
 */
export const SCAN_TYPES =
  Object.freeze({
    MESSAGE: "message",
    LINK: "link",
    FAKE_JOB: "fake-job",
  });

/**
 * ============================================================
 * Synchronization States
 * ============================================================
 *
 * Tracks the local Firebase synchronization lifecycle.
 */
export const SYNC_STATUS =
  Object.freeze({
    PENDING: "pending",
    SYNCED: "synced",
    FAILED: "failed",
    LOCAL_ONLY: "local-only",
  });

/**
 * Version of the local analyzer / scan-record contract.
 *
 * Increment this value when the local scan structure changes
 * in a breaking way.
 */
export const ANALYZER_VERSION =
  "1.0.0";

/**
 * Version of the privacy-minimized cloud-record contract.
 *
 * Version 2 removes free-text indicators, recommendations,
 * details, and content previews from Firestore.
 */
export const CLOUD_SCHEMA_VERSION =
  "2.0.0";

/**
 * ============================================================
 * Privacy-Safe Cloud Indicator Codes
 * ============================================================
 *
 * Firestore should not receive human-readable findings because
 * those findings could accidentally contain:
 *
 * - message fragments,
 * - email addresses,
 * - URLs,
 * - domains,
 * - phone numbers,
 * - employer names,
 * - recruiter names,
 * - payment amounts,
 * - or other user-submitted information.
 *
 * Instead, local findings are converted into generic security
 * category codes before synchronization.
 *
 * The local scan record remains unchanged and continues to hold
 * the user-friendly descriptions required by the UI.
 */
export const CLOUD_INDICATOR_CODES =
  Object.freeze({
    URGENCY_LANGUAGE:
      "URGENCY_LANGUAGE",

    PAYMENT_REQUEST:
      "PAYMENT_REQUEST",

    SENSITIVE_INFO_REQUEST:
      "SENSITIVE_INFO_REQUEST",

    CREDENTIAL_REQUEST:
      "CREDENTIAL_REQUEST",

    ACCOUNT_THREAT:
      "ACCOUNT_THREAT",

    SUSPICIOUS_LINK:
      "SUSPICIOUS_LINK",

    SUSPICIOUS_DOMAIN:
      "SUSPICIOUS_DOMAIN",

    SHORTENED_LINK:
      "SHORTENED_LINK",

    IMPERSONATION:
      "IMPERSONATION",

    GUARANTEED_SELECTION:
      "GUARANTEED_SELECTION",

    NO_INTERVIEW_HIRING:
      "NO_INTERVIEW_HIRING",

    UNUSUAL_COMPENSATION:
      "UNUSUAL_COMPENSATION",

    REMOTE_JOB_LURE:
      "REMOTE_JOB_LURE",

    EXTERNAL_MESSAGING_REQUEST:
      "EXTERNAL_MESSAGING_REQUEST",

    CRYPTOCURRENCY_REQUEST:
      "CRYPTOCURRENCY_REQUEST",

    GIFT_CARD_REQUEST:
      "GIFT_CARD_REQUEST",

    OTHER_RISK_INDICATOR:
      "OTHER_RISK_INDICATOR",
  });

/**
 * ============================================================
 * generateScanId
 * ============================================================
 *
 * Creates a unique local scan identifier without requiring an
 * external dependency.
 *
 * The same identifier can also be used as the Firestore
 * document ID, which helps prevent duplicate records during
 * synchronization retries.
 *
 * @returns {string}
 */
export function generateScanId() {
  const timestamp =
    Date.now().toString(36);

  const randomValue =
    Math.random()
      .toString(36)
      .slice(2, 10);

  return (
    `scan_${timestamp}_${randomValue}`
  );
}

/**
 * ============================================================
 * normalizeScore
 * ============================================================
 *
 * Converts a score into a whole number between 0 and 100.
 *
 * Invalid values safely fall back to 0.
 *
 * @param {*} score
 * @returns {number}
 */
function normalizeScore(score) {
  const numericScore =
    Number(score);

  if (
    !Number.isFinite(
      numericScore
    )
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        numericScore
      )
    )
  );
}

/**
 * ============================================================
 * normalizeStringArray
 * ============================================================
 *
 * Converts a value into a clean string array.
 *
 * Invalid values, blank strings, and unsupported values are
 * removed.
 *
 * @param {*} value
 * @returns {string[]}
 */
function normalizeStringArray(
  value
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item) =>
        typeof item ===
        "string"
    )
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}

/**
 * ============================================================
 * createContentPreview
 * ============================================================
 *
 * Creates a shortened local preview of submitted content.
 *
 * The preview is useful for local history cards.
 *
 * Important:
 * Content previews are local-only and are deliberately excluded
 * from the privacy-minimized Firestore representation.
 *
 * @param {*} content
 * @param {number} maximumLength
 * @returns {string}
 */
export function createContentPreview(
  content,
  maximumLength = 160
) {
  if (
    typeof content !==
    "string"
  ) {
    return "";
  }

  const normalizedContent =
    content
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (
    normalizedContent.length <=
    maximumLength
  ) {
    return normalizedContent;
  }

  return (
    `${normalizedContent
      .slice(
        0,
        maximumLength
      )
      .trim()}…`
  );
}

/**
 * ============================================================
 * normalizeScanType
 * ============================================================
 *
 * Converts supported aliases into a standard SEBAShield
 * scan type.
 *
 * @param {*} scanType
 * @returns {string|null}
 */
function normalizeScanType(
  scanType
) {
  const aliases = {
    message:
      SCAN_TYPES.MESSAGE,

    text:
      SCAN_TYPES.MESSAGE,

    link:
      SCAN_TYPES.LINK,

    url:
      SCAN_TYPES.LINK,

    "fake-job":
      SCAN_TYPES.FAKE_JOB,

    fakeJob:
      SCAN_TYPES.FAKE_JOB,

    job:
      SCAN_TYPES.FAKE_JOB,
  };

  return (
    aliases[scanType] ??
    null
  );
}

/**
 * ============================================================
 * createScanRecord
 * ============================================================
 *
 * Creates a complete local SEBAShield scan record.
 *
 * Local records may contain user-submitted content because they
 * support private device history and result presentation.
 *
 * Cloud synchronization must always pass the record through
 * toCloudScanRecord() before writing anything to Firestore.
 *
 * @param {Object} input
 * @param {string} input.scanType
 * @param {number} input.score
 * @param {string} input.riskLevel
 * @param {string[]} [input.indicators]
 * @param {string[]} [input.recommendations]
 * @param {string} [input.originalContent]
 * @param {Object} [input.details]
 * @param {string|null} [input.ownerId]
 * @param {string} [input.syncStatus]
 * @param {string} [input.id]
 * @returns {Object}
 */
export function createScanRecord({
  scanType,

  score,

  riskLevel,

  indicators = [],

  recommendations = [],

  originalContent = "",

  details = {},

  ownerId = null,

  syncStatus =
    SYNC_STATUS.PENDING,

  id = generateScanId(),
}) {
  const normalizedScanType =
    normalizeScanType(
      scanType
    );

  if (!normalizedScanType) {
    throw new Error(
      `Unsupported scan type: ${scanType}`
    );
  }

  const now =
    new Date()
      .toISOString();

  return {
    id,

    ownerId,

    scanType:
      normalizedScanType,

    score:
      normalizeScore(
        score
      ),

    riskLevel:
      typeof riskLevel ===
        "string" &&
      riskLevel.trim()
        ? riskLevel.trim()
        : "Unknown",

    /**
     * Human-readable local analyzer findings.
     *
     * These remain local and are converted to generic category
     * codes before Firestore synchronization.
     */
    indicators:
      normalizeStringArray(
        indicators
      ),

    /**
     * Local safety recommendations.
     *
     * Recommendations are intentionally excluded from Firestore.
     */
    recommendations:
      normalizeStringArray(
        recommendations
      ),

    /**
     * Complete submitted content.
     *
     * This is local-only and must never be included in the
     * Firestore serializer.
     */
    originalContent:
      typeof originalContent ===
        "string"
        ? originalContent.trim()
        : "",

    /**
     * Local history preview.
     *
     * This is also deliberately excluded from Firestore.
     */
    contentPreview:
      createContentPreview(
        originalContent
      ),

    /**
     * Analyzer-specific local metadata.
     *
     * This may contain implementation-specific information and
     * therefore remains local-only.
     */
    details:
      details &&
      typeof details ===
        "object" &&
      !Array.isArray(
        details
      )
        ? {
            ...details,
          }
        : {},

    createdAt:
      now,

    updatedAt:
      now,

    syncStatus,

    analyzerVersion:
      ANALYZER_VERSION,
  };
}

/**
 * ============================================================
 * isValidScanRecord
 * ============================================================
 *
 * Determines whether a local object contains the minimum fields
 * required by the standard SEBAShield scan model.
 *
 * @param {*} record
 * @returns {boolean}
 */
export function isValidScanRecord(
  record
) {
  if (
    !record ||
    typeof record !==
      "object"
  ) {
    return false;
  }

  const validTypes =
    Object.values(
      SCAN_TYPES
    );

  const validSyncStatuses =
    Object.values(
      SYNC_STATUS
    );

  return (
    typeof record.id ===
      "string" &&

    validTypes.includes(
      record.scanType
    ) &&

    typeof record.score ===
      "number" &&

    record.score >= 0 &&

    record.score <= 100 &&

    typeof record.riskLevel ===
      "string" &&

    Array.isArray(
      record.indicators
    ) &&

    Array.isArray(
      record.recommendations
    ) &&

    typeof record.createdAt ===
      "string" &&

    typeof record.updatedAt ===
      "string" &&

    validSyncStatuses.includes(
      record.syncStatus
    )
  );
}

/**
 * ============================================================
 * updateScanSyncStatus
 * ============================================================
 *
 * Returns an updated local copy of a scan after a cloud
 * synchronization attempt.
 *
 * @param {Object} record
 * @param {string} syncStatus
 * @param {string|null} ownerId
 * @returns {Object}
 */
export function updateScanSyncStatus(
  record,
  syncStatus,
  ownerId =
    record?.ownerId ??
    null
) {
  if (
    !isValidScanRecord(
      record
    )
  ) {
    throw new Error(
      "Cannot update an invalid scan record."
    );
  }

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

  return {
    ...record,

    ownerId,

    syncStatus,

    updatedAt:
      new Date()
        .toISOString(),
  };
}

/**
 * ============================================================
 * toCloudIndicatorCode
 * ============================================================
 *
 * Converts one human-readable local finding into a generic
 * privacy-safe cloud category.
 *
 * Important:
 * The original finding text is never returned by this function.
 *
 * If a finding cannot be confidently categorized, the generic
 * OTHER_RISK_INDICATOR value is used instead of synchronizing
 * the original text.
 *
 * @param {*} indicator
 * @returns {string|null}
 */
function toCloudIndicatorCode(
  indicator
) {
  if (
    typeof indicator !==
      "string" ||
    !indicator.trim()
  ) {
    return null;
  }

  const value =
    indicator
      .trim()
      .toLowerCase();

  /**
   * ----------------------------------------------------------
   * Gift-card requests
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "gift card"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .GIFT_CARD_REQUEST
    );
  }

  /**
   * ----------------------------------------------------------
   * Cryptocurrency requests
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "crypto"
    ) ||
    value.includes(
      "bitcoin"
    ) ||
    value.includes(
      "cryptocurrency"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .CRYPTOCURRENCY_REQUEST
    );
  }

  /**
   * ----------------------------------------------------------
   * Payment / fee requests
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "payment"
    ) ||
    value.includes(
      "fee"
    ) ||
    value.includes(
      "send money"
    ) ||
    value.includes(
      "transfer money"
    ) ||
    value.includes(
      "deposit"
    ) ||
    value.includes(
      "pay money"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .PAYMENT_REQUEST
    );
  }

  /**
   * ----------------------------------------------------------
   * Sensitive personal / financial information
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "banking"
    ) ||
    value.includes(
      "bank account"
    ) ||
    value.includes(
      "social insurance"
    ) ||
    value.includes(
      "personal information"
    ) ||
    value.includes(
      "financial information"
    ) ||
    value.includes(
      "identification"
    ) ||
    value.includes(
      "identity document"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .SENSITIVE_INFO_REQUEST
    );
  }

  /**
   * ----------------------------------------------------------
   * Credentials / authentication secrets
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "password"
    ) ||
    value.includes(
      "verification code"
    ) ||
    value.includes(
      "security code"
    ) ||
    value.includes(
      "credential"
    ) ||
    value.includes(
      "login information"
    ) ||
    value.includes(
      "one-time code"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .CREDENTIAL_REQUEST
    );
  }

  /**
   * ----------------------------------------------------------
   * Urgency / pressure tactics
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "urgent"
    ) ||
    value.includes(
      "urgency"
    ) ||
    value.includes(
      "immediately"
    ) ||
    value.includes(
      "act now"
    ) ||
    value.includes(
      "limited time"
    ) ||
    value.includes(
      "pressure"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .URGENCY_LANGUAGE
    );
  }

  /**
   * ----------------------------------------------------------
   * Account threats
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "account"
    ) &&
    (
      value.includes(
        "locked"
      ) ||
      value.includes(
        "suspended"
      ) ||
      value.includes(
        "closed"
      ) ||
      value.includes(
        "disabled"
      ) ||
      value.includes(
        "restricted"
      )
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .ACCOUNT_THREAT
    );
  }

  /**
   * ----------------------------------------------------------
   * Shortened URLs
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "shortened"
    ) ||
    value.includes(
      "url shortener"
    ) ||
    value.includes(
      "short link"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .SHORTENED_LINK
    );
  }

  /**
   * ----------------------------------------------------------
   * Suspicious domains
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "domain"
    ) ||
    value.includes(
      "tld"
    ) ||
    value.includes(
      "top-level domain"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .SUSPICIOUS_DOMAIN
    );
  }

  /**
   * ----------------------------------------------------------
   * Suspicious links
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "link"
    ) ||
    value.includes(
      "url"
    ) ||
    value.includes(
      "website"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .SUSPICIOUS_LINK
    );
  }

  /**
   * ----------------------------------------------------------
   * No-interview recruitment
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "no interview"
    ) ||
    value.includes(
      "without interview"
    ) ||
    value.includes(
      "interview was not"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .NO_INTERVIEW_HIRING
    );
  }

  /**
   * ----------------------------------------------------------
   * Guaranteed hiring / selection
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "guaranteed"
    ) ||
    value.includes(
      "selected"
    ) ||
    value.includes(
      "hired immediately"
    ) ||
    value.includes(
      "guaranteed selection"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .GUARANTEED_SELECTION
    );
  }

  /**
   * ----------------------------------------------------------
   * Unusually attractive compensation
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "salary"
    ) ||
    value.includes(
      "compensation"
    ) ||
    value.includes(
      "high pay"
    ) ||
    value.includes(
      "high income"
    ) ||
    value.includes(
      "unusually high"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .UNUSUAL_COMPENSATION
    );
  }

  /**
   * ----------------------------------------------------------
   * Remote-work lure
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "remote"
    ) ||
    value.includes(
      "work from home"
    ) ||
    value.includes(
      "work-at-home"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .REMOTE_JOB_LURE
    );
  }

  /**
   * ----------------------------------------------------------
   * External messaging platforms
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "whatsapp"
    ) ||
    value.includes(
      "telegram"
    ) ||
    value.includes(
      "signal"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .EXTERNAL_MESSAGING_REQUEST
    );
  }

  /**
   * ----------------------------------------------------------
   * Impersonation indicators
   * ----------------------------------------------------------
   */
  if (
    value.includes(
      "impersonat"
    ) ||
    value.includes(
      "pretending"
    ) ||
    value.includes(
      "masquerad"
    )
  ) {
    return (
      CLOUD_INDICATOR_CODES
        .IMPERSONATION
    );
  }

  /**
   * Unknown findings are represented generically.
   *
   * Never fall back to the original free-text finding.
   */
  return (
    CLOUD_INDICATOR_CODES
      .OTHER_RISK_INDICATOR
  );
}

/**
 * ============================================================
 * toCloudIndicatorCodes
 * ============================================================
 *
 * Converts local human-readable findings into a unique list of
 * privacy-safe cloud category codes.
 *
 * @param {*} indicators
 * @returns {string[]}
 */
function toCloudIndicatorCodes(
  indicators
) {
  const normalizedIndicators =
    normalizeStringArray(
      indicators
    );

  const codes =
    normalizedIndicators
      .map(
        toCloudIndicatorCode
      )
      .filter(Boolean);

  return [
    ...new Set(codes),
  ];
}

/**
 * ============================================================
 * toCloudScanRecord
 * ============================================================
 *
 * Creates the privacy-minimized Firestore representation of a
 * local SEBAShield scan.
 *
 * Firestore receives only explicitly approved fields.
 *
 * Deliberately excluded:
 *
 * - originalContent
 * - originalMessage
 * - originalUrl
 * - contentPreview
 * - human-readable indicator text
 * - recommendations
 * - analyzer details
 * - AI summaries
 * - AI explanations
 * - local synchronization status
 * - local synchronization errors
 *
 * Never replace this explicit allowlist with:
 *
 *     { ...record }
 *
 * because that could accidentally synchronize local-only or
 * sensitive fields added in future versions.
 *
 * @param {Object} record
 * @returns {Object}
 */
export function toCloudScanRecord(
  record
) {
  if (
    !isValidScanRecord(
      record
    )
  ) {
    throw new Error(
      "Cannot prepare an invalid scan for Firebase."
    );
  }

  /**
   * Explicit privacy allowlist.
   */
  const cloudRecord = {
    id:
      record.id,

    ownerId:
      record.ownerId ??
      null,

    scanType:
      record.scanType,

    score:
      normalizeScore(
        record.score
      ),

    riskLevel:
      typeof record.riskLevel ===
        "string" &&
      record.riskLevel.trim()
        ? record.riskLevel.trim()
        : "Unknown",

    /**
     * Only generic security categories are synchronized.
     *
     * Human-readable findings remain local.
     */
    indicatorCodes:
      toCloudIndicatorCodes(
        record.indicators
      ),

    analyzerVersion:
      typeof record
        .analyzerVersion ===
        "string" &&
      record.analyzerVersion
        .trim()
        ? record
            .analyzerVersion
            .trim()
        : ANALYZER_VERSION,

    /**
     * Identifies the privacy-minimized cloud contract.
     */
    cloudSchemaVersion:
      CLOUD_SCHEMA_VERSION,

    createdAt:
      record.createdAt,
  };

  /**
   * Preserve a valid update timestamp while still avoiding any
   * local-only scan content.
   */
  if (
    typeof record.updatedAt ===
      "string" &&
    record.updatedAt.trim()
  ) {
    cloudRecord.updatedAt =
      record.updatedAt;
  }

  return cloudRecord;
}