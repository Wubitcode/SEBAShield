/**
 * ============================================================
 * SEBAShield
 * Link Checker Screen
 * ============================================================
 *
 * Purpose:
 * Allows users to submit a suspicious website address for
 * phishing and unsafe-link analysis.
 *
 * Processing Flow:
 *
 * Suspicious URL
 *      ↓
 * ScanContext.submitNewScan()
 *      ↓
 * Local Rule-Based Analysis
 *      ↓
 * Local History
 *      ↓
 * Private Firestore Synchronization
 *      ↓
 * Optional AI Analysis
 *      ↓
 * Link Analysis Result
 *
 * Privacy:
 * - Analysis begins locally.
 * - Raw submitted URLs are not stored in Firestore.
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
 * LinkCheckerScreen
 * ============================================================
 */
export default function LinkCheckerScreen({
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
   * URL currently entered by the user.
   */
  const [
    url,
    setUrl,
  ] = useState("");

  /**
   * Prevents duplicate submissions and controls loading state.
   */
  const [
    isAnalyzing,
    setIsAnalyzing,
  ] = useState(false);

  /**
   * Determines whether meaningful input is available.
   */
  const hasUrlContent =
    url.trim().length > 0;

  /**
   * ============================================================
   * handleAnalyzeLink
   * ============================================================
   *
   * Validates and submits one suspicious URL.
   */
  const handleAnalyzeLink =
    async () => {
      /**
       * Prevent duplicate analysis requests.
       */
      if (isAnalyzing) {
        return;
      }

      const normalizedInput =
        url.trim();

      /**
       * Secondary validation protects against empty input.
       */
      if (!normalizedInput) {
        Alert.alert(
          "URL Required",
          "Paste or enter a suspicious website address before starting the scan."
        );

        return;
      }

      try {
        setIsAnalyzing(
          true
        );

        /**
         * Submit the URL through the centralized SEBAShield
         * scanning workflow.
         */
        const result =
          await submitNewScan({
            scanType:
              "link",

            content:
              normalizedInput,
          });

        /**
         * Validate the returned analysis before navigation.
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
            "The scan service did not return a valid link analysis."
          );
        }

        /**
         * LinkResultScreen currently expects originalUrl.
         *
         * Keep the centralized originalContent field internally
         * while adapting the result at this navigation boundary.
         */
        const linkAnalysisResult =
          {
            ...result.analysis,

            originalUrl:
              typeof result
                .analysis
                .originalContent ===
              "string"
                ? result
                    .analysis
                    .originalContent
                : normalizedInput,
          };

        /**
         * Pass both the deterministic local result and optional
         * AI assessment to the existing result screen.
         */
        navigation.navigate(
          "LinkResult",
          {
            linkAnalysisResult,

            aiAnalysis:
              result.aiAnalysis ??
              null,
          }
        );
      } catch (error) {
        /**
         * Do not include the submitted URL in diagnostic logs.
         */
        console.error(
          "[SEBAShield] Link analysis failed.",
          {
            name:
              error?.name ??
              "UnknownError",

            message:
              error?.message ??
              "Unknown link-analysis error",
          }
        );

        Alert.alert(
          "Analysis Unavailable",
          "SEBAShield could not complete the link analysis. Please try again."
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
              name="link-outline"
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
            Paste the link you want to check.
          </Text>

          <Text
            style={
              styles.helperText
            }
          >
            SEBAShield will check the address for common phishing
            and suspicious-link warning signs.
          </Text>
        </View>

        {/* =====================================================
            URL Input
            ===================================================== */}
        <View
          style={
            styles.inputSection
          }
        >
          <Text
            style={
              styles.inputLabel
            }
          >
            Website Address
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              url
            }
            onChangeText={
              setUrl
            }
            placeholder="Example: http://secure-login-example.xyz"
            placeholderTextColor={
              COLORS.mutedText
            }
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            editable={
              !isAnalyzing
            }
            accessibilityLabel="Suspicious website address"
            accessibilityHint="Enter or paste a website address for SEBAShield to analyze"
          />
        </View>

        {/* =====================================================
            Primary Scan Action
            ===================================================== */}
        <TouchableOpacity
          style={[
            styles.button,

            (!hasUrlContent ||
              isAnalyzing) &&
              styles.buttonDisabled,
          ]}
          onPress={
            handleAnalyzeLink
          }
          activeOpacity={
            0.82
          }
          disabled={
            !hasUrlContent ||
            isAnalyzing
          }
          accessibilityRole="button"
          accessibilityLabel={
            isAnalyzing
              ? "Analyzing link"
              : "Analyze link"
          }
          accessibilityHint="Runs the SEBAShield suspicious-link analysis"
          accessibilityState={{
            disabled:
              !hasUrlContent ||
              isAnalyzing,

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
                Analyze Link
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
            Do not open a suspicious link just to inspect it.
            Copy and paste the address here instead.
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

      marginBottom: 28,
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

      paddingHorizontal: 12,
    },

    /**
     * ========================================================
     * URL Input
     * ========================================================
     */
    inputSection: {
      marginTop: 4,
    },

    inputLabel: {
      color:
        COLORS.text,

      fontSize: 15,

      fontWeight:
        "700",

      marginBottom: 8,
    },

    input: {
      minHeight: 58,

      backgroundColor:
        COLORS.card,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 16,

      paddingHorizontal: 16,

      paddingVertical: 14,

      color:
        COLORS.text,

      fontSize: 15,
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