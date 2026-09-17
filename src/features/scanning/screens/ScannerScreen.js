/**
 * ============================================================
 * SEBAShield
 * Message Scanner Screen
 * ============================================================
 *
 * Purpose:
 * Allows users to paste suspicious digital communication and
 * receive a scam-risk assessment.
 *
 * Supported Content:
 * - SMS messages
 * - Email messages
 * - Social-media messages
 * - Marketplace messages
 * - General suspicious communication
 *
 * Processing Flow:
 *
 * User Message
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
 * Threat Analysis Result
 *
 * Privacy:
 * - Analysis begins locally.
 * - Raw submitted content is not stored in Firestore.
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
 * ScannerScreen
 * ============================================================
 */
export default function ScannerScreen({
  navigation,
}) {
  /**
   * Centralized scan submission action.
   *
   * This coordinates local analysis, persistence,
   * synchronization, and optional AI analysis.
   */
  const {
    submitNewScan,
  } = useScan();

  /**
   * Current message entered by the user.
   */
  const [
    message,
    setMessage,
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
  const hasMessageContent =
    message.trim().length > 0;

  /**
   * ============================================================
   * handleAnalyze
   * ============================================================
   *
   * Validates and submits one suspicious message.
   */
  const handleAnalyze =
    async () => {
      /**
       * Prevent repeated submissions while a scan is running.
       */
      if (isAnalyzing) {
        return;
      }

      const trimmedMessage =
        message.trim();

      /**
       * Secondary validation protects against empty or
       * whitespace-only submissions.
       */
      if (!trimmedMessage) {
        Alert.alert(
          "Message Required",
          "Paste or enter a suspicious message before starting the scan."
        );

        return;
      }

      try {
        setIsAnalyzing(
          true
        );

        /**
         * Submit through the centralized SEBAShield workflow.
         */
        const result =
          await submitNewScan({
            scanType:
              "message",

            content:
              trimmedMessage,
          });

        /**
         * Validate the result before navigating.
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
            "The scan service did not return a valid message analysis."
          );
        }

        /**
         * ResultScreen currently expects originalMessage.
         *
         * Preserve the centralized originalContent model while
         * adapting the result to the existing screen contract.
         */
        const analysisResult =
          {
            ...result.analysis,

            originalMessage:
              typeof result
                .analysis
                .originalContent ===
              "string"
                ? result
                    .analysis
                    .originalContent
                : trimmedMessage,
          };

        /**
         * Send both local and optional AI analysis to the
         * existing result screen.
         */
        navigation.navigate(
          "Result",
          {
            analysisResult,

            aiAnalysis:
              result.aiAnalysis ??
              null,
          }
        );
      } catch (error) {
        /**
         * Do not log submitted message content.
         */
        console.error(
          "[SEBAShield] Message analysis failed.",
          {
            name:
              error?.name ??
              "UnknownError",

            message:
              error?.message ??
              "Unknown analysis error",
          }
        );

        Alert.alert(
          "Analysis Unavailable",
          "SEBAShield could not complete the message analysis. Please try again."
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
              name="chatbubble-ellipses-outline"
              size={28}
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
            Paste the message you want to check.
          </Text>

          <Text
            style={
              styles.helperText
            }
          >
            You can scan SMS, email, social-media, or other
            suspicious messages.
          </Text>
        </View>

        {/* =====================================================
            Message Input
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
              Suspicious Message
            </Text>

            <Text
              style={
                styles.characterCount
              }
            >
              {message.length}
            </Text>
          </View>

          <TextInput
            style={
              styles.input
            }
            multiline
            value={
              message
            }
            onChangeText={
              setMessage
            }
            placeholder="Paste or type the suspicious message here..."
            placeholderTextColor={
              COLORS.mutedText
            }
            textAlignVertical="top"
            editable={
              !isAnalyzing
            }
            autoCapitalize="sentences"
            autoCorrect
            accessibilityLabel="Suspicious message"
            accessibilityHint="Enter or paste a message for SEBAShield to analyze"
          />
        </View>

        {/* =====================================================
            Primary Scan Action
            ===================================================== */}
        <TouchableOpacity
          style={[
            styles.button,

            (!hasMessageContent ||
              isAnalyzing) &&
              styles.buttonDisabled,
          ]}
          onPress={
            handleAnalyze
          }
          disabled={
            !hasMessageContent ||
            isAnalyzing
          }
          activeOpacity={
            0.82
          }
          accessibilityRole="button"
          accessibilityLabel={
            isAnalyzing
              ? "Analyzing message"
              : "Analyze message"
          }
          accessibilityHint="Runs SEBAShield scam-risk analysis"
          accessibilityState={{
            disabled:
              !hasMessageContent ||
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
                Analyze Message
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
            name="information-circle-outline"
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
            A low-risk result does not guarantee that a message is
            safe. Verify suspicious requests before sending money or
            sensitive information.
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
     * Main screen.
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

      paddingHorizontal: 12,
    },

    /**
     * ========================================================
     * Message Input
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
      color:
        COLORS.text,

      fontSize: 15,

      fontWeight:
        "700",
    },

    characterCount: {
      color:
        COLORS.mutedText,

      fontSize: 12,
    },

    input: {
      minHeight: 230,

      maxHeight: 340,

      backgroundColor:
        COLORS.card,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 16,

      paddingHorizontal: 16,

      paddingVertical: 15,

      color:
        COLORS.text,

      fontSize: 15,

      lineHeight: 22,
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