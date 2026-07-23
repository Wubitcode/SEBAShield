/**
 * ============================================================
 * SEBAShield
 * Link Checker Screen
 * ============================================================
 *
 * Purpose:
 * Allows users to submit a suspicious URL for security analysis.
 *
 * Current Responsibilities:
 * - Accept a URL from the user.
 * - Validate that the input is not empty.
 * - Run the URL through the link-checking service.
 * - Navigate to the Link Result screen.
 *
 * Why We Use a Dedicated Screen:
 * Message analysis and URL analysis require different validation
 * rules and detection logic. Keeping them separate improves
 * maintainability and makes the application easier to scale.
 *
 * Navigation Flow:
 *
 * Home Screen
 *      ↓
 * Link Checker
 *      ↓
 * Link Analysis Result
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

import React, { useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS } from "../constants/colors";
import { analyzeLink } from "../../services/linkChecker";

/**
 * LinkCheckerScreen Component
 *
 * Receives the navigation object from React Navigation.
 * The navigation object is used to open the Link Result screen
 * after the URL analysis is complete.
 */
export default function LinkCheckerScreen({ navigation }) {
  /**
   * Stores the URL entered by the user.
   */
  const [url, setUrl] = useState("");

  /**
   * Validates the URL, runs the link analysis service,
   * and sends the result to LinkResultScreen.
   */
  const handleAnalyzeLink = () => {
    const normalizedInput = url.trim();

    /**
     * Prevent empty submissions.
     */
    if (!normalizedInput) {
      Alert.alert(
        "URL Required",
        "Please enter or paste a URL before starting the analysis."
      );
      return;
    }

    /**
     * Run the dedicated URL-analysis service.
     */
    const linkAnalysisResult = analyzeLink(normalizedInput);

    /**
     * Navigate to the result screen and pass the completed
     * analysis through route parameters.
     */
    navigation.navigate("LinkResult", {
      linkAnalysisResult,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        {/* Screen heading */}
        <Text style={styles.title}>🔗 Link Checker</Text>

        {/* User instructions */}
        <Text style={styles.subtitle}>
          Paste a suspicious website address below to check for common phishing
          and unsafe-link indicators.
        </Text>

        {/* URL field label */}
        <Text style={styles.label}>Website URL</Text>

        {/* URL input */}
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="Example: http://secure-login-example.xyz"
          placeholderTextColor={COLORS.mutedText}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
        />

        {/* Analyze action */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleAnalyzeLink}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Analyze Link</Text>
        </TouchableOpacity>

        {/* Safety notice */}
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Safety Reminder</Text>

          <Text style={styles.noticeText}>
            Do not open a suspicious link. Copy and paste it into SEBAShield
            without visiting the website.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * ============================================================
 * Screen Styles
 * ============================================================
 *
 * Uses the centralized COLORS object so the screen remains
 * consistent with the rest of the SEBAShield application.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    flex: 1,
    padding: 20,
  },

  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },

  label: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },

  input: {
    minHeight: 58,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    color: COLORS.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 20,
    paddingVertical: 16,
  },

  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  notice: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 28,
    padding: 16,
  },

  noticeTitle: {
    color: COLORS.warning,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },

  noticeText: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },
});