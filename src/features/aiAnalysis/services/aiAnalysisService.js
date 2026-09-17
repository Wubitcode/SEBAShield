/**
 * ============================================================
 * SEBAShield
 * AI Analysis Service
 * ============================================================
 *
 * Purpose:
 * Coordinates provider-independent AI analysis for SEBAShield.
 *
 * Responsibilities:
 * - Validate AI analysis requests
 * - Reuse the existing Firebase authentication session
 * - Retrieve a Firebase ID token when available
 * - Call the configured secure AI provider
 * - Normalize provider responses into the SEBAShield AI model
 * - Gracefully fall back when AI is unavailable
 *
 * Important:
 * AI failure must never prevent the local SEBAShield scanner
 * from completing its normal rule-based analysis.
 *
 * Architecture:
 *
 * Scanner / ScanContext
 *        ↓
 * aiAnalysisService
 *        ↓
 * Existing Firebase Authentication
 *        ↓
 * aiProvider
 *        ↓
 * Secure AI Backend
 *        ↓
 * AI Model
 * ============================================================
 */

import {
  AI_ANALYSIS_STATUS,
  createAIAnalysisResult,
  createAIUnavailableResult,
  isValidAIAnalysisResult,
} from "../models/aiAnalysisModel";

import {
  AIProviderError,
  AI_PROVIDER_ERROR_CODES,
  requestAIAnalysis,
} from "../providers/aiProvider";

import {
  getCurrentFirebaseUser,
} from "../../authentication/services/authService";

/**
 * Maximum content length accepted by the AI analysis service.
 *
 * This matches the local scanner limit and prevents unexpectedly
 * large requests from being sent to the AI backend.
 */
export const MAX_AI_CONTENT_LENGTH = 25000;

/**
 * AI analysis service error codes.
 */
export const AI_ANALYSIS_ERROR_CODES =
  Object.freeze({
    INVALID_REQUEST:
      "INVALID_REQUEST",

    EMPTY_CONTENT:
      "EMPTY_CONTENT",

    CONTENT_TOO_LONG:
      "CONTENT_TOO_LONG",

    INVALID_RESPONSE:
      "INVALID_RESPONSE",

    AUTHENTICATION_ERROR:
      "AUTHENTICATION_ERROR",
  });

/**
 * Structured service-level error.
 */
export class AIAnalysisServiceError extends Error {
  constructor(
    message,
    code,
    originalError = null
  ) {
    super(message);

    this.name =
      "AIAnalysisServiceError";

    this.code = code;

    this.originalError =
      originalError;
  }
}

/**
 * Returns true when a value is a normal JavaScript object.
 */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Validates and trims submitted AI content.
 */
function validateContent(content) {
  if (typeof content !== "string") {
    throw new AIAnalysisServiceError(
      "AI analysis content must be text.",
      AI_ANALYSIS_ERROR_CODES
        .INVALID_REQUEST
    );
  }

  const normalizedContent =
    content.trim();

  if (!normalizedContent) {
    throw new AIAnalysisServiceError(
      "AI analysis requires submitted content.",
      AI_ANALYSIS_ERROR_CODES
        .EMPTY_CONTENT
    );
  }

  if (
    normalizedContent.length >
    MAX_AI_CONTENT_LENGTH
  ) {
    throw new AIAnalysisServiceError(
      `AI analysis content exceeds the ${MAX_AI_CONTENT_LENGTH}-character limit.`,
      AI_ANALYSIS_ERROR_CODES
        .CONTENT_TOO_LONG
    );
  }

  return normalizedContent;
}

/**
 * Validates the scan type.
 */
function validateScanType(scanType) {
  if (
    typeof scanType !== "string" ||
    !scanType.trim()
  ) {
    throw new AIAnalysisServiceError(
      "AI analysis requires a valid scan type.",
      AI_ANALYSIS_ERROR_CODES
        .INVALID_REQUEST
    );
  }

  return scanType.trim();
}

/**
 * Retrieves the Firebase ID token from the existing authenticated
 * Firebase user.
 *
 * SEBAShield already uses anonymous Firebase Authentication, so
 * no additional authentication system is created here.
 */
async function getFirebaseIdToken() {
  const currentUser =
    getCurrentFirebaseUser();

  if (!currentUser) {
    return null;
  }

  if (
    typeof currentUser.getIdToken !==
    "function"
  ) {
    return null;
  }

  try {
    return await currentUser.getIdToken();
  } catch (error) {
    console.warn(
      "[SEBAShield AI] Firebase authentication token could not be retrieved.",
      {
        name:
          error?.name ??
          "UnknownError",

        message:
          error?.message ??
          "Unknown authentication error",
      }
    );

    return null;
  }
}

/**
 * Extracts the actual AI result from different possible secure
 * backend response envelopes.
 *
 * This keeps the application independent from one backend
 * implementation.
 */
function extractProviderResult(
  responseData
) {
  if (!isPlainObject(responseData)) {
    return null;
  }

  if (
    isPlainObject(
      responseData.analysis
    )
  ) {
    return responseData.analysis;
  }

  if (
    isPlainObject(
      responseData.result
    )
  ) {
    return responseData.result;
  }

  if (
    isPlainObject(
      responseData.data
    )
  ) {
    return responseData.data;
  }

  return responseData;
}

/**
 * Converts an AI provider response into the official SEBAShield
 * AI analysis model.
 */
function normalizeProviderResult({
  providerResult,
  scanId,
  scanType,
}) {
  if (
    !isPlainObject(
      providerResult
    )
  ) {
    throw new AIAnalysisServiceError(
      "The AI provider returned an invalid analysis result.",
      AI_ANALYSIS_ERROR_CODES
        .INVALID_RESPONSE
    );
  }

  const normalizedResult =
    createAIAnalysisResult({
      scanId,

      scanType,

      riskLevel:
        providerResult.riskLevel ??
        providerResult.risk ??
        providerResult.classification ??
        "Unknown",

      confidence:
        providerResult.confidence ??
        providerResult.confidenceScore ??
        0,

      summary:
        providerResult.summary ??
        providerResult.assessment ??
        "",

      indicators:
        providerResult.indicators ??
        providerResult.findings ??
        providerResult.warningSigns ??
        [],

      recommendations:
        providerResult.recommendations ??
        providerResult.actions ??
        providerResult.safetyActions ??
        [],

      explanation:
        providerResult.explanation ??
        providerResult.reasoning ??
        "",

      provider:
        providerResult.provider ??
        "secure-ai-backend",

      model:
        providerResult.model ??
        providerResult.modelName ??
        "unknown",

      status:
        providerResult.status ??
        AI_ANALYSIS_STATUS.COMPLETED,

      analyzedAt:
        providerResult.analyzedAt ??
        new Date().toISOString(),

      /**
       * Only non-sensitive backend metadata belongs here.
       *
       * Raw submitted content must never be copied into metadata.
       */
      metadata:
        isPlainObject(
          providerResult.metadata
        )
          ? providerResult.metadata
          : {},
    });

  if (
    !isValidAIAnalysisResult(
      normalizedResult
    )
  ) {
    throw new AIAnalysisServiceError(
      "The normalized AI result did not satisfy the SEBAShield AI analysis contract.",
      AI_ANALYSIS_ERROR_CODES
        .INVALID_RESPONSE
    );
  }

  return normalizedResult;
}

/**
 * Converts provider errors into a safe user-facing fallback
 * reason.
 *
 * Technical implementation details remain in development logs.
 */
function getUnavailableReason(error) {
  if (
    error instanceof AIProviderError
  ) {
    switch (error.code) {
      case AI_PROVIDER_ERROR_CODES
        .RATE_LIMITED:
        return "AI analysis has reached its current usage limit. Local SEBAShield analysis remains available.";

      case AI_PROVIDER_ERROR_CODES
        .TIMEOUT:
        return "AI analysis took too long to respond. Local SEBAShield analysis remains available.";

      case AI_PROVIDER_ERROR_CODES
        .NETWORK_ERROR:
        return "AI analysis could not be reached. Local SEBAShield analysis remains available.";

      case AI_PROVIDER_ERROR_CODES
        .CONFIGURATION_ERROR:
        return "AI analysis is not configured yet. Local SEBAShield analysis remains available.";

      case AI_PROVIDER_ERROR_CODES
        .AUTHENTICATION_ERROR:
        return "AI analysis could not verify the current session. Local SEBAShield analysis remains available.";

      case AI_PROVIDER_ERROR_CODES
        .SERVER_ERROR:
        return "AI analysis is temporarily unavailable. Local SEBAShield analysis remains available.";

      default:
        return "AI analysis is currently unavailable. Local SEBAShield analysis remains available.";
    }
  }

  return "AI analysis is currently unavailable. Local SEBAShield analysis remains available.";
}

/**
 * Performs optional AI analysis for one completed local scan.
 *
 * Important:
 *
 * This function intentionally returns an UNAVAILABLE result
 * instead of throwing when the external AI service fails.
 *
 * That guarantees:
 *
 * AI failure
 *      ↓
 * Local SEBAShield scanner continues working
 *
 * @param {Object} request
 * @param {string|null} request.scanId
 * @param {string} request.scanType
 * @param {string} request.content
 * @param {Object|null} request.localAnalysis
 *
 * @returns {Promise<Object>}
 */
export async function analyzeWithAI({
  scanId = null,
  scanType,
  content,
  localAnalysis = null,
} = {}) {
  /**
   * Invalid application input is considered a programming or
   * request error and should not silently become an AI fallback.
   */
  const normalizedScanType =
    validateScanType(scanType);

  const normalizedContent =
    validateContent(content);

  try {
    /**
     * Reuse the already authenticated Firebase session.
     */
    const authToken =
      await getFirebaseIdToken();

    /**
     * Send the request through the provider adapter.
     *
     * aiProvider is responsible for the HTTPS request and does
     * not contain any AI provider secret.
     */
    const providerResponse =
      await requestAIAnalysis({
        scanId,

        scanType:
          normalizedScanType,

        content:
          normalizedContent,

        localAnalysis,

        authToken,
      });

    const providerResult =
      extractProviderResult(
        providerResponse
      );

    const normalizedResult =
      normalizeProviderResult({
        providerResult,

        scanId,

        scanType:
          normalizedScanType,
      });

    console.info(
      "[SEBAShield AI] AI analysis completed.",
      {
        scanId:
          scanId ?? null,

        scanType:
          normalizedScanType,

        riskLevel:
          normalizedResult.riskLevel,

        provider:
          normalizedResult.provider,
      }
    );

    return normalizedResult;
  } catch (error) {
    /**
     * Invalid caller input should still surface as a normal
     * service error.
     */
    if (
      error instanceof
        AIAnalysisServiceError &&
      error.code !==
        AI_ANALYSIS_ERROR_CODES
          .INVALID_RESPONSE
    ) {
      throw error;
    }

    /**
     * External AI failures never break the local scanner.
     *
     * Do not log submitted content here.
     */
    console.warn(
      "[SEBAShield AI] AI analysis unavailable.",
      {
        code:
          error?.code ??
          "UNKNOWN_AI_ERROR",

        name:
          error?.name ??
          "UnknownError",

        message:
          error?.message ??
          "Unknown AI analysis error",
      }
    );

    return createAIUnavailableResult({
      scanId,

      scanType:
        normalizedScanType,

      reason:
        getUnavailableReason(
          error
        ),
    });
  }
}