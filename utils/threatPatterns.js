/**
 * ============================================================
 * SEBAShield
 * Threat Pattern Library
 * ============================================================
 *
 * Purpose:
 * Central repository of scam indicators used by
 * SEBAShield to detect potentially malicious content.
 *
 * Why We Use This File:
 * Instead of hardcoding keywords throughout the application,
 * all threat patterns are stored in one place.
 *
 * Benefits:
 * • Easier maintenance
 * • Better scalability
 * • Consistent threat detection
 * • Cleaner application architecture
 *
 * Future Enhancements:
 * • Download updated patterns from Firebase
 * • Community-contributed threat signatures
 * • AI-generated phishing indicators
 *
 * Author: Sena Get
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + JavaScript
 * ============================================================
 */

/**
 * ThreatPatterns
 *
 * Collection of keyword groups used during
 * scam analysis.
 */
export const ThreatPatterns = {
  urgency: [
    "urgent",
    "immediately",
    "act now",
    "within 24 hours",
    "final notice",
    "last chance",
    "expires today",
    "verify immediately",
    "respond now",
  ],

  credentials: [
    "password",
    "username",
    "login",
    "security code",
    "verification code",
    "verify your identity",
    "confirm your account",
    "account suspended",
    "account locked",
  ],

  financial: [
    "bank account",
    "banking information",
    "wire transfer",
    "gift card",
    "bitcoin",
    "crypto",
    "send money",
    "payment required",
    "refund",
    "tax refund",
  ],

  employment: [
    "no interview",
    "weekly salary",
    "work from home",
    "remote job",
    "easy money",
    "earn from home",
    "hiring immediately",
    "guaranteed income",
    "send your sin",
    "driver's license",
  ],

  suspiciousLinks: [
    "http://",
    "bit.ly",
    "tinyurl",
    ".xyz",
    ".ru",
    ".top",
    ".click",
    ".work",
  ],

  emotionalPressure: [
    "failure to respond",
    "avoid closure",
    "limited time",
    "do not ignore",
    "you have been selected",
    "congratulations",
    "claim your prize",
  ],
};