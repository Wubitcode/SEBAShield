/**
 * ============================================================
 * SEBAShield
 * Application Entry Point
 * ============================================================
 *
 * Purpose:
 * This file serves as the root entry point for the
 * entire SEBAShield mobile application.
 *
 * Responsibilities:
 * - Launch the application.
 * - Load the navigation system.
 * - Initialize all screens.
 *
 * Why We Use It:
 * React Native applications require a root component.
 * App.js acts as the starting point loaded by Expo.
 *
 * Author: Wubit
 * Project: Mobile Capstone Project
 * Technology: React Native + Expo
 * ============================================================
 */

import AppNavigator from "./navigation/AppNavigator";

/**
 * Root Application Component
 */
export default function App() {
  return <AppNavigator />;
}