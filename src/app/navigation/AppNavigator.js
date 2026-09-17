/**
 * ============================================================
 * SEBAShield
 * Application Navigation
 * ============================================================
 *
 * Purpose:
 * Defines the primary navigation structure for SEBAShield.
 *
 * Navigation Structure:
 *
 * Home
 * ├── Message Scanner
 * │     └── Threat Analysis
 * │
 * ├── Link Checker
 * │     └── Link Analysis
 * │
 * ├── Fake Job Detector
 * │     └── Fake Job Analysis
 * │
 * ├── Scan History
 * │
 * └── Settings
 *
 * Route names must remain synchronized with navigation.navigate()
 * calls throughout the application.
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo + React Navigation
 * ============================================================
 */

import React from "react";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

/**
 * ============================================================
 * Application Screens
 * ============================================================
 */
import HomeScreen from "../../features/scanning/screens/HomeScreen";
import ScannerScreen from "../../features/scanning/screens/ScannerScreen";
import ResultScreen from "../../features/scanning/screens/ResultScreen";
import LinkCheckerScreen from "../../features/scanning/screens/LinkCheckerScreen";
import LinkResultScreen from "../../features/scanning/screens/LinkResultScreen";
import FakeJobScreen from "../../features/scanning/screens/FakeJobScreen";
import FakeJobResultScreen from "../../features/scanning/screens/FakeJobResultScreen";

import HistoryScreen from "../../features/history/screens/HistoryScreen";

import SettingsScreen from "../../features/settings/screens/SettingsScreen";

/**
 * Shared application color palette.
 */
import {
  COLORS,
} from "../../shared/constants/colors";

/**
 * Native stack navigator instance.
 */
const Stack =
  createNativeStackNavigator();

/**
 * ============================================================
 * AppNavigator
 * ============================================================
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          /**
           * Keep all navigation headers visually consistent with
           * the main SEBAShield interface.
           */
          headerStyle: {
            backgroundColor:
              COLORS.background,
          },

          /**
           * Controls header title and back-arrow color.
           */
          headerTintColor:
            COLORS.text,

          /**
           * Consistent navigation typography.
           */
          headerTitleStyle: {
            fontWeight:
              "700",
          },

          /**
           * Keep titles consistent between iOS and Android.
           */
          headerTitleAlign:
            "center",

          /**
           * SEBAShield uses standard compact navigation headers.
           */
          headerLargeTitle:
            false,

          /**
           * Removes the default separator/shadow beneath the
           * navigation bar for a cleaner dark interface.
           */
          headerShadowVisible:
            false,

          /**
           * Keeps the application background consistent during
           * screen transitions.
           */
          contentStyle: {
            backgroundColor:
              COLORS.background,
          },
        }}
      >
        {/* ====================================================
            Home
            ==================================================== */}
        <Stack.Screen
          name="Home"
          component={
            HomeScreen
          }
          options={{
            /**
             * The SEBAShield logo already provides the primary
             * branding on the Home screen.
             */
            headerTitle:
              "",
          }}
        />

        {/* ====================================================
            Message Scanner
            ==================================================== */}
        <Stack.Screen
          name="Scanner"
          component={
            ScannerScreen
          }
          options={{
            title:
              "Message Scanner",
          }}
        />

        {/* ====================================================
            Message Result
            ==================================================== */}
        <Stack.Screen
          name="Result"
          component={
            ResultScreen
          }
          options={{
            title:
              "Threat Analysis",
          }}
        />

        {/* ====================================================
            Link Checker
            ==================================================== */}
        <Stack.Screen
          name="LinkChecker"
          component={
            LinkCheckerScreen
          }
          options={{
            title:
              "Link Checker",
          }}
        />

        {/* ====================================================
            Link Result
            ==================================================== */}
        <Stack.Screen
          name="LinkResult"
          component={
            LinkResultScreen
          }
          options={{
            title:
              "Link Analysis",
          }}
        />

        {/* ====================================================
            Fake Job Detector
            ==================================================== */}
        <Stack.Screen
          name="FakeJob"
          component={
            FakeJobScreen
          }
          options={{
            title:
              "Fake Job Detector",
          }}
        />

        {/* ====================================================
            Fake Job Result
            ==================================================== */}
        <Stack.Screen
          name="FakeJobResult"
          component={
            FakeJobResultScreen
          }
          options={{
            title:
              "Fake Job Analysis",
          }}
        />

        {/* ====================================================
            Scan History
            ==================================================== */}
        <Stack.Screen
          name="History"
          component={
            HistoryScreen
          }
          options={{
            title:
              "Scan History",
          }}
        />

        {/* ====================================================
            Settings
            ==================================================== */}
        <Stack.Screen
          name="Settings"
          component={
            SettingsScreen
          }
          options={{
            title:
              "Settings",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}