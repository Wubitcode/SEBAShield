/**
 * ============================================================
 * SEBAShield
 * History Service
 * ============================================================
 *
 * Purpose:
 * Provides a centralized service for saving, loading,
 * and clearing SEBAShield scan history.
 *
 * All scanners should use this service instead of directly
 * interacting with AsyncStorage.
 *
 * Author: Wubit
 * ============================================================
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Shared storage key.
 *
 * Every analysis result is stored under this key.
 */
export const HISTORY_STORAGE_KEY = "@sebashield_scan_history";

/**
 * Saves a completed scan to history.
 *
 * Newest scans are inserted at the beginning of the list.
 */
export async function saveScan(record) {
  try {
    const existingHistory =
      await AsyncStorage.getItem(HISTORY_STORAGE_KEY);

    const history = existingHistory
      ? JSON.parse(existingHistory)
      : [];

    const newRecord = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...record,
    };

    history.unshift(newRecord);

    await AsyncStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(history)
    );
  } catch (error) {
    console.error("Unable to save scan history:", error);
  }
}

/**
 * Returns every saved scan.
 */
export async function getHistory() {
  try {
    const data = await AsyncStorage.getItem(
      HISTORY_STORAGE_KEY
    );

    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Deletes every saved scan.
 */
export async function clearHistory() {
  await AsyncStorage.removeItem(
    HISTORY_STORAGE_KEY
  );
}