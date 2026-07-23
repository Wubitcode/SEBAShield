/**
 * ============================================================
 * SEBAShield
 * Fake Job Detector Screen
 * ============================================================
 *
 * Purpose:
 * Provides a dedicated interface where users can paste a
 * suspicious job offer, recruiter message, or employment
 * advertisement for recruitment-scam analysis.
 *
 * Main Responsibilities:
 * - Collect job-related text from the user.
 * - Prevent empty submissions.
 * - Send the submitted content to the fake-job analyzer.
 * - Save completed analyses to local scan history.
 * - Navigate to the Fake Job Analysis Result screen.
 * - Keep the Analyze button accessible when long text is pasted.
 * - Prevent the mobile keyboard from covering important controls.
 * - Prevent duplicate analyses while processing is in progress.
 *
 * Why This Screen Uses a ScrollView:
 * Recruiter messages can be long. Without a ScrollView, the
 * TextInput may push the Analyze button below the visible screen.
 * The ScrollView allows the full screen to remain accessible.
 *
 * Navigation Flow:
 *
 * Home Screen
 *      ↓
 * Fake Job Detector
 *      ↓
 * Fake Job Analysis Result
 *
 * History Flow:
 *
 * Completed Analysis
 *      ↓
 * History Service
 *      ↓
 * AsyncStorage
 *      ↓
 * Scan History Screen
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
 * Displays progress while the application analyzes and saves
 * the submitted job content.
 *
 * Alert:
 * Displays validation and error messages.
 *
 * KeyboardAvoidingView:
 * Adjusts the screen when the mobile keyboard appears.
 *
 * Platform:
 * Applies platform-specific keyboard behavior.
 *
 * ScrollView:
 * Allows the screen to scroll when its content is taller than
 * the available device space.
 *
 * StyleSheet:
 * Organizes reusable screen styles.
 *
 * Text:
 * Displays headings, labels, instructions, and reminders.
 *
 * TextInput:
 * Accepts the suspicious job offer or recruiter message.
 *
 * TouchableOpacity:
 * Creates the interactive Analyze Job Offer button.
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
 * Shared colors keep this screen visually consistent with the
 * rest of the application.
 */
import { COLORS } from "../constants/colors";

/**
 * Fake-job analysis service.
 *
 * The analyzer evaluates submitted content for recruitment-scam
 * warning signs and returns a structured result containing a
 * score, risk level, indicators, and supporting information.
 */
import { analyzeFakeJob } from "../../services/jobScamAnalyzer";

/**
 * Shared history service.
 *
 * saveScan stores completed analysis records in AsyncStorage
 * using the application's centralized history format.
 */
import { saveScan } from "../../services/historyService";

/**
 * ============================================================
 * FakeJobScreen Component
 * ============================================================
 *
 * Collects suspicious employment-related content, validates it,
 * analyzes it, saves the completed result, and sends the result
 * to FakeJobResultScreen.
 */
export default function FakeJobScreen({ navigation }) {
  /**
   * Stores the job offer, recruiter message, or employment
   * advertisement entered by the user.
   */
  const [jobContent, setJobContent] = useState("");

  /**
   * Tracks whether an analysis is currently being processed.
   *
   * This prevents users from pressing the Analyze button multiple
   * times and accidentally saving duplicate history records.
   */
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * Determines whether the input contains meaningful content.
   */
  const isInputEmpty = jobContent.trim().length === 0;

  /**
   * Disables the button when:
   * - The input is empty, or
   * - An analysis is already running.
   */
  const isAnalyzeDisabled =
    isInputEmpty || isAnalyzing;

  /**
   * ============================================================
   * handleAnalyzeJob
   * ============================================================
   *
   * Processing sequence:
   * 1. Normalize and validate the submitted content.
   * 2. Run the fake-job scam analyzer.
   * 3. Build a complete result object.
   * 4. Save a history record through historyService.
   * 5. Navigate to the result screen.
   *
   * The function is asynchronous because saving to AsyncStorage
   * returns a Promise.
   */
  const handleAnalyzeJob = async () => {
    /**
     * Remove unnecessary whitespace from the beginning and end
     * of the submitted message.
     */
    const normalizedContent = jobContent.trim();

    /**
     * Prevent an empty message from being analyzed.
     *
     * Although the button is visually disabled when no content
     * exists, this validation remains as a secondary safeguard.
     */
    if (!normalizedContent) {
      Alert.alert(
        "Job Offer Required",
        "Please enter or paste a job offer before starting the analysis."
      );

      return;
    }

    /**
     * Prevent a second analysis from starting while the current
     * request is still being processed.
     */
    if (isAnalyzing) {
      return;
    }

    try {
      setIsAnalyzing(true);

      /**
       * Run the submitted content through the dedicated
       * recruitment-scam detection service.
       */
      const analyzerResult =
        analyzeFakeJob(normalizedContent);

      /**
       * Validate that the analyzer returned a usable object.
       *
       * Throwing an error here prevents invalid data from being
       * saved or passed to the result screen.
       */
      if (
        !analyzerResult ||
        typeof analyzerResult !== "object"
      ) {
        throw new Error(
          "The fake-job analyzer returned an invalid result."
        );
      }

      /**
       * Build one complete result object.
       *
       * originalContent is added explicitly so the Result screen
       * and History screen can display the exact message that was
       * analyzed, even if the analyzer does not include it.
       */
      const jobAnalysisResult = {
        ...analyzerResult,
        originalContent: normalizedContent,
      };

      /**
       * Save the completed analysis to persistent local history.
       *
       * The history service automatically adds:
       * - A unique record ID
       * - The creation date and time
       */
      await saveScan({
        scanType: "Fake Job Detector",
        score:
          typeof jobAnalysisResult.score === "number"
            ? jobAnalysisResult.score
            : 0,
        riskLevel:
          jobAnalysisResult.riskLevel ||
          "Unknown Risk",
        indicators: Array.isArray(
          jobAnalysisResult.indicators
        )
          ? jobAnalysisResult.indicators
          : [],
        originalContent: normalizedContent,
      });

      /**
       * Navigate to the result screen and pass the complete
       * analysis through React Navigation route parameters.
       */
      navigation.navigate("FakeJobResult", {
        jobAnalysisResult,
      });
    } catch (error) {
      console.error(
        "Unable to analyze or save the job offer:",
        error
      );

      Alert.alert(
        "Analysis Unavailable",
        "SEBAShield could not complete the job-offer analysis. Please try again."
      );
    } finally {
      /**
       * Restore the button after processing completes or fails.
       */
      setIsAnalyzing(false);
    }
  };

  return (
    /**
     * KeyboardAvoidingView helps keep the interface usable when
     * the on-screen keyboard is open.
     *
     * iOS works best with padding behavior. Android generally
     * manages keyboard resizing without an explicit behavior.
     */
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
      keyboardVerticalOffset={
        Platform.OS === "ios" ? 90 : 0
      }
    >
      {/**
       * ScrollView allows users to reach the Analyze button and
       * safety reminder after pasting a long recruiter message.
       */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Main screen title */}
        <Text style={styles.title}>
          💼 Fake Job Detector
        </Text>

        {/* Feature explanation */}
        <Text style={styles.subtitle}>
          Paste a suspicious job offer, recruiter message, or employment
          advertisement below for recruitment-scam analysis.
        </Text>

        {/* Input field label */}
        <Text style={styles.label}>
          Job Offer or Recruiter Message
        </Text>

        {/**
         * Multiline input area.
         *
         * The fixed height prevents long messages from expanding
         * the field indefinitely and pushing controls off-screen.
         * Long content remains scrollable inside the TextInput.
         */}
        <TextInput
          style={styles.input}
          multiline
          scrollEnabled
          value={jobContent}
          onChangeText={setJobContent}
          placeholder="Paste suspicious job content here..."
          placeholderTextColor={COLORS.mutedText}
          textAlignVertical="top"
          autoCapitalize="sentences"
          autoCorrect
          returnKeyType="default"
          editable={!isAnalyzing}
          accessibilityLabel="Job offer or recruiter message input"
          accessibilityHint="Paste suspicious job-related content for recruitment-scam analysis"
        />

        {/**
         * Analyze button.
         *
         * The button is disabled when the input is empty or while
         * analysis is in progress.
         */}
        <TouchableOpacity
          style={[
            styles.button,
            isAnalyzeDisabled &&
              styles.buttonDisabled,
          ]}
          onPress={handleAnalyzeJob}
          activeOpacity={0.8}
          disabled={isAnalyzeDisabled}
          accessibilityRole="button"
          accessibilityLabel={
            isAnalyzing
              ? "Analyzing job offer"
              : "Analyze job offer"
          }
          accessibilityState={{
            disabled: isAnalyzeDisabled,
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
            <Text
              style={[
                styles.buttonText,
                isAnalyzeDisabled &&
                  styles.buttonTextDisabled,
              ]}
            >
              Analyze Job Offer
            </Text>
          )}
        </TouchableOpacity>

        {/**
         * History information card.
         *
         * This informs users that completed results are stored
         * locally and can be reviewed from Scan History.
         */}
        <View style={styles.historyNotice}>
          <Text style={styles.historyNoticeTitle}>
            🗂️ Scan History
          </Text>

          <Text style={styles.historyNoticeText}>
            Completed analyses are saved locally on this device and can be
            reviewed from the Scan History screen.
          </Text>
        </View>

        {/**
         * Safety reminder.
         *
         * This remains visible regardless of the analysis result
         * because users should never provide sensitive information
         * to an unverified recruiter.
         */}
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            Safety Reminder
          </Text>

          <Text style={styles.noticeText}>
            Do not send your SIN, banking information, identification,
            passwords, verification codes, or money to an unverified
            recruiter. Confirm the position through the employer&apos;s
            official careers website before responding.
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
 * Defines the screen layout, scrolling behavior, typography,
 * input appearance, processing states, buttons, and notices.
 */
const styles = StyleSheet.create({
  /**
   * Main screen wrapper.
   */
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /**
   * ScrollView wrapper.
   */
  scrollView: {
    flex: 1,
  },

  /**
   * Inner ScrollView layout.
   *
   * flexGrow allows the content to fill the screen while still
   * supporting scrolling when content becomes longer.
   */
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },

  /**
   * Primary screen heading.
   */
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  /**
   * Supporting screen instructions.
   */
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 26,
  },

  /**
   * TextInput label.
   */
  label: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },

  /**
   * Multiline recruiter-message input.
   *
   * A fixed height prevents long pasted content from pushing the
   * Analyze button outside the visible screen.
   */
  input: {
    height: 250,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
    padding: 15,
  },

  /**
   * Primary Analyze button.
   */
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
  },

  /**
   * Disabled button appearance.
   */
  buttonDisabled: {
    opacity: 0.45,
  },

  /**
   * Horizontal layout used while analysis is running.
   */
  buttonLoadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  /**
   * Analyze button text.
   */
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  /**
   * Disabled button text appearance.
   */
  buttonTextDisabled: {
    color: "#333333",
  },

  /**
   * Informational card explaining local history storage.
   */
  historyNotice: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 24,
    padding: 16,
  },

  historyNoticeTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },

  historyNoticeText: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },

  /**
   * Safety reminder card.
   */
  notice: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.warning,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },

  /**
   * Safety reminder heading.
   */
  noticeTitle: {
    color: COLORS.warning,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },

  /**
   * Safety reminder supporting text.
   */
  noticeText: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },
});