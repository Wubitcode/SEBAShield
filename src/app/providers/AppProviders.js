/**
 * ============================================================
 * SEBAShield
 * Application Providers
 * ============================================================
 *
 * Provider order:
 * 1. AuthProvider establishes the Firebase user.
 * 2. ScanProvider manages scans for that user.
 * ============================================================
 */

import React from "react";

import {
  AuthProvider,
} from "../../features/authentication/context/AuthContext";

import {
  ScanProvider,
} from "../../features/scanning/context/ScanContext";

/**
 * Activates shared application state.
 */
export default function AppProviders({
  children,
}) {
  return (
    <AuthProvider>
      <ScanProvider>
        {children}
      </ScanProvider>
    </AuthProvider>
  );
}