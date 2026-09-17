/**
 * ============================================================
 * SEBAShield
 * Fake Job Analysis Result Screen
 * ============================================================
 *
 * Purpose:
 * Displays the completed local SEBAShield recruitment-scam
 * analysis and the optional AI-assisted assessment.
 *
 * Result Structure:
 *
 * Risk Summary
 *      ↓
 * Local Analysis
 *      ↓
 * AI Analysis
 *      ↓
 * Submitted Job Offer
 *      ↓
 * Official Guidance
 *
 * Security:
 * - Local rule-based analysis remains the primary baseline.
 * - AI analysis is supplemental.
 * - AI failure does not invalidate the local result.
 * - This screen does not directly write submitted content to
 *   Firestore.
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

import React from "react";

import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
 * Official Fraud-Awareness Resources
 * ============================================================
 *
 * These resources are provided for education only.
 * SEBAShield does not claim affiliation with these organizations.
 */
const GUIDANCE_SOURCES = [
  {
    id:
      "canadian-anti-fraud-centre",

    name:
      "Canadian Anti-Fraud Centre",

    description:
      "Fraud prevention, awareness, and reporting information for Canadians.",

    url:
      "https://antifraudcentre-centreantifraude.ca/index-eng.htm",
  },

  {
    id:
      "competition-bureau-canada",

    name:
      "Competition Bureau Canada",

    description:
      "Official Canadian information about job and employment scams.",

    url:
      "https://competition-bureau.canada.ca/en/fraud-and-scams/tips-and-advice/job-and-employment-scams",
  },

  {
    id:
      "federal-trade-commission",

    name:
      "Federal Trade Commission",

    description:
      "Consumer guidance about job-scam warning signs and prevention.",

    url:
      "https://consumer.ftc.gov/all-scams/job-scams",
  },
];

/**
 * ============================================================
 * FakeJobResultScreen
 * ============================================================
 */
export default function FakeJobResultScreen({
  route,
  navigation,
}) {
  const jobAnalysisResult =
    route?.params
      ?.jobAnalysisResult;

  const aiAnalysis =
    route?.params
      ?.aiAnalysis ?? null;

  /**
   * Protect against navigation without a valid result.
   */
  if (!jobAnalysisResult) {
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
          No Job Analysis Available
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          Return to Fake Job Detector and submit a job offer or
          recruiter message for analysis.
        </Text>

        <TouchableOpacity
          style={
            styles.primaryButton
          }
          onPress={() =>
            navigation.goBack()
          }
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Return to Fake Job Detector"
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Return to Detector
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * ============================================================
   * Normalize Local Result
   * ============================================================
   */
  const score =
    typeof jobAnalysisResult
      .score === "number"
      ? jobAnalysisResult.score
      : 0;

  const riskLevel =
    jobAnalysisResult
      .riskLevel ||
    "No Major Indicators Detected";

  const indicators =
    Array.isArray(
      jobAnalysisResult
        .indicators
    )
      ? jobAnalysisResult
          .indicators
      : [];

  const originalContent =
    jobAnalysisResult
      .originalContent ||
    "Submitted job content is unavailable.";

  /**
   * ============================================================
   * Risk Presentation
   * ============================================================
   */
  const getRiskPresentation = (
    level
  ) => {
    const normalizedRisk =
      String(
        level ?? ""
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
        "low risk" ||
      normalizedRisk ===
        "no major indicators detected"
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
      riskLevel
    );

  const aiRisk =
    getRiskPresentation(
      aiAnalysis?.riskLevel
    );

  /**
   * ============================================================
   * Local Recommendations
   * ============================================================
   */
  const getRecommendations =
    () => {
      if (
        riskLevel ===
        "High Risk"
      ) {
        return [
          "Stop communicating with the recruiter until the employer is independently verified.",
          "Do not send your SIN, banking information, identification, passwords, or verification codes.",
          "Do not pay registration, training, equipment, processing, or recruitment fees.",
          "Do not purchase gift cards or transfer cryptocurrency for employment purposes.",
          "Confirm the position through the employer's official careers website.",
          "Report the message, account, or job posting to the platform where it appeared.",
        ];
      }

      if (
        riskLevel ===
        "Suspicious"
      ) {
        return [
          "Verify the company and recruiter through independent official sources.",
          "Confirm that the recruiter's email domain matches the employer's official website.",
          "Search the employer's official careers page for the advertised position.",
          "Do not provide sensitive personal or financial information.",
          "Avoid paying any fee associated with the recruitment process.",
        ];
      }

      if (
        riskLevel ===
        "Caution"
      ) {
        return [
          "Review the offer carefully before responding.",
          "Verify the recruiter using the employer's official contact information.",
          "Confirm that the job appears on the employer's official careers page.",
          "Do not share sensitive information during an unverified recruitment process.",
          "Be cautious of pressure to respond immediately.",
        ];
      }

      return [
        "Continue verifying the employer before sharing personal information.",
        "Confirm the position through the employer's official careers website.",
        "Check that recruiter contact details use an official company domain.",
        "Be cautious if the recruiter later requests money or sensitive information.",
      ];
    };

  const recommendations =
    getRecommendations();

  /**
   * AI remains supplemental to local analysis.
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

  /**
   * Open an external official guidance resource.
   */
  const handleOpenGuidanceLink =
    async (url) => {
      try {
        const isSupported =
          await Linking.canOpenURL(
            url
          );

        if (!isSupported) {
          Alert.alert(
            "Unable to Open Link",
            "This guidance webpage cannot be opened on this device."
          );

          return;
        }

        await Linking.openURL(
          url
        );
      } catch (error) {
        console.error(
          "[SEBAShield] Unable to open official guidance link.",
          {
            name:
              error?.name ??
              "UnknownError",

            message:
              error?.message ??
              "Unknown link error",
          }
        );

        Alert.alert(
          "Unable to Open Link",
          "SEBAShield could not open this official guidance webpage. Please try again."
        );
      }
    };

  /**
   * Return to Fake Job Detector.
   */
  const handleAnalyzeAnother =
    () => {
      navigation.goBack();
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
          Risk Summary
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
          {score}%
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
            {riskLevel}
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
          Recruitment-scam warning signs detected by SEBAShield's
          local scanner.
        </Text>

        {indicators.length >
        0 ? (
          <View
            style={
              styles.listContainer
            }
          >
            {renderBulletList(
              indicators,
              "local-job-indicator"
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
              No major stored fake-job indicators were detected.
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
            "local-job-recommendation"
          )}
        </View>
      </View>

      {/* =====================================================
          AI Analysis
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
                <View
                  style={
                    styles.aiRiskColumn
                  }
                >
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
                  "ai-job-indicator"
                )}
              </View>
            ) : null}

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
                  "ai-job-recommendation"
                )}
              </View>
            ) : null}

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
                {aiAnalysis?.summary ||
                  "AI analysis is currently unavailable. Your local fake-job result is still available."}
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
                No AI assessment was returned for this job offer.
                The local result above remains available.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* =====================================================
          Submitted Job Offer
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
            name="briefcase-outline"
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
            Submitted Job Offer
          </Text>
        </View>

        <View
          style={
            styles.submittedCard
          }
        >
          <Text
            style={
              styles.submittedText
            }
          >
            {originalContent}
          </Text>
        </View>
      </View>

      {/* =====================================================
          Safety Notice
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
          Automated analysis cannot confirm that an employer,
          recruiter, or job offer is legitimate. Verify the
          opportunity through official company channels before
          sharing personal information or sending money.
        </Text>
      </View>

      {/* =====================================================
          Official Guidance
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
            name="information-circle-outline"
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
            Official Guidance
          </Text>
        </View>

        <Text
          style={
            styles.sectionDescription
          }
        >
          Learn more about employment scams and fraud reporting
          from official organizations.
        </Text>

        {GUIDANCE_SOURCES.map(
          (
            source
          ) => (
            <TouchableOpacity
              key={
                source.id
              }
              style={
                styles.sourceRow
              }
              onPress={() =>
                handleOpenGuidanceLink(
                  source.url
                )
              }
              activeOpacity={
                0.75
              }
              accessibilityRole="link"
              accessibilityLabel={`Open ${source.name}`}
            >
              <View
                style={
                  styles.sourceIcon
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color={
                    COLORS.primary
                  }
                />
              </View>

              <View
                style={
                  styles.sourceContent
                }
              >
                <Text
                  style={
                    styles.sourceTitle
                  }
                >
                  {
                    source.name
                  }
                </Text>

                <Text
                  style={
                    styles.sourceDescription
                  }
                >
                  {
                    source.description
                  }
                </Text>
              </View>

              <Ionicons
                name="open-outline"
                size={18}
                color={
                  COLORS.mutedText
                }
              />
            </TouchableOpacity>
          )
        )}

        <Text
          style={
            styles.sourceDisclaimer
          }
        >
          SEBAShield is not affiliated with these organizations.
          External content is managed by the respective
          organizations.
        </Text>
      </View>

      {/* =====================================================
          Analyze Another Job Offer
          ===================================================== */}
      <TouchableOpacity
        style={
          styles.primaryButton
        }
        onPress={
          handleAnalyzeAnother
        }
        activeOpacity={
          0.82
        }
        accessibilityRole="button"
        accessibilityLabel="Analyze another job offer"
      >
        <View
          style={
            styles.buttonContent
          }
        >
          <Ionicons
            name="refresh-outline"
            size={20}
            color="#000000"
          />

          <Text
            style={
              styles.primaryButtonText
            }
          >
            Analyze Another Job Offer
          </Text>
        </View>
      </TouchableOpacity>
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
     * Empty Result
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

      textAlign:
        "center",

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

      marginBottom: 8,
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
      maxWidth: "100%",

      borderWidth: 1,

      borderRadius: 20,

      paddingHorizontal: 14,

      paddingVertical: 6,

      marginTop: 10,
    },

    riskBadgeText: {
      fontSize: 14,

      fontWeight:
        "800",

      textAlign:
        "center",
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
      flex: 1,

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
     * AI Analysis
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

    aiRiskColumn: {
      flex: 1,

      paddingRight: 12,
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
     * Submitted Content
     * ========================================================
     */
    submittedCard: {
      backgroundColor:
        COLORS.background,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 14,

      padding: 14,

      marginTop: 13,
    },

    submittedText: {
      color:
        COLORS.text,

      fontSize: 14,

      lineHeight: 22,
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

      paddingHorizontal: 4,

      marginBottom: 16,
    },

    safetyText: {
      flex: 1,

      color:
        COLORS.mutedText,

      fontSize: 12,

      lineHeight: 18,

      marginLeft: 8,
    },

    /**
     * ========================================================
     * Official Guidance
     * ========================================================
     */
    sourceRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      backgroundColor:
        COLORS.background,

      borderColor:
        COLORS.border,

      borderWidth: 1,

      borderRadius: 14,

      padding: 13,

      marginBottom: 10,
    },

    sourceIcon: {
      width: 36,

      height: 36,

      borderRadius: 12,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight: 10,
    },

    sourceContent: {
      flex: 1,

      paddingRight: 10,
    },

    sourceTitle: {
      color:
        COLORS.text,

      fontSize: 14,

      fontWeight:
        "700",
    },

    sourceDescription: {
      color:
        COLORS.mutedText,

      fontSize: 12,

      lineHeight: 17,

      marginTop: 3,
    },

    sourceDisclaimer: {
      color:
        COLORS.mutedText,

      fontSize: 11,

      lineHeight: 17,

      marginTop: 4,
    },

    /**
     * ========================================================
     * Primary Button
     * ========================================================
     */
    primaryButton: {
      width: "100%",

      minHeight: 56,

      backgroundColor:
        COLORS.primary,

      borderRadius: 14,

      paddingHorizontal: 20,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop: 4,
    },

    buttonContent: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    primaryButtonText: {
      color:
        "#000000",

      fontSize: 16,

      fontWeight:
        "800",

      textAlign:
        "center",

      marginLeft: 8,
    },
  });