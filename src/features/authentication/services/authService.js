/**
 * ============================================================
 * SEBAShield
 * Firebase Authentication Service
 * ============================================================
 *
 * Purpose:
 * Manages Firebase Authentication for SEBAShield.
 *
 * Supported authentication flows:
 * - Restore an existing Firebase session
 * - Create an anonymous user when required
 * - Upgrade an anonymous account to Email/Password
 * - Sign in to an existing Email/Password account
 * - Send email-verification messages
 * - Refresh Firebase user information
 * - Send password-reset emails
 * - Sign out permanent accounts
 *
 * Security:
 * - Anonymous-to-email upgrade uses linkWithCredential() so the
 *   existing Firebase UID and Firestore ownership are preserved.
 * - Passwords, ID tokens, email addresses, and UIDs are never
 *   intentionally written to application logs.
 * - Authentication errors exposed to the UI are normalized.
 * ============================================================
 */

import {
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  firebaseAuth,
} from "../../../infrastructure/firebase/firebaseConfig";

/**
 * Prefix used for safe development diagnostics.
 */
const AUTH_LOG_PREFIX =
  "[SEBAShield Firebase Auth]";

/**
 * Prevents simultaneous anonymous sign-in requests.
 */
let anonymousSignInPromise =
  null;

/**
 * Authentication service error codes.
 */
export const AUTH_ERROR_CODES =
  Object.freeze({
    INITIALIZATION_FAILED:
      "INITIALIZATION_FAILED",

    ANONYMOUS_SIGN_IN_FAILED:
      "ANONYMOUS_SIGN_IN_FAILED",

    INVALID_AUTH_OBSERVER:
      "INVALID_AUTH_OBSERVER",

    INVALID_EMAIL:
      "INVALID_EMAIL",

    INVALID_PASSWORD:
      "INVALID_PASSWORD",

    AUTH_REQUIRED:
      "AUTH_REQUIRED",

    ANONYMOUS_ACCOUNT_REQUIRED:
      "ANONYMOUS_ACCOUNT_REQUIRED",

    ACCOUNT_ALREADY_EXISTS:
      "ACCOUNT_ALREADY_EXISTS",

    SIGN_IN_FAILED:
      "SIGN_IN_FAILED",

    ACCOUNT_UPGRADE_FAILED:
      "ACCOUNT_UPGRADE_FAILED",

    PASSWORD_RESET_FAILED:
      "PASSWORD_RESET_FAILED",

    EMAIL_VERIFICATION_FAILED:
      "EMAIL_VERIFICATION_FAILED",

    USER_REFRESH_FAILED:
      "USER_REFRESH_FAILED",

    SIGN_OUT_FAILED:
      "SIGN_OUT_FAILED",

    ANONYMOUS_DATA_PRESENT:
      "ANONYMOUS_DATA_PRESENT",

    NETWORK_ERROR:
      "NETWORK_ERROR",

    TOO_MANY_REQUESTS:
      "TOO_MANY_REQUESTS",
  });

/**
 * Standard authentication-service error.
 */
export class AuthenticationServiceError
  extends Error {
  constructor(
    message,
    code,
    originalError = null
  ) {
    super(message);

    this.name =
      "AuthenticationServiceError";

    this.code =
      code;

    this.originalError =
      originalError;
  }
}

/**
 * Writes a safe development information message.
 *
 * Do not include:
 * - email addresses
 * - Firebase UID
 * - ID tokens
 * - passwords
 */
function logAuthenticationInfo(
  message,
  details = null
) {
  if (details === null) {
    console.info(
      AUTH_LOG_PREFIX,
      message
    );

    return;
  }

  console.info(
    AUTH_LOG_PREFIX,
    message,
    details
  );
}

/**
 * Writes a limited Firebase Authentication diagnostic.
 *
 * Only the Firebase error code is logged.
 */
function logAuthenticationError(
  message,
  error
) {
  console.error(
    AUTH_LOG_PREFIX,
    message,
    {
      code:
        error?.code ??
        "unknown-auth-error",
    }
  );
}

/**
 * Normalizes an email address.
 */
function normalizeEmail(
  email
) {
  if (
    typeof email !==
      "string"
  ) {
    throw new AuthenticationServiceError(
      "Enter a valid email address.",
      AUTH_ERROR_CODES.INVALID_EMAIL
    );
  }

  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  /**
   * This is intentionally a simple client-side format check.
   *
   * Firebase remains authoritative for account validation.
   */
  const basicEmailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !normalizedEmail ||
    normalizedEmail.length >
      254 ||
    !basicEmailPattern.test(
      normalizedEmail
    )
  ) {
    throw new AuthenticationServiceError(
      "Enter a valid email address.",
      AUTH_ERROR_CODES.INVALID_EMAIL
    );
  }

  return normalizedEmail;
}

/**
 * Validates a password before sending it to Firebase.
 *
 * Firebase may apply additional password-policy requirements.
 */
function validatePassword(
  password
) {
  if (
    typeof password !==
      "string" ||
    password.length < 8
  ) {
    throw new AuthenticationServiceError(
      "Password must contain at least 8 characters.",
      AUTH_ERROR_CODES.INVALID_PASSWORD
    );
  }

  if (
    password.length >
    4096
  ) {
    throw new AuthenticationServiceError(
      "Password is too long.",
      AUTH_ERROR_CODES.INVALID_PASSWORD
    );
  }

  return password;
}

/**
 * Converts Firebase errors into safe application errors.
 */
function mapFirebaseAuthenticationError(
  error,
  fallbackMessage,
  fallbackCode
) {
  if (
    error instanceof
    AuthenticationServiceError
  ) {
    return error;
  }

  const firebaseCode =
    error?.code ??
    "";

  switch (
    firebaseCode
  ) {
    case "auth/email-already-in-use":
    case "auth/credential-already-in-use":
      return new AuthenticationServiceError(
        "An account already exists with this email. Sign in instead.",
        AUTH_ERROR_CODES.ACCOUNT_ALREADY_EXISTS,
        error
      );

    case "auth/invalid-email":
      return new AuthenticationServiceError(
        "Enter a valid email address.",
        AUTH_ERROR_CODES.INVALID_EMAIL,
        error
      );

    case "auth/weak-password":
      return new AuthenticationServiceError(
        "The password does not meet the required security policy.",
        AUTH_ERROR_CODES.INVALID_PASSWORD,
        error
      );

    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      /**
       * Use one generic message so the app does not reveal
       * whether a specific email account exists.
       */
      return new AuthenticationServiceError(
        "The email or password is incorrect.",
        AUTH_ERROR_CODES.SIGN_IN_FAILED,
        error
      );

    case "auth/network-request-failed":
      return new AuthenticationServiceError(
        "A network connection is required for this account operation.",
        AUTH_ERROR_CODES.NETWORK_ERROR,
        error
      );

    case "auth/too-many-requests":
      return new AuthenticationServiceError(
        "Too many authentication attempts were made. Please wait and try again.",
        AUTH_ERROR_CODES.TOO_MANY_REQUESTS,
        error
      );

    default:
      return new AuthenticationServiceError(
        fallbackMessage,
        fallbackCode,
        error
      );
  }
}

/**
 * Waits until Firebase finishes restoring persisted auth state.
 */
export async function waitForInitialAuthState() {
  try {
    logAuthenticationInfo(
      "Waiting for persisted authentication state..."
    );

    if (
      typeof firebaseAuth
        .authStateReady ===
      "function"
    ) {
      await firebaseAuth
        .authStateReady();
    }

    const currentUser =
      firebaseAuth.currentUser;

    logAuthenticationInfo(
      "Initial authentication state is ready.",
      {
        hasUser:
          Boolean(
            currentUser
          ),

        isAnonymous:
          Boolean(
            currentUser
              ?.isAnonymous
          ),
      }
    );

    return currentUser;
  } catch (error) {
    logAuthenticationError(
      "Failed to restore authentication state.",
      error
    );

    throw new AuthenticationServiceError(
      "Firebase could not restore the authentication session.",
      AUTH_ERROR_CODES.INITIALIZATION_FAILED,
      error
    );
  }
}

/**
 * Returns the current Firebase user.
 */
export function getCurrentFirebaseUser() {
  return firebaseAuth
    .currentUser;
}

/**
 * Returns whether a user is anonymous.
 */
export function isAnonymousFirebaseUser(
  user
) {
  return Boolean(
    user?.isAnonymous
  );
}

/**
 * Returns whether a Firebase user has an Email/Password provider.
 */
export function isEmailPasswordFirebaseUser(
  user
) {
  return Boolean(
    user?.providerData?.some(
      (provider) =>
        provider?.providerId ===
        "password"
    )
  );
}

/**
 * Restores the existing Firebase user or creates a new anonymous
 * identity when no authenticated session exists.
 *
 * Existing permanent Email/Password users are also preserved.
 */
export async function ensureAnonymousUser() {
  logAuthenticationInfo(
    "Firebase project loaded.",
    {
      projectId:
        firebaseAuth.app
          ?.options
          ?.projectId ??
        "unknown-project",
    }
  );

  await waitForInitialAuthState();

  const currentUser =
    getCurrentFirebaseUser();

  /**
   * Never replace an existing authenticated account.
   */
  if (currentUser) {
    logAuthenticationInfo(
      "Existing Firebase user restored.",
      {
        isAnonymous:
          Boolean(
            currentUser
              .isAnonymous
          ),
      }
    );

    return currentUser;
  }

  if (
    !anonymousSignInPromise
  ) {
    logAuthenticationInfo(
      "No existing Firebase user found. Creating an anonymous session..."
    );

    anonymousSignInPromise =
      signInAnonymously(
        firebaseAuth
      )
        .then(
          (
            userCredential
          ) => {
            const authenticatedUser =
              userCredential
                .user;

            logAuthenticationInfo(
              "Anonymous Firebase sign-in succeeded.",
              {
                isAnonymous:
                  Boolean(
                    authenticatedUser
                      .isAnonymous
                  ),
              }
            );

            return authenticatedUser;
          }
        )
        .catch(
          (error) => {
            logAuthenticationError(
              "Anonymous Firebase sign-in failed.",
              error
            );

            throw mapFirebaseAuthenticationError(
              error,
              "SEBAShield could not create a secure anonymous session.",
              AUTH_ERROR_CODES.ANONYMOUS_SIGN_IN_FAILED
            );
          }
        )
        .finally(
          () => {
            anonymousSignInPromise =
              null;
          }
        );
  }

  return anonymousSignInPromise;
}

/**
 * Upgrades the current anonymous Firebase identity to a permanent
 * Email/Password account.
 *
 * IMPORTANT:
 * linkWithCredential() preserves the existing Firebase UID.
 *
 * Existing Firestore ownership therefore remains associated with
 * the same authenticated user.
 */
export async function upgradeAnonymousAccount(
  email,
  password
) {
  const normalizedEmail =
    normalizeEmail(
      email
    );

  const validatedPassword =
    validatePassword(
      password
    );

  await waitForInitialAuthState();

  const currentUser =
    getCurrentFirebaseUser();

  if (!currentUser) {
    throw new AuthenticationServiceError(
      "No authenticated SEBAShield session is available.",
      AUTH_ERROR_CODES.AUTH_REQUIRED
    );
  }

  if (
    !currentUser
      .isAnonymous
  ) {
    throw new AuthenticationServiceError(
      "This Firebase account is already permanent.",
      AUTH_ERROR_CODES.ANONYMOUS_ACCOUNT_REQUIRED
    );
  }

  try {
    const credential =
      EmailAuthProvider
        .credential(
          normalizedEmail,
          validatedPassword
        );

    const userCredential =
      await linkWithCredential(
        currentUser,
        credential
      );

    logAuthenticationInfo(
      "Anonymous Firebase account upgraded to Email/Password."
    );

    return userCredential
      .user;
  } catch (error) {
    logAuthenticationError(
      "Firebase account upgrade failed.",
      error
    );

    throw mapFirebaseAuthenticationError(
      error,
      "SEBAShield could not create the permanent account.",
      AUTH_ERROR_CODES.ACCOUNT_UPGRADE_FAILED
    );
  }
}

/**
 * Signs in to an existing Email/Password account.
 *
 * Account-switch safety is enforced by AuthContext before calling
 * this function.
 */
export async function signInWithEmailAccount(
  email,
  password
) {
  const normalizedEmail =
    normalizeEmail(
      email
    );

  const validatedPassword =
    validatePassword(
      password
    );

  try {
    const userCredential =
      await signInWithEmailAndPassword(
        firebaseAuth,
        normalizedEmail,
        validatedPassword
      );

    logAuthenticationInfo(
      "Email/Password Firebase sign-in succeeded.",
      {
        isAnonymous:
          Boolean(
            userCredential
              .user
              .isAnonymous
          ),
      }
    );

    return userCredential
      .user;
  } catch (error) {
    logAuthenticationError(
      "Email/Password sign-in failed.",
      error
    );

    throw mapFirebaseAuthenticationError(
      error,
      "SEBAShield could not sign in to the account.",
      AUTH_ERROR_CODES.SIGN_IN_FAILED
    );
  }
}

/**
 * Sends an email-verification message to the currently signed-in
 * permanent account.
 */
export async function sendCurrentUserVerificationEmail() {
  const currentUser =
    getCurrentFirebaseUser();

  if (!currentUser) {
    throw new AuthenticationServiceError(
      "No authenticated account is available.",
      AUTH_ERROR_CODES.AUTH_REQUIRED
    );
  }

  if (
    currentUser
      .isAnonymous
  ) {
    throw new AuthenticationServiceError(
      "Create a permanent account before verifying an email address.",
      AUTH_ERROR_CODES.ANONYMOUS_ACCOUNT_REQUIRED
    );
  }

  if (
    currentUser
      .emailVerified
  ) {
    return true;
  }

  try {
    await sendEmailVerification(
      currentUser
    );

    logAuthenticationInfo(
      "Email verification message requested."
    );

    return true;
  } catch (error) {
    logAuthenticationError(
      "Email verification request failed.",
      error
    );

    throw mapFirebaseAuthenticationError(
      error,
      "SEBAShield could not send the verification email.",
      AUTH_ERROR_CODES.EMAIL_VERIFICATION_FAILED
    );
  }
}

/**
 * Reloads the current Firebase user so email-verification status
 * and other provider information can be refreshed.
 */
export async function refreshCurrentFirebaseUser() {
  const currentUser =
    getCurrentFirebaseUser();

  if (!currentUser) {
    throw new AuthenticationServiceError(
      "No authenticated account is available.",
      AUTH_ERROR_CODES.AUTH_REQUIRED
    );
  }

  try {
    await reload(
      currentUser
    );

    const refreshedUser =
      getCurrentFirebaseUser();

    logAuthenticationInfo(
      "Firebase account information refreshed.",
      {
        isAnonymous:
          Boolean(
            refreshedUser
              ?.isAnonymous
          ),

        emailVerified:
          Boolean(
            refreshedUser
              ?.emailVerified
          ),
      }
    );

    return refreshedUser;
  } catch (error) {
    logAuthenticationError(
      "Firebase user refresh failed.",
      error
    );

    throw mapFirebaseAuthenticationError(
      error,
      "SEBAShield could not refresh the account.",
      AUTH_ERROR_CODES.USER_REFRESH_FAILED
    );
  }
}

/**
 * Sends a password-reset email.
 *
 * The application UI should always display a generic success
 * message so it does not reveal whether an email is registered.
 */
export async function requestPasswordReset(
  email
) {
  const normalizedEmail =
    normalizeEmail(
      email
    );

  try {
    await sendPasswordResetEmail(
      firebaseAuth,
      normalizedEmail
    );

    logAuthenticationInfo(
      "Password-reset request completed."
    );

    return true;
  } catch (error) {
    logAuthenticationError(
      "Password-reset request failed.",
      error
    );

    throw mapFirebaseAuthenticationError(
      error,
      "SEBAShield could not send the password-reset email.",
      AUTH_ERROR_CODES.PASSWORD_RESET_FAILED
    );
  }
}

/**
 * Signs out the current permanent Firebase account.
 *
 * Local private-data cleanup is intentionally handled by
 * AuthContext before this function is called.
 */
export async function signOutFirebaseUser() {
  const currentUser =
    getCurrentFirebaseUser();

  if (!currentUser) {
    return true;
  }

  if (
    currentUser
      .isAnonymous
  ) {
    throw new AuthenticationServiceError(
      "Anonymous sessions cannot be signed out because doing so could permanently lose access to their cloud records.",
      AUTH_ERROR_CODES.ANONYMOUS_ACCOUNT_REQUIRED
    );
  }

  try {
    await signOut(
      firebaseAuth
    );

    logAuthenticationInfo(
      "Permanent Firebase account signed out."
    );

    return true;
  } catch (error) {
    logAuthenticationError(
      "Firebase sign-out failed.",
      error
    );

    throw mapFirebaseAuthenticationError(
      error,
      "SEBAShield could not sign out.",
      AUTH_ERROR_CODES.SIGN_OUT_FAILED
    );
  }
}

/**
 * Observes changes to Firebase Authentication.
 */
export function subscribeToAuthentication(
  onUserChanged
) {
  if (
    typeof onUserChanged !==
      "function"
  ) {
    throw new AuthenticationServiceError(
      "Authentication observer must be a function.",
      AUTH_ERROR_CODES.INVALID_AUTH_OBSERVER
    );
  }

  return onAuthStateChanged(
    firebaseAuth,
    (user) => {
      logAuthenticationInfo(
        "Authentication observer received a change.",
        {
          hasUser:
            Boolean(
              user
            ),

          isAnonymous:
            Boolean(
              user
                ?.isAnonymous
            ),

          emailVerified:
            Boolean(
              user
                ?.emailVerified
            ),
        }
      );

      onUserChanged(
        user
      );
    }
  );
}