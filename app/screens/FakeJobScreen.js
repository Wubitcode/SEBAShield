/**
 * ============================================================
 * SEBAShield
 * Link Checker Screen
 * ============================================================
 *
 * Purpose:
 * Temporary placeholder screen used during application
 * development until the full Fake Job feature
 * is implemented.
 *
 * Future Functionality:
 * - URL Analysis
 * - Phishing Detection
 * - Domain Reputation Checks
 * - Threat Scoring
 *
 * Author: Wubit
 * Project: Mobile Capstone Project
 * ============================================================
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import { COLORS } from "../constants/colors";

/**
 * FakeJobScreen Component
 */
export default function FakeJobScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        🔗 Link Checker
      </Text>

      <Text style={styles.subtitle}>
        This feature is currently under development.
      </Text>
    </View>
  );
}

/**
 * Screen Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
  },

  subtitle: {
    color: COLORS.mutedText,
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
});