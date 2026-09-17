/**
 * ============================================================
 * SEBAShield
 * Home Screen
 * ============================================================
 *
 * Purpose:
 * Provides a simple and consistent dashboard for accessing the
 * primary SEBAShield security and account-management features.
 *
 * Main Features:
 * - Message Scanner
 * - Link Checker
 * - Fake Job Detector
 * - Scan History
 * - Settings
 *
 * Design Goals:
 * - Minimal visual clutter
 * - Clear feature hierarchy
 * - Consistent iconography
 * - Responsive card layout
 * - Accessible touch targets
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

import React, {
  useLayoutEffect,
  useMemo,
} from "react";

import {
  Image,
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

import {
  useScan,
} from "../context/ScanContext";

/**
 * ============================================================
 * FeatureCard
 * ============================================================
 *
 * Reusable navigation card used for each SEBAShield feature.
 *
 * A single icon family is used throughout the screen so the
 * interface remains visually consistent across iOS and Android.
 */
function FeatureCard({
  icon,
  title,
  description,
  onPress,
  accessibilityLabel,
}) {
  return (
    <TouchableOpacity
      style={
        styles.card
      }
      onPress={
        onPress
      }
      activeOpacity={
        0.78
      }
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel
      }
      accessibilityHint={
        description
      }
    >
      {/* Consistent feature icon */}
      <View
        style={
          styles.iconContainer
        }
      >
        <Ionicons
          name={
            icon
          }
          size={
            29
          }
          color={
            COLORS.primary
          }
        />
      </View>

      {/* Feature title and supporting text */}
      <View
        style={
          styles.cardContent
        }
      >
        <Text
          style={
            styles.cardTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.cardText
          }
        >
          {description}
        </Text>
      </View>

      {/* Navigation indicator */}
      <Ionicons
        name="chevron-forward"
        size={
          21
        }
        color={
          COLORS.mutedText
        }
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </TouchableOpacity>
  );
}

/**
 * ============================================================
 * HomeScreen
 * ============================================================
 */
export default function HomeScreen({
  navigation,
}) {
  /**
   * Scan history is used only to make the History card more
   * useful for returning users.
   */
  const {
    scans,
  } = useScan();

  /**
   * Keep the navigation header minimal.
   *
   * The Expo development-menu gear that may appear while using
   * Expo Go is not part of the SEBAShield production interface.
   */
  useLayoutEffect(
    () => {
      navigation.setOptions({
        headerTitle:
          "",
      });
    },
    [
      navigation,
    ]
  );

  /**
   * Create a concise History-card message based on whether the
   * user already has locally saved scans.
   */
  const historyDescription =
    useMemo(
      () => {
        if (
          !Array.isArray(
            scans
          ) ||
          scans.length ===
            0
        ) {
          return (
            "No saved scans yet."
          );
        }

        if (
          scans.length ===
          1
        ) {
          return (
            "Review and manage your 1 saved scan."
          );
        }

        return (
          `Review and manage your ${scans.length} saved scans.`
        );
      },
      [
        scans,
      ]
    );

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
          SEBAShield Logo
          ===================================================== */}
      <View
        style={
          styles.logoContainer
        }
      >
        <Image
          source={
            require(
              "../../../../assets/images/sebashield-logo.png"
            )
          }
          style={
            styles.logo
          }
          accessibilityLabel="SEBAShield logo"
        />
      </View>

      {/* =====================================================
          Message Scanner
          ===================================================== */}
      <FeatureCard
        icon="chatbubble-ellipses-outline"
        title="Message Scanner"
        description="Check suspicious messages, emails, and social media content."
        onPress={() =>
          navigation.navigate(
            "Scanner"
          )
        }
        accessibilityLabel="Open Message Scanner"
      />

      {/* =====================================================
          Link Checker
          ===================================================== */}
      <FeatureCard
        icon="link-outline"
        title="Link Checker"
        description="Check suspicious links and websites."
        onPress={() =>
          navigation.navigate(
            "LinkChecker"
          )
        }
        accessibilityLabel="Open Link Checker"
      />

      {/* =====================================================
          Fake Job Detector
          ===================================================== */}
      <FeatureCard
        icon="briefcase-outline"
        title="Fake Job Detector"
        description="Check suspicious job offers and recruitment messages."
        onPress={() =>
          navigation.navigate(
            "FakeJob"
          )
        }
        accessibilityLabel="Open Fake Job Detector"
      />

      {/* =====================================================
          Scan History
          ===================================================== */}
      <FeatureCard
        icon="time-outline"
        title="Scan History"
        description={
          historyDescription
        }
        onPress={() =>
          navigation.navigate(
            "History"
          )
        }
        accessibilityLabel="Open Scan History"
      />

      {/* =====================================================
          Settings
          ===================================================== */}
      <FeatureCard
        icon="settings-outline"
        title="Settings"
        description="Manage your account, privacy, scan history, and app information."
        onPress={() =>
          navigation.navigate(
            "Settings"
          )
        }
        accessibilityLabel="Open Settings"
      />
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
     * Main application background.
     */
    container: {
      flex:
        1,

      backgroundColor:
        COLORS.background,
    },

    /**
     * Main scroll-content spacing.
     */
    content: {
      paddingHorizontal:
        20,

      paddingTop:
        4,

      paddingBottom:
        40,
    },

    /**
     * ========================================================
     * Logo
     * ========================================================
     *
     * The logo is intentionally kept smaller than the feature
     * cards so application actions remain the visual priority.
     */
    logoContainer: {
      alignItems:
        "center",

      justifyContent:
        "center",

      paddingTop:
        2,

      paddingBottom:
        18,
    },

    logo: {
      width:
        96,

      height:
        96,

      resizeMode:
        "contain",
    },

    /**
     * ========================================================
     * Feature Cards
     * ========================================================
     */
    card: {
      minHeight:
        104,

      backgroundColor:
        COLORS.card,

      borderColor:
        COLORS.border,

      borderWidth:
        1,

      borderRadius:
        18,

      paddingVertical:
        16,

      paddingHorizontal:
        16,

      marginBottom:
        14,

      flexDirection:
        "row",

      alignItems:
        "center",
    },

    /**
     * Fixed icon area keeps all feature titles aligned.
     */
    iconContainer: {
      width:
        46,

      height:
        46,

      borderRadius:
        14,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight:
        14,
    },

    /**
     * Flexible text layout adapts to different device widths.
     */
    cardContent: {
      flex:
        1,

      paddingRight:
        10,
    },

    cardTitle: {
      color:
        COLORS.text,

      fontSize:
        18,

      fontWeight:
        "800",

      lineHeight:
        23,
    },

    cardText: {
      color:
        COLORS.mutedText,

      fontSize:
        14,

      lineHeight:
        20,

      marginTop:
        5,
    },
  });