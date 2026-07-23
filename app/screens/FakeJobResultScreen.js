/**
 * ============================================================
 * SEBAShield
 * Fake Job Analysis Result Screen
 * ============================================================
 *
 * Purpose:
 * Displays a structured recruitment-scam assessment generated
 * by the SEBAShield Fake Job Scam Analyzer service.
 *
 * Main Responsibilities:
 * - Display the calculated threat score.
 * - Display the overall risk classification.
 * - Present detected fake-job indicators clearly.
 * - Provide risk-appropriate safety recommendations.
 * - Show the original submitted job offer or recruiter message.
 * - Explain the limitations of rule-based analysis.
 * - Provide links to official fraud-awareness resources.
 * - Allow the user to analyze another job offer.
 *
 * Important Design Principle:
 * A low threat score does not prove that a job offer is
 * legitimate. Users should independently verify the employer,
 * recruiter, job posting, and communication channels.
 *
 * Navigation Flow:
 *
 * Home Screen
 *      ↓
 * Fake Job Detector
 *      ↓
 * Fake Job Analysis Result
 *      ↓
 * Analyze Another Job Offer
 *
 * External Resource Flow:
 *
 * Guidance Source
 *      ↓
 * Device Browser
 *      ↓
 * Official Fraud-Awareness Website
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

import React from "react";

/**
 * React Native components used to build this screen.
 *
 * Alert:
 * Displays a user-friendly message when an external resource
 * cannot be opened.
 *
 * Linking:
 * Checks and opens official guidance URLs in the device browser.
 *
 * ScrollView:
 * Keeps longer reports accessible on smaller devices.
 *
 * StyleSheet:
 * Organizes reusable screen styles.
 *
 * Text:
 * Displays headings, scores, findings, recommendations,
 * submitted content, notices, and source information.
 *
 * TouchableOpacity:
 * Creates interactive buttons and guidance links.
 *
 * View:
 * Groups related interface sections into cards.
 */
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Centralized SEBAShield color palette.
 *
 * Shared colors maintain a consistent interface across all
 * application screens.
 */
import { COLORS } from "../constants/colors";

/**
 * ============================================================
 * Risk Presentation Configuration
 * ============================================================
 *
 * Maps every supported risk classification to:
 * - A recognizable icon
 * - A matching visual color
 * - A short user-facing explanation
 *
 * Keeping these values in one configuration object makes the
 * component easier to maintain and extend.
 */
const RISK_PRESENTATION = {
  "High Risk": {
    icon: "🔴",
    color: COLORS.danger,
    summary:
      "Multiple serious recruitment-scam indicators were detected. Do not continue until the employer is independently verified.",
  },

  Suspicious: {
    icon: "🟠",
    color: COLORS.warning,
    summary:
      "Several concerning patterns were detected. Treat this offer carefully and verify every important detail.",
  },

  Caution: {
    icon: "🟡",
    color: COLORS.warning,
    summary:
      "Some warning signs were detected. Additional verification is strongly recommended before responding.",
  },

  "No Major Indicators Detected": {
    icon: "🟢",
    color: COLORS.success,
    summary:
      "No major stored scam indicators were detected, but this does not confirm that the job offer is legitimate.",
  },
};

/**
 * Default presentation used when an unexpected risk-level value
 * is received from the analyzer.
 */
const DEFAULT_RISK_PRESENTATION = {
  icon: "⚪",
  color: COLORS.mutedText,
  summary:
    "The result requires additional review because the risk classification was not recognized.",
};

/**
 * ============================================================
 * Official Guidance Sources
 * ============================================================
 *
 * Each source contains:
 * - The organization name
 * - A short description
 * - An official webpage URL
 *
 * These links provide users with additional educational
 * information about employment scams, fraud prevention, and
 * reporting options.
 *
 * SEBAShield does not claim affiliation with these organizations.
 */
const GUIDANCE_SOURCES = [
  {
    id: "canadian-anti-fraud-centre",
    name: "Canadian Anti-Fraud Centre",
    description:
      "Canadian fraud-awareness, prevention, and reporting information.",
    url: "https://antifraudcentre-centreantifraude.ca/index-eng.htm",
  },
  {
    id: "competition-bureau-canada",
    name: "Competition Bureau Canada",
    description:
      "Official Canadian guidance about job and employment scams.",
    url: "https://competition-bureau.canada.ca/en/fraud-and-scams/tips-and-advice/job-and-employment-scams",
  },
  {
    id: "federal-trade-commission",
    name: "Federal Trade Commission",
    description:
      "Job-scam warning signs, consumer alerts, and prevention guidance.",
    url: "https://consumer.ftc.gov/all-scams/job-scams",
  },
];

/**
 * ============================================================
 * FakeJobResultScreen Component
 * ============================================================
 *
 * Receives jobAnalysisResult through React Navigation route
 * parameters from FakeJobScreen.
 */
export default function FakeJobResultScreen({
  route,
  navigation,
}) {
  /**
   * Safely extract the completed analysis result.
   *
   * Optional chaining prevents the application from crashing
   * if route or route.params is unavailable.
   */
  const jobAnalysisResult =
    route?.params?.jobAnalysisResult;

  /**
   * Display a fallback interface when the screen is opened
   * without valid analysis data.
   */
  if (!jobAnalysisResult) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackIcon}>
          ⚠️
        </Text>

        <Text style={styles.fallbackTitle}>
          No Job Analysis Available
        </Text>

        <Text style={styles.fallbackText}>
          Return to the Fake Job Detector and submit a job offer or recruiter
          message for analysis.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Return to fake job detector"
          accessibilityHint="Returns to the previous screen"
        >
          <Text style={styles.primaryButtonText}>
            Return to Detector
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Safely normalize the values received from the analyzer.
   *
   * These fallback values protect the screen from incomplete
   * analysis data and keep rendering predictable.
   */
  const score =
    typeof jobAnalysisResult.score === "number"
      ? jobAnalysisResult.score
      : 0;

  const riskLevel =
    jobAnalysisResult.riskLevel ||
    "No Major Indicators Detected";

  const indicators = Array.isArray(
    jobAnalysisResult.indicators
  )
    ? jobAnalysisResult.indicators
    : [];

  const originalContent =
    jobAnalysisResult.originalContent ||
    "No submitted content is available.";

  /**
   * Select the icon, color, and explanation associated with the
   * current risk classification.
   */
  const riskPresentation =
    RISK_PRESENTATION[riskLevel] ||
    DEFAULT_RISK_PRESENTATION;

  /**
   * ============================================================
   * getRecommendations
   * ============================================================
   *
   * Provides recommendations based on the calculated risk level.
   *
   * High-risk results receive urgent protective actions, while
   * lower-risk results still emphasize independent verification.
   */
  const getRecommendations = () => {
    if (riskLevel === "High Risk") {
      return [
        "Stop communicating with the recruiter until the employer is independently verified.",
        "Do not send your SIN, banking information, identification, passwords, or verification codes.",
        "Do not pay registration, training, equipment, processing, or recruitment fees.",
        "Do not purchase gift cards or transfer cryptocurrency for employment purposes.",
        "Confirm the position through the employer's official careers website.",
        "Report the message, account, or job posting to the platform where it appeared.",
      ];
    }

    if (riskLevel === "Suspicious") {
      return [
        "Verify the company and recruiter through independent official sources.",
        "Confirm that the recruiter's email domain matches the employer's official website.",
        "Search the employer's official careers page for the advertised position.",
        "Do not provide sensitive personal or financial information.",
        "Avoid paying any fee associated with the recruitment process.",
      ];
    }

    if (riskLevel === "Caution") {
      return [
        "Review the offer carefully before responding.",
        "Verify the recruiter using the employer's official contact information.",
        "Confirm that the job appears on the employer's official careers page.",
        "Do not share sensitive information during an unverified recruitment process.",
        "Be cautious of pressure to respond immediately.",
      ];
    }

    return [
      "Continue verifying the employer before sharing personal information.",
      "Confirm the position through the employer's official careers website.",
      "Check that recruiter contact details use an official company domain.",
      "Be cautious if the recruiter later requests money or sensitive information.",
    ];
  };

  /**
   * Store recommendations once so the recommendation function
   * does not need to run repeatedly during rendering.
   */
  const recommendations = getRecommendations();

  /**
   * ============================================================
   * handleOpenGuidanceLink
   * ============================================================
   *
   * Opens an official fraud-awareness webpage in the device's
   * default browser.
   *
   * Processing Sequence:
   * 1. Confirm that the device supports the URL.
   * 2. Open the URL in the browser.
   * 3. Display an alert if the URL cannot be opened.
   *
   * @param {string} url - Official webpage to open.
   */
  const handleOpenGuidanceLink = async (url) => {
    try {
      /**
       * Ask the operating system whether an application is
       * available to open the supplied URL.
       */
      const isSupported =
        await Linking.canOpenURL(url);

      if (!isSupported) {
        Alert.alert(
          "Unable to Open Link",
          "This guidance webpage cannot be opened on this device."
        );

        return;
      }

      /**
       * Open the official webpage in the device browser.
       */
      await Linking.openURL(url);
    } catch (error) {
      console.error(
        "Unable to open official guidance link:",
        error
      );

      Alert.alert(
        "Unable to Open Link",
        "SEBAShield could not open this official guidance webpage. Please try again."
      );
    }
  };

  /**
   * Navigates back to the Fake Job Detector so the user can
   * analyze another employment message.
   */
  const handleAnalyzeAnother = () => {
    navigation.goBack();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Main screen heading */}
      <Text style={styles.title}>
        💼 Fake Job Analysis
      </Text>

      {/* Short explanation of the report */}
      <Text style={styles.subtitle}>
        Review the detected indicators and recommended actions before
        responding to the recruiter.
      </Text>

      {/**
       * Risk summary card.
       *
       * The left border uses the current risk-classification color
       * to help users interpret the result quickly.
       */}
      <View
        style={[
          styles.scoreCard,
          {
            borderLeftColor:
              riskPresentation.color,
          },
        ]}
      >
        <Text style={styles.scoreLabel}>
          Threat Score
        </Text>

        <Text style={styles.scoreValue}>
          {score}%
        </Text>

        <Text
          style={[
            styles.riskLevel,
            {
              color: riskPresentation.color,
            },
          ]}
        >
          {riskPresentation.icon} {riskLevel}
        </Text>

        <Text style={styles.riskSummary}>
          {riskPresentation.summary}
        </Text>
      </View>

      {/* Detected-indicator section */}
      <Text style={styles.sectionTitle}>
        What We Found
      </Text>

      <View style={styles.reportCard}>
        {indicators.length === 0 ? (
          <View style={styles.listRow}>
            <Text style={styles.neutralListIcon}>
              ○
            </Text>

            <Text style={styles.listText}>
              No major stored fake-job indicators were detected in the
              submitted content.
            </Text>
          </View>
        ) : (
          indicators.map((indicator, index) => (
            <View
              key={`${indicator}-${index}`}
              style={styles.listRow}
            >
              <Text style={styles.indicatorIcon}>
                ✓
              </Text>

              <Text style={styles.listText}>
                {indicator}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Recommended-action section */}
      <Text style={styles.sectionTitle}>
        Recommended Actions
      </Text>

      <View style={styles.reportCard}>
        {recommendations.map(
          (recommendation, index) => (
            <View
              key={`${recommendation}-${index}`}
              style={styles.listRow}
            >
              <Text style={styles.actionNumber}>
                {index + 1}.
              </Text>

              <Text style={styles.listText}>
                {recommendation}
              </Text>
            </View>
          )
        )}
      </View>

      {/* Original submitted-content section */}
      <Text style={styles.sectionTitle}>
        Submitted Job Offer
      </Text>

      <View style={styles.submittedContentCard}>
        <Text style={styles.submittedContentText}>
          {originalContent}
        </Text>
      </View>

      {/**
       * Analysis limitation notice.
       *
       * This notice clarifies that SEBAShield provides a
       * rule-based risk assessment rather than definitive
       * verification of an employer or recruiter.
       */}
      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>
          Important Analysis Limitation
        </Text>

        <Text style={styles.noticeText}>
          This result was generated by a rule-based detection engine.
          Automated analysis cannot confirm that a recruiter, employer, or job
          offer is legitimate. Always verify the opportunity through official
          company channels before sharing information or taking action.
        </Text>
      </View>

      {/* Official guidance-source section */}
      <Text style={styles.sectionTitle}>
        Guidance Sources
      </Text>

      <View style={styles.sourceCard}>
        <Text style={styles.sourceIntroduction}>
          Select an official resource below to read more about recruitment
          scams, fraud prevention, and reporting options.
        </Text>

        {/**
         * Each source is displayed as a separate interactive card.
         *
         * Selecting a card opens the organization's official
         * webpage in the device browser.
         */}
        {GUIDANCE_SOURCES.map((source) => (
          <TouchableOpacity
            key={source.id}
            style={styles.sourceLinkCard}
            onPress={() =>
              handleOpenGuidanceLink(source.url)
            }
            activeOpacity={0.75}
            accessibilityRole="link"
            accessibilityLabel={`Read official guidance from ${source.name}`}
            accessibilityHint="Opens the official website in your browser"
          >
            <View style={styles.sourceLinkHeader}>
              <Text style={styles.sourceLinkIcon}>
                🛡️
              </Text>

              <Text style={styles.sourceLinkTitle}>
                {source.name}
              </Text>
            </View>

            <Text style={styles.sourceLinkDescription}>
              {source.description}
            </Text>

            <View style={styles.readMoreRow}>
              <Text style={styles.readMoreText}>
                Read official guidance
              </Text>

              <Text style={styles.externalLinkIcon}>
                ↗
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sourceDisclaimer}>
          SEBAShield is an educational prototype and is not affiliated with
          these organizations. External webpages are managed by their
          respective organizations.
        </Text>
      </View>

      {/* Analyze another job-offer button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAnalyzeAnother}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Analyze another job offer"
        accessibilityHint="Returns to the Fake Job Detector screen"
      >
        <Text style={styles.primaryButtonText}>
          Analyze Another Job Offer
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/**
 * ============================================================
 * Screen Styles
 * ============================================================
 *
 * Defines the layout, spacing, typography, colors, cards,
 * list presentation, external links, fallback interface,
 * notices, and primary action button.
 */
const styles = StyleSheet.create({
  /**
   * Main scrollable screen container.
   */
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /**
   * Adds consistent spacing around the report.
   */
  content: {
    padding: 20,
    paddingBottom: 48,
  },

  /**
   * Fallback screen shown when analysis data is unavailable.
   */
  fallbackContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  fallbackIcon: {
    fontSize: 42,
    marginBottom: 16,
  },

  fallbackTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },

  fallbackText: {
    color: COLORS.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 24,
    textAlign: "center",
  },

  /**
   * Main report heading.
   */
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },

  /**
   * Supporting report explanation.
   */
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },

  /**
   * Threat-score summary card.
   *
   * borderLeftWidth creates a clear visual risk accent.
   */
  scoreCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderLeftWidth: 6,
    borderRadius: 18,
    alignItems: "center",
    padding: 22,
    marginBottom: 24,
  },

  scoreLabel: {
    color: COLORS.mutedText,
    fontSize: 16,
  },

  scoreValue: {
    color: COLORS.text,
    fontSize: 46,
    fontWeight: "bold",
    marginTop: 8,
  },

  riskLevel: {
    fontSize: 21,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },

  riskSummary: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    textAlign: "center",
  },

  /**
   * Heading used for each report section.
   */
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 10,
  },

  /**
   * Standard card used for findings and recommendations.
   */
  reportCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },

  /**
   * Horizontal layout used for report-list items.
   */
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  /**
   * Checkmark displayed beside detected indicators.
   */
  indicatorIcon: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
    marginTop: 1,
  },

  /**
   * Neutral symbol displayed when no indicators were found.
   */
  neutralListIcon: {
    color: COLORS.success,
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },

  /**
   * Number displayed beside each recommended action.
   */
  actionNumber: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "bold",
    marginRight: 10,
    minWidth: 20,
  },

  /**
   * Shared text style for findings and recommendations.
   *
   * flex: 1 allows long text to wrap without overflowing.
   */
  listText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },

  /**
   * Card containing the original submitted job content.
   */
  submittedContentCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },

  submittedContentText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 23,
  },

  /**
   * Warning card explaining the analysis limitation.
   */
  noticeCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.warning,
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 24,
    padding: 16,
  },

  noticeTitle: {
    color: COLORS.warning,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },

  noticeText: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },

  /**
   * Container for all official guidance links.
   */
  sourceCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },

  sourceIntroduction: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },

  /**
   * Individual clickable official-resource card.
   */
  sourceLinkCard: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    padding: 14,
  },

  /**
   * Header layout containing the resource icon and name.
   */
  sourceLinkHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  sourceLinkIcon: {
    fontSize: 18,
    marginRight: 9,
  },

  sourceLinkTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "bold",
  },

  sourceLinkDescription: {
    color: COLORS.mutedText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },

  /**
   * Layout for the external-link call to action.
   */
  readMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  readMoreText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "bold",
  },

  externalLinkIcon: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
  },

  sourceDisclaimer: {
    color: COLORS.mutedText,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    fontStyle: "italic",
  },

  /**
   * Primary action button.
   */
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 26,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: "100%",
  },

  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});