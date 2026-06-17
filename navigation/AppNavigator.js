import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../app/screens/HomeScreen";
import ScannerScreen from "../app/screens/ScannerScreen";
import ResultScreen from "../app/screens/ResultScreen";
import LinkCheckerScreen from "../app/screens/LinkCheckerScreen";
import FakeJobScreen from "../app/screens/FakeJobScreen";
import HistoryScreen from "../app/screens/HistoryScreen";
import SettingsScreen from "../app/screens/SettingsScreen";

import { COLORS } from "../app/constants/colors";

const Stack = createNativeStackNavigator();

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
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "SEBA Shield " }}
        />

        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{ title: "Message Scanner" }}
        />

        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: "Threat Analysis" }}
        />

        <Stack.Screen
          name="LinkChecker"
          component={LinkCheckerScreen}
          options={{ title: "Link Checker" }}
        />

        <Stack.Screen
          name="FakeJob"
          component={FakeJobScreen}
          options={{ title: "Fake Job Detector" }}
        />

        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: "Scan History" }}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Settings" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}