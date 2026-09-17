/**
 * ============================================================
 * SEBAShield
 * Settings Screen
 * ============================================================
 *
 * Purpose:
 * Provides account management, privacy information, scan-history
 * controls, application information, and security guidance.
 *
 * Account features:
 * - Anonymous account status
 * - Upgrade anonymous account to Email/Password
 * - Sign in to an existing Email/Password account
 * - Password reset
 * - Email verification
 * - Verification-status refresh
 * - Secure permanent-account sign out
 *
 * Privacy:
 * - Raw submitted scan content is encrypted before local storage.
 * - Privacy-minimized scan metadata may synchronize to Firestore.
 * - Anonymous authentication provides private cloud ownership.
 * - Optional Email/Password upgrade preserves the Firebase UID.
 * - History deletion is routed through ScanContext.
 *
 * Author: Wubit
 * Project: SEBAShield Mobile Capstone
 * Technology: React Native + Expo
 * ============================================================
 */

import React, {
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  useAuth,
} from "../../authentication/context/AuthContext";

import {
  useScan,
} from "../../scanning/context/ScanContext";

/**
 * ============================================================
 * SettingsScreen
 * ============================================================
 */
export default function SettingsScreen() {
  /**
   * ============================================================
   * Authentication
   * ============================================================
   */
  const {
    email,

    isAnonymous,
    isEmailAccount,
    isEmailVerified,

    isInitializing,
    isSigningIn,
    isManagingAccount,
    isBusy,

    error:
      authenticationError,

    clearError,

    createPermanentAccount,
    signInWithEmail,
    signOutAccount,

    sendPasswordReset,
    sendVerificationEmail,
    refreshAccount,
  } = useAuth();

  /**
   * ============================================================
   * Scan history
   * ============================================================
   *
   * History management remains routed through ScanContext so
   * local and Firestore deletion stay coordinated.
   */
  const {
    clearAllHistory,
    isManagingHistory,
  } = useScan();

  /**
   * ============================================================
   * Account form state
   * ============================================================
   */
  const [
    accountMode,
    setAccountMode,
  ] =
    useState(
      "create"
    );

  const [
    accountEmail,
    setAccountEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);

  /**
   * Clears password fields when changing between account actions.
   */
  const resetAccountForm =
    () => {
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);

      clearError();
    };

  /**
   * Switches between Create Account and Sign In.
   */
  const changeAccountMode =
    (
      nextMode
    ) => {
      resetAccountForm();

      setAccountMode(
        nextMode
      );
    };

  /**
   * ============================================================
   * handleCreateAccount
   * ============================================================
   *
   * Upgrades the CURRENT anonymous Firebase account.
   *
   * The underlying authentication service uses
   * linkWithCredential(), preserving the existing Firebase UID.
   */
  const handleCreateAccount =
    async () => {
      if (isBusy) {
        return;
      }

      const trimmedEmail =
        accountEmail.trim();

      if (!trimmedEmail) {
        Alert.alert(
          "Email Required",
          "Enter the email address you want to use for your SEBAShield account."
        );

        return;
      }

      if (
        !password
      ) {
        Alert.alert(
          "Password Required",
          "Enter a password for your account."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        Alert.alert(
          "Passwords Do Not Match",
          "Enter the same password in both password fields."
        );

        return;
      }

      try {
        const result =
          await createPermanentAccount(
            trimmedEmail,
            password
          );

        resetAccountForm();

        if (
          result
            ?.verificationEmailSent
        ) {
          Alert.alert(
            "Account Created",
            "Your anonymous SEBAShield account has been upgraded successfully. A verification email was also sent to you."
          );
        } else {
          Alert.alert(
            "Account Created",
            "Your SEBAShield account was created successfully. You can request another verification email from Account Settings."
          );
        }
      } catch (
        accountError
      ) {
        Alert.alert(
          "Unable to Create Account",
          accountError
            ?.message ||
            "SEBAShield could not create your account. Please try again."
        );
      }
    };

  /**
   * ============================================================
   * handleSignIn
   * ============================================================
   */
  const handleSignIn =
    async () => {
      if (isBusy) {
        return;
      }

      const trimmedEmail =
        accountEmail.trim();

      if (
        !trimmedEmail ||
        !password
      ) {
        Alert.alert(
          "Email and Password Required",
          "Enter your email address and password."
        );

        return;
      }

      try {
        await signInWithEmail(
          trimmedEmail,
          password
        );

        resetAccountForm();

        Alert.alert(
          "Signed In",
          "You are now signed in to your SEBAShield account."
        );
      } catch (
        signInError
      ) {
        Alert.alert(
          "Unable to Sign In",
          signInError
            ?.message ||
            "SEBAShield could not sign in. Please try again."
        );
      }
    };

  /**
   * ============================================================
   * handlePasswordReset
   * ============================================================
   *
   * Always presents a generic success response.
   *
   * This avoids revealing whether a particular email address is
   * registered with SEBAShield.
   */
  const handlePasswordReset =
    async () => {
      if (isBusy) {
        return;
      }

      const trimmedEmail =
        accountEmail.trim();

      if (!trimmedEmail) {
        Alert.alert(
          "Email Required",
          "Enter your email address first, then select Forgot Password."
        );

        return;
      }

      try {
        await sendPasswordReset(
          trimmedEmail
        );

        Alert.alert(
          "Check Your Email",
          "If an account exists for that email address, password-reset instructions will be sent."
        );
      } catch (
        resetError
      ) {
        Alert.alert(
          "Unable to Send Reset Email",
          resetError
            ?.message ||
            "SEBAShield could not process the password-reset request."
        );
      }
    };

  /**
   * ============================================================
   * handleVerificationEmail
   * ============================================================
   */
  const handleVerificationEmail =
    async () => {
      if (isBusy) {
        return;
      }

      try {
        await sendVerificationEmail();

        Alert.alert(
          "Verification Email Sent",
          "Check your inbox and follow the verification link. Then return to SEBAShield and select Refresh Verification Status."
        );
      } catch (
        verificationError
      ) {
        Alert.alert(
          "Unable to Send Verification Email",
          verificationError
            ?.message ||
            "SEBAShield could not send the verification email."
        );
      }
    };

  /**
   * ============================================================
   * handleRefreshVerification
   * ============================================================
   */
  const handleRefreshVerification =
    async () => {
      if (isBusy) {
        return;
      }

      try {
        const refreshedUser =
          await refreshAccount();

        if (
          refreshedUser
            ?.emailVerified
        ) {
          Alert.alert(
            "Email Verified",
            "Your SEBAShield email address is verified."
          );
        } else {
          Alert.alert(
            "Not Verified Yet",
            "Firebase still shows this email address as unverified. Open the verification link in your email, then try again."
          );
        }
      } catch (
        refreshError
      ) {
        Alert.alert(
          "Unable to Refresh Account",
          refreshError
            ?.message ||
            "SEBAShield could not refresh your account information."
        );
      }
    };

  /**
   * ============================================================
   * handleSignOut
   * ============================================================
   *
   * Local raw scan history is intentionally removed before
   * changing Firebase identity.
   *
   * Privacy-minimized cloud records remain associated with the
   * permanent account and can be accessed again after signing in.
   */
  const handleSignOut =
    () => {
      if (isBusy) {
        return;
      }

      Alert.alert(
        "Sign Out?",
        "For privacy, encrypted scan content stored on this device will be removed when you sign out. Your account and its privacy-minimized cloud records will remain available when you sign in again.",
        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Sign Out",

            style:
              "destructive",

            onPress:
              confirmSignOut,
          },
        ]
      );
    };

  const confirmSignOut =
    async () => {
      try {
        await signOutAccount();

        setAccountEmail("");

        resetAccountForm();

        setAccountMode(
          "create"
        );

        Alert.alert(
          "Signed Out",
          "You have been signed out. SEBAShield is now using a new anonymous session."
        );
      } catch (
        signOutError
      ) {
        Alert.alert(
          "Unable to Sign Out",
          signOutError
            ?.message ||
            "SEBAShield could not sign out. Please try again."
        );
      }
    };

  /**
   * ============================================================
   * Scan-history deletion
   * ============================================================
   */
  const handleClearHistory =
    () => {
      if (
        isManagingHistory
      ) {
        return;
      }

      Alert.alert(
        "Clear Scan History?",
        "This will permanently delete your saved scan history. This action cannot be undone.",
        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Clear History",

            style:
              "destructive",

            onPress:
              confirmClearHistory,
          },
        ]
      );
    };

  const confirmClearHistory =
    async () => {
      if (
        isManagingHistory
      ) {
        return;
      }

      try {
        await clearAllHistory();

        Alert.alert(
          "History Cleared",
          "Your saved scan history has been deleted."
        );
      } catch (
        historyError
      ) {
        Alert.alert(
          "Unable to Clear History",
          historyError
            ?.message ||
            "SEBAShield could not permanently clear your scan history. Please try again."
        );
      }
    };

  /**
   * ============================================================
   * Authentication loading
   * ============================================================
   */
  if (
    isInitializing
  ) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={
            COLORS.primary
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading secure account...
        </Text>
      </View>
    );
  }

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
      keyboardShouldPersistTaps="handled"
    >
      {/* =====================================================
          Account
          ===================================================== */}
      <View
        style={
          styles.section
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.sectionIcon
            }
          >
            <Ionicons
              name="person-circle-outline"
              size={21}
              color={
                COLORS.primary
              }
            />
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Account
          </Text>
        </View>

        {/* ===================================================
            Permanent Email/Password Account
            =================================================== */}
        {!isAnonymous &&
        isEmailAccount ? (
          <>
            <View
              style={
                styles.accountStatusRow
              }
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={
                  COLORS.primary
                }
              />

              <View
                style={
                  styles.accountStatusContent
                }
              >
                <Text
                  style={
                    styles.accountStatusTitle
                  }
                >
                  Email Account
                </Text>

                <Text
                  style={
                    styles.accountEmail
                  }
                >
                  {email ||
                    "Email unavailable"}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.accountStatusRow
              }
            >
              <Ionicons
                name={
                  isEmailVerified
                    ? "checkmark-circle-outline"
                    : "alert-circle-outline"
                }
                size={20}
                color={
                  isEmailVerified
                    ? COLORS.primary
                    : COLORS.warning
                }
              />

              <View
                style={
                  styles.accountStatusContent
                }
              >
                <Text
                  style={
                    styles.accountStatusTitle
                  }
                >
                  Email Verification
                </Text>

                <Text
                  style={
                    styles.accountStatusText
                  }
                >
                  {isEmailVerified
                    ? "Your email address is verified."
                    : "Your email address has not been verified yet."}
                </Text>
              </View>
            </View>

            {!isEmailVerified && (
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,

                    isBusy &&
                      styles.buttonDisabled,
                  ]}
                  onPress={
                    handleVerificationEmail
                  }
                  disabled={
                    isBusy
                  }
                  activeOpacity={
                    0.8
                  }
                >
                  {isManagingAccount ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        COLORS.text
                      }
                    />
                  ) : (
                    <View
                      style={
                        styles.buttonContent
                      }
                    >
                      <Ionicons
                        name="mail-unread-outline"
                        size={18}
                        color={
                          COLORS.text
                        }
                      />

                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        Resend Verification Email
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryButton,

                    isBusy &&
                      styles.buttonDisabled,
                  ]}
                  onPress={
                    handleRefreshVerification
                  }
                  disabled={
                    isBusy
                  }
                  activeOpacity={
                    0.8
                  }
                >
                  <View
                    style={
                      styles.buttonContent
                    }
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={18}
                      color={
                        COLORS.primary
                      }
                    />

                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      Refresh Verification Status
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.dangerButton,
                styles.accountSignOutButton,

                isBusy &&
                  styles.buttonDisabled,
              ]}
              onPress={
                handleSignOut
              }
              disabled={
                isBusy
              }
              activeOpacity={
                0.8
              }
            >
              <View
                style={
                  styles.buttonContent
                }
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={
                    COLORS.danger
                  }
                />

                <Text
                  style={
                    styles.dangerButtonText
                  }
                >
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* ===============================================
                Anonymous Account
                =============================================== */}
            <View
              style={
                styles.accountStatusRow
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={
                  COLORS.primary
                }
              />

              <View
                style={
                  styles.accountStatusContent
                }
              >
                <Text
                  style={
                    styles.accountStatusTitle
                  }
                >
                  Anonymous Mode
                </Text>

                <Text
                  style={
                    styles.accountStatusText
                  }
                >
                  You can use SEBAShield without creating an
                  account. Creating an account preserves your
                  current Firebase identity and makes it
                  recoverable with email and password.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.modeSelector
              }
            >
              <TouchableOpacity
                style={[
                  styles.modeButton,

                  accountMode ===
                    "create" &&
                    styles.modeButtonActive,
                ]}
                onPress={() =>
                  changeAccountMode(
                    "create"
                  )
                }
                activeOpacity={
                  0.8
                }
              >
                <Text
                  style={[
                    styles.modeButtonText,

                    accountMode ===
                      "create" &&
                      styles.modeButtonTextActive,
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,

                  accountMode ===
                    "signin" &&
                    styles.modeButtonActive,
                ]}
                onPress={() =>
                  changeAccountMode(
                    "signin"
                  )
                }
                activeOpacity={
                  0.8
                }
              >
                <Text
                  style={[
                    styles.modeButtonText,

                    accountMode ===
                      "signin" &&
                      styles.modeButtonTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={
                styles.formLabel
              }
            >
              Email
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <Ionicons
                name="mail-outline"
                size={19}
                color={
                  COLORS.mutedText
                }
              />

              <TextInput
                style={
                  styles.input
                }
                value={
                  accountEmail
                }
                onChangeText={
                  setAccountEmail
                }
                placeholder="name@example.com"
                placeholderTextColor={
                  COLORS.mutedText
                }
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={
                  false
                }
                textContentType="emailAddress"
                editable={
                  !isBusy
                }
              />
            </View>

            <Text
              style={
                styles.formLabel
              }
            >
              Password
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color={
                  COLORS.mutedText
                }
              />

              <TextInput
                style={
                  styles.input
                }
                value={
                  password
                }
                onChangeText={
                  setPassword
                }
                placeholder={
                  accountMode ===
                  "create"
                    ? "At least 8 characters"
                    : "Enter password"
                }
                placeholderTextColor={
                  COLORS.mutedText
                }
                secureTextEntry={
                  !showPassword
                }
                autoCapitalize="none"
                autoCorrect={
                  false
                }
                textContentType="password"
                editable={
                  !isBusy
                }
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                disabled={
                  isBusy
                }
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                <Ionicons
                  name={
                    showPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={20}
                  color={
                    COLORS.mutedText
                  }
                />
              </TouchableOpacity>
            </View>

            {accountMode ===
              "create" && (
              <>
                <Text
                  style={
                    styles.formLabel
                  }
                >
                  Confirm Password
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color={
                      COLORS.mutedText
                    }
                  />

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      confirmPassword
                    }
                    onChangeText={
                      setConfirmPassword
                    }
                    placeholder="Enter password again"
                    placeholderTextColor={
                      COLORS.mutedText
                    }
                    secureTextEntry={
                      !showConfirmPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={
                      false
                    }
                    textContentType="newPassword"
                    editable={
                      !isBusy
                    }
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowConfirmPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    disabled={
                      isBusy
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={20}
                      color={
                        COLORS.mutedText
                      }
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {authenticationError ? (
              <View
                style={
                  styles.errorBox
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={
                    COLORS.danger
                  }
                />

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {
                    authenticationError
                  }
                </Text>
              </View>
            ) : null}

            {accountMode ===
            "create" ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,

                    isBusy &&
                      styles.buttonDisabled,
                  ]}
                  onPress={
                    handleCreateAccount
                  }
                  disabled={
                    isBusy
                  }
                  activeOpacity={
                    0.8
                  }
                >
                  {isManagingAccount ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        COLORS.text
                      }
                    />
                  ) : (
                    <View
                      style={
                        styles.buttonContent
                      }
                    >
                      <Ionicons
                        name="person-add-outline"
                        size={18}
                        color={
                          COLORS.text
                        }
                      />

                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        Create Account
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text
                  style={
                    styles.accountHelper
                  }
                >
                  Creating an account upgrades your current
                  anonymous Firebase identity instead of replacing
                  it.
                </Text>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,

                    isBusy &&
                      styles.buttonDisabled,
                  ]}
                  onPress={
                    handleSignIn
                  }
                  disabled={
                    isBusy
                  }
                  activeOpacity={
                    0.8
                  }
                >
                  {isSigningIn ||
                  isManagingAccount ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        COLORS.text
                      }
                    />
                  ) : (
                    <View
                      style={
                        styles.buttonContent
                      }
                    >
                      <Ionicons
                        name="log-in-outline"
                        size={18}
                        color={
                          COLORS.text
                        }
                      />

                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        Sign In
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.textButton
                  }
                  onPress={
                    handlePasswordReset
                  }
                  disabled={
                    isBusy
                  }
                  activeOpacity={
                    0.75
                  }
                >
                  <Text
                    style={
                      styles.textButtonText
                    }
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <Text
                  style={
                    styles.accountHelper
                  }
                >
                  If this anonymous session already has saved scan
                  history, SEBAShield may require you to preserve
                  or clear that history before switching to another
                  account.
                </Text>
              </>
            )}
          </>
        )}
      </View>

      {/* =====================================================
          Privacy
          ===================================================== */}
      <View
        style={
          styles.section
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.sectionIcon
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color={
                COLORS.primary
              }
            />
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Privacy & Data
          </Text>
        </View>

        <View
          style={
            styles.infoRow
          }
        >
          <Ionicons
            name="phone-portrait-outline"
            size={20}
            color={
              COLORS.mutedText
            }
          />

          <View
            style={
              styles.infoContent
            }
          >
            <Text
              style={
                styles.infoTitle
              }
            >
              Encrypted Local History
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              Submitted messages, links, and job-offer content are
              encrypted before being stored in local scan history.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.divider
          }
        />

        <View
          style={
            styles.infoRow
          }
        >
          <Ionicons
            name="cloud-outline"
            size={20}
            color={
              COLORS.mutedText
            }
          />

          <View
            style={
              styles.infoContent
            }
          >
            <Text
              style={
                styles.infoTitle
              }
            >
              Private Cloud Records
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              Privacy-minimized scan metadata may be synchronized
              to Firebase. Raw submitted scan content is not stored
              in the Firestore scan record.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.divider
          }
        />

        <View
          style={
            styles.infoRow
          }
        >
          <Ionicons
            name="person-circle-outline"
            size={20}
            color={
              COLORS.mutedText
            }
          />

          <View
            style={
              styles.infoContent
            }
          >
            <Text
              style={
                styles.infoTitle
              }
            >
              Private Account Ownership
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              Firebase Authentication associates synchronized
              records with your private account identity. You can
              remain anonymous or upgrade the same identity to an
              Email/Password account.
            </Text>
          </View>
        </View>
      </View>

      {/* =====================================================
          History Management
          ===================================================== */}
      <View
        style={
          styles.section
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.sectionIcon
            }
          >
            <Ionicons
              name="time-outline"
              size={21}
              color={
                COLORS.primary
              }
            />
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Scan History
          </Text>
        </View>

        <Text
          style={
            styles.sectionDescription
          }
        >
          Permanently remove your saved scan records when you no
          longer want them retained.
        </Text>

        <TouchableOpacity
          style={[
            styles.dangerButton,

            isManagingHistory &&
              styles.buttonDisabled,
          ]}
          onPress={
            handleClearHistory
          }
          disabled={
            isManagingHistory
          }
          activeOpacity={
            0.8
          }
          accessibilityRole="button"
          accessibilityLabel="Clear all scan history"
          accessibilityHint="Permanently deletes saved scan records"
          accessibilityState={{
            disabled:
              isManagingHistory,

            busy:
              isManagingHistory,
          }}
        >
          {isManagingHistory ? (
            <View
              style={
                styles.buttonContent
              }
            >
              <ActivityIndicator
                size="small"
                color={
                  COLORS.danger
                }
              />

              <Text
                style={
                  styles.dangerButtonText
                }
              >
                Clearing...
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.buttonContent
              }
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={
                  COLORS.danger
                }
              />

              <Text
                style={
                  styles.dangerButtonText
                }
              >
                Clear Scan History
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* =====================================================
          About
          ===================================================== */}
      <View
        style={
          styles.section
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.sectionIcon
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={21}
              color={
                COLORS.primary
              }
            />
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            About
          </Text>
        </View>

        <View
          style={
            styles.detailRow
          }
        >
          <Text
            style={
              styles.detailLabel
            }
          >
            Application
          </Text>

          <Text
            style={
              styles.detailValue
            }
          >
            SEBAShield
          </Text>
        </View>

        <View
          style={
            styles.divider
          }
        />

        <View
          style={
            styles.detailRow
          }
        >
          <Text
            style={
              styles.detailLabel
            }
          >
            Version
          </Text>

          <Text
            style={
              styles.detailValue
            }
          >
            1.0.0
          </Text>
        </View>

        <View
          style={
            styles.divider
          }
        />

        <View
          style={
            styles.detailRow
          }
        >
          <Text
            style={
              styles.detailLabel
            }
          >
            Technology
          </Text>

          <Text
            style={
              styles.detailValue
            }
          >
            React Native + Expo
          </Text>
        </View>

        <View
          style={
            styles.divider
          }
        />

        <View
          style={
            styles.detailRow
          }
        >
          <Text
            style={
              styles.detailLabel
            }
          >
            Developer
          </Text>

          <Text
            style={
              styles.detailValue
            }
          >
            Wubit
          </Text>
        </View>
      </View>

      {/* =====================================================
          Analysis Notice
          ===================================================== */}
      <View
        style={
          styles.notice
        }
      >
        <Ionicons
          name="warning-outline"
          size={20}
          color={
            COLORS.warning
          }
        />

        <View
          style={
            styles.noticeContent
          }
        >
          <Text
            style={
              styles.noticeTitle
            }
          >
            Analysis Guidance
          </Text>

          <Text
            style={
              styles.noticeText
            }
          >
            SEBAShield combines rule-based detection with optional
            AI-assisted analysis. Results provide security guidance
            but cannot prove that a message, website, recruiter, or
            job offer is safe or fraudulent. Verify suspicious
            activity through official channels.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * ============================================================
 * Styles
 * ============================================================
 */
const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      backgroundColor:
        COLORS.background,
    },

    loadingContainer: {
      flex:
        1,

      backgroundColor:
        COLORS.background,

      alignItems:
        "center",

      justifyContent:
        "center",

      padding:
        24,
    },

    loadingText: {
      color:
        COLORS.mutedText,

      marginTop:
        12,

      fontSize:
        13,
    },

    content: {
      paddingHorizontal:
        20,

      paddingTop:
        18,

      paddingBottom:
        44,
    },

    /**
     * ========================================================
     * Sections
     * ========================================================
     */
    section: {
      backgroundColor:
        COLORS.card,

      borderColor:
        COLORS.border,

      borderWidth:
        1,

      borderRadius:
        18,

      padding:
        17,

      marginBottom:
        14,
    },

    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      marginBottom:
        14,
    },

    sectionIcon: {
      width:
        38,

      height:
        38,

      borderRadius:
        13,

      backgroundColor:
        COLORS.background,

      borderColor:
        COLORS.border,

      borderWidth:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight:
        10,
    },

    sectionTitle: {
      flex:
        1,

      color:
        COLORS.text,

      fontSize:
        17,

      fontWeight:
        "800",
    },

    sectionDescription: {
      color:
        COLORS.mutedText,

      fontSize:
        13,

      lineHeight:
        20,

      marginBottom:
        15,
    },

    divider: {
      height:
        1,

      backgroundColor:
        COLORS.border,

      marginVertical:
        14,
    },

    /**
     * ========================================================
     * Account
     * ========================================================
     */
    accountStatusRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",
    },

    accountStatusContent: {
      flex:
        1,

      marginLeft:
        11,
    },

    accountStatusTitle: {
      color:
        COLORS.text,

      fontSize:
        14,

      fontWeight:
        "800",
    },

    accountStatusText: {
      color:
        COLORS.mutedText,

      fontSize:
        13,

      lineHeight:
        19,

      marginTop:
        4,
    },

    accountEmail: {
      color:
        COLORS.primary,

      fontSize:
        13,

      fontWeight:
        "700",

      marginTop:
        4,
    },

    modeSelector: {
      flexDirection:
        "row",

      borderColor:
        COLORS.border,

      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        4,

      marginTop:
        18,

      marginBottom:
        16,
    },

    modeButton: {
      flex:
        1,

      minHeight:
        42,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderRadius:
        9,
    },

    modeButtonActive: {
      backgroundColor:
        COLORS.primary,
    },

    modeButtonText: {
      color:
        COLORS.mutedText,

      fontSize:
        13,

      fontWeight:
        "700",
    },

    modeButtonTextActive: {
      color:
        COLORS.text,
    },

    formLabel: {
      color:
        COLORS.text,

      fontSize:
        13,

      fontWeight:
        "700",

      marginBottom:
        7,

      marginTop:
        3,
    },

    inputContainer: {
      minHeight:
        50,

      flexDirection:
        "row",

      alignItems:
        "center",

      borderColor:
        COLORS.border,

      borderWidth:
        1,

      borderRadius:
        12,

      backgroundColor:
        COLORS.background,

      paddingHorizontal:
        13,

      marginBottom:
        14,
    },

    input: {
      flex:
        1,

      color:
        COLORS.text,

      fontSize:
        14,

      marginLeft:
        9,

      paddingVertical:
        11,
    },

    errorBox: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      borderColor:
        COLORS.danger,

      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        11,

      marginBottom:
        12,
    },

    errorText: {
      flex:
        1,

      color:
        COLORS.danger,

      fontSize:
        12,

      lineHeight:
        18,

      marginLeft:
        8,
    },

    primaryButton: {
      minHeight:
        50,

      borderRadius:
        13,

      backgroundColor:
        COLORS.primary,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        16,

      marginTop:
        4,
    },

    primaryButtonText: {
      color:
        COLORS.text,

      fontSize:
        14,

      fontWeight:
        "800",

      marginLeft:
        8,
    },

    secondaryButton: {
      minHeight:
        50,

      borderColor:
        COLORS.primary,

      borderWidth:
        1,

      borderRadius:
        13,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        16,

      marginTop:
        10,
    },

    secondaryButtonText: {
      color:
        COLORS.primary,

      fontSize:
        14,

      fontWeight:
        "800",

      marginLeft:
        8,
    },

    textButton: {
      alignSelf:
        "center",

      paddingVertical:
        12,

      paddingHorizontal:
        10,
    },

    textButtonText: {
      color:
        COLORS.primary,

      fontSize:
        13,

      fontWeight:
        "700",
    },

    accountHelper: {
      color:
        COLORS.mutedText,

      fontSize:
        11,

      lineHeight:
        17,

      marginTop:
        10,
    },

    accountSignOutButton: {
      marginTop:
        16,
    },

    /**
     * ========================================================
     * Privacy
     * ========================================================
     */
    infoRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",
    },

    infoContent: {
      flex:
        1,

      marginLeft:
        11,
    },

    infoTitle: {
      color:
        COLORS.text,

      fontSize:
        14,

      fontWeight:
        "700",
    },

    infoText: {
      color:
        COLORS.mutedText,

      fontSize:
        13,

      lineHeight:
        19,

      marginTop:
        4,
    },

    /**
     * ========================================================
     * Buttons
     * ========================================================
     */
    dangerButton: {
      minHeight:
        50,

      borderColor:
        COLORS.danger,

      borderWidth:
        1,

      borderRadius:
        13,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        16,
    },

    buttonDisabled: {
      opacity:
        0.45,
    },

    buttonContent: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    dangerButtonText: {
      color:
        COLORS.danger,

      fontSize:
        14,

      fontWeight:
        "800",

      marginLeft:
        8,
    },

    /**
     * ========================================================
     * About
     * ========================================================
     */
    detailRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",
    },

    detailLabel: {
      color:
        COLORS.mutedText,

      fontSize:
        13,

      marginRight:
        16,
    },

    detailValue: {
      flex:
        1,

      color:
        COLORS.text,

      fontSize:
        13,

      fontWeight:
        "700",

      textAlign:
        "right",
    },

    /**
     * ========================================================
     * Analysis Notice
     * ========================================================
     */
    notice: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      paddingHorizontal:
        4,

      marginTop:
        3,
    },

    noticeContent: {
      flex:
        1,

      marginLeft:
        9,
    },

    noticeTitle: {
      color:
        COLORS.warning,

      fontSize:
        13,

      fontWeight:
        "800",
    },

    noticeText: {
      color:
        COLORS.mutedText,

      fontSize:
        12,

      lineHeight:
        18,

      marginTop:
        4,
    },
  });