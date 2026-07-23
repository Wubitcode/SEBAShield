/**
 * ============================================================
 * SEBAShield
 * Link Checker Service
 * ============================================================
 *
 * Purpose:
 * Analyzes URLs for common phishing indicators and
 * suspicious characteristics.
 *
 * Responsibilities:
 * - Validate URL format
 * - Detect insecure protocols
 * - Detect suspicious domain extensions
 * - Detect shortened URLs
 * - Detect phishing-related keywords
 * - Calculate a threat score
 * - Return a risk classification
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + JavaScript
 * ============================================================
 */

import {
  getRiskLevel,
  normalizeScore,
} from "../utils/scoringSystem";

/**
 * Suspicious top-level domains frequently abused
 * in phishing campaigns.
 */
const suspiciousDomains = [
  ".xyz",
  ".top",
  ".ru",
  ".click",
  ".work",
  ".online",
];

/**
 * URL shortening services.
 */
const shortenedLinks = [
  "bit.ly",
  "tinyurl",
  "goo.gl",
  "t.co",
  "ow.ly",
];

/**
 * Words commonly found in phishing URLs.
 */
const phishingKeywords = [
  "login",
  "verify",
  "secure",
  "bank",
  "update",
  "account",
  "payment",
  "wallet",
  "signin",
];

/**
 * ============================================================
 * analyzeLink()
 * ============================================================
 *
 * Receives a URL and evaluates its overall risk.
 */
export function analyzeLink(url) {
  let score = 0;

  const indicators = [];

  const lowerUrl = url.toLowerCase();

  /**
   * ------------------------------------------------------------
   * HTTP Detection
   * ------------------------------------------------------------
   */

  if (lowerUrl.startsWith("http://")) {
    score += 20;

    indicators.push(
      "Uses HTTP instead of HTTPS."
    );
  }

  /**
   * ------------------------------------------------------------
   * Suspicious Domain Detection
   * ------------------------------------------------------------
   */

  suspiciousDomains.forEach((domain) => {
    if (lowerUrl.includes(domain)) {
      score += 25;

      indicators.push(
        `Suspicious domain detected (${domain})`
      );
    }
  });

  /**
   * ------------------------------------------------------------
   * URL Shortener Detection
   * ------------------------------------------------------------
   */

  shortenedLinks.forEach((service) => {
    if (lowerUrl.includes(service)) {
      score += 20;

      indicators.push(
        `Shortened URL detected (${service})`
      );
    }
  });

  /**
   * ------------------------------------------------------------
   * Phishing Keyword Detection
   * ------------------------------------------------------------
   */

  phishingKeywords.forEach((keyword) => {
    if (lowerUrl.includes(keyword)) {
      score += 10;

      indicators.push(
        `Suspicious keyword detected ("${keyword}")`
      );
    }
  });

  /**
   * ------------------------------------------------------------
   * Normalize Final Score
   * ------------------------------------------------------------
   */

  const finalScore = normalizeScore(score);

  /**
   * Determine Risk Level
   */

  const riskLevel = getRiskLevel(finalScore);

  /**
   * Return Analysis
   */

  return {
    score: finalScore,
    riskLevel,
    indicators,
    originalUrl: url,
  };
}