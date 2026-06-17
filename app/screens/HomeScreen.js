import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";

import { COLORS } from "../constants/colors";
import { APP_CONFIG } from "../constants/appConfig";

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Image
        source={require("../../assets/images/sebashield-logo.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>{APP_CONFIG.appName}</Text>

      <Text style={styles.meaning}>
        {APP_CONFIG.meaning}
      </Text>

      <Text style={styles.tagline}>
        {APP_CONFIG.tagline}
      </Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Scanner")}
      >
        <Text style={styles.cardIcon}>💬</Text>

        <View>
          <Text style={styles.cardTitle}>
            Message Scanner
          </Text>

          <Text style={styles.cardText}>
            Analyze suspicious SMS messages, emails, and social media content.
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("LinkChecker")}
      >
        <Text style={styles.cardIcon}>🔗</Text>

        <View>
          <Text style={styles.cardTitle}>
            Link Checker
          </Text>

          <Text style={styles.cardText}>
            Detect phishing websites and suspicious URLs.
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("FakeJob")}
      >
        <Text style={styles.cardIcon}>💼</Text>

        <View>
          <Text style={styles.cardTitle}>
            Fake Job Detector
          </Text>

          <Text style={styles.cardText}>
            Identify employment scams and fraudulent job offers.
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("History")}
      >
        <Text style={styles.cardIcon}>📊</Text>

        <View>
          <Text style={styles.cardTitle}>
            Scan History
          </Text>

          <Text style={styles.cardText}>
            Review previous analyses and threat reports.
          </Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },

  logo: {
    width: 220,
    height: 220,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    color: COLORS.text,
    fontSize: 32,
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