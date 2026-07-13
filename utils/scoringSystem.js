/**
 * ============================================================
 * SEBAShield
 * Threat Scoring System
 * ============================================================
 *
 * Purpose:
 * Calculates the risk score and risk level for
 * suspicious messages based on detected scam indicators.
 *
 * Why We Use This File:
 * This keeps scoring logic separate from the UI.
 * ScannerScreen and ResultScreen should display information,
 * not calculate cybersecurity risk directly.
 *
 * Author: Sena Get
 * Project: SEBAShield Mobile Capstone
 * ============================================================
 */

/**
 * Determines the risk level based on the final score.
 *
 * Score Range:
 * 0 - 29   = Safe
 * 30 - 69  = Suspicious
 * 70 - 100 = High Risk
 */
export function getRiskLevel(score) {
  if (score >= 70) {
    return "High Risk";
  }

  if (score >= 30) {
    return "Suspicious";
  }

  return "Safe";
}

/**
 * Returns a visual color category for the risk level.
 *
 * This will help the ResultScreen display different
 * colors for Safe, Suspicious, and High Risk results.
 */
export function getRiskColor(riskLevel) {
  switch (riskLevel) {
    case "High Risk":
      return "danger";

    case "Suspicious":
      return "warning";

    default:
      return "success";
  }
}

/**
 * Ensures the final score never goes above 100.
 *
 * Scam indicators can add many points, but risk scores
 * should stay within a clear 0–100 range.
 */
export function normalizeScore(score) {
  return Math.min(score, 100);
}