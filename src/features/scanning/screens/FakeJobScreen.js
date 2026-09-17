/**
 * ============================================================
 * SEBAShield
 * Fake Job Detector Screen
 * ============================================================
 *
 * Purpose:
 * Allows users to paste suspicious job offers, recruiter
 * messages, or employment advertisements for scam analysis.
 *
 * Processing Flow:
 *
 * Job Offer / Recruiter Message
 *          ↓
 * ScanContext.submitNewScan()
 *          ↓
 * Local Rule-Based Analysis
 *          ↓
 * Local History
 *          ↓
 * Private Firestore Synchronization
 *          ↓
 * Optional AI Analysis
 *          ↓
 * Fake Job Analysis Result
 *
 * Privacy:
 * - Analysis begins locally.
 * - Raw submitted job content is not stored in Firestore.
 * - Only privacy-minimized scan metadata is synchronized.
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

import React, {
  useState,
} from "react";

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

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  COLORS,
} from "../../../shared/constants/colors";

import {
  useScan,
} from "../context/ScanContext";

/**
 * ============================================================
 * FakeJobScreen
 * ============================================================
 */
export default function FakeJobScreen({
  navigation,
}) {
  /**
   * Centralized scan submission action.
   *
   * ScanContext coordinates local analysis, persistence,
   * Firestore synchronization, and optional AI analysis.
   */
  const {
    submitNewScan,
  } = useScan();

  /**
   * Job offer, recruiter message, or employment advertisement
   * currently entered by the user.
   */
  const [
    jobContent,
    setJobContent,
  ] = useState("");

  /**
   * Controls loading state and prevents duplicate submissions.
   */
  const [
    isAnalyzing,
    setIsAnalyzing,
  ] = useState(false);

  /**
   * Determines whether meaningful content is available.
   */
  const hasJobContent =
    jobContent.trim().length > 0;

  /**
   * Primary action is disabled when there is no content or an
   * analysis is already running.
   */
  const isAnalyzeDisabled =
    !hasJobContent ||
    isAnalyzing;

  /**
   * ============================================================
   * handleAnalyzeJob
   * ============================================================
   *
   * Validates and submits one suspicious employment-related
   * message.
   */
  const handleAnalyzeJob =
    async () => {
      /**
       * Prevent duplicate scan requests.
       */
      if (isAnalyzing) {
        return;
      }

      const normalizedContent =
        jobContent.trim();

      /**
       * Secondary validation protects against empty input.
       */
      if (!normalizedContent) {
        Alert.alert(
          "Job Offer Required",
          "Paste or enter a suspicious job offer or recruiter message before starting the scan."
        );

        return;
      }

      try {
        setIsAnalyzing(
          true
        );

        /**
         * Submit through the centralized SEBAShield scanning
         * workflow.
         */
        const result =
          await submitNewScan({
            scanType:
              "fake-job",

            content:
              normalizedContent,
          });

        /**
         * Validate the result before navigation.
         */
        if (
          !result ||
          typeof result !==
            "object" ||
          !result.analysis ||
          typeof result.analysis !==
            "object"
        ) {
          throw new Error(
            "The scan service did not return a valid fake-job analysis."
          );
        }

        /**
         * FakeJobResultScreen already uses originalContent.
         *
         * requiresVerification is also exposed at the top level
         * for compatibility with the existing result screen.
         */
        const jobAnalysisResult =
          {
            ...result.analysis,

            originalContent:
              typeof result
                .analysis
                .originalContent ===
              "string"
                ? result
                    .analysis
                    .originalContent
                : normalizedContent,

            requiresVerification:
              result.analysis
                .details
                ?.requiresVerification !==
              false,
          };

        /**
         * Pass both local and optional AI analysis to the
         * existing Fake Job result screen.
         */
        navigation.navigate(
          "FakeJobResult",
          {
            jobAnalysisResult,

            aiAnalysis:
              result.aiAnalysis ??
              null,
          }
        );
      } catch (error) {
        /**
         * Do not include submitted job content in diagnostic logs.
         */
        console.error(
          "[SEBAShield] Fake-job analysis failed.",
          {
            name:
              error?.name ??
              "UnknownError",

            message:
              error?.message ??
              "Unknown fake-job analysis error",
          }
        );

        Alert.alert(
          "Analysis Unavailable",
          "SEBAShield could not complete the job-offer analysis. Please try again."
        );
      } finally {
        setIsAnalyzing(
          false
        );
      }
    };

  return (
    <KeyboardAvoidingView
      style={
        styles.keyboardContainer
      }
      behavior={
        Platform.OS ===
        "ios"
          ? "padding"
          : undefined
      }
      keyboardVerticalOffset={
        Platform.OS ===
        "ios"
          ? 90
          : 0
      }
    >
      <ScrollView
        style={
          styles.container
        }
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* =====================================================
            Introduction
            ===================================================== */}
        <View
          style={
            styles.introduction
          }
        >
          <View
            style={
              styles.introductionIcon
            }
          >
            <Ionicons
              name="briefcase-outline"
              size={29}
              color={
                COLORS.primary
              }
            />
          </View>

          <Text
            style={
              styles.instruction
            }
          >
            Paste the job offer you want to check.
          </Text>

          <Text
            style={
              styles.helperText
            }
          >
            You can scan job advertisements, recruiter messages,
            interview offers, and employment-related messages.
          </Text>
        </View>

        {/* =====================================================
            Job Content Input
            ===================================================== */}
        <View
          style={
            styles.inputSection
          }
        >
          <View
            style={
              styles.inputHeader
            }
          >
            <Text
              style={
                styles.inputLabel
              }
            >
              Job Offer or Recruiter Message
            </Text>

            <Text
              style={
                styles.characterCount
              }
            >
              {jobContent.length}
            </Text>
          </View>

          <TextInput
            style={
              styles.input
            }
            multiline
            scrollEnabled
            value={
              jobContent
            }
            onChangeText={
              setJobContent
            }
            placeholder="Paste or type the suspicious job offer here..."
            placeholderTextColor={
              COLORS.mutedText
            }
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect
            returnKeyType="default"
            editable={
              !isAnalyzing
            }
            accessibilityLabel="Job offer or recruiter message"
            accessibilityHint="Enter or paste suspicious employment-related content for SEBAShield to analyze"
          />
        </View>

        {/* =====================================================
            Primary Scan Action
            ===================================================== */}
        <TouchableOpacity
          style={[
            styles.button,

            isAnalyzeDisabled &&
              styles.buttonDisabled,
          ]}
          onPress={
            handleAnalyzeJob
          }
          activeOpacity={
            0.82
          }
          disabled={
            isAnalyzeDisabled
          }
          accessibilityRole="button"
          accessibilityLabel={
            isAnalyzing
              ? "Analyzing job offer"
              : "Analyze job offer"
          }
          accessibilityHint="Runs SEBAShield recruitment-scam analysis"
          accessibilityState={{
            disabled:
              isAnalyzeDisabled,

            busy:
              isAnalyzing,
          }}
        >
          {isAnalyzing ? (
            <View
              style={
                styles.buttonContent
              }
            >
              <ActivityIndicator
                size="small"
                color="#000000"
              />

              <Text
                style={
                  styles.buttonText
                }
              >
                Analyzing...
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.buttonContent
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#000000"
              />

              <Text
                style={
                  styles.buttonText
                }
              >
                Analyze Job Offer
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* =====================================================
            Safety Reminder
            ===================================================== */}
        <View
          style={
            styles.safetyNote
          }
        >
          <Ionicons
            name="warning-outline"
            size={20}
            color={
              COLORS.warning
            }
          />

          <Text
            style={
              styles.safetyText
            }
          >
            Never send money, banking details, passwords, SIN, or
            identification to an unverified recruiter. Confirm the
            job through the employer's official website.
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
 */
const styles =
  StyleSheet.create({
    /**
     * Full-screen keyboard-aware container.
     */
    keyboardContainer: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    /**
     * Main screen background.
     */
    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    /**
     * Main content spacing.
     */
    content: {
      flexGrow: 1,

      paddingHorizontal: 20,

      paddingTop: 18,

      paddingBottom: 40,
    },

    /**
     * ========================================================
     * Introduction
     * ========================================================
     */
    introduction: {
      alignItems:
        "center",

      marginBottom: 24,
    },

    introductionIcon: {
      width: 54,

      height: 54,

      borderRadius: 18,

      backgroundColor:
        COLORS.card,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginBottom: 14,
    },

    instruction: {
      color:
        COLORS.text,

      fontSize: 20,

      fontWeight:
        "800",

      textAlign:
        "center",
    },

    helperText: {
      color:
        COLORS.mutedText,

      fontSize: 14,

      lineHeight: 20,

      textAlign:
        "center",

      marginTop: 6,

      paddingHorizontal: 8,
    },

    /**
     * ========================================================
     * Input
     * ========================================================
     */
    inputSection: {
      marginTop: 4,
    },

    inputHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginBottom: 8,
    },

    inputLabel: {
      flex: 1,

      color:
        COLORS.text,

      fontSize: 15,

      fontWeight:
        "700",

      paddingRight: 12,
    },

    characterCount: {
      color:
        COLORS.mutedText,

      fontSize: 12,
    },

    input: {
      minHeight: 240,

      maxHeight: 350,

      backgroundColor:
        COLORS.card,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 16,

      color:
        COLORS.text,

      fontSize: 15,

      lineHeight: 22,

      paddingHorizontal: 16,

      paddingVertical: 15,
    },

    /**
     * ========================================================
     * Primary Button
     * ========================================================
     */
    button: {
      width: "100%",

      minHeight: 56,

      backgroundColor:
        COLORS.primary,

      borderRadius: 14,

      paddingHorizontal: 20,

      marginTop: 18,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    buttonDisabled: {
      opacity: 0.45,
    },

    buttonContent: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    buttonText: {
      color:
        "#000000",

      fontSize: 16,

      fontWeight:
        "800",

      marginLeft: 8,
    },

    /**
     * ========================================================
     * Safety Reminder
     * ========================================================
     */
    safetyNote: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      marginTop: 22,

      paddingHorizontal: 4,
    },

    safetyText: {
      flex: 1,

      color:
        COLORS.mutedText,

      fontSize: 12,

      lineHeight: 18,

      marginLeft: 9,
    },
  });