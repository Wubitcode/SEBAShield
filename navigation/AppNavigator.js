/**
 * ============================================================
 * SEBAShield
 * Application Navigation System
 * ============================================================
 *
 * Purpose:
 * Manages navigation between all implemented SEBAShield
 * application screens.
 *
 * Navigation Structure:
 *
 * Home Screen
 * ├── Message Scanner
 * │       └── Threat Analysis Result
 * │
 * ├── Link Checker
 * │       └── Link Analysis Result
 * │
 * ├── Fake Job Detector
 * │       └── Fake Job Analysis Result
 * │
 * ├── Scan History
 * │
 * └── Settings
 *
 * Main Responsibilities:
 * - Register every available application screen.
 * - Define the route names used by navigation.navigate().
 * - Apply consistent header and transition styling.
 * - Provide the root NavigationContainer.
 *
 * Important:
 * Route names must match exactly wherever navigation.navigate()
 * is used. For example:
 *
 * navigation.navigate("History")
 *
 * requires:
 *
 * <Stack.Screen name="History" component={HistoryScreen} />
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo + React Navigation
 * ============================================================
 */

import React from "react";

/**
 * NavigationContainer:
 * Stores and manages the application's navigation state.
 *
 * createNativeStackNavigator:
 * Provides native-style screen transitions for iOS and Android.
 */
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

/**
 * ============================================================
 * Application Screens
 * ============================================================
 *
 * Every screen imported below must also be registered as a
 * Stack.Screen route inside AppNavigator.
 */
import HomeScreen from "../app/screens/HomeScreen";
import ScannerScreen from "../app/screens/ScannerScreen";
import ResultScreen from "../app/screens/ResultScreen";
import LinkCheckerScreen from "../app/screens/LinkCheckerScreen";
import LinkResultScreen from "../app/screens/LinkResultScreen";
import FakeJobScreen from "../app/screens/FakeJobScreen";
import FakeJobResultScreen from "../app/screens/FakeJobResultScreen";
import HistoryScreen from "../app/screens/HistoryScreen";
import SettingsScreen from "../app/screens/SettingsScreen";


/**
 * Centralized SEBAShield color palette.
 *
 * Shared colors keep navigation styling consistent with the
 * rest of the application.
 */
import { COLORS } from "../app/constants/colors";

/**
 * Create the native stack navigator instance.
 */
const Stack = createNativeStackNavigator();

/**
 * ============================================================
 * AppNavigator Component
 * ============================================================
 *
 * Registers all SEBAShield routes and defines shared navigation
 * appearance settings.
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          /**
           * Applies the SEBAShield background color to every
           * navigation header.
           */
          headerStyle: {
            backgroundColor: COLORS.background,
          },

          /**
           * Controls the color of:
           * - Header titles
           * - Back arrows
           * - Header action icons
           */
          headerTintColor: COLORS.text,

          /**
           * Applies consistent title typography.
           */
          headerTitleStyle: {
            fontWeight: "bold",
          },

          /**
           * Prevents long titles from being unnecessarily large
           * on iOS.
           */
          headerLargeTitle: false,

          /**
           * Applies the application background color during
           * screen transitions.
           */
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        {/* ====================================================
             Main Dashboard
           ==================================================== */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "SEBAShield",
          }}
        />

        {/* ====================================================
             Message Scanner Input Screen
           ==================================================== */}
        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{
            title: "Message Scanner",
          }}
        />

        {/* ====================================================
             Message Threat Analysis Result Screen
           ==================================================== */}
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{
            title: "Threat Analysis",
          }}
        />

        {/* ====================================================
             Suspicious Link Input Screen
           ==================================================== */}
        <Stack.Screen
          name="LinkChecker"
          component={LinkCheckerScreen}
          options={{
            title: "Link Checker",
          }}
        />

        {/* ====================================================
             Link Analysis Result Screen
           ==================================================== */}
        <Stack.Screen
          name="LinkResult"
          component={LinkResultScreen}
          options={{
            title: "Link Analysis",
          }}
        />

        {/* ====================================================
             Fake Job Detector Input Screen
           ==================================================== */}
        <Stack.Screen
          name="FakeJob"
          component={FakeJobScreen}
          options={{
            title: "Fake Job Detector",
          }}
        />

        {/* ====================================================
             Fake Job Analysis Result Screen
           ==================================================== */}
        <Stack.Screen
          name="FakeJobResult"
          component={FakeJobResultScreen}
          options={{
            title: "Fake Job Analysis",
          }}
        />

        {/* ====================================================
             Scan History Screen
           ====================================================
             
             This route fixes the navigation error shown when
             the Home screen calls:
             
             navigation.navigate("History")
           ==================================================== */}
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: "Scan History",
          }}
        />
        <Stack.Screen
  name="Settings"
  component={SettingsScreen}
  options={{
    title: "Settings",
  }}
/>
        {/* ====================================================
             Settings Screen
           ====================================================
             
             This route supports the Settings button shown in
             the Home screen header.
           ==================================================== */}
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}