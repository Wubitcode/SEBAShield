/**
 * ============================================================
 * SEBAShield
 * Application Navigation System
 * ============================================================
 *
 * Purpose:
 * Manages navigation between application screens.
 *
 * Current Navigation Flow:
 *
 * Home Screen
 *      ↓
 * Message Scanner
 *      ↓
 * Threat Analysis Results
 *
 * Future Screens:
 * - Link Checker
 * - Fake Job Detector
 * - Scan History
 * - Settings
 *
 * Author: Wubit
 * Project: Mobile Capstone Project
 * ============================================================
 */

import React from "react";

/**
 * React Navigation Components
 *
 * NavigationContainer:
 * Provides navigation functionality.
 *
 * createNativeStackNavigator:
 * Creates native screen transitions.
 */
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

/**
 * Application Screens
 */
import HomeScreen from "../app/screens/HomeScreen";
import ScannerScreen from "../app/screens/ScannerScreen";
import ResultScreen from "../app/screens/ResultScreen";

/**
 * Application Theme Colors
 */
import { COLORS } from "../app/constants/colors";

/**
 * Create Stack Navigator Instance
 */
const Stack = createNativeStackNavigator();

/**
 * AppNavigator Component
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.background,
          },

          headerTintColor: COLORS.text,

          headerTitleStyle: {
            fontWeight: "bold",
          },

          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        {/* Main Dashboard */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "SEBAShield",
          }}
        />

        {/* Message Scanner */}
        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{
            title: "Message Scanner",
          }}
        />

        {/* Threat Analysis Results */}
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{
            title: "Threat Analysis",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}