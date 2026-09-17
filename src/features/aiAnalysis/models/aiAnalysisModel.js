/**
 * ============================================================
 * SEBAShield
 * AI Analysis Model
 * ============================================================
 *
 * Purpose:
 * Defines the provider-independent data contract used by the
 * SEBAShield AI analysis feature.
 *
 * This abstraction allows SEBAShield to use different AI
 * providers without requiring changes to the scanning feature
 * or result-screen presentation logic.
 *
 * Possible providers include:
 * - Cloudflare Workers AI
 * - Google Gemini
 * - OpenAI
 * - Other future AI services
 *
 * Privacy:
 * Raw user-submitted messages, URLs, or job content are
 * deliberately NOT stored inside this AI analysis result model.
 *
 * An AI provider may receive submitted content transiently for
 * analysis, but this model contains only the resulting security
 * assessment and non-sensitive metadata.
 * ============================================================
 */

/**
 * Version of the AI-analysis result contract.
 *
 * Increment this value only when the shape of the exchanged
 * AI-analysis result changes in a breaking way.
 */
export const AI_ANALYSIS_VERSION =
  "1.0.0";

/**
 * Standard lifecycle states for an AI analysis request.
 */
export const AI_ANALYSIS_STATUS =
  Object.freeze({
    COMPLETED: "completed",
    UNAVAILABLE: "unavailable",
    FAILED: "failed",
  });

/**
 * Standard SEBAShield AI risk classifications.
 *
 * These labels intentionally align closely with the local
 * SEBAShield scanning terminology.
 */
export const AI_RISK_LEVELS =
  Object.freeze({
    SAFE: "Safe",
    LOW: "Low",
    SUSPICIOUS: "Suspicious",
    HIGH: "High Risk",
    CRITICAL: "Critical",
    UNKNOWN: "Unknown",
  });

/**
 * Returns true when the supplied value is a plain
 * JavaScript object.
 *
 * @param {*} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Normalizes a text value.
 *
 * Empty or invalid values are replaced with the supplied
 * fallback value.
 *
 * @param {*} value
 * @param {string} fallback
 * @returns {string}
 */
function normalizeText(
  value,
  fallback = ""
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return fallback;
  }

  return value.trim();
}

/**
 * Normalizes an array of strings.
 *
 * Supported items:
 * - Plain strings
 * - Objects containing a common text field
 *
 * Empty entries and duplicate values are removed while
 * preserving their original order.
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

  const normalizedValues =
    value
      .map((item) => {
        if (
          typeof item ===
          "string"
        ) {
          return item.trim();
        }

        if (
          isPlainObject(item)
        ) {
          const text =
            item.message ??
            item.description ??
            item.label ??
            item.title ??
            item.text;

          return typeof text ===
            "string"
            ? text.trim()
            : "";
        }

        return "";
      })
      .filter(Boolean);

  return [
    ...new Set(
      normalizedValues
    ),
  ];
}

/**
 * ============================================================
 * normalizeConfidence
 * ============================================================
 *
 * Converts AI-provider confidence values into a consistent
 * whole-number percentage from 0 through 100.
 *
 * Different providers may return confidence using different
 * conventions:
 *
 * Decimal probability:
 *   0.95  -> 95
 *   0.82  -> 82
 *   1.0   -> 100
 *
 * Percentage:
 *   95    -> 95
 *   82    -> 82
 *
 * Percentage string:
 *   "95%" -> 95
 *
 * Numeric string:
 *   "0.95" -> 95
 *   "82"   -> 82
 *
 * Invalid values safely fall back to 0.
 *
 * Important:
 * Confidence is a model-generated assessment value. It does
 * not represent certainty that the security classification
 * is correct.
 *
 * @param {number|string} value
 * @returns {number}
 */
function normalizeConfidence(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  /**
   * Detect an explicitly formatted percentage before removing
   * the percent sign.
   *
   * This prevents "0.95%" from being incorrectly interpreted
   * as decimal probability 0.95 -> 95%.
   */
  const isPercentageString =
    typeof value === "string" &&
    value.trim().endsWith(
      "%"
    );

  const normalizedInput =
    typeof value === "string"
      ? value
          .trim()
          .replace(
            /%$/,
            ""
          )
      : value;

  const numericValue =
    Number(
      normalizedInput
    );

  /**
   * Reject NaN, Infinity, and other non-numeric values.
   */
  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return 0;
  }

  /**
   * Confidence cannot be negative.
   */
  if (numericValue < 0) {
    return 0;
  }

  let percentageValue;

  /**
   * Explicit percentage strings already represent percentage
   * values and therefore must not be multiplied by 100.
   *
   * Example:
   * "95%" -> 95
   */
  if (isPercentageString) {
    percentageValue =
      numericValue;
  } else {
    /**
     * Values between 0 and 1 are interpreted as decimal
     * probabilities.
     *
     * Examples:
     * 0.95 -> 95
     * 0.7  -> 70
     * 1.0  -> 100
     *
     * Values above 1 are interpreted as percentages.
     *
     * Example:
     * 92 -> 92
     */
    percentageValue =
      numericValue <= 1
        ? numericValue * 100
        : numericValue;
  }

  /**
   * Clamp the final result to the supported range and return
   * a whole-number value for consistent UI presentation.
   */
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        percentageValue
      )
    )
  );
}

/**
 * ============================================================
 * normalizeAIRiskLevel
 * ============================================================
 *
 * Converts common provider-specific risk labels into the
 * standardized SEBAShield AI risk-level contract.
 *
 * @param {*} riskLevel
 * @returns {string}
 */
export function normalizeAIRiskLevel(
  riskLevel
) {
  if (
    typeof riskLevel !==
      "string" ||
    !riskLevel.trim()
  ) {
    return (
      AI_RISK_LEVELS.UNKNOWN
    );
  }

  const normalizedValue =
    riskLevel
      .trim()
      .toLowerCase();

  const aliases = {
    safe:
      AI_RISK_LEVELS.SAFE,

    legitimate:
      AI_RISK_LEVELS.SAFE,

    low:
      AI_RISK_LEVELS.LOW,

    "low risk":
      AI_RISK_LEVELS.LOW,

    medium:
      AI_RISK_LEVELS
        .SUSPICIOUS,

    moderate:
      AI_RISK_LEVELS
        .SUSPICIOUS,

    suspicious:
      AI_RISK_LEVELS
        .SUSPICIOUS,

    "medium risk":
      AI_RISK_LEVELS
        .SUSPICIOUS,

    high:
      AI_RISK_LEVELS.HIGH,

    "high risk":
      AI_RISK_LEVELS.HIGH,

    dangerous:
      AI_RISK_LEVELS.HIGH,

    critical:
      AI_RISK_LEVELS
        .CRITICAL,

    severe:
      AI_RISK_LEVELS
        .CRITICAL,

    unknown:
      AI_RISK_LEVELS
        .UNKNOWN,
  };

  return (
    aliases[
      normalizedValue
    ] ??
    AI_RISK_LEVELS.UNKNOWN
  );
}

/**
 * ============================================================
 * normalizeStatus
 * ============================================================
 *
 * Ensures that the AI-analysis lifecycle status belongs to
 * the supported SEBAShield contract.
 *
 * Unknown status values default to "completed" because this
 * helper is primarily used when constructing successful
 * analysis objects.
 *
 * @param {*} status
 * @returns {string}
 */
function normalizeStatus(
  status
) {
  const supportedStatuses =
    Object.values(
      AI_ANALYSIS_STATUS
    );

  if (
    typeof status ===
      "string" &&
    supportedStatuses.includes(
      status
        .trim()
        .toLowerCase()
    )
  ) {
    return status
      .trim()
      .toLowerCase();
  }

  return (
    AI_ANALYSIS_STATUS
      .COMPLETED
  );
}

/**
 * ============================================================
 * createAIAnalysisResult
 * ============================================================
 *
 * Creates a standardized AI security-analysis result.
 *
 * This function is the primary normalization boundary between
 * an external AI provider and the rest of SEBAShield.
 *
 * Raw submitted content must NEVER be passed into or added to
 * the returned analysis result.
 */
export function createAIAnalysisResult({
  scanId = null,

  scanType,

  riskLevel =
    AI_RISK_LEVELS.UNKNOWN,

  confidence = 0,

  summary = "",

  indicators = [],

  recommendations = [],

  explanation = "",

  provider = "unknown",

  model = "unknown",

  status =
    AI_ANALYSIS_STATUS
      .COMPLETED,

  analyzedAt =
    new Date().toISOString(),

  metadata = {},
} = {}) {
  return {
    /**
     * Optional reference to the associated local
     * SEBAShield scan record.
     */
    scanId:
      typeof scanId ===
        "string" &&
      scanId.trim()
        ? scanId.trim()
        : null,

    /**
     * Type of content analyzed.
     *
     * Expected values include:
     * - message
     * - link
     * - fake-job
     */
    scanType:
      normalizeText(
        scanType,
        "unknown"
      ),

    /**
     * Standardized SEBAShield AI risk classification.
     */
    riskLevel:
      normalizeAIRiskLevel(
        riskLevel
      ),

    /**
     * AI confidence expressed as a whole-number
     * percentage from 0 through 100.
     */
    confidence:
      normalizeConfidence(
        confidence
      ),

    /**
     * Short human-readable assessment.
     */
    summary:
      normalizeText(
        summary
      ),

    /**
     * Security warning signs identified by the AI provider.
     */
    indicators:
      normalizeStringArray(
        indicators
      ),

    /**
     * Recommended protective actions.
     */
    recommendations:
      normalizeStringArray(
        recommendations
      ),

    /**
     * Optional explanation describing why the AI reached
     * the assessment.
     */
    explanation:
      normalizeText(
        explanation
      ),

    /**
     * Provider identifier.
     *
     * Result screens should not depend on a particular value.
     */
    provider:
      normalizeText(
        provider,
        "unknown"
      ),

    /**
     * Model identifier returned by or configured for the
     * AI provider.
     */
    model:
      normalizeText(
        model,
        "unknown"
      ),

    /**
     * AI-analysis lifecycle state.
     */
    status:
      normalizeStatus(
        status
      ),

    /**
     * Version of the provider-independent SEBAShield
     * AI-analysis contract.
     */
    analysisVersion:
      AI_ANALYSIS_VERSION,

    /**
     * ISO timestamp representing when the AI analysis
     * completed.
     */
    analyzedAt:
      normalizeText(
        analyzedAt,
        new Date()
          .toISOString()
      ),

    /**
     * Optional non-sensitive provider metadata.
     *
     * Raw submitted content must never be stored here.
     */
    metadata:
      isPlainObject(
        metadata
      )
        ? metadata
        : {},
  };
}

/**
 * ============================================================
 * createAIUnavailableResult
 * ============================================================
 *
 * Creates a standardized fallback result when AI analysis is
 * unavailable.
 *
 * Local SEBAShield scanning remains fully functional even when
 * the remote AI service cannot be reached.
 */
export function createAIUnavailableResult({
  scanId = null,

  scanType,

  reason =
    "AI analysis is currently unavailable.",
} = {}) {
  return (
    createAIAnalysisResult({
      scanId,

      scanType,

      riskLevel:
        AI_RISK_LEVELS
          .UNKNOWN,

      confidence: 0,

      summary:
        normalizeText(
          reason,
          "AI analysis is currently unavailable."
        ),

      indicators: [],

      recommendations: [],

      explanation: "",

      provider:
        "unavailable",

      model:
        "unavailable",

      status:
        AI_ANALYSIS_STATUS
          .UNAVAILABLE,
    })
  );
}

/**
 * ============================================================
 * isValidAIAnalysisResult
 * ============================================================
 *
 * Validates the minimum provider-independent AI-analysis
 * contract expected by SEBAShield.
 *
 * @param {*} result
 * @returns {boolean}
 */
export function isValidAIAnalysisResult(
  result
) {
  if (
    !isPlainObject(
      result
    )
  ) {
    return false;
  }

  if (
    typeof result.scanType !==
      "string" ||
    !result.scanType.trim()
  ) {
    return false;
  }

  if (
    !Object.values(
      AI_RISK_LEVELS
    ).includes(
      result.riskLevel
    )
  ) {
    return false;
  }

  /**
   * Confidence must already be normalized into the standard
   * 0–100 numeric representation before validation.
   */
  if (
    typeof result.confidence !==
      "number" ||
    !Number.isFinite(
      result.confidence
    ) ||
    result.confidence < 0 ||
    result.confidence > 100
  ) {
    return false;
  }

  if (
    !Array.isArray(
      result.indicators
    ) ||
    !Array.isArray(
      result.recommendations
    )
  ) {
    return false;
  }

  if (
    !Object.values(
      AI_ANALYSIS_STATUS
    ).includes(
      result.status
    )
  ) {
    return false;
  }

  if (
    typeof result.analysisVersion !==
      "string" ||
    !result.analysisVersion
      .trim()
  ) {
    return false;
  }

  if (
    typeof result.analyzedAt !==
      "string" ||
    !result.analyzedAt.trim()
  ) {
    return false;
  }

  return true;
}