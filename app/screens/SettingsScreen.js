/**
 * ============================================================
 * SEBAShield
 * Settings Screen
 * ============================================================
 *
 * Purpose:
 * Provides application information, privacy guidance, local
 * data controls, and version details.
 *
 * Main Responsibilities:
 * - Explain how SEBAShield handles scan history.
 * - Allow the user to clear locally stored scan records.
 * - Display application and developer information.
 * - Present an educational-use disclaimer.
 *
 * Data Privacy:
 * Scan history is stored locally on the user's device through
 * AsyncStorage. Clearing history removes those saved records.
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Centralized SEBAShield color palette.
 */
import { COLORS } from "../constants/colors";

/**
 * Shared history service used to remove saved scan records.
 */
import { clearHistory } from "../../services/historyService";

/**
 * ============================================================
 * SettingsScreen Component
 * ============================================================
 *
 * Displays application settings and performs local-history
 * management.
 */
export default function SettingsScreen() {
  /**
   * Tracks whether the application is currently clearing saved
   * scan history.
   */
  const [isClearingHistory, setIsClearingHistory] =
    useState(false);

  /**
   * ============================================================
   * handleClearHistory
   * ============================================================
   *
   * Displays a confirmation dialog before permanently removing
   * all locally stored scan-history records.
   */
  const handleClearHistory = () => {
    Alert.alert(
      "Clear Scan History?",
      "This will permanently remove all saved message, link, and fake-job analyses from this device.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear History",
          style: "destructive",
          onPress: confirmClearHistory,
        },
      ]
    );
  };

  /**
   * ============================================================
   * confirmClearHistory
   * ============================================================
   *
   * Calls the shared history service after the user confirms
   * the deletion request.
   */
  const confirmClearHistory = async () => {
    if (isClearingHistory) {
      return;
    }

    try {
      setIsClearingHistory(true);

      await clearHistory();

      Alert.alert(
        "History Cleared",
        "All saved scan-history records have been removed from this device."
      );
    } catch (error) {
      console.error(
        "Unable to clear SEBAShield scan history:",
        error
      );

      Alert.alert(
        "Unable to Clear History",
        "SEBAShield could not remove the saved scan history. Please try again."
      );
    } finally {
      setIsClearingHistory(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Main screen heading */}
      <Text style={styles.title}>
        ⚙️ Settings
      </Text>

      <Text style={styles.subtitle}>
        Manage local application data and review information
        about SEBAShield.
      </Text>

      {/* Privacy and local-storage information */}
      <Text style={styles.sectionTitle}>
        Privacy
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Local Scan Storage
        </Text>

        <Text style={styles.cardText}>
          Scan history is stored locally on this device using
          AsyncStorage. SEBAShield does not require an account to
          save these records.
        </Text>
      </View>

      {/* Scan-history control */}
      <Text style={styles.sectionTitle}>
        Scan History
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Clear Saved Analyses
        </Text>

        <Text style={styles.cardText}>
          Remove all stored message, link, and fake-job analysis
          records from this device.
        </Text>

        <TouchableOpacity
          style={[
            styles.dangerButton,
            isClearingHistory &&
              styles.buttonDisabled,
          ]}
          onPress={handleClearHistory}
          disabled={isClearingHistory}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Clear all scan history"
          accessibilityHint="Permanently removes saved scan records from this device"
          accessibilityState={{
            disabled: isClearingHistory,
            busy: isClearingHistory,
          }}
        >
          {isClearingHistory ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text style={styles.dangerButtonText}>
                Clearing...
              </Text>
            </View>
          ) : (
            <Text style={styles.dangerButtonText}>
              Clear Scan History
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Application information */}
      <Text style={styles.sectionTitle}>
        About
      </Text>

      <View style={styles.card}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Application
          </Text>

          <Text style={styles.detailValue}>
            SEBAShield
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Version
          </Text>

          <Text style={styles.detailValue}>
            1.0.0
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Technology
          </Text>

          <Text style={styles.detailValue}>
            React Native + Expo
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Developer
          </Text>

          <Text style={styles.detailValue}>
            Wubit
          </Text>
        </View>
      </View>

      {/* Educational disclaimer */}
      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>
          Educational Use
        </Text>

        <Text style={styles.noticeText}>
          SEBAShield provides rule-based cybersecurity guidance.
          Its results do not guarantee that a message, website,
          recruiter, or job offer is safe or fraudulent. Always
          verify suspicious activity through official channels.
        </Text>
      </View>
    </ScrollView>
  );
}

/**
 * ============================================================
 * Screen Styles
 * ============================================================
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: 20,
    paddingBottom: 48,
  },

  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },

  sectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 10,
  },

  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },

  cardText: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },

  dangerButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },

  dangerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginLeft: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  detailLabel: {
    color: COLORS.mutedText,
    fontSize: 14,
    marginRight: 16,
  },

  detailValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 13,
  },

  noticeCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.warning,
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 22,
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
});