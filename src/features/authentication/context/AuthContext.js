/**
 * ============================================================
 * SEBAShield
 * Authentication Context
 * ============================================================
 *
 * Purpose:
 * Makes the authenticated Firebase identity and account actions
 * available throughout SEBAShield.
 *
 * Supported flows:
 * - Restore Firebase authentication
 * - Anonymous authentication
 * - Upgrade anonymous account to Email/Password
 * - Preserve anonymous UID during account creation
 * - Existing-account Email/Password sign-in
 * - Password reset
 * - Email verification
 * - Verification-status refresh
 * - Safe permanent-account sign-out
 *
 * Security:
 * - Anonymous account upgrades preserve the Firebase UID.
 * - Existing anonymous scan data cannot silently move into a
 *   different permanent Firebase account.
 * - Permanent-account sign-out clears encrypted local scan
 *   history before switching to a fresh anonymous identity.
 * ============================================================
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AUTH_ERROR_CODES,
  AuthenticationServiceError,
  ensureAnonymousUser,
  isAnonymousFirebaseUser,
  isEmailPasswordFirebaseUser,
  refreshCurrentFirebaseUser,
  requestPasswordReset,
  sendCurrentUserVerificationEmail,
  signInWithEmailAccount,
  signOutFirebaseUser,
  subscribeToAuthentication,
  upgradeAnonymousAccount,
} from "../services/authService";

/**
 * Local encrypted scan-history access is required for secure
 * account switching.
 *
 * Account switching must never expose one identity's private
 * local scan content to another Firebase identity.
 */
import {
  clearHistory,
  getHistory,
} from "../../scanning/repositories/localScanRepository";
/**
 * Firestore scan access is required to prevent an anonymous
 * Firebase identity with cloud records from being abandoned
 * during account switching.
 */
import {
  getUserScansFromFirestore,
} from "../../scanning/repositories/firebaseScanRepository";

/**
 * Null default lets useAuth detect incorrect provider usage.
 */
const AuthContext =
  createContext(null);

/**
 * Converts authentication errors into readable application
 * messages.
 */
function getAuthenticationErrorMessage(
  error
) {
  if (
    error instanceof
    AuthenticationServiceError
  ) {
    return error.message;
  }

  if (
    error &&
    typeof error.message ===
      "string"
  ) {
    return error.message;
  }

  return (
    "SEBAShield could not complete the authentication operation."
  );
}

/**
 * Provides Firebase Authentication state and account actions.
 */
export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] =
    useState(null);

  const [
    isInitializing,
    setIsInitializing,
  ] =
    useState(true);

  const [
    isSigningIn,
    setIsSigningIn,
  ] =
    useState(false);

  const [
    isManagingAccount,
    setIsManagingAccount,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState(null);

  /**
   * Clears the current authentication error.
   */
  const clearError =
    useCallback(() => {
      setError(null);
    }, []);

  /**
   * Runs an authentication/account operation with consistent
   * loading-state and error handling.
   */
  const runAccountOperation =
    useCallback(
      async (
        operation
      ) => {
        setIsManagingAccount(
          true
        );

        setError(null);

        try {
          return await operation();
        } catch (
          operationError
        ) {
          setError(
            getAuthenticationErrorMessage(
              operationError
            )
          );

          throw operationError;
        } finally {
          setIsManagingAccount(
            false
          );
        }
      },
      []
    );

  /**
   * Restores the current Firebase identity or creates a new
   * anonymous identity if no session exists.
   */
  const retryAuthentication =
    useCallback(
      async () => {
        setIsSigningIn(
          true
        );

        setError(null);

        try {
          const authenticatedUser =
            await ensureAnonymousUser();

          setUser(
            authenticatedUser
          );

          return authenticatedUser;
        } catch (
          authenticationError
        ) {
          setError(
            getAuthenticationErrorMessage(
              authenticationError
            )
          );

          throw authenticationError;
        } finally {
          setIsSigningIn(
            false
          );
        }
      },
      []
    );

  /**
   * Upgrades the CURRENT anonymous Firebase account to a
   * permanent Email/Password account.
   *
   * linkWithCredential() is used by authService, so this operation
   * preserves:
   *
   * - Firebase UID
   * - existing Firestore ownership
   * - synchronized scan metadata
   */
  const createPermanentAccount =
    useCallback(
      async (
        email,
        password
      ) =>
        runAccountOperation(
          async () => {
            const upgradedUser =
              await upgradeAnonymousAccount(
                email,
                password
              );

            setUser(
              upgradedUser
            );

            /**
             * Send verification after the account upgrade succeeds.
             *
             * If email delivery fails, the account itself remains
             * valid and the user can request verification again.
             */
            let verificationEmailSent =
              false;

            try {
              await sendCurrentUserVerificationEmail();

              verificationEmailSent =
                true;
            } catch (
              verificationError
            ) {
              /**
               * Do not undo a successful permanent-account upgrade
               * simply because the verification email failed.
               */
              console.warn(
                "[SEBAShield Firebase Auth] Account created, but verification email could not be sent.",
                {
                  code:
                    verificationError
                      ?.code ??
                    "verification-email-failed",
                }
              );
            }

            return {
              user:
                upgradedUser,

              verificationEmailSent,
            };
          }
        ),
      [
        runAccountOperation,
      ]
    );

  /**
   * Signs into an existing Email/Password Firebase account.
   *
   * Security boundary:
   *
   * If the current anonymous session has encrypted local scans,
   * SEBAShield refuses to switch accounts automatically.
   *
   * Otherwise those anonymous records could become associated
   * with the wrong Firebase identity after synchronization.
   *
   * The user should either:
   *
   * - upgrade the current anonymous identity; or
   * - permanently delete the anonymous history first.
   */
    /**
   * Signs into an existing Email/Password Firebase account.
   *
   * Security boundary:
   *
   * An anonymous Firebase identity must not be abandoned while
   * it still owns either local or cloud scan history.
   *
   * Before switching identities, SEBAShield checks:
   *
   * - encrypted device-local history; and
   * - Firestore metadata owned by the anonymous UID.
   *
   * The user should either:
   *
   * - upgrade the current anonymous identity; or
   * - permanently clear the anonymous scan history first.
   *
   * Firestore verification intentionally fails closed:
   * if SEBAShield cannot verify anonymous cloud history, account
   * switching does not continue.
   */
  const signInWithEmail =
    useCallback(
      async (
        email,
        password
      ) =>
        runAccountOperation(
          async () => {
            if (
              user?.isAnonymous
            ) {
              /**
               * First check encrypted device-local scan history.
               */
              const localHistory =
                await getHistory();

              if (
                localHistory.length >
                0
              ) {
                throw new AuthenticationServiceError(
                  "This anonymous session has saved scan history. Create an account to preserve this session, or permanently clear the anonymous history before signing in to another account.",
                  AUTH_ERROR_CODES.ANONYMOUS_DATA_PRESENT
                );
              }

              /**
               * Local history may be empty even though this anonymous
               * Firebase UID still owns privacy-minimized Firestore
               * scan records.
               *
               * Do not abandon those records by switching directly
               * to another Firebase identity.
               */
              const cloudHistory =
                await getUserScansFromFirestore(
                  user.uid
                );

              if (
                cloudHistory.length >
                0
              ) {
                throw new AuthenticationServiceError(
                  "This anonymous session has cloud scan history. Create an account to preserve this session, or permanently clear the anonymous history before signing in to another account.",
                  AUTH_ERROR_CODES.ANONYMOUS_DATA_PRESENT
                );
              }
            }

            setIsSigningIn(
              true
            );

            try {
              const authenticatedUser =
                await signInWithEmailAccount(
                  email,
                  password
                );

              setUser(
                authenticatedUser
              );

              return authenticatedUser;
            } finally {
              setIsSigningIn(
                false
              );
            }
          }
        ),
      [
        user,
        runAccountOperation,
      ]
    );


  /**
   * Sends a password-reset email.
   *
   * UI should display a generic confirmation such as:
   *
   * "If an account exists for that email, check your inbox."
   *
   * This avoids unnecessary account enumeration.
   */
  const sendPasswordReset =
    useCallback(
      async (
        email
      ) =>
        runAccountOperation(
          async () =>
            requestPasswordReset(
              email
            )
        ),
      [
        runAccountOperation,
      ]
    );

  /**
   * Sends or resends the current permanent account's verification
   * email.
   */
  const sendVerificationEmail =
    useCallback(
      async () =>
        runAccountOperation(
          async () =>
            sendCurrentUserVerificationEmail()
        ),
      [
        runAccountOperation,
      ]
    );

  /**
   * Refreshes Firebase user information.
   *
   * This is used after the user opens the verification email so
   * SEBAShield can update emailVerified.
   */
  const refreshAccount =
    useCallback(
      async () =>
        runAccountOperation(
          async () => {
            const refreshedUser =
              await refreshCurrentFirebaseUser();

            setUser(
              refreshedUser
            );

            return refreshedUser;
          }
        ),
      [
        runAccountOperation,
      ]
    );

  /**
   * Signs out a PERMANENT account and returns SEBAShield to a
   * fresh anonymous session.
   *
   * Security behavior:
   *
   * 1. Delete encrypted local scan history.
   * 2. Delete the SecureStore local-history encryption key.
   * 3. Sign out Firebase permanent account.
   * 4. Create a fresh anonymous Firebase identity.
   *
   * Cloud metadata belonging to the permanent account is NOT
   * deleted by signing out.
   *
   * This prevents private local scan text from one signed-in user
   * being displayed to another account on the same device.
   */
  const signOutAccount =
    useCallback(
      async () =>
        runAccountOperation(
          async () => {
            if (!user) {
              return null;
            }

            if (
              user.isAnonymous
            ) {
              throw new AuthenticationServiceError(
                "Anonymous sessions cannot be signed out because doing so could permanently lose access to their cloud records.",
                AUTH_ERROR_CODES.ANONYMOUS_ACCOUNT_REQUIRED
              );
            }

            /**
             * Clear device-local private history before changing
             * Firebase identity.
             */
            await clearHistory();

            await signOutFirebaseUser();

            /**
             * Return SEBAShield to its privacy-preserving default:
             * a fresh anonymous account.
             */
            const anonymousUser =
              await ensureAnonymousUser();

            setUser(
              anonymousUser
            );

            return anonymousUser;
          }
        ),
      [
        user,
        runAccountOperation,
      ]
    );

  /**
   * Subscribe to Firebase Authentication state changes.
   */
  useEffect(
    () => {
      let providerIsMounted =
        true;

      const unsubscribe =
        subscribeToAuthentication(
          (
            nextUser
          ) => {
            if (
              !providerIsMounted
            ) {
              return;
            }

            setUser(
              nextUser
            );

            if (
              nextUser
            ) {
              setError(
                null
              );
            }
          }
        );

      async function initializeAuthentication() {
        setIsInitializing(
          true
        );

        try {
          const authenticatedUser =
            await ensureAnonymousUser();

          if (
            providerIsMounted
          ) {
            setUser(
              authenticatedUser
            );
          }
        } catch (
          authenticationError
        ) {
          if (
            providerIsMounted
          ) {
            setError(
              getAuthenticationErrorMessage(
                authenticationError
              )
            );
          }
        } finally {
          if (
            providerIsMounted
          ) {
            setIsInitializing(
              false
            );
          }
        }
      }

      initializeAuthentication();

      return () => {
        providerIsMounted =
          false;

        unsubscribe();
      };
    },
    []
  );

  /**
   * Derived authentication information.
   */
  const uid =
    user?.uid ??
    null;

  const email =
    user?.email ??
    null;

  const isAuthenticated =
    Boolean(
      uid
    );

  const isAnonymous =
    isAnonymousFirebaseUser(
      user
    );

  const isEmailAccount =
    isEmailPasswordFirebaseUser(
      user
    );

  const isEmailVerified =
    Boolean(
      user &&
      !user.isAnonymous &&
      user.emailVerified
    );

  const canUpgradeAccount =
    Boolean(
      user &&
      user.isAnonymous
    );

  const isBusy =
    isInitializing ||
    isSigningIn ||
    isManagingAccount;

  /**
   * Shared authentication context.
   */
  const contextValue =
    useMemo(
      () => ({
        /**
         * Firebase identity.
         */
        user,

        uid,

        email,

        isAuthenticated,

        isAnonymous,

        isEmailAccount,

        isEmailVerified,

        canUpgradeAccount,

        /**
         * Operation state.
         */
        isInitializing,

        isSigningIn,

        isManagingAccount,

        isBusy,

        /**
         * Error state.
         */
        error,

        clearError,

        /**
         * Authentication actions.
         */
        retryAuthentication,

        createPermanentAccount,

        signInWithEmail,

        signOutAccount,

        /**
         * Recovery and verification actions.
         */
        sendPasswordReset,

        sendVerificationEmail,

        refreshAccount,
      }),
      [
        user,
        uid,
        email,

        isAuthenticated,
        isAnonymous,
        isEmailAccount,
        isEmailVerified,
        canUpgradeAccount,

        isInitializing,
        isSigningIn,
        isManagingAccount,
        isBusy,

        error,

        clearError,

        retryAuthentication,
        createPermanentAccount,
        signInWithEmail,
        signOutAccount,
        sendPasswordReset,
        sendVerificationEmail,
        refreshAccount,
      ]
    );

  return (
    <AuthContext.Provider
      value={
        contextValue
      }
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Returns shared authentication state.
 */
export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}

export default AuthContext;