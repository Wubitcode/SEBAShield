/**
 * ============================================================
 * SEBAShield
 * Home Screen
 * ============================================================
 *
 * Purpose:
 * This screen is the main dashboard of the SEBAShield app.
 * It displays the app logo, brand identity, and feature cards.
 *
 * Why We Use This Screen:
 * The Home Screen gives users one central place to access
 * scam detection tools such as message scanning, link checking,
 * fake job detection, and scan history.
 *
 * Author: Wubit
 * Project: Mobile Capstone Project
 * Technology: React Native + Expo
 * ============================================================
 */

import React from "react";

/**
 * React Native UI components:
 *
 * View = Container used to group UI elements.
 * Text = Displays text on the screen.
 * StyleSheet = Organizes styling in a clean way.
 * TouchableOpacity = Creates clickable/tappable cards.
 * Image = Displays the SEBAShield logo.
 * ScrollView = Allows the screen to scroll on smaller devices.
 */
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";

/**
 * COLORS:
 * Centralized brand color system for consistent styling.
 *
 * APP_CONFIG:
 * Stores reusable app identity information such as
 * app name, tagline, version, and SEBA meaning.
 */
import { COLORS } from "../constants/colors";
import { APP_CONFIG } from "../constants/appConfig";

/**
 * HomeScreen Component
 *
 * Receives the navigation object from React Navigation.
 * This allows the feature cards to move users to other screens.
 */
export default function HomeScreen({ navigation }) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Application logo */}
      <Image
        source={require("../../assets/images/sebashield-logo.png")}
        style={styles.logo}
      />

      {/* Application brand name */}
      <Text style={styles.title}>{APP_CONFIG.appName}</Text>

      {/* Meaning of SEBA */}
      <Text style={styles.meaning}>
        {APP_CONFIG.meaning}
      </Text>

      {/* Application tagline */}
      <Text style={styles.tagline}>
        {APP_CONFIG.tagline}
      </Text>

      {/* Message Scanner Navigation Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Scanner")}
      >
        <Text style={styles.cardIcon}>💬</Text>

        <View>
          <Text style={styles.cardTitle}>Message Scanner</Text>

          <Text style={styles.cardText}>
            Analyze suspicious SMS messages, emails, and social media content.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Link Checker Navigation Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("LinkChecker")}
      >
        <Text style={styles.cardIcon}>🔗</Text>

        <View>
          <Text style={styles.cardTitle}>Link Checker</Text>

          <Text style={styles.cardText}>
            Detect phishing websites and suspicious URLs.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Fake Job Detector Navigation Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("FakeJob")}
      >
        <Text style={styles.cardIcon}>💼</Text>

        <View>
          <Text style={styles.cardTitle}>Fake Job Detector</Text>

          <Text style={styles.cardText}>
            Identify employment scams and fraudulent job offers.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Scan History Navigation Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("History")}
      >
        <Text style={styles.cardIcon}>📊</Text>

        <View>
          <Text style={styles.cardTitle}>Scan History</Text>

          <Text style={styles.cardText}>
            Review previous analyses and threat reports.
          </Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

/**
 * Screen Styles
 *
 * These styles control layout, spacing, colors, typography,
 * and card appearance for the Home Screen.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
  padding: 20,
  paddingTop: 25,
  paddingBottom: 40,
},

logo: {
  width: 140,
  height: 140,
  resizeMode: "contain",
  alignSelf: "center",
  marginBottom: 8,
},

  title: {
  color: COLORS.text,
  fontSize: 28,
  fontWeight: "bold",
  textAlign: "center",
},

  meaning: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },

  tagline: {
    color: COLORS.mutedText,
    fontSize: 16,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 30,
  },

  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  cardIcon: {
    fontSize: 34,
    marginRight: 16,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
  },

  cardText: {
    color: COLORS.mutedText,
    fontSize: 14,
    marginTop: 4,
    width: 220,
  },
});