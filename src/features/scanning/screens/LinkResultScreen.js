/**
 * ============================================================
 * SEBAShield
 * Link Analysis Result Screen
 * ============================================================
 *
 * Purpose:
 * Displays the completed local SEBAShield link analysis and the
 * optional AI-assisted security assessment.
 *
 * Result Structure:
 *
 * Risk Summary
 *      ↓
 * Local Analysis
 *      ↓
 * AI Analysis
 *      ↓
 * Analyzed URL
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
 * LinkResultScreen
 * ============================================================
 */
export default function LinkResultScreen({
  route,
}) {
  const {
    linkAnalysisResult,
    aiAnalysis,
  } =
    route.params || {};

  /**
   * Protect the screen from invalid navigation data.
   */
  if (!linkAnalysisResult) {
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
          No Link Analysis Available
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          Return to Link Checker and submit a URL for analysis.
        </Text>
      </View>
    );
  }

  /**
   * ============================================================
   * getRiskPresentation
   * ============================================================
   *
   * Returns consistent visual information for both local and AI
   * risk classifications.
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

  /**
   * ============================================================
   * getRecommendations
   * ============================================================
   *
   * Provides deterministic local safety guidance based on the
   * SEBAShield link risk classification.
   */
  const getRecommendations =
    () => {
      const normalizedRisk =
        String(
          linkAnalysisResult
            .riskLevel ?? ""
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
        return [
          "Do not open the link.",
          "Do not enter passwords or financial information.",
          "Delete or report the message containing the URL.",
          "Verify the sender through an official contact method.",
        ];
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
        return [
          "Avoid opening the link until the sender is verified.",
          "Check the spelling of the domain carefully.",
          "Use the organization's official website instead.",
        ];
      }

      return [
        "No major rule-based indicators were detected.",
        "Continue to verify the sender before opening unfamiliar links.",
      ];
    };

  /**
   * ============================================================
   * renderBulletList
   * ============================================================
   *
   * Uses one consistent presentation for local findings,
   * recommendations, and AI findings.
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

  const localRisk =
    getRiskPresentation(
      linkAnalysisResult
        .riskLevel
    );

  const aiRisk =
    getRiskPresentation(
      aiAnalysis?.riskLevel
    );

  const recommendations =
    getRecommendations();

  /**
   * AI is considered available only when the service completed
   * successfully.
   */
  const hasCompletedAIAnalysis =
    aiAnalysis?.status ===
    "completed";

  const hasUnavailableAIAnalysis =
    aiAnalysis?.status ===
    "unavailable";

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
          {
            linkAnalysisResult
              .score
          }
          %
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
            {
              linkAnalysisResult
                .riskLevel
            }
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
          Warning signs detected by SEBAShield's local link
          scanner.
        </Text>

        {Array.isArray(
          linkAnalysisResult
            .indicators
        ) &&
        linkAnalysisResult
          .indicators.length >
          0 ? (
          <View
            style={
              styles.listContainer
            }
          >
            {renderBulletList(
              linkAnalysisResult
                .indicators,
              "local-link-indicator"
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
              No common suspicious-link indicators were detected
              by the local scanner.
            </Text>
          </View>
        )}

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
            Recommended Actions
          </Text>

          {renderBulletList(
            recommendations,
            "local-link-recommendation"
          )}
        </View>
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
            {/* AI risk and confidence */}
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
                  "ai-link-indicator"
                )}
              </View>
            ) : null}

            {/* AI Recommendations */}
            {Array.isArray(
              aiAnalysis
                .recommendations
            ) &&
            aiAnalysis
              .recommendations
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
                  aiAnalysis
                    .recommendations,
                  "ai-link-recommendation"
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
                    aiAnalysis
                      .explanation
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
                together with the local SEBAShield link result.
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
                  "AI analysis is currently unavailable. Your local link result is still available."}
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
                No AI assessment was returned for this link. The
                local result above remains available.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* =====================================================
          Analyzed URL
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
            name="link-outline"
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
            Analyzed URL
          </Text>
        </View>

        <View
          style={
            styles.urlCard
          }
        >
          <Text
            style={
              styles.urlText
            }
            selectable
          >
            {
              linkAnalysisResult
                .originalUrl ||
              "Submitted URL unavailable."
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
          A low-risk score does not guarantee that a website is
          safe. Verify the sender and use the organization's
          official website whenever possible.
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

      textAlign:
        "center",
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
     * General Sections
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
     * Subsections
     * ========================================================
     */
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
     * Analyzed URL
     * ========================================================
     */
    urlCard: {
      backgroundColor:
        COLORS.background,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 14,

      padding: 14,

      marginTop: 13,
    },

    urlText: {
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