/**
 * ============================================================
 * SEBAShield
 * AI Provider Adapter
 * ============================================================
 *
 * Purpose:
 * Provides one provider-independent interface for communicating
 * with the secure SEBAShield AI backend.
 *
 * Architecture:
 *
 * SEBAShield Mobile App
 *        ↓
 * aiAnalysisService
 *        ↓
 * aiProvider
 *        ↓
 * Secure HTTPS AI Backend
 *        ↓
 * AI Model
 *
 * Security:
 * - AI provider credentials never belong in the mobile app.
 * - Raw submitted content is sent only for transient analysis.
 * - Raw content is never written to application logs here.
 * - The backend endpoint itself is not considered a secret.
 * ============================================================
 */

/**
 * Maximum time allowed for one AI request.
 */
const DEFAULT_TIMEOUT_MS = 20000;

/**
 * Error identifiers used by the AI provider layer.
 */
export const AI_PROVIDER_ERROR_CODES =
  Object.freeze({
    CONFIGURATION_ERROR:
      "CONFIGURATION_ERROR",

    INVALID_REQUEST:
      "INVALID_REQUEST",

    NETWORK_ERROR:
      "NETWORK_ERROR",

    TIMEOUT:
      "TIMEOUT",

    AUTHENTICATION_ERROR:
      "AUTHENTICATION_ERROR",

    RATE_LIMITED:
      "RATE_LIMITED",

    SERVER_ERROR:
      "SERVER_ERROR",

    INVALID_RESPONSE:
      "INVALID_RESPONSE",
  });

/**
 * Structured provider error.
 */
export class AIProviderError extends Error {
  constructor(
    message,
    code,
    originalError = null
  ) {
    super(message);

    this.name = "AIProviderError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Returns the configured secure backend URL.
 *
 * Important:
 * EXPO_PUBLIC_AI_ANALYSIS_URL contains only the public HTTPS
 * endpoint. It must never contain an API key or secret.
 */
function getAIEndpoint() {
  const endpoint =
    process.env
      .EXPO_PUBLIC_AI_ANALYSIS_URL;

  if (
    typeof endpoint !== "string" ||
    !endpoint.trim()
  ) {
    throw new AIProviderError(
      "The AI analysis endpoint is not configured.",
      AI_PROVIDER_ERROR_CODES
        .CONFIGURATION_ERROR
    );
  }

  return endpoint.trim();
}

/**
 * Validates the scan content before transmission.
 */
function validateContent(content) {
  if (
    typeof content !== "string" ||
    !content.trim()
  ) {
    throw new AIProviderError(
      "AI analysis requires submitted text content.",
      AI_PROVIDER_ERROR_CODES
        .INVALID_REQUEST
    );
  }

  return content.trim();
}

/**
 * Creates a privacy-controlled representation of the local
 * rule-based analysis.
 *
 * originalContent, originalMessage, originalUrl, contentPreview,
 * and synchronization metadata are intentionally excluded.
 */
function createSafeLocalAnalysis(
  localAnalysis
) {
  if (
    !localAnalysis ||
    typeof localAnalysis !== "object" ||
    Array.isArray(localAnalysis)
  ) {
    return null;
  }

  return {
    scanType:
      typeof localAnalysis.scanType ===
      "string"
        ? localAnalysis.scanType
        : null,

    score:
      typeof localAnalysis.score ===
      "number"
        ? localAnalysis.score
        : null,

    riskLevel:
      typeof localAnalysis.riskLevel ===
      "string"
        ? localAnalysis.riskLevel
        : null,

    indicators:
      Array.isArray(
        localAnalysis.indicators
      )
        ? localAnalysis.indicators
            .filter(
              (indicator) =>
                typeof indicator ===
                "string"
            )
            .map((indicator) =>
              indicator.trim()
            )
            .filter(Boolean)
        : [],

    recommendations:
      Array.isArray(
        localAnalysis.recommendations
      )
        ? localAnalysis.recommendations
            .filter(
              (recommendation) =>
                typeof recommendation ===
                "string"
            )
            .map((recommendation) =>
              recommendation.trim()
            )
            .filter(Boolean)
        : [],
  };
}

/**
 * Attempts to parse a JSON response safely.
 */
async function parseJSONResponse(
  response
) {
  try {
    return await response.json();
  } catch (error) {
    throw new AIProviderError(
      "The AI backend returned an invalid response.",
      AI_PROVIDER_ERROR_CODES
        .INVALID_RESPONSE,
      error
    );
  }
}

/**
 * Converts HTTP errors into structured SEBAShield errors.
 */
function throwForHTTPStatus(
  response
) {
  if (
    response.status === 401 ||
    response.status === 403
  ) {
    throw new AIProviderError(
      "The AI analysis request was not authorized.",
      AI_PROVIDER_ERROR_CODES
        .AUTHENTICATION_ERROR
    );
  }

  if (response.status === 429) {
    throw new AIProviderError(
      "The AI analysis service has reached its current usage limit.",
      AI_PROVIDER_ERROR_CODES
        .RATE_LIMITED
    );
  }

  if (response.status >= 500) {
    throw new AIProviderError(
      "The AI analysis service is temporarily unavailable.",
      AI_PROVIDER_ERROR_CODES
        .SERVER_ERROR
    );
  }

  if (!response.ok) {
    throw new AIProviderError(
      "The AI analysis request could not be completed.",
      AI_PROVIDER_ERROR_CODES
        .INVALID_RESPONSE
    );
  }
}

/**
 * Sends one scan to the secure SEBAShield AI backend.
 *
 * Raw content is required because the AI model must inspect the
 * submitted material. The backend must treat this content as
 * transient data and must not persist it by default.
 *
 * @param {Object} request
 * @param {string|null} request.scanId
 * @param {string} request.scanType
 * @param {string} request.content
 * @param {Object|null} request.localAnalysis
 * @param {string|null} request.authToken
 * @returns {Promise<Object>}
 */
export async function requestAIAnalysis({
  scanId = null,
  scanType,
  content,
  localAnalysis = null,
  authToken = null,
} = {}) {
  const endpoint =
    getAIEndpoint();

  const normalizedContent =
    validateContent(content);

  if (
    typeof scanType !== "string" ||
    !scanType.trim()
  ) {
    throw new AIProviderError(
      "AI analysis requires a valid scan type.",
      AI_PROVIDER_ERROR_CODES
        .INVALID_REQUEST
    );
  }

  /**
   * AbortController prevents a stalled AI request from blocking
   * the scanner indefinitely.
   */
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () => {
        controller.abort();
      },
      DEFAULT_TIMEOUT_MS
    );

  try {
    const headers = {
      "Content-Type":
        "application/json",
    };

    /**
     * Firebase authentication token will eventually be supplied
     * by aiAnalysisService.
     *
     * The secure backend can verify this token before allowing
     * AI analysis.
     */
    if (
      typeof authToken === "string" &&
      authToken.trim()
    ) {
      headers.Authorization =
        `Bearer ${authToken.trim()}`;
    }

    const response =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers,

          body: JSON.stringify({
            scanId:
              typeof scanId ===
                "string" &&
              scanId.trim()
                ? scanId.trim()
                : null,

            scanType:
              scanType.trim(),

            /**
             * Raw content is transmitted only for the current
             * analysis request.
             */
            content:
              normalizedContent,

            /**
             * Only privacy-approved local-analysis fields are
             * included.
             */
            localAnalysis:
              createSafeLocalAnalysis(
                localAnalysis
              ),
          }),

          signal:
            controller.signal,
        }
      );

    throwForHTTPStatus(
      response
    );

    const responseData =
      await parseJSONResponse(
        response
      );

    if (
      !responseData ||
      typeof responseData !==
        "object" ||
      Array.isArray(responseData)
    ) {
      throw new AIProviderError(
        "The AI backend returned an unexpected response.",
        AI_PROVIDER_ERROR_CODES
          .INVALID_RESPONSE
      );
    }

    return responseData;
  } catch (error) {
    if (
      error instanceof
      AIProviderError
    ) {
      throw error;
    }

    /**
     * AbortError represents our configured timeout.
     */
    if (
      error?.name ===
      "AbortError"
    ) {
      throw new AIProviderError(
        "The AI analysis request timed out.",
        AI_PROVIDER_ERROR_CODES
          .TIMEOUT,
        error
      );
    }

    throw new AIProviderError(
      "SEBAShield could not reach the AI analysis service.",
      AI_PROVIDER_ERROR_CODES
        .NETWORK_ERROR,
      error
    );
  } finally {
    clearTimeout(
      timeoutId
    );
  }
}