/**
 * ============================================================
 * SEBAShield
 * Message Scanner Screen
 * ============================================================
 *
 * Purpose:
 * Allows users to submit suspicious content for
 * cybersecurity analysis.
 *
 * Supported Content Types:
 * - SMS Messages
 * - Emails
 * - Social Media Messages
 * - Fake Job Offers
 * - General Scam Messages
 *
 * Functionality:
 * - Accept user input
 * - Validate message content
 * - Forward data to Threat Analysis screen
 *
 * Navigation Flow:
 *
 * Home Screen
 *      ↓
 * Message Scanner
 *      ↓
 * Threat Analysis Screen
 *
 * Future Enhancements:
 * - AI-powered scam detection
 * - OCR screenshot scanning
 * - Threat intelligence feeds
 * - Firebase scan history
 * - Real-time phishing detection
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

/**
 * React Library
 *
 * useState:
 * Allows the screen to store and update user input.
 */
import React, { useState } from "react";

/**
 * React Native Components
 *
 * View:
 * Layout container.
 *
 * Text:
 * Displays information to users.
 *
 * TextInput:
 * Accepts suspicious content from users.
 *
 * TouchableOpacity:
 * Creates a pressable button.
 *
 * StyleSheet:
 * Organizes screen styling.
 *
 * Alert:
 * Displays validation messages.
 */
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

/**
 * Application Color System
 *
 * Centralized color palette used throughout
 * the SEBAShield application.
 */
import { COLORS } from "../constants/colors";
import { analyzeMessage } from "../../services/scamAnalyzer";

/**
 * ============================================================
 * ScannerScreen Component
 * ============================================================
 *
 * Collects suspicious content from users and
 * forwards the content to the Threat Analysis screen.
 */
export default function ScannerScreen({ navigation }) {
  /**
   * Stores user-entered content.
   *
   * Examples:
   * - Suspicious SMS
   * - Email messages
   * - Job offers
   * - Scam messages
   */
  const [message, setMessage] = useState("");

  /**
   * ============================================================
   * Handle Analyze Button
   * ============================================================
   *
   * Responsibilities:
   * 1. Validate user input.
   * 2. Prevent empty submissions.
   * 3. Navigate to Result Screen.
   * 4. Pass message for threat analysis.
   */
  const handleAnalyze = () => {
    /**
     * Prevent empty submissions.
     */
    if (!message.trim()) {
      Alert.alert(
        "Input Required",
        "Please enter or paste a message before running analysis."
      );
      return;
    }

    /**
     * Navigate to Threat Analysis Screen.
     */
    const analysisResult = analyzeMessage(message);

navigation.navigate("Result", {
  analysisResult,
});
  };

  return (
    <View style={styles.container}>
      {/* ======================================================
           Screen Title
         ====================================================== */}
      <Text style={styles.title}>
        🛡️ Message Scanner
      </Text>

      {/* ======================================================
           Screen Description
         ====================================================== */}
      <Text style={styles.subtitle}>
        Paste a suspicious SMS, email, social media message,
        or job offer below for scam analysis.
      </Text>

      {/* ======================================================
           Message Input Area
         ====================================================== */}
      <TextInput
        style={styles.input}
        multiline
        placeholder="Paste suspicious content here..."
        placeholderTextColor="#888"
        value={message}
        onChangeText={setMessage}
      />

      {/* ======================================================
           Analyze Button
         ====================================================== */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleAnalyze}
      >
        <Text style={styles.buttonText}>
          Analyze Message
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * ============================================================
 * Screen Styles
 * ============================================================
 *
 * Purpose:
 * Defines the visual appearance of the Message
 * Scanner screen.
 */
const styles = StyleSheet.create({
  /**
   * Main screen container.
   */
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },

  /**
   * Screen title.
   */
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  /**
   * Instructional text.
   */
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
  },

  /**
   * Message input box.
   */
  input: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    minHeight: 220,
    color: COLORS.text,
    textAlignVertical: "top",
    fontSize: 15,
  },

  /**
   * Analyze button.
   */
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },

  /**
   * Analyze button text.
   */
  buttonText: {
    textAlign: "center",
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});