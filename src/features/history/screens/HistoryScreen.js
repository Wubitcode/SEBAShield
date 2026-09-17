/**
 * ============================================================
 * SEBAShield
 * Scan History Screen
 * ============================================================
 *
 * Purpose:
 * Displays previously saved SEBAShield scans and provides
 * privacy-aware deletion controls.
 *
 * Privacy:
 * - Raw submitted content shown here comes only from encrypted
 *   local history.
 * - Cloud-only history records contain privacy-minimized metadata.
 * - Original submitted content is never reconstructed from
 *   Firestore.
 * - This screen does not communicate directly with Firestore.
 * - Individual deletion uses ScanContext.removeScan().
 * - Clear All uses ScanContext.clearAllHistory().
 * - ScanContext coordinates local and cloud deletion.
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

import React, {
  useCallback,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useFocusEffect,
} from "@react-navigation/native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  COLORS,
} from "../../../shared/constants/colors";

import {
  useScan,
} from "../../scanning/context/ScanContext";

/**
 * ============================================================
 * HistoryScreen
 * ============================================================
 */
export default function HistoryScreen() {
  /**
   * ScanContext remains the single source of truth for history.
   */
  const {
    scans,
    refreshHistory,
    removeScan,
    clearAllHistory,
    isInitializing,
    isRefreshing,
    isManagingHistory,
  } = useScan();

  /**
   * Refresh history whenever the screen receives focus.
   */
  useFocusEffect(
    useCallback(() => {
      let screenIsActive =
        true;

      async function reloadHistory() {
        try {
          await refreshHistory({
            showRefreshIndicator:
              false,
          });
        } catch (error) {
          if (screenIsActive) {
            Alert.alert(
              "History Unavailable",
              "SEBAShield could not load your saved scan history."
            );
          }
        }
      }

      reloadHistory();

      return () => {
        screenIsActive =
          false;
      };
    }, [
      refreshHistory,
    ])
  );

  /**
   * ============================================================
   * Single Record Deletion
   * ============================================================
   */
  const confirmDeleteScan =
    useCallback(
      (
        scanRecord
      ) => {
        if (
          !scanRecord?.id
        ) {
          Alert.alert(
            "Unable to Delete",
            "This scan does not have a valid record ID."
          );

          return;
        }

        Alert.alert(
          "Delete Scan",
          "Permanently delete this scan from your history?",
          [
            {
              text:
                "Cancel",

              style:
                "cancel",
            },

            {
              text:
                "Delete",

              style:
                "destructive",

              onPress:
                async () => {
                  try {
                    const wasDeleted =
                      await removeScan(
                        scanRecord.id
                      );

                    if (
                      !wasDeleted
                    ) {
                      Alert.alert(
                        "Scan Not Found",
                        "The scan may already have been removed."
                      );
                    }
                  } catch (
                    error
                  ) {
                    Alert.alert(
                      "Unable to Delete Scan",
                      error?.message ||
                        "SEBAShield could not permanently delete this scan. Please try again."
                    );
                  }
                },
            },
          ]
        );
      },
      [
        removeScan,
      ]
    );

  /**
   * ============================================================
   * Clear All History
   * ============================================================
   */
  const confirmClearHistory =
    useCallback(() => {
      Alert.alert(
        "Clear Scan History",
        "Permanently delete all saved scan records? This action cannot be undone.",
        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Clear History",

            style:
              "destructive",

            onPress:
              async () => {
                try {
                  await clearAllHistory();
                } catch (
                  error
                ) {
                  Alert.alert(
                    "Unable to Clear History",
                    error?.message ||
                      "SEBAShield could not permanently clear your scan history. Please try again."
                  );
                }
              },
          },
        ]
      );
    }, [
      clearAllHistory,
    ]);

  /**
   * ============================================================
   * Risk Presentation
   * ============================================================
   */
  const getRiskColor =
    useCallback(
      (
        riskLevel
      ) => {
        const normalizedRisk =
          String(
            riskLevel ?? ""
          )
            .trim()
            .toLowerCase();

        if (
          normalizedRisk ===
            "high risk" ||
          normalizedRisk ===
            "critical" ||
          normalizedRisk ===
            "high"
        ) {
          return COLORS.danger;
        }

        if (
          normalizedRisk ===
            "suspicious" ||
          normalizedRisk ===
            "caution" ||
          normalizedRisk ===
            "medium risk" ||
          normalizedRisk ===
            "medium" ||
          normalizedRisk ===
            "moderate"
        ) {
          return COLORS.warning;
        }

        if (
          normalizedRisk ===
            "safe" ||
          normalizedRisk ===
            "low" ||
          normalizedRisk ===
            "low risk" ||
          normalizedRisk ===
            "no major indicators detected"
        ) {
          return COLORS.success;
        }

        return COLORS.mutedText;
      },
      []
    );

  /**
   * ============================================================
   * Scan Type Helpers
   * ============================================================
   */
  const getScanTypeLabel =
    useCallback(
      (
        scanType
      ) => {
        const normalizedType =
          String(
            scanType ?? ""
          )
            .trim()
            .toLowerCase();

        if (
          normalizedType ===
            "message" ||
          normalizedType ===
            "message scanner"
        ) {
          return "Message Scanner";
        }

        if (
          normalizedType ===
            "link" ||
          normalizedType ===
            "url" ||
          normalizedType ===
            "link checker"
        ) {
          return "Link Checker";
        }

        if (
          normalizedType ===
            "fake-job" ||
          normalizedType ===
            "fake_job" ||
          normalizedType ===
            "fake job" ||
          normalizedType ===
            "fake job detector"
        ) {
          return "Fake Job Detector";
        }

        return (
          scanType ||
          "SEBAShield Analysis"
        );
      },
      []
    );

  const getScanTypeIcon =
    useCallback(
      (
        scanType
      ) => {
        const label =
          getScanTypeLabel(
            scanType
          );

        if (
          label ===
          "Fake Job Detector"
        ) {
          return "briefcase-outline";
        }

        if (
          label ===
          "Link Checker"
        ) {
          return "link-outline";
        }

        if (
          label ===
          "Message Scanner"
        ) {
          return "chatbubble-outline";
        }

        return "shield-outline";
      },
      [
        getScanTypeLabel,
      ]
    );

  /**
   * ============================================================
   * Date Formatting
   * ============================================================
   */
  const formatDate =
    useCallback(
      (
        createdAt
      ) => {
        if (!createdAt) {
          return "Date unavailable";
        }

        const parsedDate =
          new Date(
            createdAt
          );

        if (
          Number.isNaN(
            parsedDate.getTime()
          )
        ) {
          return "Date unavailable";
        }

        return parsedDate.toLocaleString();
      },
      []
    );

  /**
   * ============================================================
   * Local Content Preview
   * ============================================================
   *
   * Supports current and legacy scan record field names.
   */
  const getSubmittedContent =
    useCallback(
      (
        item
      ) =>
        item?.originalContent ||
        item?.originalMessage ||
        item?.originalUrl ||
        item?.content ||
        item?.submittedContent ||
        item?.contentPreview ||
        "",
      []
    );

  const createContentPreview =
    useCallback(
      (
        content
      ) => {
        if (
          typeof content !==
            "string" ||
          content.trim()
            .length === 0
        ) {
          return "No submitted content preview is available.";
        }

        const normalizedContent =
          content
            .replace(
              /\s+/g,
              " "
            )
            .trim();

        const maximumLength =
          140;

        if (
          normalizedContent.length <=
          maximumLength
        ) {
          return normalizedContent;
        }

        return `${normalizedContent.slice(
          0,
          maximumLength
        )}...`;
      },
      []
    );

  /**
   * ============================================================
   * History Card
   * ============================================================
   */
  const renderHistoryRecord =
    useCallback(
      ({
        item,
      }) => {
        const scanType =
          getScanTypeLabel(
            item?.scanType ||
              item?.type
          );

        const riskLevel =
          item?.riskLevel ||
          "Unknown Risk";

        const riskColor =
          getRiskColor(
            riskLevel
          );

        const score =
          typeof item?.score ===
            "number"
            ? item.score
            : null;

        const isCloudOnly =
          Boolean(
            item?.isCloudOnly ||
            item?.historySource ===
              "cloud"
          );

        const submittedContent =
          isCloudOnly
            ? ""
            : getSubmittedContent(
                item
              );

        return (
          <View
            style={
              styles.historyCard
            }
          >
            {/* Card header */}
            <View
              style={
                styles.cardHeader
              }
            >
              <View
                style={
                  styles.scanIdentity
                }
              >
                <View
                  style={
                    styles.scanIconContainer
                  }
                >
                  <Ionicons
                    name={
                      getScanTypeIcon(
                        scanType
                      )
                    }
                    size={21}
                    color={
                      COLORS.primary
                    }
                  />
                </View>

                <View
                  style={
                    styles.scanTitleContainer
                  }
                >
                  <Text
                    style={
                      styles.scanType
                    }
                  >
                    {scanType}
                  </Text>

                  <Text
                    style={
                      styles.dateText
                    }
                  >
                    {formatDate(
                      item?.createdAt
                    )}
                  </Text>
                </View>
              </View>

              {score !==
                null && (
                <View
                  style={
                    styles.scoreContainer
                  }
                >
                  <Text
                    style={
                      styles.score
                    }
                  >
                    {score}%
                  </Text>
                </View>
              )}
            </View>

            {/* Risk level */}
            <View
              style={[
                styles.riskBadge,
                {
                  borderColor:
                    riskColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.riskText,
                  {
                    color:
                      riskColor,
                  },
                ]}
              >
                {riskLevel}
              </Text>
            </View>

            {/* Privacy-aware history source */}
            {isCloudOnly ? (
              <View
                style={
                  styles.cloudRecordNotice
                }
              >
                <Ionicons
                  name="cloud-done-outline"
                  size={18}
                  color={
                    COLORS.primary
                  }
                />

                <View
                  style={
                    styles.cloudRecordTextContainer
                  }
                >
                  <Text
                    style={
                      styles.cloudRecordTitle
                    }
                  >
                    Cloud Record
                  </Text>

                  <Text
                    style={
                      styles.cloudRecordText
                    }
                  >
                    Original submitted content is not available on
                    this device. Only privacy-minimized scan
                    metadata was restored from Firebase.
                  </Text>
                </View>
              </View>
            ) : (
              <Text
                style={
                  styles.contentPreview
                }
                numberOfLines={
                  3
                }
              >
                {createContentPreview(
                  submittedContent
                )}
              </Text>
            )}

            {/* Delete action */}
            <View
              style={
                styles.cardFooter
              }
            >
              <TouchableOpacity
                style={[
                  styles.deleteButton,

                  isManagingHistory &&
                    styles.disabledButton,
                ]}
                onPress={() =>
                  confirmDeleteScan(
                    item
                  )
                }
                activeOpacity={
                  0.75
                }
                accessibilityRole="button"
                accessibilityLabel={`Delete ${scanType} history record`}
                disabled={
                  isManagingHistory
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color={
                    COLORS.danger
                  }
                />

                <Text
                  style={
                    styles.deleteButtonText
                  }
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      },
      [
        confirmDeleteScan,
        createContentPreview,
        formatDate,
        getRiskColor,
        getScanTypeIcon,
        getScanTypeLabel,
        getSubmittedContent,
        isManagingHistory,
      ]
    );

  /**
   * ============================================================
   * Empty History
   * ============================================================
   */
  const renderEmptyHistory =
    useCallback(
      () => (
        <View
          style={
            styles.emptyHistory
          }
        >
          <View
            style={
              styles.emptyIconContainer
            }
          >
            <Ionicons
              name="time-outline"
              size={34}
              color={
                COLORS.primary
              }
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            No Saved Scans
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            Your local scans and available cloud scan metadata
            will appear here.
          </Text>
        </View>
      ),
      []
    );

  /**
   * ============================================================
   * Initial Loading State
   * ============================================================
   */
  if (
    isInitializing
  ) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={
            COLORS.primary
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading scan history...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.container
      }
    >
      {/* =====================================================
          History Controls
          ===================================================== */}
      {scans.length >
        0 && (
        <View
          style={
            styles.toolbar
          }
        >
          <Text
            style={
              styles.historyCount
            }
          >
            {scans.length === 1
              ? "1 saved scan"
              : `${scans.length} saved scans`}
          </Text>

          <TouchableOpacity
            style={[
              styles.clearButton,

              isManagingHistory &&
                styles.disabledButton,
            ]}
            onPress={
              confirmClearHistory
            }
            activeOpacity={
              0.75
            }
            accessibilityRole="button"
            accessibilityLabel="Clear all scan history"
            disabled={
              isManagingHistory
            }
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={
                COLORS.danger
              }
            />

            <Text
              style={
                styles.clearButtonText
              }
            >
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Background activity */}
      {(isRefreshing ||
        isManagingHistory) && (
        <View
          style={
            styles.operationStatus
          }
        >
          <ActivityIndicator
            size="small"
            color={
              COLORS.primary
            }
          />

          <Text
            style={
              styles.operationStatusText
            }
          >
            {isManagingHistory
              ? "Updating history..."
              : "Refreshing history..."}
          </Text>
        </View>
      )}

      <FlatList
        data={
          scans
        }
        renderItem={
          renderHistoryRecord
        }
        keyExtractor={(
          item,
          index
        ) =>
          item?.id
            ? String(
                item.id
              )
            : `history-record-${index}`
        }
        contentContainerStyle={[
          styles.listContent,

          scans.length ===
            0 &&
            styles.emptyListContent,
        ]}
        ListEmptyComponent={
          renderEmptyHistory
        }
        showsVerticalScrollIndicator={
          false
        }
      />
    </View>
  );
}

/**
 * ============================================================
 * Styles
 * ============================================================
 */
const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    /**
     * ========================================================
     * Loading
     * ========================================================
     */
    loadingContainer: {
      flex: 1,

      backgroundColor:
        COLORS.background,

      alignItems:
        "center",

      justifyContent:
        "center",

      padding: 24,
    },

    loadingText: {
      color:
        COLORS.mutedText,

      fontSize: 14,

      marginTop: 14,
    },

    /**
     * ========================================================
     * Toolbar
     * ========================================================
     */
    toolbar: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingHorizontal: 20,

      paddingTop: 18,

      paddingBottom: 8,
    },

    historyCount: {
      color:
        COLORS.mutedText,

      fontSize: 13,

      fontWeight:
        "600",
    },

    clearButton: {
      flexDirection:
        "row",

      alignItems:
        "center",

      borderColor:
        COLORS.danger,

      borderWidth: 1,

      borderRadius: 10,

      paddingHorizontal: 11,

      paddingVertical: 7,
    },

    clearButtonText: {
      color:
        COLORS.danger,

      fontSize: 13,

      fontWeight:
        "700",

      marginLeft: 6,
    },

    disabledButton: {
      opacity: 0.45,
    },

    /**
     * ========================================================
     * Operation Status
     * ========================================================
     */
    operationStatus: {
      flexDirection:
        "row",

      alignItems:
        "center",

      paddingHorizontal: 20,

      paddingTop: 4,

      paddingBottom: 8,
    },

    operationStatusText: {
      color:
        COLORS.mutedText,

      fontSize: 12,

      marginLeft: 8,
    },

    /**
     * ========================================================
     * History List
     * ========================================================
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
     * ========================================================
     * History Card
     * ========================================================
     */
    historyCard: {
      backgroundColor:
        COLORS.card,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 18,

      padding: 16,

      marginBottom: 14,
    },

    cardHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    scanIdentity: {
      flex: 1,

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingRight: 12,
    },

    scanIconContainer: {
      width: 42,

      height: 42,

      borderRadius: 14,

      backgroundColor:
        COLORS.background,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight: 11,
    },

    scanTitleContainer: {
      flex: 1,
    },

    scanType: {
      color:
        COLORS.text,

      fontSize: 15,

      fontWeight:
        "800",
    },

    dateText: {
      color:
        COLORS.mutedText,

      fontSize: 11,

      marginTop: 4,
    },

    scoreContainer: {
      paddingLeft: 8,
    },

    score: {
      color:
        COLORS.text,

      fontSize: 21,

      fontWeight:
        "900",
    },

    riskBadge: {
      alignSelf:
        "flex-start",

      borderWidth: 1,

      borderRadius: 20,

      paddingHorizontal: 10,

      paddingVertical: 4,

      marginTop: 14,
    },

    riskText: {
      fontSize: 12,

      fontWeight:
        "800",
    },

    contentPreview: {
      color:
        COLORS.mutedText,

      fontSize: 13,

      lineHeight: 20,

      marginTop: 12,
    },

    cloudRecordNotice: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      backgroundColor:
        COLORS.background,

      borderColor:
        COLORS.border,

      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        12,

      marginTop:
        12,
    },

    cloudRecordTextContainer: {
      flex:
        1,

      marginLeft:
        9,
    },

    cloudRecordTitle: {
      color:
        COLORS.primary,

      fontSize:
        12,

      fontWeight:
        "800",
    },

    cloudRecordText: {
      color:
        COLORS.mutedText,

      fontSize:
        12,

      lineHeight:
        18,

      marginTop:
        3,
    },

    cardFooter: {
      flexDirection:
        "row",

      justifyContent:
        "flex-end",

      marginTop: 14,

      paddingTop: 12,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,
    },

    deleteButton: {
      flexDirection:
        "row",

      alignItems:
        "center",

      paddingHorizontal: 7,

      paddingVertical: 4,
    },

    deleteButtonText: {
      color:
        COLORS.danger,

      fontSize: 13,

      fontWeight:
        "700",

      marginLeft: 6,
    },

    /**
     * ========================================================
     * Empty History
     * ========================================================
     */
    emptyHistory: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal: 34,

      paddingBottom: 70,
    },

    emptyIconContainer: {
      width: 68,

      height: 68,

      borderRadius: 22,

      backgroundColor:
        COLORS.card,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginBottom: 16,
    },

    emptyTitle: {
      color:
        COLORS.text,

      fontSize: 20,

      fontWeight:
        "800",

      textAlign:
        "center",
    },

    emptyText: {
      color:
        COLORS.mutedText,

      fontSize: 14,

      lineHeight: 20,

      marginTop: 7,

      textAlign:
        "center",
    },
  });