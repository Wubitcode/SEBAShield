/**
 * ============================================================
 * SEBAShield
 * Fake Job Scam Analyzer Service — Version 2
 * ============================================================
 *
 * Purpose:
 * Analyzes job offers, recruiter messages, and employment
 * advertisements for common recruitment-scam indicators.
 *
 * Detection Approach:
 * - Exact keyword and phrase matching
 * - Regular-expression pattern detection
 * - Combined-risk heuristics
 * - Safer uncertainty classification
 *
 * Why This Version Is Safer:
 * A job offer should not be classified as legitimate simply
 * because it does not contain an exact stored phrase.
 *
 * This analyzer detects broader patterns such as:
 * - Phone numbers
 * - Money amounts
 * - Very short work schedules
 * - Guaranteed compensation
 * - Generic candidate greetings
 * - Informal recruiter contact
 * - Vague online optimization tasks
 *
 * Important Limitation:
 * This rule-based prototype cannot verify that a job offer is
 * legitimate. Users should independently verify employers
 * through official company websites and contact channels.
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: JavaScript
 * ============================================================
 */

import {
  getRiskLevel,
  normalizeScore,
} from "../scoring/scoringSystem";

/**
 * Job-related threat categories.
 *
 * Each category contains:
 * - label: Explanation displayed to the user
 * - scoreValue: Points added for each matched phrase
 * - patterns: Known fake-job language
 */
const jobThreatCategories = [
  {
    label: "No-interview hiring indicator",
    scoreValue: 25,
    patterns: [
      "no interview",
      "without an interview",
      "interview not required",
      "instant hiring",
      "automatically hired",
      "automatic approval",
    ],
  },

  {
    label: "Guaranteed employment or compensation claim",
    scoreValue: 20,
    patterns: [
      "guaranteed income",
      "guaranteed salary",
      "guaranteed base salary",
      "guaranteed employment",
      "guaranteed job",
      "you are hired",
      "you have been selected",
      "position is already yours",
    ],
  },

  {
    label: "Low-effort remote-work claim",
    scoreValue: 15,
    patterns: [
      "work from home",
      "remote position",
      "remote job",
      "part-time remote position",
      "flexible part-time remote position",
      "few hours per day",
      "minimal work",
      "simple tasks",
      "product listings",
      "product exposure",
      "product optimization",
      "merchant optimization",
      "boost product visibility",
      "boosting products",
    ],
  },

  {
    label: "Sensitive personal information request",
    scoreValue: 30,
    patterns: [
      "social insurance number",
      "sin number",
      "send your sin",
      "passport",
      "driver's license",
      "drivers license",
      "government id",
      "photo id",
      "date of birth",
    ],
  },

  {
    label: "Banking information request",
    scoreValue: 30,
    patterns: [
      "bank account",
      "banking information",
      "direct deposit information",
      "credit card",
      "debit card",
      "account number",
      "routing number",
    ],
  },

  {
    label: "Upfront payment request",
    scoreValue: 30,
    patterns: [
      "registration fee",
      "training fee",
      "processing fee",
      "equipment fee",
      "pay before starting",
      "send money",
      "purchase gift cards",
      "buy gift cards",
      "wire transfer",
      "cryptocurrency payment",
    ],
  },

  {
    label: "Messaging-app communication",
    scoreValue: 15,
    patterns: [
      "whatsapp",
      "telegram",
      "signal",
      "contact us on whatsapp",
      "message us on telegram",
      "text only",
    ],
  },

  {
    label: "Urgency or limited-position pressure",
    scoreValue: 15,
    patterns: [
      "apply immediately",
      "respond immediately",
      "hiring immediately",
      "act now",
      "limited positions",
      "vacant positions",
      "positions waiting to be filled",
      "today only",
      "respond within 24 hours",
      "start today",
    ],
  },

  {
    label: "Generic recruitment greeting",
    scoreValue: 10,
    patterns: [
      "hi candidate",
      "dear candidate",
      "hello candidate",
      "dear applicant",
      "selected candidate",
    ],
  },

  {
    label: "Informal recruiter contact request",
    scoreValue: 20,
    patterns: [
      "message this number",
      "text this number",
      "contact this number",
      "message the number",
      "receive detailed job information",
      "contact for more details",
    ],
  },
];

/**
 * Checks one keyword category against the submitted content.
 *
 * @param {string} content - Lowercase job-offer text.
 * @param {object} category - Threat category configuration.
 * @returns {{ score: number, indicators: string[] }}
 */
function checkCategory(content, category) {
  let score = 0;
  const indicators = [];

  category.patterns.forEach((pattern) => {
    if (content.includes(pattern)) {
      score += category.scoreValue;
      indicators.push(`${category.label}: "${pattern}"`);
    }
  });

  return {
    score,
    indicators,
  };
}

/**
 * Adds a unique indicator so duplicate findings are not shown.
 *
 * @param {string[]} indicators - Current list of findings.
 * @param {string} indicator - New finding to add.
 */
function addUniqueIndicator(indicators, indicator) {
  if (!indicators.includes(indicator)) {
    indicators.push(indicator);
  }
}

/**
 * Main fake-job analysis function.
 *
 * @param {string} jobContent - Job posting or recruiter message.
 * @returns {{
 *   score: number,
 *   riskLevel: string,
 *   indicators: string[],
 *   originalContent: string,
 *   requiresVerification: boolean
 * }}
 */
export function analyzeFakeJob(jobContent) {
  let totalScore = 0;
  const indicators = [];

  /**
   * Normalize capitalization and spacing before analysis.
   */
  const normalizedContent = jobContent
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  /**
   * Run all phrase-based threat categories.
   */
  jobThreatCategories.forEach((category) => {
    const result = checkCategory(
      normalizedContent,
      category
    );

    totalScore += result.score;

    result.indicators.forEach((indicator) => {
      addUniqueIndicator(indicators, indicator);
    });
  });

  /**
   * Detect North American phone numbers.
   *
   * Examples:
   * - 12135694626
   * - +1 213 569 4626
   * - (213) 569-4626
   */
  const phonePattern =
    /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

  if (phonePattern.test(jobContent)) {
    totalScore += 20;

    addUniqueIndicator(
      indicators,
      "Personal or informal phone-number contact detected."
    );
  }

  /**
   * Detect dollar amounts.
   *
   * This does not automatically prove fraud.
   * It becomes more concerning when combined with
   * short hours, guaranteed income, or vague duties.
   */
  const moneyPattern =
    /\$\s?\d{2,3}(?:,\d{3})*(?:\.\d{1,2})?/g;

  const moneyMatches =
    normalizedContent.match(moneyPattern) || [];

  if (moneyMatches.length > 0) {
    totalScore += 10;

    addUniqueIndicator(
      indicators,
      `Compensation amount detected: ${moneyMatches.join(", ")}.`
    );
  }

  /**
   * Detect unusually short daily work schedules.
   *
   * Examples:
   * - 60 to 90 minutes
   * - 1 hour per day
   * - 2 hours daily
   */
  const shortWorkPattern =
    /\b(?:\d{1,3}\s*(?:to|-)\s*\d{1,3}\s*minutes|\d(?:\.\d+)?\s*hours?\s*(?:per day|daily|each day))\b/i;

  const shortWorkDetected =
    shortWorkPattern.test(jobContent);

  if (shortWorkDetected) {
    totalScore += 20;

    addUniqueIndicator(
      indicators,
      "Very short work schedule detected."
    );
  }

  /**
   * Detect promises of daily or weekly income.
   */
  const frequentPayPattern =
    /\b(?:daily income|daily pay|weekly pay|per day|per week)\b/i;

  const frequentPayDetected =
    frequentPayPattern.test(normalizedContent);

  if (frequentPayDetected) {
    totalScore += 10;

    addUniqueIndicator(
      indicators,
      "Frequent high-income payment language detected."
    );
  }

  /**
   * Detect major-company impersonation language.
   *
   * A company name alone is not suspicious.
   * The score is added only when combined with informal
   * contact, guaranteed pay, or low-effort remote work.
   */
  const majorCompanyPattern =
    /\b(?:amazon|microsoft|google|apple|walmart|costco|netflix|meta)\b/i;

  const majorCompanyDetected =
    majorCompanyPattern.test(normalizedContent);

  const suspiciousRecruitmentContext =
    phonePattern.test(jobContent) ||
    normalizedContent.includes("guaranteed") ||
    normalizedContent.includes("product listings") ||
    normalizedContent.includes("product exposure") ||
    shortWorkDetected;

  if (
    majorCompanyDetected &&
    suspiciousRecruitmentContext
  ) {
    totalScore += 20;

    addUniqueIndicator(
      indicators,
      "Major-company identity used with an unofficial recruitment pattern."
    );
  }

  /**
   * Combined heuristic:
   *
   * High compensation + very short hours is more suspicious
   * than either indicator by itself.
   */
  if (
    moneyMatches.length >= 2 &&
    shortWorkDetected
  ) {
    totalScore += 25;

    addUniqueIndicator(
      indicators,
      "High compensation combined with minimal working time."
    );
  }

  /**
   * Combined heuristic:
   *
   * A personal phone number combined with a well-known
   * company name may indicate recruiter impersonation.
   */
  if (
    majorCompanyDetected &&
    phonePattern.test(jobContent)
  ) {
    totalScore += 20;

    addUniqueIndicator(
      indicators,
      "Well-known company name combined with personal phone contact."
    );
  }

  /**
   * Keep the final score between 0 and 100.
   */
  const finalScore = normalizeScore(totalScore);

  /**
   * Convert the numerical score into the standard
   * SEBAShield risk classification.
   */
  const riskLevel = getRiskLevel(finalScore);

  /**
   * Return a structured object for FakeJobResultScreen.
   *
   * requiresVerification is always true because this prototype
   * cannot confirm that an employer or offer is legitimate.
   */
  return {
    score: finalScore,
    riskLevel,
    indicators,
    originalContent: jobContent,
    requiresVerification: true,
  };
}