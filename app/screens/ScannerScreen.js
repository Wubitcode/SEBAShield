/**
 * ============================================================
 * SEBAShield
 * Message Scanner Screen
 * ============================================================
 *
 * Purpose:
 * Allows users to paste suspicious digital communication and
 * receive a rule-based scam-risk assessment.
 *
 * Supported Content:
 * - SMS messages
 * - Email messages
 * - Social-media messages
 * - Marketplace messages
 * - General phishing or scam messages
 *
 * Main Responsibilities:
 * - Collect suspicious message content.
 * - Validate the submitted input.
 * - Run the message through the scam-analysis service.
 * - Save the completed analysis to local scan history.
 * - Navigate to the detailed Result screen.
 * - Prevent accidental duplicate submissions.
 * - Provide accessible and responsive user interaction.
 *
 * Navigation Flow:
 *
 * Home Screen
 *      ↓
 * Message Scanner
 *      ↓
 * Threat Analysis Result
 *
 * History Flow:
 *
 * Completed Message Analysis
 *      ↓
 * AsyncStorage History Service
 *      ↓
 * History Screen
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

import React, { useState } from "react";

/**
 * React Native components used by this screen.
 *
 * ActivityIndicator:
 * Displays progress while the message is being analyzed.
 *
 * Alert:
 * Displays validation and error messages.
 *
 * KeyboardAvoidingView:
 * Prevents the software keyboard from covering the input area
 * and action button.
 *
 * Platform:
 * Applies platform-specific keyboard behavior.
 *
 * ScrollView:
 * Keeps the full screen accessible on smaller devices.
 *
 * StyleSheet:
 * Organizes reusable interface styles.
 *
 * Text:
 * Displays headings, instructions, notices, and button labels.
 *
 * TextInput:
 * Accepts suspicious message content from the user.
 *
 * TouchableOpacity:
 * Creates the interactive analysis button.
 *
 * View:
 * Groups related interface elements.
 */
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Centralized SEBAShield color palette.
 *
 * Using shared colors keeps the application visually consistent
 * and makes future design changes easier to manage.
 */
import { COLORS } from "../constants/colors";

/**
 * Message scam-analysis service.
 *
 * This service examines the submitted message, calculates a
 * threat score, assigns a risk level, and returns detected
 * scam indicators.
 */
import { analyzeMessage } from "../../services/scamAnalyzer";

/**
 * Shared local-history service.
 *
 * saveScan stores completed scan information in AsyncStorage so
 * the analysis can later appear on the History screen.
 */
import { saveScan } from "../../services/historyService";

/**
 * ============================================================
 * ScannerScreen Component
 * ============================================================
 *
 * Collects suspicious message content, performs the analysis,
 * stores the result, and navigates to the Result screen.
 */
export default function ScannerScreen({ navigation }) {
  /**
   * Stores the message currently entered by the user.
   */
  const [message, setMessage] = useState("");

  /**
   * Tracks whether an analysis operation is in progress.
   *
   * This state:
   * - prevents repeated button presses;
   * - disables editing during processing;
   * - displays a loading indicator.
   */
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * Determine whether the current input contains usable text.
   *
   * Whitespace-only input is treated as empty.
   */
  const hasMessageContent = message.trim().length > 0;

  /**
   * ============================================================
   * handleAnalyze
   * ============================================================
   *
   * Validates the submitted content, runs the scam-analysis
   * service, saves the result to local history, and opens the
   * detailed Result screen.
   *
   * Processing Sequence:
   * 1. Prevent another submission while processing.
   * 2. Remove unnecessary leading and trailing whitespace.
   * 3. Validate that meaningful content was entered.
   * 4. Run the message-analysis service.
   * 5. Save the completed scan to local history.
   * 6. Navigate to the detailed Result screen.
   * 7. Restore the button state if processing finishes or fails.
   */
  const handleAnalyze = async () => {
    /**
     * Protect against duplicate button presses.
     */
    if (isAnalyzing) {
      return;
    }

    /**
     * Normalize the submitted message before analysis.
     */
    const trimmedMessage = message.trim();

    /**
     * Prevent empty or whitespace-only submissions.
     */
    if (!trimmedMessage) {
      Alert.alert(
        "Input Required",
        "Please enter or paste a suspicious message before running the analysis."
      );

      return;
    }

    try {
      /**
       * Disable the button and display the loading state.
       */
      setIsAnalyzing(true);

      /**
       * Run the local scam-analysis engine.
       *
       * The service is currently synchronous, but this screen
       * uses an asynchronous handler because saving to local
       * history requires an asynchronous operation.
       */
      const analysisResult = analyzeMessage(trimmedMessage);

      /**
       * Validate that the analysis service returned a usable
       * result before saving or navigating.
       */
      if (!analysisResult || typeof analysisResult !== "object") {
        throw new Error(
          "The message-analysis service did not return a valid result."
        );
      }

      /**
       * Normalize important values before saving them.
       *
       * These fallback values prevent incomplete service output
       * from breaking the History screen.
       */
      const normalizedScore =
        typeof analysisResult.score === "number"
          ? analysisResult.score
          : 0;

      const normalizedRiskLevel =
        analysisResult.riskLevel || "Unknown Risk";

      const normalizedIndicators = Array.isArray(
        analysisResult.indicators
      )
        ? analysisResult.indicators
        : [];

      /**
       * Store the completed message scan in local history.
       *
       * The History service adds the unique identifier and
       * timestamp used by the History screen.
       */
      await saveScan({
        scanType: "message",
        score: normalizedScore,
        riskLevel: normalizedRiskLevel,
        indicators: normalizedIndicators,
        originalContent: trimmedMessage,
      });

      /**
       * Navigate to the detailed Result screen.
       *
       * The complete analysis object is passed so ResultScreen
       * can display all findings generated by scamAnalyzer.
       */
      navigation.navigate("Result", {
        analysisResult: {
          ...analysisResult,

          /**
           * Include the normalized submitted message in case the
           * analyzer does not already return originalContent.
           */
          originalContent:
            analysisResult.originalContent || trimmedMessage,
        },
      });
    } catch (error) {
      /**
       * Record technical information for development debugging.
       */
      console.error(
        "Unable to analyze or save the suspicious message:",
        error
      );

      /**
       * Display a user-friendly error without exposing internal
       * implementation details.
       */
      Alert.alert(
        "Analysis Unavailable",
        "SEBAShield could not complete the message analysis. Please try again."
      );
    } finally {
      /**
       * Restore the interface regardless of success or failure.
       */
      setIsAnalyzing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Main screen heading */}
        <Text style={styles.title}>
          🛡️ Message Scanner
        </Text>

        {/* Screen purpose and user instruction */}
        <Text style={styles.subtitle}>
          Paste a suspicious SMS, email, social-media message, or other
          communication below for scam-risk analysis.
        </Text>

        {/**
         * Educational information card.
         *
         * This prepares the user for the types of warning signs
         * that the rule-based analyzer evaluates.
         */}
        <View style={styles.informationCard}>
          <Text style={styles.informationTitle}>
            What SEBAShield Checks
          </Text>

          <Text style={styles.informationText}>
            The scanner checks for warning signs such as urgent language,
            payment requests, suspicious links, requests for sensitive
            information, prizes, threats, and impersonation attempts.
          </Text>
        </View>

        {/* Input-field label */}
        <Text style={styles.inputLabel}>
          Suspicious Message
        </Text>

        {/**
         * Multiline message input.
         *
         * The input remains a controlled component through the
         * message state value.
         */}
        <TextInput
          style={styles.input}
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder="Paste suspicious content here..."
          placeholderTextColor={COLORS.mutedText}
          textAlignVertical="top"
          editable={!isAnalyzing}
          autoCapitalize="sentences"
          autoCorrect
          accessibilityLabel="Suspicious message"
          accessibilityHint="Enter or paste the message that you want SEBAShield to analyze"
        />

        {/**
         * Character-count feedback.
         *
         * This gives the user a clear indication that their
         * complete content has been entered.
         */}
        <Text style={styles.characterCount}>
          {message.length} characters
        </Text>

        {/**
         * Analysis button.
         *
         * The button is disabled when:
         * - no meaningful content has been entered; or
         * - an analysis is already in progress.
         */}
        <TouchableOpacity
          style={[
            styles.button,
            (!hasMessageContent || isAnalyzing) &&
              styles.buttonDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={!hasMessageContent || isAnalyzing}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={
            isAnalyzing
              ? "Analyzing message"
              : "Analyze suspicious message"
          }
          accessibilityHint="Runs the SEBAShield scam-risk analysis"
          accessibilityState={{
            disabled: !hasMessageContent || isAnalyzing,
            busy: isAnalyzing,
          }}
        >
          {isAnalyzing ? (
            <View style={styles.buttonLoadingContent}>
              <ActivityIndicator
                size="small"
                color="#000000"
              />

              <Text style={styles.buttonText}>
                Analyzing...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>
              Analyze Message
            </Text>
          )}
        </TouchableOpacity>

        {/**
         * History confirmation notice.
         *
         * This explains that completed results are stored locally
         * and can be reviewed from the History screen.
         */}
        <View style={styles.historyNoticeCard}>
          <Text style={styles.historyNoticeIcon}>
            🕘
          </Text>

          <View style={styles.historyNoticeContent}>
            <Text style={styles.historyNoticeTitle}>
              Saved to Scan History
            </Text>

            <Text style={styles.historyNoticeText}>
              Completed message analyses are stored locally on this device
              and can be reviewed from the History screen.
            </Text>
          </View>
        </View>

        {/**
         * Analysis limitation notice.
         *
         * The app provides a risk assessment, not a guarantee
         * that a message is safe or fraudulent.
         */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>
            Important
          </Text>

          <Text style={styles.disclaimerText}>
            SEBAShield provides an educational, rule-based risk assessment.
            A low score does not prove that a message is safe. Avoid sending
            money or sensitive information until the sender has been
            independently verified.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * ============================================================
 * Screen Styles
 * ============================================================
 *
 * Defines the layout, typography, cards, input field, loading
 * state, notices, and primary action button.
 */
const styles = StyleSheet.create({
  /**
   * Allows KeyboardAvoidingView to fill the available screen.
   */
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /**
   * Main scrollable screen container.
   */
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /**
   * Adds consistent spacing around the screen content.
   */
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 44,
  },

  /**
   * Main screen heading.
   */
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },

  /**
   * Supporting screen description.
   */
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },

  /**
   * Educational card displayed above the message input.
   */
  informationCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 22,
  },

  informationTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 7,
  },

  informationText: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },

  /**
   * Label displayed immediately above the input field.
   */
  inputLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },

  /**
   * Multiline suspicious-message input area.
   */
  input: {
    minHeight: 230,
    maxHeight: 340,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },

  /**
   * Character count shown underneath the input.
   */
  characterCount: {
    alignSelf: "flex-end",
    color: COLORS.mutedText,
    fontSize: 12,
    marginTop: 7,
  },

  /**
   * Main analysis button.
   */
  button: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 20,
  },

  /**
   * Reduced-opacity appearance for disabled button states.
   */
  buttonDisabled: {
    opacity: 0.5,
  },

  /**
   * Aligns the loading indicator and loading label.
   */
  buttonLoadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  /**
   * Primary button text.
   */
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginLeft: 8,
  },

  /**
   * Local-history information card.
   */
  historyNoticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 22,
  },

  historyNoticeIcon: {
    fontSize: 21,
    marginRight: 12,
  },

  historyNoticeContent: {
    flex: 1,
  },

  historyNoticeTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 5,
  },

  historyNoticeText: {
    color: COLORS.mutedText,
    fontSize: 13,
    lineHeight: 19,
  },

  /**
   * Educational limitation and safety notice.
   */
  disclaimerCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.warning,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },

  disclaimerTitle: {
    color: COLORS.warning,
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
  },

  disclaimerText: {
    color: COLORS.mutedText,
    fontSize: 13,
    lineHeight: 20,
  },
});