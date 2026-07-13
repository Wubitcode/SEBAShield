/**
 * ============================================================
 * SEBAShield
 * Scam Analyzer Service
 * ============================================================
 *
 * Purpose:
 * Analyzes user-submitted messages and detects scam indicators.
 *
 * Why We Use This File:
 * This file acts as the main detection engine for SEBAShield.
 * It keeps cybersecurity analysis logic separate from the UI.
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * ============================================================
 */

import { ThreatPatterns } from "../utils/threatPatterns";
import { getRiskLevel, normalizeScore } from "../utils/scoringSystem";

/**
 * Checks a message against one threat category.
 */
function checkPatterns(message, patterns, scoreValue, label) {
  let score = 0;
  const indicators = [];

  patterns.forEach((pattern) => {
    if (message.includes(pattern)) {
      score += scoreValue;
      indicators.push(`${label}: "${pattern}"`);
    }
  });

  return { score, indicators };
}

/**
 * Main scam analysis function.
 */
export function analyzeMessage(message) {
  let totalScore = 0;
  let indicators = [];

  const lowerMessage = message.toLowerCase();

  const checks = [
    {
      patterns: ThreatPatterns.urgency,
      scoreValue: 15,
      label: "Urgency language detected",
    },
    {
      patterns: ThreatPatterns.credentials,
      scoreValue: 20,
      label: "Credential theft indicator detected",
    },
    {
      patterns: ThreatPatterns.financial,
      scoreValue: 20,
      label: "Financial scam indicator detected",
    },
    {
      patterns: ThreatPatterns.employment,
      scoreValue: 18,
      label: "Employment scam indicator detected",
    },
    {
      patterns: ThreatPatterns.suspiciousLinks,
      scoreValue: 25,
      label: "Suspicious link indicator detected",
    },
    {
      patterns: ThreatPatterns.emotionalPressure,
      scoreValue: 15,
      label: "Emotional pressure tactic detected",
    },
  ];

  checks.forEach((check) => {
    const result = checkPatterns(
      lowerMessage,
      check.patterns,
      check.scoreValue,
      check.label
    );

    totalScore += result.score;
    indicators = [...indicators, ...result.indicators];
  });

  const finalScore = normalizeScore(totalScore);
  const riskLevel = getRiskLevel(finalScore);

  return {
    score: finalScore,
    riskLevel,
    indicators,
    originalMessage: message,
  };
}