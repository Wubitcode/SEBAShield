/**
 * ============================================================
 * SEBAShield
 * Message Threat Analysis Result Screen
 * ============================================================
 *
 * Purpose:
 * Displays the completed local SEBAShield message analysis and
 * the optional AI-assisted security assessment.
 *
 * Result Structure:
 *
 * Risk Summary
 *      ↓
 * Local Findings
 *      ↓
 * AI Assessment
 *      ↓
 * Submitted Message
 *
 * Security:
 * - Local rule-based analysis remains the primary baseline.
 * - AI analysis is supplemental.
 * - AI failure does not invalidate the local result.
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

import React from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  COLORS,
} from "../../../shared/constants/colors";

/**
 * ============================================================
 * ResultScreen
 * ============================================================
 */
export default function ResultScreen({
  route,
}) {
  const {
    analysisResult,
    aiAnalysis,
  } =
    route.params || {};

  /**
   * Protect the screen from invalid navigation data.
   */
  if (!analysisResult) {
    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <Ionicons
          name="alert-circle-outline"
          size={42}
          color={
            COLORS.warning
          }
        />

        <Text
          style={
            styles.emptyTitle
          }
        >
          No Analysis Available
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          SEBAShield did not receive a valid analysis result.
        </Text>
      </View>
    );
  }

  /**
   * ============================================================
   * getRiskPresentation
   * ============================================================
   *
   * Returns consistent presentation information for local and
   * AI risk classifications.
   */
  const getRiskPresentation = (
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
      return {
        color:
          COLORS.danger,

        icon:
          "warning-outline",
      };
    }

    if (
      normalizedRisk ===
        "suspicious" ||
      normalizedRisk ===
        "medium" ||
      normalizedRisk ===
        "moderate" ||
      normalizedRisk ===
        "caution"
    ) {
      return {
        color:
          COLORS.warning,

        icon:
          "alert-circle-outline",
      };
    }

    if (
      normalizedRisk ===
        "safe" ||
      normalizedRisk ===
        "low" ||
      normalizedRisk ===
        "low risk"
    ) {
      return {
        color:
          COLORS.success,

        icon:
          "shield-checkmark-outline",
      };
    }

    return {
      color:
        COLORS.mutedText,

      icon:
        "help-circle-outline",
    };
  };

  const localRisk =
    getRiskPresentation(
      analysisResult.riskLevel
    );

  const aiRisk =
    getRiskPresentation(
      aiAnalysis?.riskLevel
    );

  /**
   * AI is considered completed only when the backend explicitly
   * returns the completed state.
   */
  const hasCompletedAIAnalysis =
    aiAnalysis?.status ===
    "completed";

  const hasUnavailableAIAnalysis =
    aiAnalysis?.status ===
    "unavailable";

  /**
   * ============================================================
   * renderBulletList
   * ============================================================
   *
   * Renders short readable findings or recommendations using the
   * same layout across local and AI analysis.
   */
  const renderBulletList = (
    items,
    keyPrefix
  ) => {
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return null;
    }

    return items.map(
      (
        item,
        index
      ) => (
        <View
          key={`${keyPrefix}-${index}`}
          style={
            styles.bulletRow
          }
        >
          <View
            style={
              styles.bulletDot
            }
          />

          <Text
            style={
              styles.bulletText
            }
          >
            {item}
          </Text>
        </View>
      )
    );
  };

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* =====================================================
          Local Risk Summary
          ===================================================== */}
      <View
        style={
          styles.riskCard
        }
      >
        <View
          style={[
            styles.riskIconContainer,
            {
              borderColor:
                localRisk.color,
            },
          ]}
        >
          <Ionicons
            name={
              localRisk.icon
            }
            size={30}
            color={
              localRisk.color
            }
          />
        </View>

        <Text
          style={
            styles.scoreLabel
          }
        >
          Threat Score
        </Text>

        <Text
          style={
            styles.scoreValue
          }
        >
          {analysisResult.score}%
        </Text>

        <View
          style={[
            styles.riskBadge,
            {
              borderColor:
                localRisk.color,
            },
          ]}
        >
          <Text
            style={[
              styles.riskBadgeText,
              {
                color:
                  localRisk.color,
              },
            ]}
          >
            {analysisResult.riskLevel}
          </Text>
        </View>
      </View>

      {/* =====================================================
          Local Analysis
          ===================================================== */}
      <View
        style={
          styles.section
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <Ionicons
            name="shield-outline"
            size={21}
            color={
              COLORS.primary
            }
          />

          <Text
            style={
              styles.sectionTitle
            }
          >
            Local Analysis
          </Text>
        </View>

        <Text
          style={
            styles.sectionDescription
          }
        >
          Warning signs detected by SEBAShield's local scanner.
        </Text>

        {Array.isArray(
          analysisResult.indicators
        ) &&
        analysisResult.indicators
          .length > 0 ? (
          <View
            style={
              styles.listContainer
            }
          >
            {renderBulletList(
              analysisResult.indicators,
              "local-indicator"
            )}
          </View>
        ) : (
          <View
            style={
              styles.cleanFinding
            }
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={
                COLORS.success
              }
            />

            <Text
              style={
                styles.cleanFindingText
              }
            >
              No suspicious indicators were detected by the
              local scanner.
            </Text>
          </View>
        )}
      </View>

      {/* =====================================================
          AI Security Analysis
          ===================================================== */}
      <View
        style={
          styles.section
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <Ionicons
            name="sparkles-outline"
            size={21}
            color={
              COLORS.primary
            }
          />

          <Text
            style={
              styles.sectionTitle
            }
          >
            AI Analysis
          </Text>
        </View>

        {hasCompletedAIAnalysis ? (
          <>
            {/* AI summary header */}
            <View
              style={
                styles.aiSummaryCard
              }
            >
              <View
                style={
                  styles.aiRiskRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.aiSmallLabel
                    }
                  >
                    AI Risk
                  </Text>

                  <Text
                    style={[
                      styles.aiRiskLevel,
                      {
                        color:
                          aiRisk.color,
                      },
                    ]}
                  >
                    {
                      aiAnalysis.riskLevel
                    }
                  </Text>
                </View>

                <View
                  style={
                    styles.confidenceContainer
                  }
                >
                  <Text
                    style={
                      styles.aiSmallLabel
                    }
                  >
                    Confidence
                  </Text>

                  <Text
                    style={
                      styles.confidenceValue
                    }
                  >
                    {
                      aiAnalysis.confidence
                    }
                    %
                  </Text>
                </View>
              </View>
            </View>

            {/* AI Summary */}
            {aiAnalysis.summary ? (
              <View
                style={
                  styles.subsection
                }
              >
                <Text
                  style={
                    styles.subsectionTitle
                  }
                >
                  Summary
                </Text>

                <Text
                  style={
                    styles.bodyText
                  }
                >
                  {
                    aiAnalysis.summary
                  }
                </Text>
              </View>
            ) : null}

            {/* AI Findings */}
            {Array.isArray(
              aiAnalysis.indicators
            ) &&
            aiAnalysis.indicators
              .length > 0 ? (
              <View
                style={
                  styles.subsection
                }
              >
                <Text
                  style={
                    styles.subsectionTitle
                  }
                >
                  Findings
                </Text>

                {renderBulletList(
                  aiAnalysis.indicators,
                  "ai-indicator"
                )}
              </View>
            ) : null}

            {/* AI Recommendations */}
            {Array.isArray(
              aiAnalysis.recommendations
            ) &&
            aiAnalysis.recommendations
              .length > 0 ? (
              <View
                style={
                  styles.subsection
                }
              >
                <Text
                  style={
                    styles.subsectionTitle
                  }
                >
                  Recommendations
                </Text>

                {renderBulletList(
                  aiAnalysis.recommendations,
                  "ai-recommendation"
                )}
              </View>
            ) : null}

            {/* AI Explanation */}
            {aiAnalysis.explanation ? (
              <View
                style={
                  styles.subsection
                }
              >
                <Text
                  style={
                    styles.subsectionTitle
                  }
                >
                  Why It Was Flagged
                </Text>

                <Text
                  style={
                    styles.bodyText
                  }
                >
                  {
                    aiAnalysis.explanation
                  }
                </Text>
              </View>
            ) : null}

            <View
              style={
                styles.aiNotice
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={
                  COLORS.mutedText
                }
              />

              <Text
                style={
                  styles.aiNoticeText
                }
              >
                AI analysis adds context and should be considered
                together with the local SEBAShield result.
              </Text>
            </View>
          </>
        ) : hasUnavailableAIAnalysis ? (
          <View
            style={
              styles.unavailableCard
            }
          >
            <Ionicons
              name="cloud-offline-outline"
              size={25}
              color={
                COLORS.mutedText
              }
            />

            <View
              style={
                styles.unavailableContent
              }
            >
              <Text
                style={
                  styles.unavailableTitle
                }
              >
                AI Analysis Unavailable
              </Text>

              <Text
                style={
                  styles.unavailableText
                }
              >
                {aiAnalysis.summary ||
                  "AI analysis is currently unavailable. Your local SEBAShield result is still available."}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={
              styles.unavailableCard
            }
          >
            <Ionicons
              name="shield-outline"
              size={25}
              color={
                COLORS.mutedText
              }
            />

            <View
              style={
                styles.unavailableContent
              }
            >
              <Text
                style={
                  styles.unavailableTitle
                }
              >
                Local Analysis Only
              </Text>

              <Text
                style={
                  styles.unavailableText
                }
              >
                No AI assessment was returned for this scan. The
                local result above remains available.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* =====================================================
          Submitted Message
          ===================================================== */}
      <View
        style={
          styles.section
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <Ionicons
            name="document-text-outline"
            size={21}
            color={
              COLORS.primary
            }
          />

          <Text
            style={
              styles.sectionTitle
            }
          >
            Submitted Message
          </Text>
        </View>

        <View
          style={
            styles.messageCard
          }
        >
          <Text
            style={
              styles.messageText
            }
          >
            {
              analysisResult.originalMessage ||
              "Submitted message unavailable."
            }
          </Text>
        </View>
      </View>

      {/* =====================================================
          Final Safety Reminder
          ===================================================== */}
      <View
        style={
          styles.safetyNote
        }
      >
        <Ionicons
          name="warning-outline"
          size={19}
          color={
            COLORS.warning
          }
        />

        <Text
          style={
            styles.safetyText
          }
        >
          A risk score is guidance, not proof. Verify suspicious
          requests independently before sending money, credentials,
          or personal information.
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
const styles =
  StyleSheet.create({
    /**
     * Main screen.
     */
    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    content: {
      paddingHorizontal: 20,

      paddingTop: 18,

      paddingBottom: 44,
    },

    /**
     * ========================================================
     * Missing Result
     * ========================================================
     */
    emptyContainer: {
      flex: 1,

      backgroundColor:
        COLORS.background,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal: 30,
    },

    emptyTitle: {
      color:
        COLORS.text,

      fontSize: 21,

      fontWeight:
        "800",

      marginTop: 14,
    },

    emptyText: {
      color:
        COLORS.mutedText,

      fontSize: 14,

      lineHeight: 20,

      textAlign:
        "center",

      marginTop: 8,
    },

    /**
     * ========================================================
     * Risk Summary
     * ========================================================
     */
    riskCard: {
      backgroundColor:
        COLORS.card,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 20,

      alignItems:
        "center",

      paddingVertical: 22,

      paddingHorizontal: 20,

      marginBottom: 18,
    },

    riskIconContainer: {
      width: 54,

      height: 54,

      borderRadius: 18,

      borderWidth: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginBottom: 12,
    },

    scoreLabel: {
      color:
        COLORS.mutedText,

      fontSize: 13,

      fontWeight:
        "600",
    },

    scoreValue: {
      color:
        COLORS.text,

      fontSize: 42,

      fontWeight:
        "900",

      marginTop: 4,
    },

    riskBadge: {
      borderWidth: 1,

      borderRadius: 20,

      paddingHorizontal: 14,

      paddingVertical: 6,

      marginTop: 10,
    },

    riskBadgeText: {
      fontSize: 15,

      fontWeight:
        "800",
    },

    /**
     * ========================================================
     * Sections
     * ========================================================
     */
    section: {
      backgroundColor:
        COLORS.card,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 18,

      padding: 17,

      marginBottom: 14,
    },

    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",
    },

    sectionTitle: {
      color:
        COLORS.text,

      fontSize: 17,

      fontWeight:
        "800",

      marginLeft: 8,
    },

    sectionDescription: {
      color:
        COLORS.mutedText,

      fontSize: 13,

      lineHeight: 19,

      marginTop: 7,

      marginBottom: 12,
    },

    /**
     * ========================================================
     * Lists
     * ========================================================
     */
    listContainer: {
      marginTop: 3,
    },

    bulletRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      marginBottom: 9,
    },

    bulletDot: {
      width: 6,

      height: 6,

      borderRadius: 3,

      backgroundColor:
        COLORS.primary,

      marginTop: 8,

      marginRight: 10,
    },

    bulletText: {
      flex: 1,

      color:
        COLORS.text,

      fontSize: 14,

      lineHeight: 21,
    },

    cleanFinding: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      marginTop: 8,
    },

    cleanFindingText: {
      flex: 1,

      color:
        COLORS.mutedText,

      fontSize: 14,

      lineHeight: 20,

      marginLeft: 8,
    },

    /**
     * ========================================================
     * AI
     * ========================================================
     */
    aiSummaryCard: {
      backgroundColor:
        COLORS.background,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 14,

      padding: 14,

      marginTop: 14,
    },

    aiRiskRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    aiSmallLabel: {
      color:
        COLORS.mutedText,

      fontSize: 12,

      marginBottom: 4,
    },

    aiRiskLevel: {
      fontSize: 20,

      fontWeight:
        "800",
    },

    confidenceContainer: {
      alignItems:
        "flex-end",
    },

    confidenceValue: {
      color:
        COLORS.text,

      fontSize: 20,

      fontWeight:
        "800",
    },

    subsection: {
      marginTop: 17,
    },

    subsectionTitle: {
      color:
        COLORS.primary,

      fontSize: 14,

      fontWeight:
        "800",

      marginBottom: 8,
    },

    bodyText: {
      color:
        COLORS.text,

      fontSize: 14,

      lineHeight: 22,
    },

    aiNotice: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      marginTop: 18,
    },

    aiNoticeText: {
      flex: 1,

      color:
        COLORS.mutedText,

      fontSize: 12,

      lineHeight: 18,

      marginLeft: 8,
    },

    /**
     * AI unavailable state.
     */
    unavailableCard: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      backgroundColor:
        COLORS.background,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 14,

      padding: 14,

      marginTop: 14,
    },

    unavailableContent: {
      flex: 1,

      marginLeft: 11,
    },

    unavailableTitle: {
      color:
        COLORS.text,

      fontSize: 14,

      fontWeight:
        "800",
    },

    unavailableText: {
      color:
        COLORS.mutedText,

      fontSize: 13,

      lineHeight: 19,

      marginTop: 4,
    },

    /**
     * ========================================================
     * Submitted Message
     * ========================================================
     */
    messageCard: {
      backgroundColor:
        COLORS.background,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 14,

      padding: 14,

      marginTop: 13,
    },

    messageText: {
      color:
        COLORS.text,

      fontSize: 14,

      lineHeight: 22,
    },

    /**
     * ========================================================
     * Final Safety Reminder
     * ========================================================
     */
    safetyNote: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      paddingHorizontal: 4,

      marginTop: 3,
    },

    safetyText: {
      flex: 1,

      color:
        COLORS.mutedText,

      fontSize: 12,

      lineHeight: 18,

      marginLeft: 8,
    },
  });