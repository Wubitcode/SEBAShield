/**
 * ============================================================
 * SEBAShield
 * Scan History Screen
 * ============================================================
 *
 * Purpose:
 * Displays previously saved SEBAShield analysis results.
 *
 * Main Responsibilities:
 * - Load saved analysis records from AsyncStorage.
 * - Refresh history whenever the screen receives focus.
 * - Display the scan type, risk level, score, date, and preview.
 * - Provide a clear empty-history state.
 * - Allow the user to delete all saved history records.
 *
 * Supported Scan Types:
 * - Message Scanner
 * - Link Checker
 * - Fake Job Detector
 *
 * Important:
 * This screen reads history from AsyncStorage using the shared
 * storage key "@sebashield_scan_history".
 *
 * Result screens must save analysis records using the same key
 * and data structure before records will appear here.
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

import React, {
  useCallback,
  useState,
} from "react";

/**
 * React Native components used by this screen.
 *
 * ActivityIndicator:
 * Displays a loading indicator while history is being retrieved.
 *
 * Alert:
 * Confirms destructive actions and displays storage errors.
 *
 * FlatList:
 * Efficiently renders saved scan-history records.
 *
 * StyleSheet:
 * Organizes reusable styles.
 *
 * Text:
 * Displays history details and interface labels.
 *
 * TouchableOpacity:
 * Creates the Clear History action.
 *
 * View:
 * Groups related interface elements.
 */
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * React Navigation hook.
 *
 * useFocusEffect reloads the history whenever the user returns
 * to this screen. This ensures newly completed scans appear
 * without requiring the application to restart.
 */
import { useFocusEffect } from "@react-navigation/native";

/**
 * AsyncStorage provides persistent local storage for React Native.
 *
 * Scan records remain available after the application closes
 * unless the user clears the history or uninstalls the app.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Centralized SEBAShield color palette.
 */
import { COLORS } from "../constants/colors";

/**
 * Shared key used to store all SEBAShield scan-history records.
 *
 * Result screens must use this exact key when saving records.
 */
const HISTORY_STORAGE_KEY = "@sebashield_scan_history";

/**
 * ============================================================
 * HistoryScreen Component
 * ============================================================
 *
 * Loads, displays, and clears locally stored analysis records.
 */
export default function HistoryScreen() {
  /**
   * Stores all history records retrieved from AsyncStorage.
   */
  const [historyRecords, setHistoryRecords] = useState([]);

  /**
   * Tracks whether history is currently being loaded.
   */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Loads history records from local storage.
   *
   * Records are sorted from newest to oldest so the most recent
   * analysis appears at the top of the screen.
   */
  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);

      const storedHistory = await AsyncStorage.getItem(
        HISTORY_STORAGE_KEY
      );

      /**
       * If no saved data exists, display the empty-history state.
       */
      if (!storedHistory) {
        setHistoryRecords([]);
        return;
      }

      const parsedHistory = JSON.parse(storedHistory);

      /**
       * Protect the interface from malformed storage data.
       */
      if (!Array.isArray(parsedHistory)) {
        setHistoryRecords([]);
        return;
      }

      /**
       * Create a copied array before sorting so the original
       * parsed value is not mutated unexpectedly.
       */
      const sortedHistory = [...parsedHistory].sort(
        (firstRecord, secondRecord) => {
          const firstDate = new Date(
            firstRecord.createdAt || 0
          ).getTime();

          const secondDate = new Date(
            secondRecord.createdAt || 0
          ).getTime();

          return secondDate - firstDate;
        }
      );

      setHistoryRecords(sortedHistory);
    } catch (error) {
      console.error(
        "Unable to load SEBAShield scan history:",
        error
      );

      setHistoryRecords([]);

      Alert.alert(
        "History Unavailable",
        "SEBAShield could not load the saved scan history."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reload history whenever this screen becomes active.
   */
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  /**
   * Permanently removes all saved scan-history records.
   */
  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      setHistoryRecords([]);
    } catch (error) {
      console.error(
        "Unable to clear SEBAShield scan history:",
        error
      );

      Alert.alert(
        "Unable to Clear History",
        "SEBAShield could not delete the saved scan history."
      );
    }
  };

  /**
   * Displays a confirmation alert before deleting history.
   *
   * This protects users from clearing saved records accidentally.
   */
  const confirmClearHistory = () => {
    Alert.alert(
      "Clear Scan History",
      "Are you sure you want to permanently delete all saved analysis records?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear History",
          style: "destructive",
          onPress: clearHistory,
        },
      ]
    );
  };

  /**
   * Returns a presentation color for the supplied risk level.
   */
  const getRiskColor = (riskLevel) => {
    if (riskLevel === "High Risk") {
      return COLORS.danger;
    }

    if (riskLevel === "Suspicious") {
      return COLORS.warning;
    }

    if (riskLevel === "Caution") {
      return COLORS.warning;
    }

    return COLORS.success;
  };

  /**
   * Returns a user-friendly icon for each scan type.
   */
  const getScanTypeIcon = (scanType) => {
    if (scanType === "Fake Job Detector") {
      return "💼";
    }

    if (scanType === "Link Checker") {
      return "🔗";
    }

    if (scanType === "Message Scanner") {
      return "💬";
    }

    return "🛡️";
  };

  /**
   * Converts a stored ISO date into a readable local date.
   */
  const formatDate = (createdAt) => {
    if (!createdAt) {
      return "Date unavailable";
    }

    const parsedDate = new Date(createdAt);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString();
  };

  /**
   * Creates a shortened preview of the submitted content.
   */
  const createContentPreview = (content) => {
    if (
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return "No submitted content preview is available.";
    }

    const normalizedContent = content
      .replace(/\s+/g, " ")
      .trim();

    const maximumLength = 140;

    if (normalizedContent.length <= maximumLength) {
      return normalizedContent;
    }

    return `${normalizedContent.slice(0, maximumLength)}...`;
  };

  /**
   * Renders one saved analysis record.
   */
  const renderHistoryRecord = ({ item }) => {
    const scanType =
      item.scanType ||
      item.type ||
      "SEBAShield Analysis";

    const riskLevel =
      item.riskLevel ||
      "Unknown Risk";

    const score =
      typeof item.score === "number"
        ? item.score
        : null;

    const submittedContent =
      item.originalContent ||
      item.content ||
      item.submittedContent ||
      "";

    return (
      <View style={styles.historyCard}>
        {/* Scan type and score */}
        <View style={styles.cardHeader}>
          <View style={styles.scanTypeContainer}>
            <Text style={styles.scanTypeIcon}>
              {getScanTypeIcon(scanType)}
            </Text>

            <Text style={styles.scanType}>
              {scanType}
            </Text>
          </View>

          {score !== null && (
            <Text style={styles.score}>
              {score}%
            </Text>
          )}
        </View>

        {/* Risk classification */}
        <Text
          style={[
            styles.riskLevel,
            {
              color: getRiskColor(riskLevel),
            },
          ]}
        >
          {riskLevel}
        </Text>

        {/* Submitted-content preview */}
        <Text
          style={styles.contentPreview}
          numberOfLines={4}
        >
          {createContentPreview(submittedContent)}
        </Text>

        {/* Analysis date and time */}
        <Text style={styles.dateText}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    );
  };

  /**
   * Displays an informative interface when no history exists.
   */
  const renderEmptyHistory = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        🗂️
      </Text>

      <Text style={styles.emptyTitle}>
        No Scan History
      </Text>

      <Text style={styles.emptyText}>
        Completed message, link, and fake-job analyses will appear here after
        they are saved.
      </Text>
    </View>
  );

  /**
   * Display a loading state while AsyncStorage is being read.
   */
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Loading scan history...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Screen heading and clear action */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>
            🗂️ Scan History
          </Text>

          <Text style={styles.subtitle}>
            Review analysis results previously saved on this device.
          </Text>
        </View>

        {historyRecords.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={confirmClearHistory}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Clear all scan history"
          >
            <Text style={styles.clearButtonText}>
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/**
       * FlatList efficiently renders history records and includes
       * the empty-state component when no records are available.
       */}
      <FlatList
        data={historyRecords}
        renderItem={renderHistoryRecord}
        keyExtractor={(item, index) =>
          item.id
            ? String(item.id)
            : `history-record-${index}`
        }
        contentContainerStyle={[
          styles.listContent,
          historyRecords.length === 0 &&
            styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyHistory}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

/**
 * ============================================================
 * Screen Styles
 * ============================================================
 *
 * Defines the screen layout, loading state, history cards,
 * empty state, typography, and Clear History control.
 */
const styles = StyleSheet.create({
  /**
   * Main screen container.
   */
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /**
   * Loading-state container.
   */
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingText: {
    color: COLORS.mutedText,
    fontSize: 15,
    marginTop: 14,
  },

  /**
   * Screen header.
   */
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },

  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
  },

  subtitle: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },

  /**
   * Clear History control.
   */
  clearButton: {
    borderColor: COLORS.danger,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  clearButtonText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: "bold",
  },

  /**
   * FlatList content spacing.
   */
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  /**
   * Individual history record card.
   */
  historyCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  scanTypeContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },

  scanTypeIcon: {
    fontSize: 20,
    marginRight: 9,
  },

  scanType: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
  },

  score: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "bold",
  },

  riskLevel: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 10,
  },

  contentPreview: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },

  dateText: {
    color: COLORS.mutedText,
    fontSize: 12,
    marginTop: 12,
  },

  /**
   * Empty-history presentation.
   */
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 60,
  },

  emptyIcon: {
    fontSize: 54,
    marginBottom: 16,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  emptyText: {
    color: COLORS.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
});